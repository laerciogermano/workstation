import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository, SelectQueryBuilder } from 'typeorm';
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
  group?: 'funil' | 'hoje';
};

type RecentRow = {
  id: string;
  name: string | null;
  title: string | null;
  city: string | null;
  company: string | null;
  inviteStatus: string | null;
  connectionDegree: string | null;
  when: Date | null;
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
  ) {}

  private active(): SelectQueryBuilder<ClienteLinkedin> {
    return this.linkedin
      .createQueryBuilder('li')
      .leftJoin('li.cliente', 'cl')
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
      connectedToday,
      invitedToday,
      extractedToday,
    ] = await Promise.all([
      this.linkedin.count({ where: { deletedAt: IsNull() } }),
      // Funil = client_connection_linkedin (mesmo critério do board /profiles?agentId=).
      // Não usar li.inviteStatus — fica desatualizado após claim/convite do agente.
      this.connections.count({
        where: { status: ClientConnectionLinkedinStatus.CONNECTED },
      }),
      this.connections.count({
        where: { status: ClientConnectionLinkedinStatus.PENDING },
      }),
      this.connections.count({
        where: { status: ClientConnectionLinkedinStatus.NOT_SENT },
      }),
      this.connections
        .createQueryBuilder('c')
        .select('c.status', 'label')
        .addSelect('COUNT(*)', 'count')
        .where('c.status IN (:...sts)', {
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
      this.connections
        .createQueryBuilder('c')
        .select(
          `TO_CHAR(c.connectedAt AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
          'label',
        )
        .addSelect('COUNT(*)', 'count')
        .where('c.connectedAt IS NOT NULL')
        .andWhere('c.status = :st', {
          st: ClientConnectionLinkedinStatus.CONNECTED,
        })
        .groupBy('label')
        .orderBy('label', 'ASC')
        .getRawMany<{ label: string | null; count: string }>(),
      this.connections
        .createQueryBuilder('c')
        .select(
          `TO_CHAR(c.invitedAt AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
          'label',
        )
        .addSelect('COUNT(*)', 'count')
        .where('c.invitedAt IS NOT NULL')
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
          when: Date | null;
        }>(),
      this.connections
        .createQueryBuilder('c')
        .where('c.status = :st', {
          st: ClientConnectionLinkedinStatus.CONNECTED,
        })
        .andWhere(`c.connectedAt >= date_trunc('day', NOW() AT TIME ZONE 'UTC')`)
        .getCount(),
      this.connections
        .createQueryBuilder('c')
        .where(`c.invitedAt >= date_trunc('day', NOW() AT TIME ZONE 'UTC')`)
        .getCount(),
      this.active()
        .andWhere(
          `COALESCE(li.extractedAt, li.createdAt) >= date_trunc('day', NOW() AT TIME ZONE 'UTC')`,
        )
        .getCount(),
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
        {
          group: 'hoje',
          label: 'Extraídos',
          value: extractedToday,
          hint: 'perfis coletados hoje',
        },
        {
          group: 'hoje',
          label: 'Convites enviados',
          value: invitedToday,
          hint: 'pelo agente hoje',
        },
        {
          group: 'hoje',
          label: 'Aceites',
          value: connectedToday,
          hint: 'conexões aceitas hoje',
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
      recent: recentRaw.map((r) => ({
        id: r.id,
        name: r.name,
        title: r.title,
        city: r.city,
        company: r.company,
        inviteStatus: r.inviteStatus,
        connectionDegree: r.connectionDegree,
        when: r.when,
      })),
    };
  }
}
