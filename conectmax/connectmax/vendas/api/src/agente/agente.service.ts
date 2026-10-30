import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { generateApiKey, hashApiKey } from '../auth/api-key-hash';
import { Agente } from '../agentes/agente.entity';
import {
  containerNameForAgente,
  portForAgenteName,
  serialForAgente,
} from '../agentes/agente-names';
import { hostKey } from '../agentes/ssh-host';
import { ClienteLinkedin } from '../clientes/cliente-linkedin.entity';
import { ClientConnectionLinkedin } from '../client-connections-linkedin/client-connection-linkedin.entity';
import { ClientConnectionLinkedinStatus } from '../client-connections-linkedin/client-connection-linkedin-status';
import { ClientLinkedinMessage } from '../client-linkedin-messages/client-linkedin-message.entity';
import { ClientLinkedinMessageDirection } from '../client-linkedin-messages/client-linkedin-message-direction';
import { AgentJob } from './agent-job.entity';
import {
  AGENT_JOB_PRIORITY,
  AGENT_JOB_TYPES,
  type AgentJobType,
} from './agent-job-types';
import { AgentRuntime } from './agent-runtime.entity';
import { EnrollDto } from './enroll.dto';
import { HostConfig } from './host-config.entity';
import {
  DEFAULT_MENSAGEM_PROSPECCAO,
  renderProspeccaoTemplate,
} from './prospeccao-template';
import { UpdateHostConfigDto } from './update-host-config.dto';

const DEFAULT_AVD_IMAGE =
  'us-docker.pkg.dev/android-emulator-268719/images/30-google-x64-no-metrics:30.1.2';

export type EnrollResult = {
  id: string;
  /** Sempre `agentes.id` (uuid). */
  agentId: string;
  nome: string;
  created: boolean;
  needsLinkedin: boolean;
  hasApiKey: boolean;
  apiKey?: string;
  status: string;
  serial: string;
  containerName: string;
  adbPort: number;
  hostKind: string;
  online: boolean;
  lastHeartbeatAt: Date | null;
};

export type ClaimResult =
  | { job: null; reason: string; runtime: AgentRuntime }
  | { job: AgentJob; reason: null; runtime: AgentRuntime };

/** Inventário de um agente no host (supervisor / rodízio de slots). */
export type SlotAgentView = {
  id: string;
  agentId: string;
  nome: string;
  serial: string;
  containerName: string;
  adbPort: number;
  status: string;
  pendingJobs: number;
};

@Injectable()
export class AgenteService implements OnModuleInit {
  private readonly logger = new Logger(AgenteService.name);

  constructor(
    @InjectRepository(AgentJob)
    private readonly jobs: Repository<AgentJob>,
    @InjectRepository(AgentRuntime)
    private readonly runtimes: Repository<AgentRuntime>,
    @InjectRepository(HostConfig)
    private readonly hostConfigs: Repository<HostConfig>,
    @InjectRepository(ClientConnectionLinkedin)
    private readonly connections: Repository<ClientConnectionLinkedin>,
    @InjectRepository(ClientLinkedinMessage)
    private readonly messages: Repository<ClientLinkedinMessage>,
    @InjectRepository(ClienteLinkedin)
    private readonly clienteLinkedin: Repository<ClienteLinkedin>,
    @InjectRepository(Agente)
    private readonly agentesCadastro: Repository<Agente>,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureHostConfigTable();
    await this.ensureRuntimeSchemaColumns();
  }

