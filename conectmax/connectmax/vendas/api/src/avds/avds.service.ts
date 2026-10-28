import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
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
import { Servidor } from '../servidores/servidor.entity';
import { ServidoresService } from '../servidores/servidores.service';
import {
  containerNameForAvd,
  portForAvdName,
  serialForAvd,
} from './avd-names';
import { Avd, AvdStatus } from './avd.entity';
import { CreateAvdDto } from './create-avd.dto';
import {
  shQuote,
  sshCatStream,
  sshExec,
  sshTargetFromServidor,
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
export class AvdsService {
  private readonly logger = new Logger(AvdsService.name);

  constructor(
    @InjectRepository(Avd)
    private readonly avds: Repository<Avd>,
    private readonly servidores: ServidoresService,
    private readonly config: ConfigService,
  ) {}

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
    servidorId?: string;
    q?: string;
    sync?: boolean;
    grouped?: boolean;
  }): Promise<
    | {
        meta: { total: number };
        data: Avd[];
      }
    | {
        meta: { total: number; ativos: number; dormindo: number };
        ativos: Avd[];
        dormindo: Avd[];
        outros: Avd[];
      }
  > {
    if (opts?.sync) {
      await this.syncFromHosts(opts.servidorId);
    }

    const qb = this.avds
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.servidor', 's')
      .orderBy('a.nome', 'ASC');

    if (opts?.servidorId) {
      qb.andWhere('a.servidor_id = :sid', { sid: opts.servidorId });
    }
    if (opts?.status) {
      qb.andWhere('a.status = :st', { st: opts.status });
    }
    const q = opts?.q?.trim() ?? '';
    if (q) {
      qb.andWhere(
        `(a.nome ILIKE :q OR a.container_name ILIKE :q OR a.serial ILIKE :q)`,
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

  async findOne(id: string, opts?: { sync?: boolean }): Promise<Avd> {
    const row = await this.avds.findOne({
      where: { id },
      relations: ['servidor'],
    });
    if (!row) {
      throw new NotFoundException(`avd não encontrado: ${id}`);
    }
    if (opts?.sync) {
      await this.refreshRuntimeStatus(row);
    }
    return row;
  }

  /**
   * Cria container no servidor (opcional restore de tar `/android-home`).
   */
  async create(dto: CreateAvdDto): Promise<Avd> {
    const nome = dto.nome.trim();
    if (!nome) {
      throw new BadRequestException('nome é obrigatório');
    }
    const servidor = await this.servidores.findOne(dto.servidorId);
    const containerName = containerNameForAvd(nome);
    const adbPort = dto.adbPort ?? portForAvdName(nome);
    const image = (dto.image?.trim() || this.defaultImage()).trim();
    const start = dto.start !== false;

    const existing = await this.avds.findOneBy({
      servidorId: servidor.id,
      nome,
    });
    if (existing) {
      throw new ConflictException(
        `já existe avd nome=${nome} neste servidor (${existing.id})`,
      );
    }

    const row = await this.avds.save(
      this.avds.create({
        nome,
        servidorId: servidor.id,
        containerName,
        image,
        adbPort,
        serial: serialForAvd(nome, adbPort),
        status: 'criando',
        lastBackupPath: null,
        notas: dto.notas ?? null,
        lastError: null,
      }),
    );

    try {
      const t = sshTargetFromServidor(servidor);
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
      return await this.avds.save(row);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`create avd ${nome}: ${msg}`);
      row.status = 'erro';
      row.lastError = msg;
      await this.avds.save(row);
      throw new ServiceUnavailableException(`falha ao criar avd: ${msg}`);
    }
  }

  async remove(id: string): Promise<{ ok: true; id: string }> {
    const row = await this.findOne(id);
    const servidor = row.servidor ?? (await this.servidores.findOne(row.servidorId));
    try {
      const t = sshTargetFromServidor(servidor);
      await sshExec(
        t,
        `docker rm -f ${shQuote(row.containerName)} 2>/dev/null || true`,
        { timeoutMs: 60_000 },
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new ServiceUnavailableException(`falha ao remover container: ${msg}`);
    }
    await this.avds.remove(row);
    return { ok: true, id };
  }

  /** docker stop → dormindo (preserva /android-home). */
  async sleep(id: string): Promise<Avd> {
    const row = await this.findOne(id);
    const servidor = row.servidor ?? (await this.servidores.findOne(row.servidorId));
    const t = sshTargetFromServidor(servidor);
    try {
      await sshExec(t, `docker stop ${shQuote(row.containerName)}`, {
        timeoutMs: 120_000,
      });
      row.status = 'dormindo';
      row.lastError = null;
      return await this.avds.save(row);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      row.lastError = msg;
      await this.avds.save(row);
      throw new ServiceUnavailableException(`falha ao dormir avd: ${msg}`);
    }
  }

  /** docker start → ativo. */
  async wake(id: string): Promise<Avd> {
    const row = await this.findOne(id);
    const servidor = row.servidor ?? (await this.servidores.findOne(row.servidorId));
    const t = sshTargetFromServidor(servidor);
    try {
      await sshExec(t, `docker start ${shQuote(row.containerName)}`, {
        timeoutMs: 60_000,
      });
      row.status = 'ativo';
      row.lastError = null;
      return await this.avds.save(row);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      row.lastError = msg;
      await this.avds.save(row);
      throw new ServiceUnavailableException(`falha ao acordar avd: ${msg}`);
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
    const servidor =
      row.servidor ?? (await this.servidores.findOne(row.servidorId));
    const t = sshTargetFromServidor(servidor);
    const serial = row.serial || serialForAvd(row.nome, row.adbPort);
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
    row: Avd,
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
    row: Avd,
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
    avd: Avd;
    path: string;
    sha256: string | null;
    sizeBytes: number | null;
  }> {
    const row = await this.findOne(id, { sync: true });
    const servidor = row.servidor ?? (await this.servidores.findOne(row.servidorId));
    const t = sshTargetFromServidor(servidor);
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
      await this.avds.save(row);
      return {
        avd: row,
        path,
        sha256: shaMatch?.[1] ?? null,
        sizeBytes: sizeMatch ? Number(sizeMatch[1]) : null,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      row.lastError = msg;
      await this.avds.save(row);
      throw new ServiceUnavailableException(`falha no backup: ${msg}`);
    }
  }

  /** Lista tars em AVD_ARTIFACTS_DIR no servidor do AVD. */
  async listBackups(id: string): Promise<{
    dir: string;
    files: { name: string; path: string; sizeBytes: number; mtime: string }[];
  }> {
    const row = await this.findOne(id);
    const servidor = row.servidor ?? (await this.servidores.findOne(row.servidorId));
    const t = sshTargetFromServidor(servidor);
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
    const servidor = row.servidor ?? (await this.servidores.findOne(row.servidorId));
    const t = sshTargetFromServidor(servidor);
    let remote = path?.trim() || row.lastBackupPath || '';

    if (!remote) {
      const { files } = await this.listBackups(id);
      const match = files.find((f) => f.name.startsWith(`${row.nome}-`));
      if (!match) {
        throw new NotFoundException(
          `nenhum backup tar para ${row.nome}; rode POST /avds/${id}/backup`,
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

  /** Descobre containers `docker-avd-*` nos servidores e upsert na base. */
  async syncFromHosts(servidorId?: string): Promise<{ upserted: number }> {
    let hosts: Servidor[];
    if (servidorId) {
      hosts = [await this.servidores.findOne(servidorId)];
    } else {
      const { data } = await this.servidores.findAll({ limit: 200, status: 'active' });
      hosts = data;
    }

    let upserted = 0;
    for (const s of hosts) {
      try {
        const t = sshTargetFromServidor(s);
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
            portByName.get(containerName) ?? portForAvdName(nome);
          const status = this.mapDockerStatus(statusRaw);
          let row = await this.avds.findOneBy({
            servidorId: s.id,
            nome,
          });
          if (!row) {
            row = this.avds.create({
              nome,
              servidorId: s.id,
              containerName,
              image: image || this.defaultImage(),
              adbPort,
              serial: serialForAvd(nome, adbPort),
              status,
              lastBackupPath: null,
              notas: null,
              lastError: null,
            });
          } else {
            row.containerName = containerName;
            row.status = status;
            row.adbPort = adbPort;
            row.serial = serialForAvd(nome, adbPort);
            if (image) row.image = image;
            row.lastError = null;
          }
          await this.avds.save(row);
          upserted += 1;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`sync servidor ${s.id} (${s.nome}): ${msg}`);
      }
    }
    return { upserted };
  }

  private async refreshRuntimeStatus(row: Avd): Promise<Avd> {
    const servidor = row.servidor ?? (await this.servidores.findOne(row.servidorId));
    try {
      const t = sshTargetFromServidor(servidor);
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
      return await this.avds.save(row);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      row.lastError = msg;
      return await this.avds.save(row);
    }
  }

  private mapDockerStatus(raw: string): AvdStatus {
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
