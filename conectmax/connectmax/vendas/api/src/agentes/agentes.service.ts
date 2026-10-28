import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { execFile } from 'node:child_process';
import { accessSync, constants } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';
import { Readable } from 'node:stream';
import { promisify } from 'node:util';
import { Repository } from 'typeorm';
import { generateApiKey, hashApiKey } from '../auth/api-key-hash';
import { AuthPrincipal } from '../auth/auth-user';
import { UserRole, userHasRole } from '../auth/roles';
import { GestorAgente } from '../gestores/gestor-agente.entity';
import {
  containerNameForAgente,
  portForAgenteName,
  serialForAgente,
} from './agente-names';
import {
  Agente,
  AgenteLinkedinStatus,
  AgenteStatus,
} from './agente.entity';
import { CreateAgenteDto, UpdateAgenteDto } from './create-agente.dto';
import {
  shQuote,
  sshCatStream,
  sshExec,
  sshTargetFromAgente,
  hostKey,
  type SshTarget,
} from './ssh-host';

const DEFAULT_IMAGE =
  'us-docker.pkg.dev/android-emulator-268719/images/30-google-x64-no-metrics:30.1.2';

const execFileAsync = promisify(execFile);

function resolveAdbBin(): string | null {
  const home = homedir();
  const candidates = [
    process.env.ADB_PATH,
    '/opt/homebrew/bin/adb',
    '/usr/local/bin/adb',
    join(home, 'Library/Android/sdk/platform-tools/adb'),
    join(home, 'Android/Sdk/platform-tools/adb'),
    '/opt/android-sdk/platform-tools/adb',
  ].filter(Boolean) as string[];
  for (const c of candidates) {
    try {
      accessSync(c, constants.X_OK);
      return c;
    } catch {
      /* next */
    }
  }
  return null;
}

@Injectable()
export class AgentesService implements OnModuleInit {
  private readonly logger = new Logger(AgentesService.name);

  constructor(
    @InjectRepository(Agente)
    private readonly agentes: Repository<Agente>,
    @InjectRepository(GestorAgente)
    private readonly gestorAgentes: Repository<GestorAgente>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSchemaColumns();
    await this.migrateAvdsServidoresIntoAgentes();
    await this.migrateLinkedinFromLegacyTable();
    await this.dropLegacyVendedoresTable();
  }

