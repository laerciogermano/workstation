import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Agente } from '../agentes/agente.entity';
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
export class AgenteService {
  private readonly logger = new Logger(AgenteService.name);

  constructor(
    @InjectRepository(AgentJob)
    private readonly jobs: Repository<AgentJob>,
    @InjectRepository(AgentRuntime)
    private readonly runtimes: Repository<AgentRuntime>,
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

  private inboxIntervalMs(): number {
    const n = Number(this.config.get('AGENT_INBOX_INTERVAL_MS', '900000'));
    return Number.isFinite(n) && n >= 60_000 ? n : 900_000;
  }

  /** Intervalo para listar N conexões recentes e promover pending→conectado. */
  private connectionsIntervalMs(): number {
    const n = Number(
      this.config.get('AGENT_CONNECTIONS_INTERVAL_MS', '1800000'),
    );
    return Number.isFinite(n) && n >= 60_000 ? n : 1_800_000;
  }

  private leadThreshold(): number {
    const n = Number(this.config.get('AGENT_LEAD_THRESHOLD', '20'));
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 20;
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
      this.config.get('AGENT_CONNECT_BATCH_INTERVAL_MS', '7200000'),
    );
    return Number.isFinite(n) && n >= 60_000 ? n : 7_200_000;
  }

  /**
   * Subconjunto de tipos a materializar/claimar.
   * Env `AGENT_MATERIALIZE_TYPES=verificar_conexoes,conectar` (vazio = todos).
   * `AGENT_ENVIAR_PROSPECCAO_ENABLED=0` ainda desliga só AC-02 quando a lista está vazia.
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

  private jobTypeEnabled(type: AgentJobType): boolean {
    const set = this.materializeTypeSet();
    if (set) return set.has(type);
    if (type === 'enviar_prospeccao') {
      const raw = String(
        this.config.get('AGENT_ENVIAR_PROSPECCAO_ENABLED', '1'),
      )
        .trim()
        .toLowerCase();
      return !['0', 'false', 'off', 'no'].includes(raw);
    }
    return true;
  }

  /** Cancela pending de tipos fora do allowlist / flag. */
  private async cancelDisabledPending(agentId: string): Promise<void> {
    for (const type of AGENT_JOB_TYPES) {
      if (this.jobTypeEnabled(type)) continue;
      await this.jobs.update(
        { agentId, type, status: 'pending' },
        {
          status: 'cancelled',
          lastError: `tipo desligado (AGENT_MATERIALIZE_TYPES / flag)`,
          completedAt: new Date(),
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

  private maxSlotsPerServer(): number {
    const n = Number(this.config.get('AVD_MAX_ATIVOS_POR_SERVIDOR', '4'));
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 4;
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
    const agentId = String(agentIdRaw || '').trim();
    if (!agentId) throw new BadRequestException('agentId obrigatório');
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
    const agentId = String(agentIdRaw || '').trim();
    if (!agentId) throw new BadRequestException('agentId obrigatório');

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
    agentId: string,
    jobId: string,
    opts?: { result?: Record<string, unknown> },
  ): Promise<AgentJob> {
    const job = await this.findOwnedJob(agentId, jobId);
    if (job.status !== 'claimed' && job.status !== 'pending') {
      throw new BadRequestException(
        `job ${jobId} status=${job.status}; só claimed/pending → done`,
      );
    }
    job.status = 'done';
    job.completedAt = new Date();
    job.lastError = null;
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
    if (runtime.currentJobId === job.id) {
      runtime.currentJobId = null;
      runtime.status = 'idle';
    }
    await this.runtimes.save(runtime);
    return job;
  }

  async fail(
    agentId: string,
    jobId: string,
    error: string,
  ): Promise<AgentJob> {
    const job = await this.findOwnedJob(agentId, jobId);
    job.status = 'failed';
    job.completedAt = new Date();
    job.lastError = String(error || 'erro').slice(0, 2000);
    await this.jobs.save(job);

    const runtime = await this.ensureRuntime(agentId);
    runtime.lastError = job.lastError;
    // Mantém o intervalo mesmo em falha (evita reenfileirar a cada claim).
    if (job.type === 'verificar_conexoes') {
      runtime.lastConnectionsAt = new Date();
    }
    if (runtime.currentJobId === job.id) {
      runtime.currentJobId = null;
      runtime.status = 'idle';
    }
    await this.runtimes.save(runtime);
    return job;
  }

  async peek(agentIdRaw: string): Promise<{
    agentId: string;
    runtime: AgentRuntime;
    online: boolean;
    pending: { type: AgentJobType; count: number }[];
    next: AgentJob | null;
    /** Próximo (ou atual) conectar = 1º card de Candidatos. */
    nextConnect: {
      profileId: string | null;
      profileUrl: string | null;
      name: string | null;
      jobStatus: 'pending' | 'claimed';
      jobId: string;
    } | null;
    thresholds: {
      inboxIntervalMs: number;
      leadThreshold: number;
      leadsNaFila: number;
      connectDailyLimit: number;
      connectBatchSize: number;
      connectBatchIntervalMs: number;
      connectsToday: number;
      connectSlotsNow: number;
      heartbeatStaleMs: number;
    };
  }> {
    const agentId = String(agentIdRaw || '').trim();
    if (!agentId) throw new BadRequestException('agentId obrigatório');
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

    const nextConnect = connectJob
      ? {
          profileId: String(connectJob.payload?.clienteLinkedinId || '') || null,
          profileUrl: String(connectJob.payload?.profileUrl || '') || null,
          name: String(connectJob.payload?.name || '') || null,
          jobStatus: connectJob.status as 'pending' | 'claimed',
          jobId: connectJob.id,
        }
      : null;

    const leadsNaFila = await this.countLeadsCandidatos(agentId);
    const connectsToday = await this.countInvitedToday(agentId);
    const batchNow = await this.connectSlotsNow(agentId, connectsToday);

    return {
      agentId,
      runtime,
      online: this.isOnline(runtime),
      pending,
      next,
      nextConnect,
      thresholds: {
        inboxIntervalMs: this.inboxIntervalMs(),
        leadThreshold: this.leadThreshold(),
        leadsNaFila,
        connectDailyLimit: this.connectDailyLimit(),
        connectBatchSize: batchNow.batchSize,
        connectBatchIntervalMs: batchNow.batchIntervalMs,
        connectsToday,
        connectSlotsNow: batchNow.slots,
        heartbeatStaleMs: this.heartbeatStaleMs(),
      },
    };
  }

  async runtimeStatus(
    agentIdRaw: string,
  ): Promise<AgentRuntime & { online: boolean }> {
    const runtime = await this.ensureRuntime(String(agentIdRaw || '').trim());
    return Object.assign(runtime, { online: this.isOnline(runtime) });
  }

  async listJobs(
    agentId: string,
    opts?: { status?: string; limit?: number },
  ): Promise<AgentJob[]> {
    const id = String(agentId || '').trim();
    if (!id) throw new BadRequestException('agentId obrigatório');
    const limit = Math.min(100, Math.max(1, Number(opts?.limit) || 50));
    const qb = this.jobs
      .createQueryBuilder('j')
      .where('j.agentId = :id', { id })
      .orderBy('j.createdAt', 'DESC')
      .take(limit);
    if (opts?.status) {
      qb.andWhere('j.status = :st', { st: opts.status });
    }
    return qb.getMany();
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
      ativos: number;
      dormindo: number;
      livres: number;
      agentesAtivos: SlotAgentView[];
      candidatosWake: SlotAgentView[];
      candidatosSleep: SlotAgentView[];
    }[];
  }> {
    const maxAtivos = this.maxSlotsPerServer();
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
      for (const a of agentes) {
        try {
          await this.materializeJobs(a.nome);
        } catch (err) {
          this.logger.warn(
            `slots materialize ${a.nome}: ${err instanceof Error ? err.message : err}`,
          );
        }
      }

      const withPending: SlotAgentView[] = [];
      for (const a of agentes) {
        const pendingJobs = await this.jobs.count({
          where: { agentId: a.nome, status: 'pending' },
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
        ativos: agentesAtivos.length,
        dormindo: dormindo.length,
        livres: Math.max(0, maxAtivos - agentesAtivos.length),
        agentesAtivos,
        candidatosWake,
        candidatosSleep,
      });
    }

    return { maxAtivos, hosts };
  }

  private toSlotAgent(a: Agente, pendingJobs: number): SlotAgentView {
    return {
      id: a.id,
      agentId: a.nome,
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
    const agentId = String(agentIdRaw || '').trim();
    if (!agentId) throw new BadRequestException('agentId obrigatório');
    const row = await this.agentesCadastro.findOneBy({ nome: agentId });
    if (!row) {
      throw new NotFoundException(`agente nome=${agentId} não encontrado`);
    }
    row.status = status;
    row.lastError = null;
    return this.agentesCadastro.save(row);
  }

  /** Cria/atualiza filas a partir do estado atual do CRM. */
  private async materializeJobs(agentId: string): Promise<void> {
    await this.cancelDisabledPending(agentId);
    if (this.jobTypeEnabled('ler_mensagens')) {
      await this.enqueueInboxIfDue(agentId);
    }
    if (this.jobTypeEnabled('verificar_conexoes')) {
      await this.enqueueConnectionsIfDue(agentId);
    }
    if (this.jobTypeEnabled('enviar_prospeccao')) {
      await this.enqueueProspeccao(agentId);
    }
    if (this.jobTypeEnabled('conectar')) {
      await this.enqueueConectar(agentId);
    }
    if (this.jobTypeEnabled('extrair_leads')) {
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

    const agente = await this.agentesCadastro.findOneBy({ nome: agentId });
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
   */
  private async enqueueProspeccao(agentId: string): Promise<void> {
    const rows = await this.connections
      .createQueryBuilder('c')
      .innerJoinAndSelect('c.clienteLinkedin', 'cl')
      .where('c.agentId = :agentId', { agentId })
      .andWhere('c.status = :st', {
        st: ClientConnectionLinkedinStatus.CONNECTED,
      })
      .orderBy('c.createdAt', 'ASC')
      .take(30)
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

      const profileUrl = c.clienteLinkedin?.profileUrl ?? null;
      await this.insertJob({
        agentId,
        type: 'enviar_prospeccao',
        dedupeKey: `enviar_prospeccao:${c.id}`,
        payload: {
          ac: 'AC-02',
          connectionId: c.id,
          clienteLinkedinId: c.clienteLinkedinId,
          profileUrl,
          hint: 'Enviar mensagem de prospecção; persistir sent',
        },
      });
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

  /** AC-04: estoque de leads (livres + reservados deste agente) abaixo do threshold. */
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

    await this.insertJob({
      agentId,
      type: 'extrair_leads',
      dedupeKey: `extrair_leads:${agentId}:low`,
      payload: {
        ac: 'AC-04',
        leadsNaFila,
        leadThreshold: threshold,
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

    // limpa done/failed antigo com mesma chave p/ reusar unique parcial
    await this.jobs
      .createQueryBuilder()
      .delete()
      .where('dedupe_key = :k', { k: opts.dedupeKey })
      .andWhere('status IN (:...st)', { st: ['done', 'failed', 'cancelled'] })
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
    const allowed = this.materializeTypeSet();
    const types = allowed
      ? [...allowed]
      : AGENT_JOB_TYPES.filter((t) => this.jobTypeEnabled(t));
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
