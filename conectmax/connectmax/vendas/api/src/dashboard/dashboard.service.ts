import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository, SelectQueryBuilder } from 'typeorm';
import { AgentJob } from '../agente/agent-job.entity';
import {
  AGENT_JOB_TYPES,
  type AgentJobType,
} from '../agente/agent-job-types';
import { AgentRuntime } from '../agente/agent-runtime.entity';
import { Agente } from '../agentes/agente.entity';
import { ClientConnectionLinkedin } from '../client-connections-linkedin/client-connection-linkedin.entity';
import {
  CLIENT_CONNECTION_LINKEDIN_STATUS_LABEL,
  ClientConnectionLinkedinStatus,
} from '../client-connections-linkedin/client-connection-linkedin-status';
import { ClienteLinkedin } from '../clientes/cliente-linkedin.entity';
import {
  INVITE_STATUS_LABEL,
  InviteStatus,
} from '../clientes/invite-status';
import { ClientLinkedinMessage } from '../client-linkedin-messages/client-linkedin-message.entity';
import { ClientLinkedinMessageDirection } from '../client-linkedin-messages/client-linkedin-message-direction';

type CountRow = { label: string; count: number; pct?: number };

/** Série diária atribuída a um agente (`agentId` = `agentes.id` / connection.agent_id). */
type AgentDayCount = { label: string; agentId: string; count: number };

type Kpi = {
  label: string;
  value: string | number;
  hint?: string;
  group?: 'funil' | 'procedimentos';
};

type RecentRow = {
  id: string;
  name: string | null;
  title: string | null;
  city: string | null;
  company: string | null;
  inviteStatus: string | null;
  connectionDegree: string | null;
  photoBase64: string | null;
  when: Date | null;
};

/** Funil + presença por agente (`client_connection_linkedin.agent_id`). */
export type AgentInsight = {
  agentId: string;
  name: string;
  status: string | null;
  linkedinStatus: string | null;
  notSent: number;
  pending: number;
  connected: number;
  abordados: number;
  respondidos: number;
  discarded: number;
  total: number;
  lastHeartbeatAt: Date | null;
  runtimeStatus: string | null;
};

export type ProcedureInsight = {
  type: AgentJobType;
  label: string;
  done: number;
  pending: number;
  claimed: number;
  failed: number;
  total: number;
};

export type DashboardInsights = {
  kpis: Kpi[];
  byInviteStatus: CountRow[];
  byFunil: CountRow[];
  byConnStatus: CountRow[];
  byDegree: CountRow[];
  byCity: CountRow[];
  byTitle: CountRow[];
  byCompany: CountRow[];
  byDayExtract: AgentDayCount[];
  byDayConnected: AgentDayCount[];
  byDayInvited: AgentDayCount[];
  byDayAbordados: AgentDayCount[];
  byDayRespondidos: AgentDayCount[];
  byProcedure: ProcedureInsight[];
  byAgent: AgentInsight[];
  recent: RecentRow[];
};

const PROCEDURE_LABEL: Record<AgentJobType, string> = {
  extrair_leads: 'Buscar candidatos',
  conectar: 'Conectar',
  verificar_conexoes: 'Ver conexões',
  enviar_prospeccao: 'Enviar prospecção',
  ler_mensagens: 'Ler mensagens',
};

/** Ordem do funil (≠ prioridade do worker em AGENT_JOB_TYPES). */
const PROCEDURE_FUNNEL_ORDER: AgentJobType[] = [
  'extrair_leads',
  'conectar',
  'verificar_conexoes',
  'enviar_prospeccao',
  'ler_mensagens',
];

function pct(n: number, den: number): number {
  return den ? Math.round((100 * n) / den) : 0;
}

function mapCountRows(
  rows: { label: string | null; count: string | number }[],
  empty: string,
  total?: number,
): CountRow[] {
  return rows.map((r) => {
    const count = Number(r.count) || 0;
    return {
      label: (r.label && String(r.label).trim()) || empty,
      count,
      ...(total !== undefined ? { pct: pct(count, total) } : {}),
    };
  });
}