  private async ensureHostConfigTable(): Promise<void> {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS host_config (
          host_key varchar(120) PRIMARY KEY,
          max_ativos int NOT NULL DEFAULT 1,
          created_at timestamptz NOT NULL DEFAULT NOW(),
          updated_at timestamptz NOT NULL DEFAULT NOW()
        )
      `);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`ensureHostConfigTable: ${msg}`);
    }
  }

  /** Colunas novas em `agent_runtime` com DB_SYNC=false. Idempotente. */
  private async ensureRuntimeSchemaColumns(): Promise<void> {
    try {
      await this.dataSource.query(
        `ALTER TABLE agent_runtime ADD COLUMN IF NOT EXISTS last_prospeccao_at timestamptz`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`ensureRuntimeSchemaColumns: ${msg}`);
    }
  }

  /**
   * agentId canônico = `agentes.id` (uuid). Path ainda aceita `nome` legado.
   */
  private async resolveAgente(agentIdRaw: string): Promise<Agente> {
    const key = String(agentIdRaw || '').trim();
    if (!key) throw new BadRequestException('agentId obrigatório');
    const byId = await this.agentesCadastro.findOneBy({ id: key });
    if (byId) return byId;
    const byNome = await this.agentesCadastro.findOneBy({ nome: key });
    if (byNome) return byNome;
    throw new NotFoundException(`agente ${key} não encontrado`);
  }

  /** Normaliza path/env para uuid usado em jobs/conexões/runtime. */
  private async canonicalAgentId(agentIdRaw: string): Promise<string> {
    const row = await this.resolveAgente(agentIdRaw);
    return row.id;
  }

  private inboxIntervalMs(): number {
    const n = Number(this.config.get('AGENT_INBOX_INTERVAL_MS', '14400000'));
    return Number.isFinite(n) && n >= 60_000 ? n : 900_000;
  }

  /** Intervalo para listar N conexões recentes e promover pending→conectado (default 4h). */
  private connectionsIntervalMs(): number {
    const n = Number(
      this.config.get('AGENT_CONNECTIONS_INTERVAL_MS', '14400000'),
    );
    return Number.isFinite(n) && n >= 60_000 ? n : 14_400_000;
  }

  private leadThreshold(): number {
    const n = Number(this.config.get('AGENT_LEAD_THRESHOLD', '10'));
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 10;
  }

  /** Mínimo entre um `extrair_leads` e o próximo (default 4 h). */
  private extractIntervalMs(): number {
    const n = Number(
      this.config.get('AGENT_EXTRACT_INTERVAL_MS', '14400000'),
    );
    return Number.isFinite(n) && n >= 60_000 ? n : 14_400_000;
  }

  /** Máx. convites Connect por agente / dia civil (TZ do processo). */
  private connectDailyLimit(): number {
    const n = Number(this.config.get('AGENT_CONNECT_DAILY_LIMIT', '15'));
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 15;
  }

  /** Tamanho do lote de connects antes do intervalo. */
  private connectBatchSize(): number {
    const n = Number(this.config.get('AGENT_CONNECT_BATCH_SIZE', '5'));
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 5;
  }

  /** Pausa entre lotes de connect (default 2h). */
  private connectBatchIntervalMs(): number {
    const n = Number(
      this.config.get('AGENT_CONNECT_BATCH_INTERVAL_MS', '3600000'),
    );
    return Number.isFinite(n) && n >= 60_000 ? n : 7_200_000;
  }

  /** Máx. mensagens de prospecção por agente / dia civil (default 15). */
  private prospeccaoDailyLimit(): number {
    const n = Number(this.config.get('AGENT_PROSPECCAO_DAILY_LIMIT', '15'));
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 15;
  }

  /** Intervalo mínimo entre envios de prospecção com sucesso (default 30 min). */
  private prospeccaoIntervalMs(): number {
    const n = Number(
      this.config.get('AGENT_PROSPECCAO_INTERVAL_MS', '1800000'),
    );
    return Number.isFinite(n) && n >= 60_000 ? n : 1_800_000;
  }

  /** Cooldown após falha de `enviar_prospeccao` antes de tentar de novo (default 5 min). */
  private prospeccaoRetryIntervalMs(): number {
    const n = Number(
      this.config.get('AGENT_PROSPECCAO_RETRY_INTERVAL_MS', '300000'),
    );
    return Number.isFinite(n) && n >= 60_000 ? n : 300_000;
  }

  /** Último job terminal de prospecção (done/failed) — define cooldown sucesso vs retry. */
  private async lastProspeccaoTerminal(
    agentId: string,
  ): Promise<{ status: 'done' | 'failed'; at: Date } | null> {
    const row = await this.jobs.findOne({
      where: {
        agentId,
        type: 'enviar_prospeccao',
        status: In(['done', 'failed']),
      },
      order: { completedAt: 'DESC' },
    });
    if (!row?.completedAt) return null;
    if (row.status !== 'done' && row.status !== 'failed') return null;
    return { status: row.status, at: row.completedAt };
  }

  /**
   * Subconjunto de tipos a materializar/claimar.
   * Env `AGENT_MATERIALIZE_TYPES=verificar_conexoes,conectar` (vazio = todos).
   * Flags soltas (quando a lista está vazia):
   * - `AGENT_ENVIAR_PROSPECCAO_ENABLED=0` desliga AC-02 (default **1**)
   * - `AGENT_LER_MENSAGENS_ENABLED=0` desliga AC-01 (default **0** por enquanto)
   */
  private materializeTypeSet(): Set<AgentJobType> | null {
    const raw = String(this.config.get('AGENT_MATERIALIZE_TYPES', '') || '')
      .trim();
    if (!raw) return null;
    const set = new Set<AgentJobType>();
    for (const part of raw.split(/[,;\s]+/)) {
      const t = part.trim();
      if ((AGENT_JOB_TYPES as readonly string[]).includes(t)) {
        set.add(t as AgentJobType);
      }
    }
    return set.size ? set : null;
  }

  private envFlagEnabled(key: string, defaultValue: string): boolean {
    const raw = String(this.config.get(key, defaultValue))
      .trim()
      .toLowerCase();
    return !['0', 'false', 'off', 'no'].includes(raw);
  }

  private jobTypeEnabled(type: AgentJobType): boolean {
    const set = this.materializeTypeSet();
    if (set) return set.has(type);
    if (type === 'enviar_prospeccao') {
      return this.envFlagEnabled('AGENT_ENVIAR_PROSPECCAO_ENABLED', '1');
    }
    if (type === 'ler_mensagens') {
      return this.envFlagEnabled('AGENT_LER_MENSAGENS_ENABLED', '0');
    }
    return true;
  }

  /** Allowlist do agente (`agentes.procedimentos`); `null` = herda flags globais. */
  private normalizeAgentProcedimentos(
    raw: unknown,
  ): AgentJobType[] | null {
    if (raw == null) return null;
    if (!Array.isArray(raw)) return null;
    const out: AgentJobType[] = [];
    const seen = new Set<string>();
    for (const item of raw) {
      const t = String(item || '').trim();
      if (!(AGENT_JOB_TYPES as readonly string[]).includes(t) || seen.has(t)) {
        continue;
      }
      seen.add(t);
      out.push(t as AgentJobType);
    }
    return out;
  }

  /**
   * Tipos permitidos para o agente.
   * - array em `procedimentos` → allowlist do agente (vence `AGENT_MATERIALIZE_TYPES`)
   * - `procedimentos == null` → flags/env globais (`jobTypeEnabled` / `AGENT_MATERIALIZE_TYPES`)
   */
  private async allowedTypesForAgent(
    agentId: string,
  ): Promise<AgentJobType[]> {
    const row = await this.agentesCadastro.findOneBy({ id: agentId });
    const procs = this.normalizeAgentProcedimentos(row?.procedimentos);
    if (procs != null) {
      return AGENT_JOB_TYPES.filter((t) => procs.includes(t));
    }
    return AGENT_JOB_TYPES.filter((t) => this.jobTypeEnabled(t));
  }

  /** Cancela pending de tipos fora do allowlist / flag / procedimentos do agente. */
  private async cancelDisabledPending(agentId: string): Promise<void> {
    const allowed = new Set(await this.allowedTypesForAgent(agentId));
    for (const type of AGENT_JOB_TYPES) {
      if (allowed.has(type)) continue;
      await this.jobs.update(
        { agentId, type, status: 'pending' },
        {
          status: 'cancelled',
          lastError: `tipo desligado (procedimentos do agente / AGENT_MATERIALIZE_TYPES / flag)`,
          completedAt: new Date(),
          dedupeKey: null,
        },
      );
    }
  }

  private startOfLocalDay(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Leads disponíveis ao agente: livres (ninguém com 0|1|2) **ou** já reservados
   * por ele (`status=0`). Outro agente com 0|1|2 tira o perfil da fila deste.
   */
  private async countLeadsCandidatos(agentId: string): Promise<number> {
    return this.clienteLinkedin
      .createQueryBuilder('li')
      .where('li.deletedAt IS NULL')
      .andWhere("li.profileUrl IS NOT NULL AND li.profileUrl <> ''")
      .andWhere(
        `(
          EXISTS (
            SELECT 1 FROM client_connection_linkedin mine
            WHERE mine.cliente_linkedin_id = li.id
              AND mine.agent_id = :agentId
              AND mine.status = 0
          )
          OR NOT EXISTS (
            SELECT 1 FROM client_connection_linkedin cc
            WHERE cc.cliente_linkedin_id = li.id AND cc.status IN (0, 1, 2)
          )
        )`,
        { agentId },
      )
      .getCount();
  }

  /** Convites já enviados hoje (status 1|2 com invitedAt no dia). */
  private async countInvitedToday(agentId: string): Promise<number> {
    return this.connections
      .createQueryBuilder('c')
      .where('c.agentId = :agentId', { agentId })
      .andWhere('c.status IN (:...st)', {
        st: [
          ClientConnectionLinkedinStatus.PENDING,
          ClientConnectionLinkedinStatus.CONNECTED,
        ],
      })
      .andWhere('c.invitedAt IS NOT NULL')
      .andWhere('c.invitedAt >= :day', { day: this.startOfLocalDay() })
      .getCount();
  }

  /** Último invitedAt de hoje (para cooldown entre lotes). */
  private async lastInvitedAtToday(agentId: string): Promise<Date | null> {
    const row = await this.connections
      .createQueryBuilder('c')
      .select('MAX(c.invitedAt)', 'max')
      .where('c.agentId = :agentId', { agentId })
      .andWhere('c.status IN (:...st)', {
        st: [
          ClientConnectionLinkedinStatus.PENDING,
          ClientConnectionLinkedinStatus.CONNECTED,
        ],
      })
      .andWhere('c.invitedAt IS NOT NULL')
      .andWhere('c.invitedAt >= :day', { day: this.startOfLocalDay() })
      .getRawOne<{ max: Date | string | null }>();
    if (!row?.max) return null;
    const d = row.max instanceof Date ? row.max : new Date(row.max);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  /** Jobs `enviar_prospeccao` concluídos hoje (conta no limite diário). */
  private async countProspeccaoDoneToday(agentId: string): Promise<number> {
    return this.jobs
      .createQueryBuilder('j')
      .where('j.agentId = :agentId', { agentId })
      .andWhere('j.type = :type', { type: 'enviar_prospeccao' })
      .andWhere('j.status = :st', { st: 'done' })
      .andWhere('j.completedAt IS NOT NULL')
      .andWhere('j.completedAt >= :day', { day: this.startOfLocalDay() })
      .getCount();
  }

  private parseHmToMinutes(
    raw: string | null | undefined,
    fallbackMin: number,
  ): number {
    const s = String(raw || '').trim();
    const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(s);
    if (!m) return fallbackMin;
    return Number(m[1]) * 60 + Number(m[2]);
  }

  private formatMinutesAsHm(mins: number): string {
    const day = 24 * 60;
    const clamped = ((mins % day) + day) % day;
    const h = Math.floor(clamped / 60);
    const m = clamped % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  /** Janela do agente (default 08:00–18:00, fim exclusivo). TZ do processo. */
  private resolveProspeccaoWindow(agente: {
    prospeccaoHoraInicio?: string | null;
    prospeccaoHoraFim?: string | null;
  } | null): {
    startMin: number;
    endMin: number;
    startLabel: string;
    endLabel: string;
  } {
    const startMin = this.parseHmToMinutes(agente?.prospeccaoHoraInicio, 8 * 60);
    let endMin = this.parseHmToMinutes(agente?.prospeccaoHoraFim, 18 * 60);
    if (endMin <= startMin) {
      endMin = Math.min(24 * 60, startMin + 60);
    }
    return {
      startMin,
      endMin,
      startLabel: this.formatMinutesAsHm(startMin),
      endLabel: this.formatMinutesAsHm(endMin),
    };
  }

  private nextProspeccaoWindowOpen(
    startMin: number,
    from: Date = new Date(),
  ): Date {
    const next = new Date(from);
    next.setSeconds(0, 0);
    next.setMilliseconds(0);
    next.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
    if (next.getTime() <= from.getTime()) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  /**
   * 1 slot se dentro da janela, ainda há cota do dia e passou o intervalo;
   * senão 0 (fora do horário / cooldown / daily).
   */
  private async prospeccaoSlotsNow(
    agentId: string,
    runtime: AgentRuntime,
    sentToday: number,
  ): Promise<{
    slots: number;
    intervalMs: number;
    dailyLimit: number;
    reason: string | null;
    windowStart: string;
    windowEnd: string;
    nextDueAt: Date | null;
    outsideWindow: boolean;
  }> {
    const dailyLimit = this.prospeccaoDailyLimit();
    const successIntervalMs = this.prospeccaoIntervalMs();
    const retryIntervalMs = this.prospeccaoRetryIntervalMs();
    const agente = await this.agentesCadastro.findOneBy({ id: agentId });
    const win = this.resolveProspeccaoWindow(agente);
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const remainingDaily = Math.max(0, dailyLimit - sentToday);
    const lastTerminal = await this.lastProspeccaoTerminal(agentId);
    const afterFail = lastTerminal?.status === 'failed';
    const intervalMs = afterFail ? retryIntervalMs : successIntervalMs;
    const lastAt = lastTerminal?.at ?? runtime.lastProspeccaoAt;

    if (nowMin < win.startMin || nowMin >= win.endMin) {
      const nextDueAt = this.nextProspeccaoWindowOpen(win.startMin, now);
      return {
        slots: 0,
        intervalMs,
        dailyLimit,
        reason: `fora da janela ${win.startLabel}–${win.endLabel}`,
        windowStart: win.startLabel,
        windowEnd: win.endLabel,
        nextDueAt,
        outsideWindow: true,
      };
    }

    if (remainingDaily <= 0) {
      return {
        slots: 0,
        intervalMs,
        dailyLimit,
        reason: `prospecção daily limit ${sentToday}/${dailyLimit}`,
        windowStart: win.startLabel,
        windowEnd: win.endLabel,
        nextDueAt: null,
        outsideWindow: false,
      };
    }

    if (lastAt) {
      const elapsed = Date.now() - lastAt.getTime();
      if (elapsed < intervalMs) {
        const kind = afterFail ? 'retry após falha' : 'cooldown';
        return {
          slots: 0,
          intervalMs,
          dailyLimit,
          reason: `prospecção ${kind} ${sentToday}/${dailyLimit} (falta ${Math.ceil((intervalMs - elapsed) / 60_000)}min)`,
          windowStart: win.startLabel,
          windowEnd: win.endLabel,
          nextDueAt: new Date(lastAt.getTime() + intervalMs),
          outsideWindow: false,
        };
      }
    }

    return {
      slots: 1,
      intervalMs,
      dailyLimit,
      reason: null,
      windowStart: win.startLabel,
      windowEnd: win.endLabel,
      nextDueAt: null,
      outsideWindow: false,
    };
  }

  /**
   * Quantos connects ainda podem começar agora: resto do lote atual,
   * ou lote novo se passou o intervalo após múltiplo de batchSize.
   */
  private async connectSlotsNow(
    agentId: string,
    invitedToday: number,
  ): Promise<{
    slots: number;
    batchSize: number;
    batchIntervalMs: number;
    reason: string | null;
  }> {
    const dailyLimit = this.connectDailyLimit();
    const batchSize = this.connectBatchSize();
    const batchIntervalMs = this.connectBatchIntervalMs();
    const remainingDaily = Math.max(0, dailyLimit - invitedToday);

    if (remainingDaily <= 0) {
      return {
        slots: 0,
        batchSize,
        batchIntervalMs,
        reason: `connect daily limit ${invitedToday}/${dailyLimit}`,
      };
    }

    const inBatch = invitedToday % batchSize;
    if (inBatch === 0 && invitedToday > 0) {
      const lastAt = await this.lastInvitedAtToday(agentId);
      const elapsed = lastAt ? Date.now() - lastAt.getTime() : batchIntervalMs;
      if (elapsed < batchIntervalMs) {
        return {
          slots: 0,
          batchSize,
          batchIntervalMs,
          reason: `connect batch cooldown ${invitedToday}/${dailyLimit} (lote ${batchSize}, falta ${Math.ceil((batchIntervalMs - elapsed) / 60_000)}min)`,
        };
      }
      return {
        slots: Math.min(batchSize, remainingDaily),
        batchSize,
        batchIntervalMs,
        reason: null,
      };
    }

    return {
      slots: Math.min(batchSize - inBatch, remainingDaily),
      batchSize,
      batchIntervalMs,
      reason: null,
    };
  }

  /** Default global (env); host pode sobrescrever em `host_config`. */
  private maxSlotsPerServer(): number {
    const n = Number(this.config.get('AVD_MAX_ATIVOS_POR_SERVIDOR', '4'));
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 4;
  }

  private async maxSlotsForHost(hostKeyValue: string): Promise<number> {
    const row = await this.hostConfigs.findOneBy({ hostKey: hostKeyValue });
    if (row?.maxAtivos != null && row.maxAtivos >= 1) {
      return Math.min(64, Math.floor(row.maxAtivos));
    }
    return this.maxSlotsPerServer();
  }

  async updateHostMaxAtivos(
    hostKeyRaw: string,
    dto: UpdateHostConfigDto,
  ): Promise<{ hostKey: string; maxAtivos: number }> {
    const key = String(hostKeyRaw || '').trim();
    if (!key) throw new BadRequestException('hostKey obrigatório');
    const maxAtivos = Math.min(64, Math.max(1, Math.floor(Number(dto.maxAtivos))));
    let row = await this.hostConfigs.findOneBy({ hostKey: key });
    if (!row) {
      row = this.hostConfigs.create({ hostKey: key, maxAtivos });
    } else {
      row.maxAtivos = maxAtivos;
    }
    await this.hostConfigs.save(row);
    return { hostKey: key, maxAtivos: row.maxAtivos };
  }

  private claimTimeoutMs(): number {
    const n = Number(this.config.get('AGENT_CLAIM_TIMEOUT_MS', '1800000'));
    return Number.isFinite(n) && n >= 60_000 ? n : 1_800_000;
  }

  private heartbeatStaleMs(): number {
    const n = Number(this.config.get('AGENT_HEARTBEAT_STALE_MS', '120000'));
    return Number.isFinite(n) && n >= 10_000 ? n : 120_000;
  }

  isOnline(runtime: AgentRuntime): boolean {
    if (!runtime.lastHeartbeatAt) return false;
    return (
      Date.now() - runtime.lastHeartbeatAt.getTime() < this.heartbeatStaleMs()
    );
  }

  async ensureRuntime(agentId: string): Promise<AgentRuntime> {
    const id = String(agentId || '').trim();
    if (!id) throw new BadRequestException('agentId obrigatório');
    let row = await this.runtimes.findOneBy({ agentId: id });
    if (!row) {
      row = await this.runtimes.save(
        this.runtimes.create({
          agentId: id,
          status: 'idle',
          currentJobId: null,
          lastInboxAt: null,
          lastConnectionsAt: null,
          lastExtractAt: null,
          lastProspeccaoAt: null,
          lastClaimAt: null,
          lastHeartbeatAt: null,
          hostInstanceId: null,
          workerVersion: null,
          lastError: null,
        }),
      );
    }
    return row;
  }

  async heartbeat(
    agentIdRaw: string,
    opts?: { hostInstanceId?: string; workerVersion?: string },
  ): Promise<AgentRuntime & { online: boolean }> {
    const agentId = await this.canonicalAgentId(agentIdRaw);
    const runtime = await this.ensureRuntime(agentId);
    runtime.lastHeartbeatAt = new Date();
    if (opts?.hostInstanceId !== undefined) {
      runtime.hostInstanceId = String(opts.hostInstanceId || '').slice(0, 120) || null;
    }
    if (opts?.workerVersion !== undefined) {
      runtime.workerVersion = String(opts.workerVersion || '').slice(0, 40) || null;
    }
    await this.runtimes.save(runtime);
    return Object.assign(runtime, { online: true });
  }

  /**
   * Materializa jobs a partir do banco (AC-01…04) e faz claim SKIP LOCKED.
   */
  async claimNext(agentIdRaw: string): Promise<ClaimResult> {
    const agentId = await this.canonicalAgentId(agentIdRaw);

    await this.releaseStaleClaims(agentId);
    await this.materializeJobs(agentId);

    const claimed = await this.claimPendingRow(agentId);
    const runtime = await this.ensureRuntime(agentId);

    if (!claimed) {
      runtime.status = 'idle';
      runtime.currentJobId = null;
      runtime.lastClaimAt = new Date();
      await this.runtimes.save(runtime);
      return {
        job: null,
        reason: 'sem trabalho na fila (prioridades vazias)',
        runtime,
      };
    }

    runtime.status = 'busy';
    runtime.currentJobId = claimed.id;
    runtime.lastClaimAt = new Date();
    runtime.lastError = null;
    await this.runtimes.save(runtime);

    this.logger.log(
      `claim agent=${agentId} type=${claimed.type} job=${claimed.id}`,
    );
    return { job: claimed, reason: null, runtime };
  }

  async complete(
    agentIdRaw: string,
    jobId: string,
    opts?: { result?: Record<string, unknown> },
  ): Promise<AgentJob> {
    const agentId = await this.canonicalAgentId(agentIdRaw);
    const job = await this.findOwnedJob(agentId, jobId);
    if (job.status !== 'claimed' && job.status !== 'pending') {
      throw new BadRequestException(
        `job ${jobId} status=${job.status}; só claimed/pending → done`,
      );
    }
    job.status = 'done';
    job.completedAt = new Date();
    job.lastError = null;
    // libera unique parcial — mantém o histórico (não apaga o done no próximo ciclo)
    job.dedupeKey = null;
    if (opts?.result) {
      job.payload = { ...(job.payload || {}), result: opts.result };
    }
    await this.jobs.save(job);

    const runtime = await this.ensureRuntime(agentId);
    if (job.type === 'ler_mensagens') {
      runtime.lastInboxAt = new Date();
    }
    if (job.type === 'verificar_conexoes') {
      runtime.lastConnectionsAt = new Date();
    }
    if (job.type === 'extrair_leads') {
      runtime.lastExtractAt = new Date();
    }
    if (job.type === 'enviar_prospeccao') {
      runtime.lastProspeccaoAt = new Date();
    }
    if (runtime.currentJobId === job.id) {
      runtime.currentJobId = null;
      runtime.status = 'idle';
    }
    await this.runtimes.save(runtime);
    return job;
  }

  async fail(
    agentIdRaw: string,
    jobId: string,
    error: string,
  ): Promise<AgentJob> {
    const agentId = await this.canonicalAgentId(agentIdRaw);
    const job = await this.findOwnedJob(agentId, jobId);
    job.status = 'failed';
    job.completedAt = new Date();
    job.lastError = String(error || 'erro').slice(0, 2000);
    job.dedupeKey = null;
    await this.jobs.save(job);

    const runtime = await this.ensureRuntime(agentId);
    runtime.lastError = job.lastError;
    // Mantém o intervalo mesmo em falha (evita reenfileirar a cada claim).
    if (job.type === 'verificar_conexoes') {
      runtime.lastConnectionsAt = new Date();
    }
    if (job.type === 'extrair_leads') {
      runtime.lastExtractAt = new Date();
    }
    if (job.type === 'enviar_prospeccao') {
      runtime.lastProspeccaoAt = new Date();
    }
    if (runtime.currentJobId === job.id) {
      runtime.currentJobId = null;
      runtime.status = 'idle';
    }
    await this.runtimes.save(runtime);
    return job;
  }

  /**
   * Previsão de quando cada ciclo pode voltar (inbox / conexões / connect lote).
   * `due` = já pode materializar; `queued` = job pending/claimed; `waiting` = cooldown;
   * `blocked` = pré-condição (ex. sem convites pending).
   */
  private async buildSchedule(
    agentId: string,
    runtime: AgentRuntime,
    pendingByType: Map<AgentJobType, number>,
    opts: {
      pendingInvites: number;
      connectsToday: number;
      connectSlots: number;
      connectBatchIntervalMs: number;
      prospeccaoToday: number;
      prospeccaoSlots: number;
      prospeccaoIntervalMs: number;
      prospeccaoDailyLimit: number;
      prospeccaoWindowStart: string;
      prospeccaoWindowEnd: string;
      prospeccaoOutsideWindow: boolean;
      prospeccaoNextDueAt: Date | null;
      leadThreshold: number;
      leadsNaFila: number;
      extractIntervalMs: number;
      allowedTypes?: ReadonlySet<AgentJobType>;
    },
  ): Promise<
    {
      type: AgentJobType;
      state: 'due' | 'queued' | 'waiting' | 'blocked';
      dueAt: string | null;
      dueInMs: number | null;
      lastAt: string | null;
      intervalMs: number | null;
      reason: string | null;
    }[]
  > {
    const allowed =
      opts.allowedTypes ??
      new Set(await this.allowedTypesForAgent(agentId));
    const now = Date.now();
    const iso = (d: Date | null | undefined) =>
      d ? new Date(d).toISOString() : null;

    const intervalItem = async (
      type: AgentJobType,
      lastAt: Date | null,
      intervalMs: number,
      blocked?: { reason: string } | null,
    ) => {
      const open =
        (pendingByType.get(type) || 0) > 0 ||
        !!(await this.jobs.findOne({
          where: [
            { agentId, type, status: 'pending' },
            { agentId, type, status: 'claimed' },
          ],
        }));
      if (open) {
        return {
          type,
          state: 'queued' as const,
          dueAt: new Date(now).toISOString(),
          dueInMs: 0,
          lastAt: iso(lastAt),
          intervalMs,
          reason: 'job na fila',
        };
      }
      if (blocked) {
        return {
          type,
          state: 'blocked' as const,
          dueAt: null,
          dueInMs: null,
          lastAt: iso(lastAt),
          intervalMs,
          reason: blocked.reason,
        };
      }
      const base = lastAt ? lastAt.getTime() + intervalMs : now;
      const dueInMs = Math.max(0, base - now);
      return {
        type,
        state: (dueInMs <= 0 ? 'due' : 'waiting') as 'due' | 'waiting',
        dueAt: new Date(now + dueInMs).toISOString(),
        dueInMs,
        lastAt: iso(lastAt),
        intervalMs,
        reason:
          dueInMs <= 0
            ? 'intervalo vencido'
            : `a cada ${Math.round(intervalMs / 60_000)} min`,
      };
    };

    const inbox = allowed.has('ler_mensagens')
      ? await intervalItem(
          'ler_mensagens',
          runtime.lastInboxAt,
          this.inboxIntervalMs(),
        )
      : null;

    const connections = allowed.has('verificar_conexoes')
      ? await intervalItem(
          'verificar_conexoes',
          runtime.lastConnectionsAt,
          this.connectionsIntervalMs(),
          opts.pendingInvites <= 0
            ? { reason: 'sem convites pendentes (status=1)' }
            : null,
        )
      : null;

    let conectar: {
      type: AgentJobType;
      state: 'due' | 'queued' | 'waiting' | 'blocked';
      dueAt: string | null;
      dueInMs: number | null;
      lastAt: string | null;
      intervalMs: number | null;
      reason: string | null;
    } | null = null;
    if (allowed.has('conectar')) {
      const connectQueued = (pendingByType.get('conectar') || 0) > 0;
      const lastInvite = await this.lastInvitedAtToday(agentId);
      if (connectQueued) {
        conectar = {
          type: 'conectar',
          state: 'queued',
          dueAt: new Date(now).toISOString(),
          dueInMs: 0,
          lastAt: iso(lastInvite),
          intervalMs: opts.connectBatchIntervalMs,
          reason: 'job na fila',
        };
      } else if (opts.connectSlots > 0) {
        conectar = {
          type: 'conectar',
          state: 'due',
          dueAt: new Date(now).toISOString(),
          dueInMs: 0,
          lastAt: iso(lastInvite),
          intervalMs: opts.connectBatchIntervalMs,
          reason: `${opts.connectSlots} slot(s) de connect disponíveis`,
        };
      } else if (opts.connectsToday >= this.connectDailyLimit()) {
        conectar = {
          type: 'conectar',
          state: 'blocked',
          dueAt: null,
          dueInMs: null,
          lastAt: iso(lastInvite),
          intervalMs: opts.connectBatchIntervalMs,
          reason: `limite diário ${opts.connectsToday}/${this.connectDailyLimit()}`,
        };
      } else {
        const elapsed = lastInvite
          ? now - lastInvite.getTime()
          : opts.connectBatchIntervalMs;
        const dueInMs = Math.max(0, opts.connectBatchIntervalMs - elapsed);
        conectar = {
          type: 'conectar',
          state: dueInMs <= 0 ? 'due' : 'waiting',
          dueAt: new Date(now + dueInMs).toISOString(),
          dueInMs,
          lastAt: iso(lastInvite),
          intervalMs: opts.connectBatchIntervalMs,
          reason:
            dueInMs <= 0
              ? 'cooldown do lote encerrado'
              : `cooldown entre lotes (${Math.round(opts.connectBatchIntervalMs / 60_000)} min)`,
        };
      }
    }

    const prospeccaoQueued = (pendingByType.get('enviar_prospeccao') || 0) > 0;
    let prospeccao: {
      type: AgentJobType;
      state: 'due' | 'queued' | 'waiting' | 'blocked';
      dueAt: string | null;
      dueInMs: number | null;
      lastAt: string | null;
      intervalMs: number | null;
      reason: string | null;
    } | null = null;
    if (allowed.has('enviar_prospeccao')) {
      const lastAt = runtime.lastProspeccaoAt;
      const intervalMs = opts.prospeccaoIntervalMs;
      if (prospeccaoQueued) {
        prospeccao = {
          type: 'enviar_prospeccao',
          state: 'queued',
          dueAt: new Date(now).toISOString(),
          dueInMs: 0,
          lastAt: iso(lastAt),
          intervalMs,
          reason: 'job na fila',
        };
      } else if (opts.prospeccaoOutsideWindow) {
        const dueAt = opts.prospeccaoNextDueAt;
        const dueInMs = dueAt ? Math.max(0, dueAt.getTime() - now) : null;
        prospeccao = {
          type: 'enviar_prospeccao',
          state: 'waiting',
          dueAt: dueAt ? dueAt.toISOString() : null,
          dueInMs,
          lastAt: iso(lastAt),
          intervalMs,
          reason: `fora da janela ${opts.prospeccaoWindowStart}–${opts.prospeccaoWindowEnd}`,
        };
      } else if (opts.prospeccaoToday >= opts.prospeccaoDailyLimit) {
        prospeccao = {
          type: 'enviar_prospeccao',
          state: 'blocked',
          dueAt: null,
          dueInMs: null,
          lastAt: iso(lastAt),
          intervalMs,
          reason: `limite diário ${opts.prospeccaoToday}/${opts.prospeccaoDailyLimit}`,
        };
      } else if (opts.prospeccaoSlots <= 0 && lastAt) {
        const elapsed = now - lastAt.getTime();
        const dueInMs = Math.max(0, intervalMs - elapsed);
        prospeccao = {
          type: 'enviar_prospeccao',
          state: dueInMs <= 0 ? 'due' : 'waiting',
          dueAt: new Date(lastAt.getTime() + intervalMs).toISOString(),
          dueInMs,
          lastAt: iso(lastAt),
          intervalMs,
          reason:
            dueInMs <= 0
              ? 'intervalo vencido'
              : `a cada ${Math.round(intervalMs / 60_000)} min (${opts.prospeccaoToday}/${opts.prospeccaoDailyLimit})`,
        };
      } else if (opts.prospeccaoSlots > 0) {
        prospeccao = {
          type: 'enviar_prospeccao',
          state: 'due',
          dueAt: new Date(now).toISOString(),
          dueInMs: 0,
          lastAt: iso(lastAt),
          intervalMs,
          reason: `pronto ${opts.prospeccaoWindowStart}–${opts.prospeccaoWindowEnd} (${opts.prospeccaoToday}/${opts.prospeccaoDailyLimit})`,
        };
      } else {
        prospeccao = {
          type: 'enviar_prospeccao',
          state: 'blocked',
          dueAt: null,
          dueInMs: null,
          lastAt: iso(lastAt),
          intervalMs,
          reason: 'só quando há conectado sem mensagem enviada',
        };
      }
    }

    let leads: {
      type: AgentJobType;
      state: 'due' | 'queued' | 'waiting' | 'blocked';
      dueAt: string | null;
      dueInMs: number | null;
      lastAt: string | null;
      intervalMs: number | null;
      reason: string | null;
    } | null = null;
    if (allowed.has('extrair_leads')) {
      const leadsQueued = (pendingByType.get('extrair_leads') || 0) > 0;
      const lastAt = runtime.lastExtractAt;
      const intervalMs = opts.extractIntervalMs;
      if (leadsQueued) {
        leads = {
          type: 'extrair_leads',
          state: 'queued',
          dueAt: new Date(now).toISOString(),
          dueInMs: 0,
          lastAt: iso(lastAt),
          intervalMs,
          reason: 'job na fila',
        };
      } else if (opts.leadsNaFila >= opts.leadThreshold) {
        leads = {
          type: 'extrair_leads',
          state: 'blocked',
          dueAt: null,
          dueInMs: null,
          lastAt: iso(lastAt),
          intervalMs,
          reason: `fila ok (${opts.leadsNaFila}/${opts.leadThreshold})`,
        };
      } else if (lastAt) {
        const elapsed = now - lastAt.getTime();
        const dueInMs = Math.max(0, intervalMs - elapsed);
        leads = {
          type: 'extrair_leads',
          state: dueInMs <= 0 ? 'due' : 'waiting',
          dueAt: new Date(lastAt.getTime() + intervalMs).toISOString(),
          dueInMs,
          lastAt: iso(lastAt),
          intervalMs,
          reason:
            dueInMs <= 0
              ? `fila baixa (${opts.leadsNaFila}/${opts.leadThreshold})`
              : `a cada ${Math.round(intervalMs / 60_000)} min (${opts.leadsNaFila}/${opts.leadThreshold})`,
        };
      } else {
        leads = {
          type: 'extrair_leads',
          state: 'due',
          dueAt: new Date(now).toISOString(),
          dueInMs: 0,
          lastAt: null,
          intervalMs,
          reason: `fila baixa (${opts.leadsNaFila}/${opts.leadThreshold})`,
        };
      }
    }

    /** Ordem de exibição: buscar candidatos → conectar → ver conexões → … */
    const typeOrder: Record<AgentJobType, number> = {
      extrair_leads: 0,
      conectar: 1,
      verificar_conexoes: 2,
      ler_mensagens: 3,
      enviar_prospeccao: 4,
    };
    return [inbox, connections, prospeccao, conectar, leads]
      .filter((x): x is NonNullable<typeof connections> => Boolean(x))
      .sort((a, b) => (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99));
  }

  async peek(agentIdRaw: string): Promise<{
    agentId: string;
    runtime: AgentRuntime;
    online: boolean;
    pending: { type: AgentJobType; count: number }[];
    next: AgentJob | null;
    /** Agenda prevista (intervalos / cooldown / bloqueios). */
    schedule: {
      type: AgentJobType;
      state: 'due' | 'queued' | 'waiting' | 'blocked';
      dueAt: string | null;
      dueInMs: number | null;
      lastAt: string | null;
      intervalMs: number | null;
      reason: string | null;
    }[];
    /** Próximo (ou atual) conectar = 1º card de Candidatos. */
    nextConnect: {
      profileId: string | null;
      profileUrl: string | null;
      name: string | null;
      photoBase64: string | null;
      jobStatus: 'pending' | 'claimed';
      jobId: string;
    } | null;
      thresholds: {
      inboxIntervalMs: number;
      connectionsIntervalMs: number;
      extractIntervalMs: number;
      leadThreshold: number;
      leadsNaFila: number;
      connectDailyLimit: number;
      connectBatchSize: number;
      connectBatchIntervalMs: number;
      connectsToday: number;
      connectSlotsNow: number;
      prospeccaoDailyLimit: number;
      prospeccaoIntervalMs: number;
      prospeccaoToday: number;
      prospeccaoSlotsNow: number;
      prospeccaoWindowStart: string;
      prospeccaoWindowEnd: string;
      heartbeatStaleMs: number;
    };
  }> {
    const agentId = await this.canonicalAgentId(agentIdRaw);
    await this.materializeJobs(agentId);
    const runtime = await this.ensureRuntime(agentId);

    const counts = await this.jobs
      .createQueryBuilder('j')
      .select('j.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('j.agentId = :agentId', { agentId })
      .andWhere('j.status = :st', { st: 'pending' })
      .groupBy('j.type')
      .getRawMany<{ type: AgentJobType; count: string }>();

    const openCounts = await this.jobs
      .createQueryBuilder('j')
      .select('j.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('j.agentId = :agentId', { agentId })
      .andWhere('j.status IN (:...sts)', { sts: ['pending', 'claimed'] })
      .groupBy('j.type')
      .getRawMany<{ type: AgentJobType; count: string }>();

    const pendingByType = new Map<AgentJobType, number>();
    for (const c of openCounts) {
      pendingByType.set(c.type, Number(c.count) || 0);
    }

    const pending = (
      [
        'ler_mensagens',
        'verificar_conexoes',
        'enviar_prospeccao',
        'conectar',
        'extrair_leads',
      ] as const
    ).map((type) => ({
      type,
      count: Number(counts.find((c) => c.type === type)?.count || 0),
    }));

    const next = await this.jobs.findOne({
      where: { agentId, status: 'pending' },
      order: { priority: 'ASC', createdAt: 'ASC' },
    });

    const connectJob =
      (await this.jobs.findOne({
        where: { agentId, type: 'conectar', status: 'claimed' },
        order: { claimedAt: 'DESC' },
      })) ||
      (await this.jobs.findOne({
        where: { agentId, type: 'conectar', status: 'pending' },
        order: { createdAt: 'ASC' },
      }));

    let nextConnect: {
      profileId: string | null;
      profileUrl: string | null;
      name: string | null;
      photoBase64: string | null;
      jobStatus: 'pending' | 'claimed';
      jobId: string;
    } | null = null;
    if (connectJob) {
      const profileId =
        String(connectJob.payload?.clienteLinkedinId || '') || null;
      let photoBase64 =
        typeof connectJob.payload?.photoBase64 === 'string'
          ? connectJob.payload.photoBase64 || null
          : null;
      if (!photoBase64 && profileId) {
        const li = await this.clienteLinkedin.findOne({
          where: { id: profileId },
          select: ['id', 'photoBase64'],
        });
        photoBase64 = li?.photoBase64 || null;
      }
      nextConnect = {
        profileId,
        profileUrl: String(connectJob.payload?.profileUrl || '') || null,
        name: String(connectJob.payload?.name || '') || null,
        photoBase64,
        jobStatus: connectJob.status as 'pending' | 'claimed',
        jobId: connectJob.id,
      };
    }

    const leadsNaFila = await this.countLeadsCandidatos(agentId);
    const connectsToday = await this.countInvitedToday(agentId);
    const batchNow = await this.connectSlotsNow(agentId, connectsToday);
    const prospeccaoToday = await this.countProspeccaoDoneToday(agentId);
    const prospeccaoNow = await this.prospeccaoSlotsNow(
      agentId,
      runtime,
      prospeccaoToday,
    );
    const pendingInvites = await this.connections.count({
      where: {
        agentId,
        status: ClientConnectionLinkedinStatus.PENDING,
      },
    });

    const allowedTypes = new Set(await this.allowedTypesForAgent(agentId));
    const schedule = await this.buildSchedule(agentId, runtime, pendingByType, {
      pendingInvites,
      connectsToday,
      connectSlots: batchNow.slots,
      connectBatchIntervalMs: batchNow.batchIntervalMs,
      prospeccaoToday,
      prospeccaoSlots: prospeccaoNow.slots,
      prospeccaoIntervalMs: prospeccaoNow.intervalMs,
      prospeccaoDailyLimit: prospeccaoNow.dailyLimit,
      prospeccaoWindowStart: prospeccaoNow.windowStart,
      prospeccaoWindowEnd: prospeccaoNow.windowEnd,
      prospeccaoOutsideWindow: prospeccaoNow.outsideWindow,
      prospeccaoNextDueAt: prospeccaoNow.nextDueAt,
      leadThreshold: this.leadThreshold(),
      leadsNaFila,
      extractIntervalMs: this.extractIntervalMs(),
      allowedTypes,
    });

    return {
      agentId,
      runtime,
      online: this.isOnline(runtime),
      pending,
      next,
      schedule,
      nextConnect,
      thresholds: {
        inboxIntervalMs: this.inboxIntervalMs(),
        connectionsIntervalMs: this.connectionsIntervalMs(),
        extractIntervalMs: this.extractIntervalMs(),
        leadThreshold: this.leadThreshold(),
        leadsNaFila,
        connectDailyLimit: this.connectDailyLimit(),
        connectBatchSize: batchNow.batchSize,
        connectBatchIntervalMs: batchNow.batchIntervalMs,
        connectsToday,
        connectSlotsNow: batchNow.slots,
        prospeccaoDailyLimit: prospeccaoNow.dailyLimit,
        prospeccaoIntervalMs: prospeccaoNow.intervalMs,
        prospeccaoToday,
        prospeccaoSlotsNow: prospeccaoNow.slots,
        prospeccaoWindowStart: prospeccaoNow.windowStart,
        prospeccaoWindowEnd: prospeccaoNow.windowEnd,
        heartbeatStaleMs: this.heartbeatStaleMs(),
      },
    };
  }

  async runtimeStatus(
    agentIdRaw: string,
  ): Promise<AgentRuntime & { online: boolean }> {
    const agentId = await this.canonicalAgentId(agentIdRaw);
    const runtime = await this.ensureRuntime(agentId);
    return Object.assign(runtime, { online: this.isOnline(runtime) });
  }

  async listJobs(
    agentIdRaw: string,
    opts?: { status?: string; limit?: number },
  ): Promise<AgentJob[]> {
    const id = await this.canonicalAgentId(agentIdRaw);
    const limit = Math.min(100, Math.max(1, Number(opts?.limit) || 50));
    const qb = this.jobs
      .createQueryBuilder('j')
      .where('j.agentId = :id', { id })
      .orderBy('j.createdAt', 'DESC')
      .take(limit);
    if (opts?.status) {
      qb.andWhere('j.status = :st', { st: opts.status });
    }
    const rows = await qb.getMany();
    const missingPhotoIds = [
      ...new Set(
        rows
          .filter(
            (j) =>
              j.type === 'conectar' &&
              !j.payload?.photoBase64 &&
              j.payload?.clienteLinkedinId,
          )
          .map((j) => String(j.payload?.clienteLinkedinId)),
      ),
    ];
    if (!missingPhotoIds.length) return rows;
    const lis = await this.clienteLinkedin.find({
      where: { id: In(missingPhotoIds) },
      select: ['id', 'photoBase64'],
    });
    const byId = new Map(
      lis.map((li) => [li.id, li.photoBase64 || null] as const),
    );
    for (const job of rows) {
      if (job.type !== 'conectar' || job.payload?.photoBase64) continue;
      const liId = String(job.payload?.clienteLinkedinId || '');
      const photo = liId ? byId.get(liId) : null;
      if (!photo) continue;
      job.payload = { ...(job.payload || {}), photoBase64: photo };
    }
    return rows;
  }

  /**
   * Slots por host: máx ativos (default 4) + inventário p/ supervisor (rodízio).
   * Materializa filas dos agentes do host p/ pending/candidatos ficarem frescos.
   */
  async slots(filterHostKey?: string): Promise<{
    maxAtivos: number;
    hosts: {
      hostKey: string;
      hostNome: string;
      maxAtivos: number;
      ativos: number;
      dormindo: number;
      livres: number;
      agentesAtivos: SlotAgentView[];
      candidatosWake: SlotAgentView[];
      candidatosSleep: SlotAgentView[];
    }[];
  }> {
    const defaultMax = this.maxSlotsPerServer();
    const rows = await this.agentesCadastro.find({ order: { nome: 'ASC' } });
    const byHost = new Map<string, Agente[]>();
    for (const a of rows) {
      const key = hostKey(a);
      if (filterHostKey && key !== filterHostKey) continue;
      const list = byHost.get(key) || [];
      list.push(a);
      byHost.set(key, list);
    }

    const hosts = [];
    for (const [key, agentes] of byHost) {
      const maxAtivos = await this.maxSlotsForHost(key);
      for (const a of agentes) {
        try {
          await this.materializeJobs(a.id);
        } catch (err) {
          this.logger.warn(
            `slots materialize ${a.nome}: ${err instanceof Error ? err.message : err}`,
          );
        }
      }

      const withPending: SlotAgentView[] = [];
      for (const a of agentes) {
        const pendingJobs = await this.jobs.count({
          where: { agentId: a.id, status: 'pending' },
        });
        withPending.push(this.toSlotAgent(a, pendingJobs));
      }

      const agentesAtivos = withPending.filter((a) => a.status === 'ativo');
      const dormindo = withPending.filter((a) => a.status === 'dormindo');
      const candidatosWake = dormindo
        .filter((a) => a.pendingJobs > 0)
        .sort((x, y) => y.pendingJobs - x.pendingJobs);
      const candidatosSleep = agentesAtivos
        .filter((a) => a.pendingJobs === 0)
        .sort((x, y) => x.pendingJobs - y.pendingJobs);

      hosts.push({
        hostKey: key,
        hostNome: agentes[0]?.hostNome || key,
        maxAtivos,
        ativos: agentesAtivos.length,
        dormindo: dormindo.length,
        livres: Math.max(0, maxAtivos - agentesAtivos.length),
        agentesAtivos,
        candidatosWake,
        candidatosSleep,
      });
    }

    return { maxAtivos: defaultMax, hosts };
  }

  private toSlotAgent(a: Agente, pendingJobs: number): SlotAgentView {
    return {
      id: a.id,
      agentId: a.id,
      nome: a.nome,
      serial: a.serial,
      containerName: a.containerName,
      adbPort: a.adbPort,
      status: a.status,
      pendingJobs,
    };
  }

  /**
   * Worker local já fez docker start/stop — só sincroniza status no cadastro.
   */
  async setDeviceStatus(
    agentIdRaw: string,
    status: 'ativo' | 'dormindo',
  ): Promise<Agente> {
    const row = await this.resolveAgente(agentIdRaw);
    row.status = status;
    row.lastError = null;
    return this.agentesCadastro.save(row);
  }

  /**
   * Auto-cadastro magro do worker: cria `agentes` se não existir; senão
   * atualiza só device/hostKind/status. Nunca apaga LinkedIn/notas.
   * Bootstrap de create: use `AGENT_API_KEY` global (chave scoped só após existir).
   */
  async enroll(agentIdRaw: string, dto: EnrollDto = {}): Promise<EnrollResult> {
    const key = String(agentIdRaw || '').trim();
    if (!key) throw new BadRequestException('agentId obrigatório');

    let row =
      (await this.agentesCadastro.findOneBy({ id: key })) ||
      (await this.agentesCadastro.findOneBy({ nome: key }));
    const created = !row;
    /** Rótulo do device (container/serial); path pode ser uuid. */
    const nomeKey = row?.nome || key;

    const adbPort =
      dto.adbPort ??
      row?.adbPort ??
      portForAgenteName(nomeKey);
    const serial =
      String(dto.serial || '').trim() ||
      row?.serial ||
      serialForAgente(nomeKey, adbPort);
    const containerName =
      String(dto.containerName || '').trim() ||
      row?.containerName ||
      containerNameForAgente(nomeKey);
    const image =
      String(dto.image || '').trim() ||
      row?.image ||
      this.config.get<string>('AVD_IMAGE')?.trim() ||
      DEFAULT_AVD_IMAGE;

    const hostKind =
      dto.hostKind ||
      row?.hostKind ||
      (dto.localhost === false ? 'server' : 'localhost');
    const localhost =
      dto.localhost !== undefined
        ? Boolean(dto.localhost)
        : row?.localhost ?? hostKind === 'localhost';
    const hostNome =
      String(dto.hostNome || '').trim() ||
      row?.hostNome ||
      String(dto.hostname || '').trim() ||
      (localhost ? 'localhost' : nomeKey);
    const hostname =
      String(dto.hostname || '').trim() || row?.hostname || null;
    const status = dto.status || row?.status || 'dormindo';

    if (!row) {
      // Path uuid sem cadastro: criar pelo painel; slug ainda auto-cria (legado).
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) {
        throw new NotFoundException(`agente ${key} não encontrado`);
      }
      row = this.agentesCadastro.create({
        nome: nomeKey,
        hostNome,
        provedor: null,
        produto: null,
        hostname,
        ipPublico: localhost ? '127.0.0.1' : null,
        ipPrivado: null,
        localhost,
        hostKind,
        sshUser: 'root',
        sshPort: 22,
        sshPassword: null,
        ramGb: dto.ramGb ?? null,
        diskGb: dto.diskGb ?? null,
        nestedKvm: false,
        hostStatus: 'active',
        containerName,
        image,
        adbPort,
        serial,
        status,
        lastBackupPath: null,
        notas: null,
        lastError: null,
        linkedinNome: null,
        linkedinUsuario: null,
        linkedinSenha: null,
        linkedinProfileUrl: null,
        linkedinHeadline: null,
        linkedinPhotoBase64: null,
        linkedinStatus: 'ativa',
        linkedinInfracoes: [],
      });
      row = await this.agentesCadastro.save(row);
      this.logger.log(`enroll created nome=${nomeKey} id=${row.id}`);
    } else {
      row.serial = serial;
      row.containerName = containerName;
      row.adbPort = adbPort;
      row.image = image;
      row.hostKind = hostKind;
      row.localhost = localhost;
      row.hostNome = hostNome;
      if (hostname !== undefined) row.hostname = hostname;
      if (dto.ramGb != null) row.ramGb = dto.ramGb;
      if (dto.diskGb != null) row.diskGb = dto.diskGb;
      if (localhost) row.ipPublico = row.ipPublico || '127.0.0.1';
      if (dto.status) {
        row.status = dto.status;
        row.lastError = null;
      }
      row = await this.agentesCadastro.save(row);
    }

    const withHash = await this.agentesCadastro
      .createQueryBuilder('a')
      .addSelect('a.apiKeyHash')
      .where('a.id = :id', { id: row.id })
      .getOne();
    const hadKey = Boolean(withHash?.apiKeyHash);
    const wantKey = created
      ? dto.issueApiKey !== false
      : dto.issueApiKey === true;
    let apiKey: string | undefined;
    if (wantKey) {
      apiKey = generateApiKey();
      await this.agentesCadastro
        .createQueryBuilder()
        .update(Agente)
        .set({ apiKeyHash: hashApiKey(apiKey) })
        .where('id = :id', { id: row.id })
        .execute();
    }

    const runtime = await this.heartbeat(row.id, {
      hostInstanceId: dto.hostInstanceId,
      workerVersion: dto.workerVersion,
    });

    const needsLinkedin = !String(row.linkedinUsuario || '').trim();

    return {
      id: row.id,
      agentId: row.id,
      nome: row.nome,
      created,
      needsLinkedin,
      hasApiKey: Boolean(apiKey) || hadKey,
      ...(apiKey ? { apiKey } : {}),
      status: row.status,
      serial: row.serial,
      containerName: row.containerName,
      adbPort: row.adbPort,
      hostKind: row.hostKind,
      online: runtime.online,
      lastHeartbeatAt: runtime.lastHeartbeatAt,
    };
  }

  /** Cria/atualiza filas a partir do estado atual do CRM. */
  private async materializeJobs(agentId: string): Promise<void> {
    await this.cancelDisabledPending(agentId);
    const allowed = new Set(await this.allowedTypesForAgent(agentId));
    if (allowed.has('ler_mensagens')) {
      await this.enqueueInboxIfDue(agentId);
    }
    if (allowed.has('verificar_conexoes')) {
      await this.enqueueConnectionsIfDue(agentId);
    }
    if (allowed.has('enviar_prospeccao')) {
      await this.enqueueProspeccao(agentId);
    }
    if (allowed.has('conectar')) {
      await this.enqueueConectar(agentId);
    }
    if (allowed.has('extrair_leads')) {
      await this.enqueueExtrairIfLow(agentId);
    }
  }

  /** AC-01: ler mensagens se passou o intervalo. */
  private async enqueueInboxIfDue(agentId: string): Promise<void> {
    const runtime = await this.ensureRuntime(agentId);
    const due =
      !runtime.lastInboxAt ||
      Date.now() - runtime.lastInboxAt.getTime() >= this.inboxIntervalMs();
    if (!due) return;

    const open = await this.jobs.findOne({
      where: [
        { agentId, type: 'ler_mensagens', status: 'pending' },
        { agentId, type: 'ler_mensagens', status: 'claimed' },
      ],
    });
    if (open) return;

    await this.insertJob({
      agentId,
      type: 'ler_mensagens',
      dedupeKey: `ler_mensagens:${agentId}:due`,
      payload: {
        ac: 'AC-01',
        action: 'sync_inbox',
        hint: 'Checar mensagens não lidas; salvar em client_linkedin_message',
      },
    });
  }

  /**
   * Lista N conexões recentes no LinkedIn → mark-accepted (pending→2).
   * Só enfileira se há convites pendentes e passou AGENT_CONNECTIONS_INTERVAL_MS.
   */
  private async enqueueConnectionsIfDue(agentId: string): Promise<void> {
    const pendingInvites = await this.connections.count({
      where: {
        agentId,
        status: ClientConnectionLinkedinStatus.PENDING,
      },
    });
    if (pendingInvites <= 0) return;

    const runtime = await this.ensureRuntime(agentId);
    const due =
      !runtime.lastConnectionsAt ||
      Date.now() - runtime.lastConnectionsAt.getTime() >=
        this.connectionsIntervalMs();
    if (!due) return;

    const open = await this.jobs.findOne({
      where: [
        { agentId, type: 'verificar_conexoes', status: 'pending' },
        { agentId, type: 'verificar_conexoes', status: 'claimed' },
      ],
    });
    if (open) return;

    const n = Math.max(
      1,
      Math.min(
        50,
        Number(this.config.get('AGENT_CONNECTIONS_CHECK_N', '20')) || 20,
      ),
    );

    const agente = await this.agentesCadastro.findOneBy({ id: agentId });
    const profileUrl =
      String(agente?.linkedinProfileUrl || '').trim() || null;

    await this.insertJob({
      agentId,
      type: 'verificar_conexoes',
      dedupeKey: `verificar_conexoes:${agentId}:due`,
      payload: {
        ac: 'verificar_conexoes',
        action: 'extract_recent_connections',
        n,
        pendingInvites,
        profileUrl,
        hint: 'perfil → tap N connections → mark-accepted (lote 20)',
      },
    });
  }

  /**
   * AC-02: conectado (status=2) sem nenhuma mensagem `sent` do agente.
   * Mensagem = template do agente (`mensagem_prospeccao`) com placeholders
   * (`{{primeiro_nome}}`, `{{empresa}}`, … — ver `prospeccao-template.ts`).
   * 1 job por vez; máx. AGENT_PROSPECCAO_DAILY_LIMIT/dia com pausa
   * AGENT_PROSPECCAO_INTERVAL_MS entre envios.
   */
  private async enqueueProspeccao(agentId: string): Promise<void> {
    const runtime = await this.ensureRuntime(agentId);
    const sentToday = await this.countProspeccaoDoneToday(agentId);
    const slot = await this.prospeccaoSlotsNow(agentId, runtime, sentToday);

    const claimedOpen = await this.jobs.count({
      where: { agentId, type: 'enviar_prospeccao', status: 'claimed' },
    });
    const pendingRows = await this.jobs.find({
      where: { agentId, type: 'enviar_prospeccao', status: 'pending' },
      order: { createdAt: 'ASC' },
    });

    const cancelPending = async (reason: string, keepFirst = false) => {
      const toCancel = keepFirst ? pendingRows.slice(1) : pendingRows;
      for (const j of toCancel) {
        j.status = 'cancelled';
        j.lastError = reason;
        j.completedAt = new Date();
        j.dedupeKey = null;
      }
      if (toCancel.length) await this.jobs.save(toCancel);
    };

    if (slot.slots <= 0) {
      await cancelPending(slot.reason || 'prospecção blocked');
      return;
    }

    if (claimedOpen > 0) {
      await cancelPending('já há enviar_prospeccao claimed');
      return;
    }

    if (pendingRows.length > 0) {
      // 1 por vez: mantém o mais antigo, cancela o restante (legado em lote).
      await cancelPending('só 1 enviar_prospeccao por vez', true);
      return;
    }

    const agente = await this.agentesCadastro.findOneBy({ id: agentId });
    const template =
      String(agente?.mensagemProspeccao || '').trim() ||
      DEFAULT_MENSAGEM_PROSPECCAO;

    const rows = await this.connections
      .createQueryBuilder('c')
      .innerJoinAndSelect('c.clienteLinkedin', 'cl')
      .leftJoinAndSelect('cl.cliente', 'cli')
      .where('c.agentId = :agentId', { agentId })
      .andWhere('c.status = :st', {
        st: ClientConnectionLinkedinStatus.CONNECTED,
      })
      .orderBy('c.createdAt', 'ASC')
      .take(40)
      .getMany();

    for (const c of rows) {
      const sent = await this.messages.count({
        where: {
          agentId,
          clienteLinkedinId: c.clienteLinkedinId,
          direction: ClientLinkedinMessageDirection.SENT,
        },
      });
      if (sent > 0) continue;

      const li = c.clienteLinkedin;
      const cli = li?.cliente;
      const profileUrl = li?.profileUrl ?? null;
      const name = cli?.nome ?? null;
      const message = renderProspeccaoTemplate(template, {
        nome: name,
        firstName: agente?.firstName || null,
        lastName: agente?.lastName || null,
        nomeAgente: agente?.nome || null,
        empresa: cli?.empresa || li?.company || null,
        cargo: cli?.cargo || null,
        headline: li?.headline || null,
        cidade: cli?.cidade || li?.location || null,
        email: cli?.email || null,
        telefone: cli?.telefone || null,
        profileUrl,
      });
      await this.insertJob({
        agentId,
        type: 'enviar_prospeccao',
        dedupeKey: `enviar_prospeccao:${c.id}`,
        payload: {
          ac: 'AC-02',
          connectionId: c.id,
          clienteLinkedinId: c.clienteLinkedinId,
          profileUrl,
          name,
          message,
          template,
          hint: 'Enviar mensagem de prospecção; persistir sent',
        },
      });
      return; // 1 job por materialize
    }
  }

  /**
   * AC-03: 1º candidato **deste** agente (já status=0) ou lead livre (ninguém 0|1|2)
   * → reserva NOT_SENT. Máx. AGENT_CONNECT_DAILY_LIMIT/dia em lotes
   * AGENT_CONNECT_BATCH_SIZE com pausa AGENT_CONNECT_BATCH_INTERVAL_MS.
   */
  private async enqueueConectar(agentId: string): Promise<void> {
    const dailyLimit = this.connectDailyLimit();
    const invitedToday = await this.countInvitedToday(agentId);
    const batch = await this.connectSlotsNow(agentId, invitedToday);

    if (batch.slots <= 0) {
      await this.jobs.update(
        { agentId, type: 'conectar', status: 'pending' },
        {
          status: 'cancelled',
          lastError: batch.reason || 'connect batch blocked',
          completedAt: new Date(),
        },
      );
      return;
    }

    const claimedJobs = await this.jobs.find({
      where: { agentId, type: 'conectar', status: 'claimed' },
    });
    const claimedIds = new Set(
      claimedJobs
        .map((j) => String(j.payload?.clienteLinkedinId || ''))
        .filter(Boolean),
    );
    const slots = Math.max(
      0,
      Math.min(1, batch.slots - claimedJobs.length),
    );

    await this.jobs.update(
      { agentId, type: 'conectar', status: 'pending' },
      {
        status: 'cancelled',
        lastError: 'reconnect queue — leads do agente',
        completedAt: new Date(),
      },
    );
    if (slots <= 0) return;

    const take = Math.max(8, claimedJobs.length + 2);
    let conn: ClientConnectionLinkedin | null = null;
    let nextLi: ClienteLinkedin | null = null;

    // 1) Já reservados por este agente (status=0)
    const mine = await this.connections.find({
      where: {
        agentId,
        status: ClientConnectionLinkedinStatus.NOT_SENT,
      },
      relations: ['clienteLinkedin', 'clienteLinkedin.cliente'],
      order: { createdAt: 'ASC' },
      take,
    });
    for (const c of mine) {
      const li = c.clienteLinkedin;
      if (!li || li.deletedAt) continue;
      if (!li.profileUrl) continue;
      if (claimedIds.has(li.id)) continue;
      conn = c;
      nextLi = li;
      break;
    }

    // 2) Livre: ninguém com 0|1|2 → grava NOT_SENT para este agente
    if (!conn || !nextLi) {
      const head = await this.listCandidatosLivres(take);
      for (const li of head) {
        if (claimedIds.has(li.id)) continue;
        const claimed = await this.tryClaimLeadForAgent(agentId, li.id);
        if (!claimed) continue;
        conn = claimed;
        nextLi = li;
        break;
      }
    }

    if (!conn || !nextLi) return;
    if (conn.status !== ClientConnectionLinkedinStatus.NOT_SENT) return;

    const queuePos = (invitedToday % batch.batchSize) + claimedJobs.length + 1;

    await this.insertJob({
      agentId,
      type: 'conectar',
      dedupeKey: `conectar:${conn.id}`,
      payload: {
        ac: 'AC-03',
        connectionId: conn.id,
        clienteLinkedinId: nextLi.id,
        profileUrl: nextLi.profileUrl,
        name: nextLi.cliente?.nome ?? null,
        photoBase64: nextLi.photoBase64 ?? null,
        queuePos,
        hint: 'lead do agente (reservado status=0) ou livre → claim',
        connectsToday: invitedToday,
        connectDailyLimit: dailyLimit,
        connectBatchSize: batch.batchSize,
        connectBatchIntervalMs: batch.batchIntervalMs,
      },
    });
  }

  /**
   * Perfis livres: sem conexão ativa (0|1|2) de **nenhum** agente.
   * Ordem = GET /profiles (extractedAt DESC).
   */
  private async listCandidatosLivres(
    limit: number,
  ): Promise<ClienteLinkedin[]> {
    const take = Math.max(1, Math.min(50, Math.floor(limit) || 1));
    return this.clienteLinkedin
      .createQueryBuilder('li')
      .leftJoinAndSelect('li.cliente', 'cl')
      .where('li.deletedAt IS NULL')
      .andWhere("li.profileUrl IS NOT NULL AND li.profileUrl <> ''")
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM client_connection_linkedin cc
          WHERE cc.cliente_linkedin_id = li.id AND cc.status IN (0, 1, 2)
        )`,
      )
      .orderBy('li.extractedAt', 'DESC', 'NULLS LAST')
      .addOrderBy('li.createdAt', 'DESC')
      .take(take)
      .getMany();
  }

  /**
   * Reserva lead para o agente (NOT_SENT). Null se outro agente já tem 0|1|2
   * ou corrida no unique parcial.
   */
  private async tryClaimLeadForAgent(
    agentId: string,
    clienteLinkedinId: string,
  ): Promise<ClientConnectionLinkedin | null> {
    const other = await this.connections
      .createQueryBuilder('c')
      .where('c.clienteLinkedinId = :id', { id: clienteLinkedinId })
      .andWhere('c.agentId <> :agentId', { agentId })
      .andWhere('c.status IN (:...st)', {
        st: [
          ClientConnectionLinkedinStatus.NOT_SENT,
          ClientConnectionLinkedinStatus.PENDING,
          ClientConnectionLinkedinStatus.CONNECTED,
        ],
      })
      .getOne();
    if (other) return null;

    const existing = await this.connections.findOneBy({
      agentId,
      clienteLinkedinId,
    });
    if (existing) {
      return existing.status === ClientConnectionLinkedinStatus.NOT_SENT
        ? existing
        : null;
    }

    try {
      return await this.connections.save(
        this.connections.create({
          clienteLinkedinId,
          agentId,
          status: ClientConnectionLinkedinStatus.NOT_SENT,
        }),
      );
    } catch (err) {
      this.logger.debug(
        `tryClaimLead skip ${clienteLinkedinId}: ${
          err instanceof Error ? err.message : err
        }`,
      );
      return null;
    }
  }

  /**
   * AC-04: estoque de leads (livres + reservados deste agente) abaixo do threshold
   * e intervalo mínimo AGENT_EXTRACT_INTERVAL_MS desde o último extract.
   */
  private async enqueueExtrairIfLow(agentId: string): Promise<void> {
    const leadsNaFila = await this.countLeadsCandidatos(agentId);
    const threshold = this.leadThreshold();
    if (leadsNaFila >= threshold) {
      // Cancela pending; claimed segue até complete/fail/timeout.
      await this.jobs.update(
        { agentId, type: 'extrair_leads', status: 'pending' },
        {
          status: 'cancelled',
          lastError: `leads (candidatos)=${leadsNaFila} >= threshold=${threshold}`,
          completedAt: new Date(),
          dedupeKey: null,
        },
      );
      return;
    }

    const runtime = await this.ensureRuntime(agentId);
    const intervalMs = this.extractIntervalMs();
    const due =
      !runtime.lastExtractAt ||
      Date.now() - runtime.lastExtractAt.getTime() >= intervalMs;
    if (!due) {
      await this.jobs.update(
        { agentId, type: 'extrair_leads', status: 'pending' },
        {
          status: 'cancelled',
          lastError: `extract cooldown < ${Math.round(intervalMs / 60_000)} min (lastExtractAt)`,
          completedAt: new Date(),
          dedupeKey: null,
        },
      );
      return;
    }

    const open = await this.jobs.findOne({
      where: [
        { agentId, type: 'extrair_leads', status: 'pending' },
        { agentId, type: 'extrair_leads', status: 'claimed' },
      ],
    });
    if (open) return;

    const agente = await this.agentesCadastro.findOneBy({ id: agentId });
    const query = String(agente?.searchQuery || '').trim() || null;

    await this.insertJob({
      agentId,
      type: 'extrair_leads',
      dedupeKey: `extrair_leads:${agentId}:low`,
      payload: {
        ac: 'AC-04',
        leadsNaFila,
        leadThreshold: threshold,
        extractIntervalMs: intervalMs,
        query,
        hint: 'Rodar extract/search; upsert candidatos (leads globais)',
      },
    });
  }

  private async insertJob(opts: {
    agentId: string;
    type: AgentJobType;
    dedupeKey: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    const existing = await this.jobs.findOne({
      where: [
        { dedupeKey: opts.dedupeKey, status: 'pending' },
        { dedupeKey: opts.dedupeKey, status: 'claimed' },
      ],
    });
    if (existing) return;

    // Unique parcial (dedupe_key NOT NULL): libera chave em terminais sem apagar histórico.
    await this.jobs
      .createQueryBuilder()
      .update(AgentJob)
      .set({ dedupeKey: null })
      .where('dedupe_key = :k', { k: opts.dedupeKey })
      .andWhere('status IN (:...st)', {
        st: ['done', 'failed', 'cancelled'],
      })
      .execute();

    try {
      await this.jobs.save(
        this.jobs.create({
          agentId: opts.agentId,
          type: opts.type,
          priority: AGENT_JOB_PRIORITY[opts.type],
          status: 'pending',
          payload: opts.payload,
          dedupeKey: opts.dedupeKey,
          claimedAt: null,
          completedAt: null,
          lastError: null,
        }),
      );
    } catch (err) {
      // corrida no unique — ok
      this.logger.debug(
        `insertJob skip ${opts.dedupeKey}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  private async claimPendingRow(agentId: string): Promise<AgentJob | null> {
    const types = await this.allowedTypesForAgent(agentId);
    if (!types.length) return null;

    return this.dataSource.transaction(async (manager) => {
      const rows: AgentJob[] = await manager.query(
        `
        SELECT id FROM agent_jobs
        WHERE agent_id = $1 AND status = 'pending'
          AND type = ANY($2::text[])
        ORDER BY priority ASC, created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
        `,
        [agentId, types],
      );
      if (!rows.length) return null;
      const id = rows[0].id;
      await manager.query(
        `
        UPDATE agent_jobs
        SET status = 'claimed', claimed_at = NOW(), updated_at = NOW()
        WHERE id = $1
        `,
        [id],
      );
      return manager.findOneBy(AgentJob, { id });
    });
  }

  private async releaseStaleClaims(agentId: string): Promise<void> {
    const timeoutSec = Math.floor(this.claimTimeoutMs() / 1000);
    await this.dataSource.query(
      `
      UPDATE agent_jobs
      SET status = 'pending',
          claimed_at = NULL,
          last_error = 'claim timeout — reaberto',
          updated_at = NOW()
      WHERE agent_id = $1
        AND status = 'claimed'
        AND claimed_at < NOW() - ($2::text || ' seconds')::interval
      `,
      [agentId, String(timeoutSec)],
    );
  }

  private async findOwnedJob(
    agentIdRaw: string,
    jobId: string,
  ): Promise<AgentJob> {
    const agentId = String(agentIdRaw || '').trim();
    const job = await this.jobs.findOneBy({ id: jobId });
    if (!job) throw new NotFoundException(`job não encontrado: ${jobId}`);
    if (job.agentId !== agentId) {
      throw new BadRequestException('job pertence a outro agentId');
    }
    return job;
  }
}