  /** Colunas novas com DB_SYNC=false (prod). Idempotente. */
  private async ensureSchemaColumns(): Promise<void> {
    const ds = this.agentes.manager.connection;
    const stmts = [
      `ALTER TABLE agentes ADD COLUMN IF NOT EXISTS host_kind varchar(32) NOT NULL DEFAULT 'server'`,
      `ALTER TABLE agentes ADD COLUMN IF NOT EXISTS api_key_hash varchar(128)`,
      `UPDATE agentes SET host_kind = 'localhost' WHERE localhost = true AND (host_kind IS NULL OR host_kind = 'server')`,
    ];
    for (const sql of stmts) {
      try {
        await ds.query(sql);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`ensureSchema agentes: ${msg}`);
      }
    }
  }

  /** Copia avds+servidores → agentes (idempotente; preserva id do AVD). */
  private async migrateAvdsServidoresIntoAgentes(): Promise<void> {
    const ds = this.agentes.manager.connection;
    try {
      const tables = await ds.query(`
        SELECT to_regclass('public.avds') AS avds,
               to_regclass('public.servidores') AS servidores
      `);
      if (!tables?.[0]?.avds || !tables?.[0]?.servidores) return;
      const result = await ds.query(`
        INSERT INTO agentes (
          id, nome, host_nome, provedor, produto, hostname, ip_publico, ip_privado,
          localhost, ssh_user, ssh_port, ssh_password, ram_gb, nested_kvm, host_status,
          container_name, image, adb_port, serial, status, last_backup_path, notas,
          last_error, created_at, updated_at, linkedin_status, linkedin_infracoes
        )
        SELECT
          a.id, a.nome, s.nome, s.provedor, s.produto, s.hostname,
          s.ip_publico, s.ip_privado, s.localhost, s.ssh_user, s.ssh_port,
          s.ssh_password, s.ram_gb, s.nested_kvm, s.status,
          a.container_name, a.image, a.adb_port, a.serial, a.status,
          a.last_backup_path, COALESCE(a.notas, s.notas), a.last_error,
          a.created_at, a.updated_at, 'ativa', '[]'::jsonb
        FROM avds a
        JOIN servidores s ON s.id = a.servidor_id
        WHERE NOT EXISTS (
          SELECT 1 FROM agentes g WHERE g.nome = a.nome OR g.id = a.id
        )
      `);
      const n = Array.isArray(result) ? result.length : 0;
      this.logger.log(`migrate: avds+servidores → agentes (${n} upserts)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`migrate avds/servidores: ${msg}`);
    }
  }

  /** Copia contas_linkedin → colunas do agente (idempotente). */
  private async migrateLinkedinFromLegacyTable(): Promise<void> {
    const ds = this.agentes.manager.connection;
    try {
      const rows = await ds.query(
        `SELECT to_regclass('public.contas_linkedin') AS t`,
      );
      if (!rows?.[0]?.t) return;
      await ds.query(`
        UPDATE agentes a SET
          linkedin_nome = COALESCE(a.linkedin_nome, c.nome),
          linkedin_usuario = COALESCE(a.linkedin_usuario, c.usuario),
          linkedin_senha = COALESCE(a.linkedin_senha, c.senha),
          linkedin_profile_url = COALESCE(a.linkedin_profile_url, c.profile_url),
          linkedin_headline = COALESCE(a.linkedin_headline, c.headline),
          linkedin_photo_base64 = COALESCE(a.linkedin_photo_base64, c.photo_base64),
          linkedin_status = COALESCE(NULLIF(a.linkedin_status, ''), c.status, 'ativa'),
          linkedin_infracoes = COALESCE(a.linkedin_infracoes, c.infracoes, '[]'::jsonb)
        FROM contas_linkedin c
        WHERE c.agente_id = a.id
      `);
      this.logger.log('migrate: contas_linkedin → agentes.linkedin_*');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`migrate LinkedIn: ${msg}`);
    }
  }

  /** Vendedor = agente: remove tabela CRM legada. */
  private async dropLegacyVendedoresTable(): Promise<void> {
    const ds = this.agentes.manager.connection;
    try {
      const rows = await ds.query(
        `SELECT to_regclass('public.vendedores') AS t`,
      );
      if (!rows?.[0]?.t) return;
      await ds.query(`DROP TABLE IF EXISTS vendedores CASCADE`);
      this.logger.log('migrate: DROP vendedores (vendedor = agente)');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`drop vendedores: ${msg}`);
    }
  }

  private linkedinFieldsFromDto(
    dto: CreateAgenteDto | UpdateAgenteDto,
  ): Partial<Agente> {
    const out: Partial<Agente> = {};
    if ('linkedinNome' in dto && dto.linkedinNome !== undefined) {
      out.linkedinNome = dto.linkedinNome?.trim() || null;
    }
    if ('linkedinUsuario' in dto && dto.linkedinUsuario !== undefined) {
      out.linkedinUsuario = dto.linkedinUsuario?.trim().toLowerCase() || null;
    }
    if ('linkedinSenha' in dto && dto.linkedinSenha !== undefined) {
      out.linkedinSenha = dto.linkedinSenha || null;
    }
    if ('linkedinProfileUrl' in dto && dto.linkedinProfileUrl !== undefined) {
      out.linkedinProfileUrl = dto.linkedinProfileUrl?.trim() || null;
    }
    if ('linkedinHeadline' in dto && dto.linkedinHeadline !== undefined) {
      out.linkedinHeadline = dto.linkedinHeadline?.trim() || null;
    }
    if ('linkedinPhotoBase64' in dto && dto.linkedinPhotoBase64 !== undefined) {
      out.linkedinPhotoBase64 = dto.linkedinPhotoBase64 || null;
    }
    if ('linkedinStatus' in dto && dto.linkedinStatus !== undefined) {
      out.linkedinStatus = dto.linkedinStatus as AgenteLinkedinStatus;
    }
    return out;
  }

  private async assertLinkedinUsuarioFree(
    usuario: string | null | undefined,
    exceptId?: string,
  ): Promise<void> {
    const u = usuario?.trim().toLowerCase();
    if (!u) return;
    const existing = await this.agentes.findOneBy({ linkedinUsuario: u });
    if (existing && existing.id !== exceptId) {
      throw new ConflictException(
        `LinkedIn usuário já em uso no agente “${existing.nome}”`,
      );
    }
  }

  private async linkGestorIfNeeded(
    creator: AuthPrincipal | undefined,
    agentNome: string,
  ): Promise<void> {
    if (!creator || creator.kind !== 'user') return;
    if (!userHasRole(creator.roles, UserRole.Gestor)) return;
    const taken = await this.gestorAgentes.findOneBy({ agentId: agentNome });
    if (taken && taken.gestorId !== creator.sub) {
      throw new ConflictException(
        `agente ${agentNome} já vinculado a outro gestor`,
      );
    }
    if (taken) return;
    await this.gestorAgentes.save(
      this.gestorAgentes.create({
        gestorId: creator.sub,
        agentId: agentNome,
      }),
    );
  }

  private artifactsDir(): string {
    return (
      this.config.get<string>('AVD_ARTIFACTS_DIR')?.trim() ||
      '/root/avd-artifacts'
    );
  }

  private defaultImage(): string {
    return (
      this.config.get<string>('AVD_DEFAULT_IMAGE')?.trim() || DEFAULT_IMAGE
    );
  }

  async findAll(opts?: {
    status?: string;
    hostKey?: string;
    q?: string;
    sync?: boolean;
    grouped?: boolean;
  }): Promise<
    | {
        meta: { total: number };
        data: Agente[];
      }
    | {
        meta: { total: number; ativos: number; dormindo: number };
        ativos: Agente[];
        dormindo: Agente[];
        outros: Agente[];
      }
  > {
    if (opts?.sync) {
      await this.syncFromHosts(opts.hostKey);
    }

    const qb = this.agentes
      .createQueryBuilder('a')
      .orderBy('a.nome', 'ASC');

    if (opts?.hostKey) {
      if (opts.hostKey === 'localhost') {
        qb.andWhere('a.localhost = true');
      } else {
        qb.andWhere(
          '(a.ip_privado = :hk OR a.ip_publico = :hk)',
          { hk: opts.hostKey },
        );
      }
    }
    if (opts?.status) {
      qb.andWhere('a.status = :st', { st: opts.status });
    }
    const q = opts?.q?.trim() ?? '';
    if (q) {
      qb.andWhere(
        `(a.nome ILIKE :q OR a.container_name ILIKE :q OR a.serial ILIKE :q OR a.host_nome ILIKE :q OR a.ip_publico ILIKE :q OR a.linkedin_nome ILIKE :q OR a.linkedin_usuario ILIKE :q)`,
        { q: `%${q}%` },
      );
    }

    const data = await qb.getMany();

    if (opts?.grouped) {
      const ativos = data.filter((a) => a.status === 'ativo');
      const dormindo = data.filter((a) => a.status === 'dormindo');
      const outros = data.filter(
        (a) => a.status !== 'ativo' && a.status !== 'dormindo',
      );
      return {
        meta: {
          total: data.length,
          ativos: ativos.length,
          dormindo: dormindo.length,
        },
        ativos,
        dormindo,
        outros,
      };
    }

    return { meta: { total: data.length }, data };
  }

  async findOne(id: string, opts?: { sync?: boolean }): Promise<Agente> {
    const row = await this.agentes.findOne({
      where: { id },
    });
    if (!row) {
      throw new NotFoundException(`agente não encontrado: ${id}`);
    }
    if (opts?.sync) {
      await this.refreshRuntimeStatus(row);
    }
    return row;
  }

  private async resolveHostFields(dto: CreateAgenteDto): Promise<{
    hostNome: string;
    provedor: string | null;
    produto: string | null;
    hostname: string | null;
    ipPublico: string | null;
    ipPrivado: string | null;
    localhost: boolean;
    hostKind: string;
    sshUser: string;
    sshPort: number;
    sshPassword: string | null;
    ramGb: number | null;
    nestedKvm: boolean;
    hostStatus: string;
  }> {
    if (dto.copyHostFromAgenteId) {
      const src = await this.findOne(dto.copyHostFromAgenteId);
      return {
        hostNome: src.hostNome,
        provedor: src.provedor,
        produto: src.produto,
        hostname: src.hostname,
        ipPublico: src.ipPublico,
        ipPrivado: src.ipPrivado,
        localhost: src.localhost,
        hostKind: src.hostKind || 'server',
        sshUser: src.sshUser,
        sshPort: src.sshPort,
        sshPassword: src.sshPassword,
        ramGb: src.ramGb,
        nestedKvm: src.nestedKvm,
        hostStatus: src.hostStatus,
      };
    }
    const localhost = Boolean(dto.localhost);
    const hostKind =
      dto.hostKind?.trim() ||
      (localhost ? 'localhost' : 'server');
    const ipPublico = localhost
      ? '127.0.0.1'
      : (dto.ipPublico?.trim() || null);
    if (!ipPublico && hostKind !== 'gestor') {
      throw new BadRequestException(
        'ipPublico, localhost ou hostKind=gestor (ou copyHostFromAgenteId) é obrigatório',
      );
    }
    const hostNome = dto.hostNome?.trim();
    if (!hostNome) {
      throw new BadRequestException('hostNome é obrigatório');
    }
    return {
      hostNome,
      provedor: dto.provedor?.trim() || null,
      produto: dto.produto?.trim() || null,
      hostname: dto.hostname?.trim() || null,
      ipPublico,
      ipPrivado: dto.ipPrivado?.trim() || null,
      localhost,
      hostKind,
      sshUser: dto.sshUser?.trim() || 'root',
      sshPort: dto.sshPort ?? 22,
      sshPassword: dto.sshPassword ?? null,
      ramGb: dto.ramGb ?? null,
      nestedKvm: Boolean(dto.nestedKvm),
      hostStatus: dto.hostStatus?.trim() || 'active',
    };
  }

  /**
   * Cria agente (host + device + LinkedIn).
   * `provisionDevice=false` grava só o cadastro (sem Docker).
   * Gestor autenticado é vinculado automaticamente em `gestor_agentes`.
   */
  async create(
    dto: CreateAgenteDto,
    opts?: { creator?: AuthPrincipal },
  ): Promise<Agente> {
    const nome = dto.nome.trim();
    if (!nome) {
      throw new BadRequestException('nome é obrigatório');
    }
    const host = await this.resolveHostFields(dto);
    const containerName = containerNameForAgente(nome);
    const adbPort = dto.adbPort ?? portForAgenteName(nome);
    const image = (dto.image?.trim() || this.defaultImage()).trim();
    const start = dto.start !== false;
    const provision = dto.provisionDevice !== false;
    const li = this.linkedinFieldsFromDto(dto);

    const existing = await this.agentes.findOneBy({ nome });
    if (existing) {
      throw new ConflictException(
        `já existe agente nome=${nome} (${existing.id})`,
      );
    }
    await this.assertLinkedinUsuarioFree(li.linkedinUsuario);

    const row = await this.agentes.save(
      this.agentes.create({
        nome,
        ...host,
        containerName,
        image,
        adbPort,
        serial: serialForAgente(nome, adbPort),
        status: provision ? 'criando' : 'dormindo',
        lastBackupPath: null,
        notas: dto.notas ?? null,
        lastError: null,
        linkedinNome: li.linkedinNome ?? null,
        linkedinUsuario: li.linkedinUsuario ?? null,
        linkedinSenha: li.linkedinSenha ?? null,
        linkedinProfileUrl: li.linkedinProfileUrl ?? null,
        linkedinHeadline: li.linkedinHeadline ?? null,
        linkedinPhotoBase64: li.linkedinPhotoBase64 ?? null,
        linkedinStatus: li.linkedinStatus ?? 'ativa',
        linkedinInfracoes: [],
      }),
    );

    await this.linkGestorIfNeeded(opts?.creator, nome);

    if (!provision) {
      return row;
    }

    try {
      const t = sshTargetFromAgente(row);
      await this.assertPortFree(t, adbPort, containerName);
      await this.remoteCreateContainer({
        t,
        containerName,
        image,
        adbPort,
        fromBackup: dto.fromBackup?.trim() || null,
        start,
      });
      row.status = start ? 'ativo' : 'dormindo';
      row.lastError = null;
      if (dto.fromBackup?.trim()) {
        row.lastBackupPath = dto.fromBackup.trim();
      }
      return await this.agentes.save(row);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`create agente ${nome}: ${msg}`);
      row.status = 'erro';
      row.lastError = msg;
      await this.agentes.save(row);
      throw new ServiceUnavailableException(`falha ao criar agente: ${msg}`);
    }
  }

  /**
   * Emite nova API key do worker (plain uma vez). Invalida a anterior.
   */
  async rotateApiKey(
    id: string,
  ): Promise<{ agentId: string; apiKey: string; hasApiKey: true }> {
    const row = await this.findOne(id);
    const apiKey = generateApiKey();
    await this.agentes
      .createQueryBuilder()
      .update(Agente)
      .set({ apiKeyHash: hashApiKey(apiKey) })
      .where('id = :id', { id: row.id })
      .execute();
    return { agentId: row.nome, apiKey, hasApiKey: true };
  }

  /** Indica se o agente já tem chave (sem revelar hash). */
  async hasApiKey(id: string): Promise<boolean> {
    const row = await this.agentes
      .createQueryBuilder('a')
      .addSelect('a.apiKeyHash')
      .where('a.id = :id', { id })
      .getOne();
    if (!row) throw new NotFoundException(`agente ${id} não encontrado`);
    return Boolean(row.apiKeyHash);
  }

  /** Atualiza host / notas / LinkedIn (não mexe no container). */
  async update(id: string, dto: UpdateAgenteDto): Promise<Agente> {
    const row = await this.findOne(id);
    if (dto.hostNome !== undefined) row.hostNome = dto.hostNome.trim();
    if (dto.provedor !== undefined) row.provedor = dto.provedor?.trim() || null;
    if (dto.produto !== undefined) row.produto = dto.produto?.trim() || null;
    if (dto.hostname !== undefined) row.hostname = dto.hostname?.trim() || null;
    if (dto.localhost !== undefined) {
      row.localhost = Boolean(dto.localhost);
      if (row.localhost) row.ipPublico = '127.0.0.1';
    }
    if (dto.hostKind !== undefined) {
      row.hostKind = dto.hostKind;
    }
    if (dto.ipPublico !== undefined && !row.localhost) {
      row.ipPublico = dto.ipPublico.trim() || null;
    }
    if (dto.ipPrivado !== undefined) {
      row.ipPrivado = dto.ipPrivado?.trim() || null;
    }
    if (dto.sshUser !== undefined) {
      row.sshUser = dto.sshUser.trim() || 'root';
    }
    if (dto.sshPort !== undefined) row.sshPort = dto.sshPort;
    if (dto.sshPassword !== undefined) {
      row.sshPassword = dto.sshPassword || null;
    }
    if (dto.ramGb !== undefined) row.ramGb = dto.ramGb ?? null;
    if (dto.nestedKvm !== undefined) row.nestedKvm = Boolean(dto.nestedKvm);
    if (dto.hostStatus !== undefined) {
      row.hostStatus = dto.hostStatus.trim() || 'active';
    }
    if (dto.notas !== undefined) row.notas = dto.notas ?? null;

    const li = this.linkedinFieldsFromDto(dto);
    if (li.linkedinUsuario !== undefined) {
      await this.assertLinkedinUsuarioFree(li.linkedinUsuario, id);
    }
    Object.assign(row, li);

    return this.agentes.save(row);
  }

  async remove(id: string): Promise<{ ok: true; id: string }> {
    const row = await this.findOne(id);
    try {
      const t = sshTargetFromAgente(row);
      await sshExec(
        t,
        `docker rm -f ${shQuote(row.containerName)} 2>/dev/null || true`,
        { timeoutMs: 60_000 },
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new ServiceUnavailableException(`falha ao remover container: ${msg}`);
    }
    await this.agentes.remove(row);
    return { ok: true, id };
  }

  /** docker stop → dormindo (preserva /android-home). */
  async sleep(id: string): Promise<Agente> {
    const row = await this.findOne(id);
    const t = sshTargetFromAgente(row);
    try {
      await sshExec(t, `docker stop ${shQuote(row.containerName)}`, {
        timeoutMs: 120_000,
      });
      row.status = 'dormindo';
      row.lastError = null;
      return await this.agentes.save(row);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      row.lastError = msg;
      await this.agentes.save(row);
      throw new ServiceUnavailableException(`falha ao dormir agente: ${msg}`);
    }
  }

  /** docker start → ativo. */
  async wake(id: string): Promise<Agente> {
    const row = await this.findOne(id);
    const t = sshTargetFromAgente(row);
    try {
      await sshExec(t, `docker start ${shQuote(row.containerName)}`, {
        timeoutMs: 60_000,
      });
      row.status = 'ativo';
      row.lastError = null;
      return await this.agentes.save(row);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      row.lastError = msg;
      await this.agentes.save(row);
      throw new ServiceUnavailableException(`falha ao acordar agente: ${msg}`);
    }
  }

  /**
   * Ping via **adb** (AVD nativo / TCP). Local: execFile no Node.
   * Remoto: script no host. Docker só informativo.
   */
  async pingAdb(id: string): Promise<{
    ok: boolean;
    id: string;
    nome: string;
    serial: string;
    adbPort: number;
    docker: string;
    adb: string;
    bootCompleted: boolean | null;
    ms: number;
    detail: string | null;
  }> {
    const row = await this.findOne(id);
    const t = sshTargetFromAgente(row);
    const serial = row.serial || serialForAgente(row.nome, row.adbPort);
    const port = row.adbPort;
    const started = Date.now();
    const emuSerial =
      Number(port) > 0 ? `emulator-${Number(port) - 1}` : '';

    if (t.local) {
      return this.pingAdbLocal(row, serial, port, emuSerial, started);
    }

    const script = `
set +e
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/Library/Android/sdk/platform-tools:$HOME/Android/Sdk/platform-tools:/opt/android-sdk/platform-tools:$PATH"
NAME=${shQuote(row.containerName)}
PORT=${shQuote(String(port))}
SERIAL=${shQuote(serial)}
EMU=${shQuote(emuSerial)}
DOC=n/a
if command -v docker >/dev/null 2>&1; then
  DOC=$(docker inspect -f '{{.State.Status}}' "$NAME" 2>/dev/null)
  if [ -z "$DOC" ]; then DOC=missing; fi
fi
ADB_BIN=$(command -v adb || true)
if [ -z "$ADB_BIN" ] && [ -x /usr/bin/adb ]; then ADB_BIN=/usr/bin/adb; fi
ADB=no_adb
BOOT=
USED=
DEVICES=
if [ -n "$ADB_BIN" ]; then
  "$ADB_BIN" start-server >/dev/null 2>&1
  "$ADB_BIN" connect "127.0.0.1:$PORT" >/dev/null 2>&1
  DEVICES=$("$ADB_BIN" devices 2>/dev/null | tr '\\t' ' ' | tr '\\r' ' ' | paste -sd ';' -)
  for S in "$SERIAL" "127.0.0.1:$PORT" "$EMU" "emulator-$PORT"; do
    [ -z "$S" ] && continue
    ST=$("$ADB_BIN" -s "$S" get-state 2>/dev/null | tr -d '\\r\\n')
    case "$ST" in
      device|offline|unauthorized)
        ADB=$ST; USED=$S
        BOOT=$("$ADB_BIN" -s "$S" shell getprop sys.boot_completed 2>/dev/null | tr -d '\\r\\n')
        break ;;
    esac
  done
  if [ -z "$USED" ]; then
    DEV=$("$ADB_BIN" devices 2>/dev/null | awk '/device$/{print $1; exit}')
    if [ -n "$DEV" ] && [ "$DEV" != "List" ]; then
      USED=$DEV
      ADB=$("$ADB_BIN" -s "$DEV" get-state 2>/dev/null | tr -d '\\r\\n')
      BOOT=$("$ADB_BIN" -s "$DEV" shell getprop sys.boot_completed 2>/dev/null | tr -d '\\r\\n')
    else
      ADB=unreachable
    fi
  fi
fi
printf 'DOCKER=%s\\n' "$DOC"
printf 'ADB=%s\\n' "$ADB"
printf 'BOOT=%s\\n' "$BOOT"
printf 'SERIAL=%s\\n' "\${USED:-$SERIAL}"
printf 'ADB_BIN=%s\\n' "\${ADB_BIN:-none}"
printf 'DEVICES=%s\\n' "$DEVICES"
`.trim();

    try {
      const { stdout } = await sshExec(t, 'bash -s', {
        timeoutMs: 45_000,
        script,
      });
      return this.parsePingStdout(row, serial, port, started, stdout);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`ping avd ${row.nome}: ${msg}`);
      return {
        ok: false,
        id: row.id,
        nome: row.nome,
        serial,
        adbPort: port,
        docker: 'n/a',
        adb: 'error',
        bootCompleted: null,
        ms: Date.now() - started,
        detail: msg.slice(0, 500),
      };
    }
  }

  private async pingAdbLocal(
    row: Agente,
    serial: string,
    port: number,
    emuSerial: string,
    started: number,
  ) {
    const adbBin = resolveAdbBin();
    if (!adbBin) {
      return {
        ok: false,
        id: row.id,
        nome: row.nome,
        serial,
        adbPort: port,
        docker: 'n/a',
        adb: 'no_adb',
        bootCompleted: null as boolean | null,
        ms: Date.now() - started,
        detail: 'adb não encontrado (Homebrew/SDK). Defina ADB_PATH.',
      };
    }

    const run = async (args: string[]) => {
      try {
        const { stdout } = await execFileAsync(adbBin, args, {
          timeout: 15_000,
          env: process.env,
        });
        return String(stdout || '').trim();
      } catch {
        return '';
      }
    };

    await run(['start-server']);
    await run(['connect', `127.0.0.1:${port}`]);
    const devicesOut = await run(['devices']);
    const candidates = [
      serial,
      `127.0.0.1:${port}`,
      emuSerial,
      `emulator-${port}`,
    ].filter(Boolean);

    let used = '';
    let adb = 'unreachable';
    let bootRaw = '';
    for (const s of candidates) {
      const st = (await run(['-s', s, 'get-state'])).replace(/\r/g, '');
      if (st === 'device' || st === 'offline' || st === 'unauthorized') {
        adb = st;
        used = s;
        bootRaw = (
          await run(['-s', s, 'shell', 'getprop', 'sys.boot_completed'])
        ).replace(/\r/g, '');
        break;
      }
    }
    if (!used) {
      const line = devicesOut
        .split('\n')
        .map((l) => l.trim())
        .find((l) => /\tdevice$/.test(l) || / device$/.test(l));
      const dev = line?.split(/\s+/)[0];
      if (dev && dev !== 'List') {
        used = dev;
        adb = (await run(['-s', dev, 'get-state'])).replace(/\r/g, '') || adb;
        bootRaw = (
          await run(['-s', dev, 'shell', 'getprop', 'sys.boot_completed'])
        ).replace(/\r/g, '');
      }
    }

    const bootCompleted =
      bootRaw === '1' ? true : bootRaw === '0' ? false : null;
    return {
      ok: adb === 'device',
      id: row.id,
      nome: row.nome,
      serial: used || serial,
      adbPort: port,
      docker: 'n/a',
      adb,
      bootCompleted,
      ms: Date.now() - started,
      detail:
        adb === 'unreachable'
          ? `devices=[${devicesOut.replace(/\n/g, ';')}] bin=${adbBin}`
          : null,
    };
  }

  private parsePingStdout(
    row: Agente,
    serial: string,
    port: number,
    started: number,
    stdout: string,
  ) {
    const lines = Object.fromEntries(
      stdout
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.includes('='))
        .map((l) => {
          const i = l.indexOf('=');
          return [l.slice(0, i), l.slice(i + 1)];
        }),
    ) as Record<string, string>;

    const docker = lines.DOCKER || 'n/a';
    const adb = lines.ADB || 'unreachable';
    const bootRaw = (lines.BOOT || '').trim();
    const bootCompleted =
      bootRaw === '1' ? true : bootRaw === '0' ? false : null;

    return {
      ok: adb === 'device',
      id: row.id,
      nome: row.nome,
      serial: lines.SERIAL || serial,
      adbPort: port,
      docker,
      adb,
      bootCompleted,
      ms: Date.now() - started,
      detail:
        adb === 'no_adb'
          ? `adb não encontrado (bin=${lines.ADB_BIN || 'none'})`
          : adb === 'unreachable'
            ? `devices=[${lines.DEVICES || ''}] bin=${lines.ADB_BIN || 'none'}`
            : null,
    };
  }

  /**
   * Exporta `/android-home` → tar.gz em AVD_ARTIFACTS_DIR.
   * Para o container durante o export e sobe de novo se estava ativo.
   */
  async backup(id: string): Promise<{
    avd: Agente;
    path: string;
    sha256: string | null;
    sizeBytes: number | null;
  }> {
    const row = await this.findOne(id, { sync: true });
    const t = sshTargetFromAgente(row);
    const dir = this.artifactsDir();
    const ts = new Date().toISOString().replace(/[:.]/g, '-').replace(/Z$/, 'Z');
    const out = `${dir}/${row.nome}-android-home-${ts}.tar.gz`;
    const wasAtivo = row.status === 'ativo';

    const script = `
set -euo pipefail
NAME=${shQuote(row.containerName)}
OUT=${shQuote(out)}
DIR=${shQuote(dir)}
mkdir -p "$DIR"
WAS_RUNNING=$(docker inspect -f '{{.State.Running}}' "$NAME" 2>/dev/null || echo false)
if [ "$WAS_RUNNING" = "true" ]; then
  docker stop "$NAME"
fi
docker cp "\${NAME}:/android-home" - | gzip -1 > "$OUT"
sha256sum "$OUT" | tee "\${OUT}.sha256"
SIZE=$(stat -c%s "$OUT" 2>/dev/null || stat -f%z "$OUT")
if [ "$WAS_RUNNING" = "true" ]; then
  docker start "$NAME" >/dev/null
fi
echo "OK_PATH=$OUT"
echo "OK_SIZE=$SIZE"
`.trim();

    try {
      const { stdout } = await sshExec(t, 'bash -s', {
        timeoutMs: 600_000,
        script,
      });
      const pathMatch = stdout.match(/OK_PATH=(.+)/);
      const sizeMatch = stdout.match(/OK_SIZE=(\d+)/);
      const shaMatch = stdout.match(/^([a-f0-9]{64})\s+/m);
      const path = pathMatch?.[1]?.trim() || out;
      row.lastBackupPath = path;
      row.status = wasAtivo ? 'ativo' : 'dormindo';
      row.lastError = null;
      await this.agentes.save(row);
      return {
        avd: row,
        path,
        sha256: shaMatch?.[1] ?? null,
        sizeBytes: sizeMatch ? Number(sizeMatch[1]) : null,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      row.lastError = msg;
      await this.agentes.save(row);
      throw new ServiceUnavailableException(`falha no backup: ${msg}`);
    }
  }

  /** Lista tars em AVD_ARTIFACTS_DIR no servidor do AVD. */
  async listBackups(id: string): Promise<{
    dir: string;
    files: { name: string; path: string; sizeBytes: number; mtime: string }[];
  }> {
    const row = await this.findOne(id);
    const t = sshTargetFromAgente(row);
    const dir = this.artifactsDir();
    const { stdout } = await sshExec(
      t,
      `mkdir -p ${shQuote(dir)}; ls -1 ${shQuote(dir)}/*.tar.gz 2>/dev/null | while read f; do
  sz=$(stat -c%s "$f" 2>/dev/null || stat -f%z "$f")
  mt=$(stat -c%Y "$f" 2>/dev/null || stat -f%m "$f")
  echo "$sz|$mt|$f"
done`,
      { timeoutMs: 30_000 },
    );
    const files = stdout
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const [sz, mt, path] = line.split('|');
        return {
          name: basename(path || ''),
          path: path || '',
          sizeBytes: Number(sz) || 0,
          mtime: mt
            ? new Date(Number(mt) * 1000).toISOString()
            : new Date(0).toISOString(),
        };
      })
      .filter((f) => f.path)
      .sort((a, b) => b.mtime.localeCompare(a.mtime));
    return { dir, files };
  }

  /**
   * Stream do backup (path explícito ou lastBackupPath / mais recente do nome).
   */
  async openBackupDownload(
    id: string,
    path?: string,
  ): Promise<{ stream: Readable; filename: string; path: string }> {
    const row = await this.findOne(id);
    const t = sshTargetFromAgente(row);
    let remote = path?.trim() || row.lastBackupPath || '';

    if (!remote) {
      const { files } = await this.listBackups(id);
      const match = files.find((f) => f.name.startsWith(`${row.nome}-`));
      if (!match) {
        throw new NotFoundException(
          `nenhum backup tar para ${row.nome}; rode POST /agentes/${id}/backup`,
        );
      }
      remote = match.path;
    }

    if (!remote.startsWith('/')) {
      throw new BadRequestException('path do backup deve ser absoluto no servidor');
    }

    const { stdout } = await sshExec(
      t,
      `test -f ${shQuote(remote)} && echo OK || echo MISSING`,
      { timeoutMs: 15_000 },
    );
    if (!stdout.includes('OK')) {
      throw new NotFoundException(`arquivo ausente no servidor: ${remote}`);
    }

    return {
      stream: sshCatStream(t, remote),
      filename: basename(remote),
      path: remote,
    };
  }

  /**
   * Descobre containers `docker-avd-*` nos hosts já cadastrados (agentes)
   * e upsert. Agrupa por hostKey (IP / localhost).
   */
  async syncFromHosts(filterHostKey?: string): Promise<{ upserted: number }> {
    const all = await this.agentes.find({ order: { nome: 'ASC' } });
    const byHost = new Map<string, Agente>();
    for (const a of all) {
      if (a.hostStatus === 'inactive') continue;
      const key = hostKey(a);
      if (filterHostKey && key !== filterHostKey) continue;
      if (!byHost.has(key)) byHost.set(key, a);
    }
    if (!byHost.size) {
      throw new BadRequestException(
        'Nenhum host em agentes — cadastre um agente com SSH antes do sync',
      );
    }

    let upserted = 0;
    for (const [key, template] of byHost) {
      try {
        const t = sshTargetFromAgente(template);
        const { stdout } = await sshExec(
          t,
          `docker ps -a --filter name=docker-avd --format '{{.Names}}\\t{{.Status}}\\t{{.Image}}'
for c in $(docker ps -aq --filter name=docker-avd); do
  name=$(docker inspect -f '{{.Name}}' "$c" | sed 's#^/##')
  port=$(docker inspect -f '{{with (index .NetworkSettings.Ports "5555/tcp")}}{{(index . 0).HostPort}}{{end}}' "$c" 2>/dev/null || true)
  if [ -z "$port" ] || [ "$port" = "<no value>" ]; then
    port=$(docker inspect -f '{{with (index .HostConfig.PortBindings "5555/tcp")}}{{(index . 0).HostPort}}{{end}}' "$c" 2>/dev/null || true)
  fi
  echo "PORT\t$name\t$port"
done`,
          { timeoutMs: 45_000 },
        );
        const portByName = new Map<string, number>();
        for (const line of stdout.split('\n')) {
          if (!line.startsWith('PORT\t')) continue;
          const [, name, port] = line.split('\t');
          if (name && /^\d+$/.test(port || '')) {
            portByName.set(name, Number(port));
          }
        }
        for (const line of stdout.split('\n').map((l) => l.trim()).filter(Boolean)) {
          if (line.startsWith('PORT\t')) continue;
          const [containerName, statusRaw, image] = line.split('\t');
          if (!containerName?.startsWith('docker-avd-')) continue;
          const nome = containerName.replace(/^docker-avd-/, '');
          const adbPort =
            portByName.get(containerName) ?? portForAgenteName(nome);
          const status = this.mapDockerStatus(statusRaw);
          let row = await this.agentes.findOneBy({ nome });
          if (!row) {
            row = this.agentes.create({
              nome,
              hostNome: template.hostNome,
              provedor: template.provedor,
              produto: template.produto,
              hostname: template.hostname,
              ipPublico: template.ipPublico,
              ipPrivado: template.ipPrivado,
              localhost: template.localhost,
              sshUser: template.sshUser,
              sshPort: template.sshPort,
              sshPassword: template.sshPassword,
              ramGb: template.ramGb,
              nestedKvm: template.nestedKvm,
              hostStatus: template.hostStatus,
              containerName,
              image: image || this.defaultImage(),
              adbPort,
              serial: serialForAgente(nome, adbPort),
              status,
              lastBackupPath: null,
              notas: null,
              lastError: null,
            });
          } else {
            row.containerName = containerName;
            row.status = status;
            row.adbPort = adbPort;
            row.serial = serialForAgente(nome, adbPort);
            if (image) row.image = image;
            row.lastError = null;
          }
          await this.agentes.save(row);
          upserted += 1;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`sync host ${key} (${template.hostNome}): ${msg}`);
      }
    }
    return { upserted };
  }

  private async refreshRuntimeStatus(row: Agente): Promise<Agente> {
    try {
      const t = sshTargetFromAgente(row);
      const { stdout } = await sshExec(
        t,
        `docker inspect -f '{{.State.Status}}' ${shQuote(row.containerName)} 2>/dev/null || echo missing`,
        { timeoutMs: 15_000 },
      );
      const st = stdout.trim().split('\n').pop() || 'missing';
      if (st === 'missing') {
        row.status = 'erro';
        row.lastError = 'container ausente no host';
      } else {
        row.status = this.mapDockerStatus(st);
        row.lastError = null;
      }
      return await this.agentes.save(row);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      row.lastError = msg;
      return await this.agentes.save(row);
    }
  }

  private mapDockerStatus(raw: string): AgenteStatus {
    const s = (raw || '').toLowerCase();
    if (s.includes('up') || s === 'running') return 'ativo';
    if (
      s.includes('exited') ||
      s.includes('created') ||
      s === 'paused' ||
      s === 'dead'
    ) {
      return 'dormindo';
    }
    return 'erro';
  }

  private parseAdbPort(ports: string | undefined): number | null {
    if (!ports) return null;
    // 127.0.0.1:5658->5555/tcp
    const m = ports.match(/127\.0\.0\.1:(\d+)->5555/);
    if (m) return Number(m[1]);
    const m2 = ports.match(/:(\d+)->5555/);
    return m2 ? Number(m2[1]) : null;
  }

  private async assertPortFree(
    t: SshTarget,
    adbPort: number,
    containerName: string,
  ): Promise<void> {
    const { stdout } = await sshExec(
      t,
      `docker ps -a --format '{{.Names}} {{.Ports}}' | grep -E ':${adbPort}->5555' || true; docker inspect -f '{{.Name}}' ${shQuote(containerName)} 2>/dev/null || true`,
      { timeoutMs: 20_000 },
    );
    if (stdout.includes(`/${containerName}`) || stdout.trim().endsWith(containerName)) {
      throw new ConflictException(
        `container ${containerName} já existe no host`,
      );
    }
    if (stdout.includes(`:${adbPort}->5555`)) {
      throw new ConflictException(`porta ADB ${adbPort} já em uso no host`);
    }
  }

  private async remoteCreateContainer(opts: {
    t: SshTarget;
    containerName: string;
    image: string;
    adbPort: number;
    fromBackup: string | null;
    start: boolean;
  }): Promise<void> {
    const { t, containerName, image, adbPort, fromBackup, start } = opts;
    const backupBlock = fromBackup
      ? `
TAR=${shQuote(fromBackup)}
test -f "$TAR" || { echo "backup ausente: $TAR"; exit 1; }
echo "import tar → /android-home"
gzip -dc "$TAR" | docker cp - "$NAME":/
`
      : '';

    const startBlock = start ? `docker start "$NAME"` : 'echo "create ok (parado)"';

    const script = `
set -euo pipefail
NAME=${shQuote(containerName)}
IMAGE=${shQuote(image)}
PORT=${shQuote(String(adbPort))}
docker rm -f "$NAME" 2>/dev/null || true
# ADBKEY via --env-file (chave pode ser multilinha)
ENV_FILE=/tmp/avd-env-$$
: > "$ENV_FILE"
ADBKEY_FILE=/tmp/adbkey-avd-api-$$
if SRC=$(docker ps -aq --filter name=docker-avd | head -1) && [ -n "$SRC" ]; then
  docker inspect "$SRC" --format '{{range .Config.Env}}{{println .}}{{end}}' \\
    | sed -n 's/^ADBKEY=//p' > "$ADBKEY_FILE" || true
fi
if [ ! -s "$ADBKEY_FILE" ] && [ -f /root/.android/adbkey ]; then
  cp /root/.android/adbkey "$ADBKEY_FILE"
fi
if [ ! -s "$ADBKEY_FILE" ]; then
  mkdir -p /root/.android
  if command -v adb >/dev/null 2>&1; then
    adb keygen /root/.android/adbkey >/dev/null 2>&1 || true
  fi
  [ -f /root/.android/adbkey ] && cp /root/.android/adbkey "$ADBKEY_FILE" || true
fi
if [ -s "$ADBKEY_FILE" ]; then
  {
    printf 'ADBKEY='
    cat "$ADBKEY_FILE"
    printf '\\n'
  } > "$ENV_FILE"
fi
docker create \\
  --name "$NAME" \\
  --privileged \\
  --device /dev/kvm \\
  --restart unless-stopped \\
  --env-file "$ENV_FILE" \\
  -p "127.0.0.1:\${PORT}:5555" \\
  "$IMAGE"
rm -f "$ENV_FILE" "$ADBKEY_FILE"
${backupBlock}
${startBlock}
docker ps -a --filter name="^/\${NAME}$" --format '{{.Names}} {{.Status}} {{.Ports}}'
`.trim();

    await sshExec(t, 'bash -s', {
      timeoutMs: 600_000,
      script,
    });
  }
}