/** YYYY-MM-DD UTC de N dias atrás (inclusive com hoje ≈ N+1 buckets se filtrar ≥). */
function dayCutoffUtc(days: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

function mapAgentDayRows(
  rows: {
    label: string | null;
    agentId: string | null;
    count: string | number;
  }[],
  sinceDay: string,
): AgentDayCount[] {
  return rows
    .map((r) => ({
      label: (r.label && String(r.label).trim()) || '',
      agentId: (r.agentId && String(r.agentId).trim()) || '',
      count: Number(r.count) || 0,
    }))
    .filter((r) => r.label && r.agentId && r.label >= sinceDay);
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(ClienteLinkedin)
    private readonly linkedin: Repository<ClienteLinkedin>,
    @InjectRepository(ClientConnectionLinkedin)
    private readonly connections: Repository<ClientConnectionLinkedin>,
    @InjectRepository(ClientLinkedinMessage)
    private readonly messages: Repository<ClientLinkedinMessage>,
    @InjectRepository(AgentJob)
    private readonly jobs: Repository<AgentJob>,
    @InjectRepository(Agente)
    private readonly agentes: Repository<Agente>,
    @InjectRepository(AgentRuntime)
    private readonly runtimes: Repository<AgentRuntime>,
  ) {}

  private active(): SelectQueryBuilder<ClienteLinkedin> {
    return this.linkedin
      .createQueryBuilder('li')
      .leftJoin('li.cliente', 'cl')
      .where('li.deletedAt IS NULL');
  }

  /**
   * Funil só com perfil vivo — soft-delete do candidato sem descartar status=0
   * deixava órfãos e KPI "Sem convite" > coluna Candidatos.
   */
  private activeConnections(): SelectQueryBuilder<ClientConnectionLinkedin> {
    return this.connections
      .createQueryBuilder('c')
      .innerJoin('c.clienteLinkedin', 'li')
      .where('li.deletedAt IS NULL');
  }

  /** Mensagens com perfil ativo (igual colunas Abordados/Respondidos do board). */
  private activeMessages(): SelectQueryBuilder<ClientLinkedinMessage> {
    return this.messages
      .createQueryBuilder('m')
      .innerJoin('m.clienteLinkedin', 'li')
      .where('li.deletedAt IS NULL');
  }

  /** Pessoas distintas com ≥1 mensagem na direção (board = 1 card/pessoa). */
  private async countDistinctPeople(
    direction: ClientLinkedinMessageDirection,
  ): Promise<number> {
    const row = await this.activeMessages()
      .select('COUNT(DISTINCT m.clienteLinkedinId)', 'count')
      .andWhere('m.direction = :dir', { dir: direction })
      .getRawOne<{ count: string }>();
    return Number(row?.count) || 0;
  }

  private async peopleByAgent(
    direction: ClientLinkedinMessageDirection,
  ): Promise<{ agentId: string; count: string }[]> {
    return this.activeMessages()
      .select('m.agentId', 'agentId')
      .addSelect('COUNT(DISTINCT m.clienteLinkedinId)', 'count')
      .andWhere('m.direction = :dir', { dir: direction })
      .groupBy('m.agentId')
      .getRawMany<{ agentId: string; count: string }>();
  }

  private async peopleByDay(
    direction: ClientLinkedinMessageDirection,
  ): Promise<{ label: string | null; agentId: string | null; count: string }[]> {
    return this.activeMessages()
      .select(
        `TO_CHAR(COALESCE(m.occurredAt, m.createdAt) AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
        'label',
      )
      .addSelect('m.agentId', 'agentId')
      .addSelect('COUNT(DISTINCT m.clienteLinkedinId)', 'count')
      .andWhere('m.direction = :dir', { dir: direction })
      .andWhere('COALESCE(m.occurredAt, m.createdAt) IS NOT NULL')
      .groupBy('label')
      .addGroupBy('m.agentId')
      .orderBy('label', 'ASC')
      .getRawMany<{ label: string | null; agentId: string | null; count: string }>();
  }

  async insights(): Promise<DashboardInsights> {
    const [
      profilesTotal,
      connConnected,
      connPending,
      connNotSent,
      connDiscarded,
      abordados,
      respondidos,
      byConnStatusRaw,
      byDegreeRaw,
      byCityRaw,
      byTitleRaw,
      byCompanyRaw,
      byDayExtractRaw,
      byDayConnectedRaw,
      byDayInvitedRaw,
      byDayAbordadosRaw,
      byDayRespondidosRaw,
      recentRaw,
      byAgentStatusRaw,
      byAgentAbordadosRaw,
      byAgentRespondidosRaw,
      byJobTypeRaw,
      agentesRows,
      runtimeRows,
    ] = await Promise.all([
      this.linkedin.count({ where: { deletedAt: IsNull() } }),
      // Funil = client_connection_linkedin + perfil ativo (igual board Candidatos).
      // Não usar li.inviteStatus — fica desatualizado após claim/convite do agente.
      this.activeConnections()
        .andWhere('c.status = :st', {
          st: ClientConnectionLinkedinStatus.CONNECTED,
        })
        .getCount(),
      this.activeConnections()
        .andWhere('c.status = :st', {
          st: ClientConnectionLinkedinStatus.PENDING,
        })
        .getCount(),
      this.activeConnections()
        .andWhere('c.status = :st', {
          st: ClientConnectionLinkedinStatus.NOT_SENT,
        })
        .getCount(),
      this.activeConnections()
        .andWhere('c.status = :st', {
          st: ClientConnectionLinkedinStatus.DISCARDED,
        })
        .getCount(),
      this.countDistinctPeople(ClientLinkedinMessageDirection.SENT),
      this.countDistinctPeople(ClientLinkedinMessageDirection.RECEIVED),
      this.activeConnections()
        .select('c.status', 'label')
        .addSelect('COUNT(*)', 'count')
        .andWhere('c.status IN (:...sts)', {
          sts: [
            ClientConnectionLinkedinStatus.NOT_SENT,
            ClientConnectionLinkedinStatus.PENDING,
            ClientConnectionLinkedinStatus.CONNECTED,
            ClientConnectionLinkedinStatus.DISCARDED,
          ],
        })
        .groupBy('c.status')
        .orderBy('count', 'DESC')
        .getRawMany<{ label: string | number | null; count: string }>(),
      this.active()
        .select('li.connectionDegree', 'label')
        .addSelect('COUNT(*)', 'count')
        .groupBy('li.connectionDegree')
        .orderBy('count', 'DESC')
        .limit(8)
        .getRawMany<{ label: string | null; count: string }>(),
      this.active()
        .select('COALESCE(NULLIF(TRIM(li.location), \'\'), NULL)', 'label')
        .addSelect('COUNT(*)', 'count')
        .groupBy('label')
        .orderBy('count', 'DESC')
        .limit(12)
        .getRawMany<{ label: string | null; count: string }>(),
      this.active()
        .select('COALESCE(NULLIF(TRIM(li.headline), \'\'), NULLIF(TRIM(cl.cargo), \'\'), NULL)', 'label')
        .addSelect('COUNT(*)', 'count')
        .groupBy('label')
        .orderBy('count', 'DESC')
        .limit(12)
        .getRawMany<{ label: string | null; count: string }>(),
      this.active()
        .select('COALESCE(NULLIF(TRIM(li.company), \'\'), NULLIF(TRIM(cl.empresa), \'\'), NULL)', 'label')
        .addSelect('COUNT(*)', 'count')
        .groupBy('label')
        .orderBy('count', 'DESC')
        .limit(12)
        .getRawMany<{ label: string | null; count: string }>(),
      // Extração por agente = perfil com connection desse agente (dono do lead).
      this.activeConnections()
        .select(
          `TO_CHAR(COALESCE(li.extractedAt, li.createdAt) AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
          'label',
        )
        .addSelect('c.agentId', 'agentId')
        .addSelect('COUNT(DISTINCT li.id)', 'count')
        .andWhere('COALESCE(li.extractedAt, li.createdAt) IS NOT NULL')
        .groupBy('label')
        .addGroupBy('c.agentId')
        .orderBy('label', 'ASC')
        .getRawMany<{
          label: string | null;
          agentId: string | null;
          count: string;
        }>(),
      this.activeConnections()
        .select(
          `TO_CHAR(c.connectedAt AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
          'label',
        )
        .addSelect('c.agentId', 'agentId')
        .addSelect('COUNT(*)', 'count')
        .andWhere('c.connectedAt IS NOT NULL')
        .andWhere('c.status = :st', {
          st: ClientConnectionLinkedinStatus.CONNECTED,
        })
        .groupBy('label')
        .addGroupBy('c.agentId')
        .orderBy('label', 'ASC')
        .getRawMany<{
          label: string | null;
          agentId: string | null;
          count: string;
        }>(),
      this.activeConnections()
        .select(
          `TO_CHAR(c.invitedAt AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
          'label',
        )
        .addSelect('c.agentId', 'agentId')
        .addSelect('COUNT(*)', 'count')
        .andWhere('c.invitedAt IS NOT NULL')
        .groupBy('label')
        .addGroupBy('c.agentId')
        .orderBy('label', 'ASC')
        .getRawMany<{
          label: string | null;
          agentId: string | null;
          count: string;
        }>(),
      this.peopleByDay(ClientLinkedinMessageDirection.SENT),
      this.peopleByDay(ClientLinkedinMessageDirection.RECEIVED),
      // Mesma fila/ordem da coluna Candidatos (status=0 + extractedAt DESC).
      // Sem o filtro, "Perfis recentes" misturava pending/connected e a 1ª do funil sumia do top 20.
      this.active()
        .andWhere(
          `EXISTS (
            SELECT 1 FROM client_connection_linkedin cc
            WHERE cc.cliente_linkedin_id = li.id AND cc.status = :st0
          )`,
          { st0: ClientConnectionLinkedinStatus.NOT_SENT },
        )
        .select([
          'li.id AS id',
          'cl.nome AS name',
          'COALESCE(li.headline, cl.cargo) AS title',
          'COALESCE(li.location, cl.cidade) AS city',
          'COALESCE(li.company, cl.empresa) AS company',
          'li.inviteStatus AS "inviteStatus"',
          'li.connectionDegree AS "connectionDegree"',
          'li.photoBase64 AS "photoBase64"',
          'COALESCE(li.extractedAt, li.createdAt) AS "when"',
        ])
        .orderBy('li.extractedAt', 'DESC', 'NULLS LAST')
        .addOrderBy('li.createdAt', 'DESC')
        .limit(20)
        .getRawMany<{
          id: string;
          name: string | null;
          title: string | null;
          city: string | null;
          company: string | null;
          inviteStatus: string | null;
          connectionDegree: string | null;
          photoBase64: string | null;
          when: Date | null;
        }>(),
      this.activeConnections()
        .select('c.agentId', 'agentId')
        .addSelect('c.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .andWhere('c.status IN (:...sts)', {
          sts: [
            ClientConnectionLinkedinStatus.NOT_SENT,
            ClientConnectionLinkedinStatus.PENDING,
            ClientConnectionLinkedinStatus.CONNECTED,
            ClientConnectionLinkedinStatus.DISCARDED,
          ],
        })
        .groupBy('c.agentId')
        .addGroupBy('c.status')
        .getRawMany<{ agentId: string; status: string | number; count: string }>(),
      this.peopleByAgent(ClientLinkedinMessageDirection.SENT),
      this.peopleByAgent(ClientLinkedinMessageDirection.RECEIVED),
      this.jobs
        .createQueryBuilder('j')
        .select('j.type', 'type')
        .addSelect('j.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .andWhere('j.type IN (:...types)', { types: [...AGENT_JOB_TYPES] })
        .andWhere('j.status IN (:...sts)', {
          sts: ['pending', 'claimed', 'done', 'failed'],
        })
        .groupBy('j.type')
        .addGroupBy('j.status')
        .getRawMany<{ type: AgentJobType; status: string; count: string }>(),
      this.agentes.find({
        select: {
          id: true,
          nome: true,
          linkedinNome: true,
          status: true,
          linkedinStatus: true,
        },
        order: { nome: 'ASC' },
      }),
      this.runtimes.find({
        select: {
          agentId: true,
          status: true,
          lastHeartbeatAt: true,
        },
      }),
    ]);

    const connTotal =
      connConnected + connPending + connNotSent + connDiscarded;

    const byConnStatus = byConnStatusRaw.map((r) => {
      const code = Number(r.label);
      const count = Number(r.count) || 0;
      const label =
        CLIENT_CONNECTION_LINKEDIN_STATUS_LABEL[
          code as ClientConnectionLinkedinStatus
        ] ?? `(status ${r.label ?? '?'})`;
      return { label, count, pct: pct(count, connTotal) };
    });

    /** Buckets exclusivos do convite (status 0|1|2) — pie legado. */
    const inviteBuckets: Record<InviteStatus, number> = {
      connect: connNotSent,
      pending: connPending,
      connected: connConnected,
    };
    const inviteLabeled: CountRow[] = (
      ['connect', 'pending', 'connected'] as InviteStatus[]
    ).map((key) => ({
      label: INVITE_STATUS_LABEL[key],
      count: inviteBuckets[key],
      pct: pct(inviteBuckets[key], profilesTotal),
    }));

    /** Colunas do board (procedimentos) — cards/barra (não exclusivos entre si). */
    const byFunil: CountRow[] = [
      {
        label: 'Candidatos',
        count: connNotSent,
        pct: pct(connNotSent, profilesTotal),
      },
      {
        label: 'Convidados',
        count: connPending,
        pct: pct(connPending, profilesTotal),
      },
      {
        label: 'Conectados',
        count: connConnected,
        pct: pct(connConnected, profilesTotal),
      },
      {
        label: 'Abordados',
        count: abordados,
        pct: pct(abordados, profilesTotal),
      },
      {
        label: 'Respondidos',
        count: respondidos,
        pct: pct(respondidos, profilesTotal),
      },
      {
        label: 'Descartados',
        count: connDiscarded,
        pct: pct(connDiscarded, profilesTotal),
      },
    ];

    const byProcedure = this.buildByProcedure(byJobTypeRaw);

    const byAgent = this.buildByAgent(
      agentesRows,
      runtimeRows,
      byAgentStatusRaw,
      byAgentAbordadosRaw,
      byAgentRespondidosRaw,
    );

    return {
      kpis: [
        {
          group: 'funil',
          label: 'Perfis na base',
          value: profilesTotal,
          hint: 'total ativos',
        },
        {
          group: 'funil',
          label: 'Candidatos',
          value: connNotSent,
          hint:
            profilesTotal > 0
              ? `${pct(connNotSent, profilesTotal)}% · extrair_leads / fila status=0`
              : 'extrair_leads / fila status=0',
        },
        {
          group: 'funil',
          label: 'Convidados',
          value: connPending,
          hint:
            profilesTotal > 0
              ? `${pct(connPending, profilesTotal)}% · conectar`
              : 'conectar',
        },
        {
          group: 'funil',
          label: 'Conectados',
          value: connConnected,
          hint:
            profilesTotal > 0
              ? `${pct(connConnected, profilesTotal)}% · verificar_conexoes`
              : 'verificar_conexoes',
        },
        {
          group: 'funil',
          label: 'Abordados',
          value: abordados,
          hint:
            profilesTotal > 0
              ? `${pct(abordados, profilesTotal)}% · enviar_prospeccao`
              : 'enviar_prospeccao',
        },
        {
          group: 'funil',
          label: 'Respondidos',
          value: respondidos,
          hint:
            profilesTotal > 0
              ? `${pct(respondidos, profilesTotal)}% · ler_mensagens`
              : 'ler_mensagens',
        },
        {
          group: 'funil',
          label: 'Descartados',
          value: connDiscarded,
          hint:
            profilesTotal > 0
              ? `${pct(connDiscarded, profilesTotal)}% · status=3`
              : 'status=3',
        },
        ...byProcedure.map((p) => ({
          group: 'procedimentos' as const,
          label: p.label,
          value: p.done,
          hint: `done · fila ${p.pending + p.claimed} · falha ${p.failed}`,
        })),
      ],
      byInviteStatus: inviteLabeled,
      byFunil,
      byConnStatus,
      byDegree: mapCountRows(byDegreeRaw, '(sem grau)', profilesTotal),
      byCity: mapCountRows(byCityRaw, '(sem cidade)'),
      byTitle: mapCountRows(byTitleRaw, '(sem cargo)'),
      byCompany: mapCountRows(byCompanyRaw, '(sem empresa)'),
      byDayExtract: mapAgentDayRows(byDayExtractRaw, dayCutoffUtc(30)),
      byDayConnected: mapAgentDayRows(byDayConnectedRaw, dayCutoffUtc(30)),
      byDayInvited: mapAgentDayRows(byDayInvitedRaw, dayCutoffUtc(30)),
      byDayAbordados: mapAgentDayRows(byDayAbordadosRaw, dayCutoffUtc(30)),
      byDayRespondidos: mapAgentDayRows(byDayRespondidosRaw, dayCutoffUtc(30)),
      byProcedure,
      byAgent,
      recent: recentRaw.map((r) => ({
        id: r.id,
        name: r.name,
        title: r.title,
        city: r.city,
        company: r.company,
        inviteStatus: r.inviteStatus,
        connectionDegree: r.connectionDegree,
        photoBase64: r.photoBase64 ?? null,
        when: r.when,
      })),
    };
  }

  private buildByProcedure(
    raw: { type: AgentJobType; status: string; count: string }[],
  ): ProcedureInsight[] {
    const map = new Map<
      AgentJobType,
      { done: number; pending: number; claimed: number; failed: number }
    >();
    for (const t of AGENT_JOB_TYPES) {
      map.set(t, { done: 0, pending: 0, claimed: 0, failed: 0 });
    }
    for (const row of raw) {
      const cur = map.get(row.type);
      if (!cur) continue;
      const n = Number(row.count) || 0;
      if (row.status === 'done') cur.done = n;
      else if (row.status === 'pending') cur.pending = n;
      else if (row.status === 'claimed') cur.claimed = n;
      else if (row.status === 'failed') cur.failed = n;
    }
    return PROCEDURE_FUNNEL_ORDER.map((type) => {
      const c = map.get(type)!;
      return {
        type,
        label: PROCEDURE_LABEL[type],
        done: c.done,
        pending: c.pending,
        claimed: c.claimed,
        failed: c.failed,
        total: c.done + c.pending + c.claimed + c.failed,
      };
    });
  }

  private buildByAgent(
    agentesRows: Pick<
      Agente,
      'id' | 'nome' | 'linkedinNome' | 'status' | 'linkedinStatus'
    >[],
    runtimeRows: Pick<AgentRuntime, 'agentId' | 'status' | 'lastHeartbeatAt'>[],
    byAgentStatusRaw: {
      agentId: string;
      status: string | number;
      count: string;
    }[],
    byAgentAbordadosRaw: { agentId: string; count: string }[],
    byAgentRespondidosRaw: { agentId: string; count: string }[],
  ): AgentInsight[] {
    const counts = new Map<
      string,
      {
        notSent: number;
        pending: number;
        connected: number;
        discarded: number;
        abordados: number;
        respondidos: number;
      }
    >();
    const bump = (id: string) => {
      const key = String(id || '').trim();
      if (!key) return null;
      const cur = counts.get(key) ?? {
        notSent: 0,
        pending: 0,
        connected: 0,
        discarded: 0,
        abordados: 0,
        respondidos: 0,
      };
      counts.set(key, cur);
      return cur;
    };

    for (const row of byAgentStatusRaw) {
      const cur = bump(row.agentId);
      if (!cur) continue;
      const n = Number(row.count) || 0;
      const st = Number(row.status);
      if (st === ClientConnectionLinkedinStatus.NOT_SENT) cur.notSent = n;
      else if (st === ClientConnectionLinkedinStatus.PENDING) cur.pending = n;
      else if (st === ClientConnectionLinkedinStatus.CONNECTED)
        cur.connected = n;
      else if (st === ClientConnectionLinkedinStatus.DISCARDED)
        cur.discarded = n;
    }
    for (const row of byAgentAbordadosRaw) {
      const cur = bump(row.agentId);
      if (cur) cur.abordados = Number(row.count) || 0;
    }
    for (const row of byAgentRespondidosRaw) {
      const cur = bump(row.agentId);
      if (cur) cur.respondidos = Number(row.count) || 0;
    }

    const runtimeById = new Map(
      runtimeRows.map((r) => [r.agentId, r] as const),
    );
    const seen = new Set<string>();
    const out: AgentInsight[] = [];

    const pushRow = (
      agentId: string,
      name: string,
      status: string | null,
      linkedinStatus: string | null,
    ) => {
      const c = counts.get(agentId) ?? {
        notSent: 0,
        pending: 0,
        connected: 0,
        discarded: 0,
        abordados: 0,
        respondidos: 0,
      };
      const rt = runtimeById.get(agentId);
      out.push({
        agentId,
        name,
        status,
        linkedinStatus,
        notSent: c.notSent,
        pending: c.pending,
        connected: c.connected,
        abordados: c.abordados,
        respondidos: c.respondidos,
        discarded: c.discarded,
        total: c.notSent + c.pending + c.connected,
        lastHeartbeatAt: rt?.lastHeartbeatAt ?? null,
        runtimeStatus: rt?.status ?? null,
      });
    };

    for (const a of agentesRows) {
      const agentId = a.id;
      seen.add(agentId);
      const label =
        (a.linkedinNome && a.linkedinNome.trim()) ||
        (a.nome && a.nome.trim()) ||
        agentId;
      pushRow(agentId, label, a.status ?? null, a.linkedinStatus ?? null);
    }

    for (const agentId of counts.keys()) {
      if (seen.has(agentId)) continue;
      pushRow(agentId, agentId, null, null);
    }

    return out.sort(
      (a, b) =>
        b.total - a.total ||
        b.connected - a.connected ||
        a.agentId.localeCompare(b.agentId),
    );
  }
}
