import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository, SelectQueryBuilder } from 'typeorm';
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

type CountRow = { label: string; count: number; pct?: number };

type Kpi = {
  label: string;
  value: string | number;
  hint?: string;
  group?: 'funil';
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
  total: number;
  lastHeartbeatAt: Date | null;
  runtimeStatus: string | null;
};

export type DashboardInsights = {
  kpis: Kpi[];
  byInviteStatus: CountRow[];
  byConnStatus: CountRow[];
  byDegree: CountRow[];
  byCity: CountRow[];
  byTitle: CountRow[];
  byCompany: CountRow[];
  byDayExtract: CountRow[];
  byDayConnected: CountRow[];
  byDayInvited: CountRow[];
  byAgent: AgentInsight[];
  recent: RecentRow[];
};

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

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(ClienteLinkedin)
    private readonly linkedin: Repository<ClienteLinkedin>,
    @InjectRepository(ClientConnectionLinkedin)
    private readonly connections: Repository<ClientConnectionLinkedin>,
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

  async insights(): Promise<DashboardInsights> {
    const [
      profilesTotal,
      connConnected,
      connPending,
      connNotSent,
      byConnStatusRaw,
      byDegreeRaw,
      byCityRaw,
      byTitleRaw,
      byCompanyRaw,
      byDayExtractRaw,
      byDayConnectedRaw,
      byDayInvitedRaw,
      recentRaw,
      byAgentStatusRaw,
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
        .select('c.status', 'label')
        .addSelect('COUNT(*)', 'count')
        .andWhere('c.status IN (:...sts)', {
          sts: [
            ClientConnectionLinkedinStatus.NOT_SENT,
            ClientConnectionLinkedinStatus.PENDING,
            ClientConnectionLinkedinStatus.CONNECTED,
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
      this.active()
        .select(
          `TO_CHAR(COALESCE(li.extractedAt, li.createdAt) AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
          'label',
        )
        .addSelect('COUNT(*)', 'count')
        .andWhere('COALESCE(li.extractedAt, li.createdAt) IS NOT NULL')
        .groupBy('label')
        .orderBy('label', 'ASC')
        .getRawMany<{ label: string | null; count: string }>(),
      this.activeConnections()
        .select(
          `TO_CHAR(c.connectedAt AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
          'label',
        )
        .addSelect('COUNT(*)', 'count')
        .andWhere('c.connectedAt IS NOT NULL')
        .andWhere('c.status = :st', {
          st: ClientConnectionLinkedinStatus.CONNECTED,
        })
        .groupBy('label')
        .orderBy('label', 'ASC')
        .getRawMany<{ label: string | null; count: string }>(),
      this.activeConnections()
        .select(
          `TO_CHAR(c.invitedAt AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
          'label',
        )
        .addSelect('COUNT(*)', 'count')
        .andWhere('c.invitedAt IS NOT NULL')
        .groupBy('label')
        .orderBy('label', 'ASC')
        .getRawMany<{ label: string | null; count: string }>(),
      this.active()
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
          ],
        })
        .groupBy('c.agentId')
        .addGroupBy('c.status')
        .getRawMany<{ agentId: string; status: string | number; count: string }>(),
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

    const connTotal = connConnected + connPending + connNotSent;

    const byConnStatus = byConnStatusRaw.map((r) => {
      const code = Number(r.label);
      const count = Number(r.count) || 0;
      const label =
        CLIENT_CONNECTION_LINKEDIN_STATUS_LABEL[
          code as ClientConnectionLinkedinStatus
        ] ?? `(status ${r.label ?? '?'})`;
      return { label, count, pct: pct(count, connTotal) };
    });

    /** Mesmos buckets do funil (status 0|1|2), labels de invite para o gráfico. */
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

    const byAgent = this.buildByAgent(
      agentesRows,
      runtimeRows,
      byAgentStatusRaw,
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
          label: 'Sem convite',
          value: connNotSent,
          hint:
            profilesTotal > 0
              ? `${pct(connNotSent, profilesTotal)}% · fila status=0 (candidatos)`
              : 'fila status=0 (candidatos)',
        },
        {
          group: 'funil',
          label: 'Aguardando aceite',
          value: connPending,
          hint:
            profilesTotal > 0
              ? `${pct(connPending, profilesTotal)}% · convite enviado`
              : 'convite enviado',
        },
        {
          group: 'funil',
          label: 'Conectados',
          value: connConnected,
          hint:
            profilesTotal > 0
              ? `${pct(connConnected, profilesTotal)}% · aceitaram o convite`
              : 'aceitaram o convite',
        },
      ],
      byInviteStatus: inviteLabeled,
      byConnStatus,
      byDegree: mapCountRows(byDegreeRaw, '(sem grau)', profilesTotal),
      byCity: mapCountRows(byCityRaw, '(sem cidade)'),
      byTitle: mapCountRows(byTitleRaw, '(sem cargo)'),
      byCompany: mapCountRows(byCompanyRaw, '(sem empresa)'),
      byDayExtract: mapCountRows(byDayExtractRaw, '—').slice(-30),
      byDayConnected: mapCountRows(byDayConnectedRaw, '—').slice(-30),
      byDayInvited: mapCountRows(byDayInvitedRaw, '—').slice(-30),
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

  private buildByAgent(
    agentesRows: Pick<
      Agente,
      'nome' | 'linkedinNome' | 'status' | 'linkedinStatus'
    >[],
    runtimeRows: Pick<AgentRuntime, 'agentId' | 'status' | 'lastHeartbeatAt'>[],
    byAgentStatusRaw: { agentId: string; status: string | number; count: string }[],
  ): AgentInsight[] {
    const counts = new Map<
      string,
      { notSent: number; pending: number; connected: number }
    >();
    for (const row of byAgentStatusRaw) {
      const id = String(row.agentId || '').trim();
      if (!id) continue;
      const cur = counts.get(id) ?? { notSent: 0, pending: 0, connected: 0 };
      const n = Number(row.count) || 0;
      const st = Number(row.status);
      if (st === ClientConnectionLinkedinStatus.NOT_SENT) cur.notSent = n;
      else if (st === ClientConnectionLinkedinStatus.PENDING) cur.pending = n;
      else if (st === ClientConnectionLinkedinStatus.CONNECTED) cur.connected = n;
      counts.set(id, cur);
    }

    const runtimeById = new Map(
      runtimeRows.map((r) => [r.agentId, r] as const),
    );
    const seen = new Set<string>();
    const out: AgentInsight[] = [];

    for (const a of agentesRows) {
      const agentId = a.nome;
      seen.add(agentId);
      const c = counts.get(agentId) ?? {
        notSent: 0,
        pending: 0,
        connected: 0,
      };
      const rt = runtimeById.get(agentId);
      out.push({
        agentId,
        name: (a.linkedinNome && a.linkedinNome.trim()) || agentId,
        status: a.status ?? null,
        linkedinStatus: a.linkedinStatus ?? null,
        notSent: c.notSent,
        pending: c.pending,
        connected: c.connected,
        total: c.notSent + c.pending + c.connected,
        lastHeartbeatAt: rt?.lastHeartbeatAt ?? null,
        runtimeStatus: rt?.status ?? null,
      });
    }

    for (const [agentId, c] of counts) {
      if (seen.has(agentId)) continue;
      const rt = runtimeById.get(agentId);
      out.push({
        agentId,
        name: agentId,
        status: null,
        linkedinStatus: null,
        notSent: c.notSent,
        pending: c.pending,
        connected: c.connected,
        total: c.notSent + c.pending + c.connected,
        lastHeartbeatAt: rt?.lastHeartbeatAt ?? null,
        runtimeStatus: rt?.status ?? null,
      });
    }

    return out.sort(
      (a, b) =>
        b.total - a.total ||
        b.connected - a.connected ||
        a.agentId.localeCompare(b.agentId),
    );
  }
}
