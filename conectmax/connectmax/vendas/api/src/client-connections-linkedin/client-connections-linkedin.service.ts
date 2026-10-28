import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from '../clientes/cliente.entity';
import { ClienteLinkedin } from '../clientes/cliente-linkedin.entity';
import {
  connectionCandidateMatch,
  nameTokens,
  normalize,
  sqlUnaccentLower,
} from '../profiles/profile-match';
import { ClientConnectionLinkedin } from './client-connection-linkedin.entity';
import { ClientConnectionLinkedinStatus } from './client-connection-linkedin-status';
import { CreateClientConnectionLinkedinDto } from './create-client-connection-linkedin.dto';
import { MarkAcceptedConnectionsDto } from './mark-accepted-connections.dto';

/** Já na fila de convite/conexão → não deve ficar em Candidatos. */
function isInvitedOrConnected(status: number | null | undefined): boolean {
  const s = Number(status);
  return (
    s === ClientConnectionLinkedinStatus.PENDING ||
    s === ClientConnectionLinkedinStatus.CONNECTED
  );
}

function normalizeProfileUrl(raw: string): string {
  const s = String(raw || '').trim();
  const m = s.match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([^\s/?#]+)/i,
  );
  if (!m) return s.replace(/\/$/, '');
  let slug = m[1].replace(/[.,;:!?)\]}>'"]+$/g, '');
  try {
    slug = decodeURIComponent(slug);
  } catch {
    /* keep */
  }
  return `https://www.linkedin.com/in/${slug}`;
}

function slugFromProfileUrl(profileUrl: string): string {
  const m = String(profileUrl || '').match(/linkedin\.com\/in\/([^/?#]+)/i);
  return decodeURIComponent(m?.[1] || '')
    .replace(/\/$/, '')
    .toLowerCase();
}

/** `bruno-toyomoto-923870410` → `bruno-toyomoto` (descarta sufixo numérico). */
function slugNamePrefix(slug: string): string {
  const parts = String(slug || '')
    .split('-')
    .filter(Boolean);
  while (parts.length && /^\d+$/.test(parts[parts.length - 1])) {
    parts.pop();
  }
  return parts.join('-');
}

/** slug `bruno-toyomoto-923870410` → `Bruno Toyomoto` (descarta id numérico final). */
function nomeFromProfileUrl(profileUrl: string): string {
  const m = profileUrl.match(/linkedin\.com\/in\/([^/?#]+)/i);
  const slug = decodeURIComponent(m?.[1] || '').replace(/\/$/, '');
  const parts = slug.split('-').filter(Boolean);
  while (parts.length && /^\d{5,}$/.test(parts[parts.length - 1])) {
    parts.pop();
  }
  const titled = parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ')
    .trim();
  return titled || slug || 'LinkedIn';
}

/** Nome OCR ↔ `clientes.nome` (minúsculo, sem acento, espaços colapsados). */
export function normalizePersonName(raw: string): string {
  return String(raw || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

@Injectable()
export class ClientConnectionsLinkedinService {
  private readonly logger = new Logger(ClientConnectionsLinkedinService.name);

  constructor(
    @InjectRepository(ClientConnectionLinkedin)
    private readonly connections: Repository<ClientConnectionLinkedin>,
    @InjectRepository(ClienteLinkedin)
    private readonly clienteLinkedin: Repository<ClienteLinkedin>,
    @InjectRepository(Cliente)
    private readonly clientes: Repository<Cliente>,
  ) {}

  async upsertOne(
    dto: CreateClientConnectionLinkedinDto,
  ): Promise<ClientConnectionLinkedin> {
    const agentId = String(dto.agentId || '').trim();
    if (!agentId) {
      throw new BadRequestException('agentId obrigatório');
    }

    const clienteLinkedinId = await this.resolveClienteLinkedinId(dto);
    const status =
      dto.status ?? ClientConnectionLinkedinStatus.NOT_SENT;

    // Lead por agente: se outro já reservou (0) / convidou (1) / conectou (2), 409.
    if (status === ClientConnectionLinkedinStatus.NOT_SENT) {
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
        .orderBy('c.updatedAt', 'DESC')
        .getOne();
      if (other) {
        throw new ConflictException(
          `lead já reservado/convidado por agente ${other.agentId} (status=${other.status})`,
        );
      }
    }

    const existing = await this.connections.findOneBy({
      clienteLinkedinId,
      agentId,
    });

    const invitedAt =
      dto.invitedAt != null
        ? new Date(dto.invitedAt)
        : status === ClientConnectionLinkedinStatus.PENDING
          ? (existing?.invitedAt ?? new Date())
          : (existing?.invitedAt ?? null);

    const connectedAt =
      dto.connectedAt != null
        ? new Date(dto.connectedAt)
        : status === ClientConnectionLinkedinStatus.CONNECTED
          ? (existing?.connectedAt ?? new Date())
          : (existing?.connectedAt ?? null);

    const steps = dto.steps ?? existing?.steps ?? null;
    const discardReason =
      status === ClientConnectionLinkedinStatus.DISCARDED
        ? String(dto.discardReason || existing?.discardReason || '')
            .trim()
            .slice(0, 500) || 'descartado'
        : null;

    if (existing) {
      existing.status = status;
      existing.invitedAt = invitedAt;
      existing.connectedAt = connectedAt;
      existing.steps = steps;
      existing.discardReason = discardReason;
      await this.connections.save(existing);
    } else {
      await this.connections.save(
        this.connections.create({
          clienteLinkedinId,
          agentId,
          status,
          invitedAt,
          connectedAt,
          steps,
          discardReason,
        }),
      );
    }

    // Sai de Candidatos (soft-delete); Descartados lista via status=3.
    if (status === ClientConnectionLinkedinStatus.DISCARDED) {
      await this.clienteLinkedin.update(
        { id: clienteLinkedinId },
        { deletedAt: new Date() },
      );
    }

    return this.connections.findOneOrFail({
      where: { clienteLinkedinId, agentId },
      relations: { clienteLinkedin: true },
    });
  }

  async findAll(opts?: {
    page?: number;
    limit?: number;
    agentId?: string;
    status?: number;
    profileUrl?: string;
    clienteLinkedinId?: string;
  }): Promise<{
    meta: { total: number; page: number; limit: number; pages: number };
    data: ClientConnectionLinkedin[];
  }> {
    await this.reviveConnectedSoftDeleted();

    const page = Math.max(1, Number(opts?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(opts?.limit) || 100));

    const qb = this.connections
      .createQueryBuilder('c')
      .innerJoinAndSelect('c.clienteLinkedin', 'li')
      .innerJoinAndSelect('li.cliente', 'cl')
      .orderBy('c.updatedAt', 'DESC');

    if (opts?.agentId?.trim()) {
      qb.andWhere('c.agentId = :agentId', { agentId: opts.agentId.trim() });
    }
    if (opts?.clienteLinkedinId) {
      qb.andWhere('c.clienteLinkedinId = :cid', {
        cid: opts.clienteLinkedinId,
      });
    }
    if (opts?.profileUrl?.trim()) {
      qb.andWhere('li.profileUrl = :purl', {
        purl: normalizeProfileUrl(opts.profileUrl),
      });
    }
    if (
      opts?.status !== undefined &&
      opts?.status !== null &&
      Number.isFinite(Number(opts.status))
    ) {
      qb.andWhere('c.status = :status', { status: Number(opts.status) });
    }

    const total = await qb.getCount();
    const pages = Math.max(1, Math.ceil(total / limit) || 1);
    const safePage = Math.min(page, pages);
    const data = await qb
      .skip((safePage - 1) * limit)
      .take(limit)
      .getMany();

    await this.enrichClienteLinkedinPhotos(data);

    return {
      meta: { total, page: safePage, limit, pages },
      data,
    };
  }

  /**
   * Antes de abrir card no extract: já existe na base?
   * Busca conexões (qualquer agente) + cliente_linkedin ativos (`deleted_at IS NULL`)
   * cujo parent não está soft-deleted. Não olha Connect/Pending da UI.
   */
  async matchExistingByScore(opts: {
    name?: string;
    title?: string;
    city?: string;
    current?: string;
  }): Promise<{
    matched: boolean;
    matchScore: number;
    nameSimilarity: number;
    titleSimilarity: number;
    citySimilarity: number;
    currentSimilarity: number;
    source: 'connection' | 'profile' | null;
    connectionId: string | null;
    agentId: string | null;
    status: number | null;
    clienteNome: string | null;
    profileId: string | null;
    profileUrl: string | null;
  }> {
    const name = String(opts?.name || '').trim();
    const empty = {
      matched: false,
      matchScore: 0,
      nameSimilarity: 0,
      titleSimilarity: 0,
      citySimilarity: 0,
      currentSimilarity: 0,
      source: null as 'connection' | 'profile' | null,
      connectionId: null as string | null,
      agentId: null as string | null,
      status: null as number | null,
      clienteNome: null as string | null,
      profileId: null as string | null,
      profileUrl: null as string | null,
    };
    if (name.length < 3) return empty;

    const incoming = {
      name,
      title: opts.title?.trim() || null,
      city: opts.city?.trim() || null,
      current: opts.current?.trim() || null,
    };
    const tokens = nameTokens(name);

    type Cand = {
      score: ReturnType<typeof connectionCandidateMatch>;
      source: 'connection' | 'profile';
      connectionId?: string | null;
      agentId?: string | null;
      status?: number | null;
      clienteNome?: string | null;
      profileId?: string | null;
      profileUrl?: string | null;
    };
    const bestBox: { current: Cand | null } = { current: null };
    const consider = (c: Cand) => {
      const cur = bestBox.current;
      if (!cur) {
        bestBox.current = c;
        return;
      }
      // Conexão pendente/conectada manda sobre card de candidato.
      if (
        c.score.matched &&
        cur.score.matched &&
        c.source === 'connection' &&
        isInvitedOrConnected(c.status) &&
        cur.source !== 'connection'
      ) {
        bestBox.current = c;
        return;
      }
      if (
        cur.score.matched &&
        cur.source === 'connection' &&
        isInvitedOrConnected(cur.status) &&
        c.source !== 'connection'
      ) {
        return;
      }
      if (c.score.matchScore > cur.score.matchScore) {
        bestBox.current = c;
        return;
      }
      if (
        c.score.matched &&
        !cur.score.matched &&
        c.score.nameSimilarity >= cur.score.nameSimilarity
      ) {
        bestBox.current = c;
      }
    };

    // 1) Conexões (exige cliente_linkedin + cliente)
    {
      const qb = this.connections
        .createQueryBuilder('c')
        .innerJoinAndSelect('c.clienteLinkedin', 'li')
        .innerJoinAndSelect('li.cliente', 'cl')
        .orderBy('c.updatedAt', 'DESC')
        .take(80);
      if (tokens.length) {
        tokens.forEach((t, i) => {
          qb.andWhere(`${sqlUnaccentLower('cl.nome')} LIKE :ct${i}`, {
            [`ct${i}`]: `%${t}%`,
          });
        });
      } else {
        qb.andWhere(`${sqlUnaccentLower('cl.nome')} LIKE :clike`, {
          clike: `%${normalize(name)}%`,
        });
      }
      const rows = await qb.getMany();
      for (const row of rows) {
        const cl = row.clienteLinkedin?.cliente;
        const li = row.clienteLinkedin;
        const score = connectionCandidateMatch(incoming, {
          name: cl?.nome || null,
          title: cl?.cargo || li?.headline || null,
          city: cl?.cidade || li?.location || null,
          current: cl?.empresa || li?.company || null,
        });
        consider({
          score,
          source: 'connection',
          connectionId: row.id,
          agentId: row.agentId,
          status: row.status,
          clienteNome: cl?.nome || null,
          profileId: li?.id || null,
          profileUrl: li?.profileUrl || null,
        });
      }
    }

    // 2) cliente_linkedin ativos (`deleted_at IS NULL`)
    {
      const qb = this.clienteLinkedin
        .createQueryBuilder('li')
        .leftJoinAndSelect('li.cliente', 'cl')
        .where('li.deletedAt IS NULL')
        .orderBy('li.extractedAt', 'DESC', 'NULLS LAST')
        .addOrderBy('li.createdAt', 'DESC')
        .take(80);
      if (tokens.length) {
        const last = tokens[tokens.length - 1];
        qb.andWhere(
          `(${sqlUnaccentLower('cl.nome')} LIKE :plast OR LOWER(COALESCE(li.profileUrl, '')) LIKE :plast)`,
          { plast: `%${last}%` },
        );
      } else {
        qb.andWhere(`${sqlUnaccentLower('cl.nome')} LIKE :plike`, {
          plike: `%${normalize(name)}%`,
        });
      }
      const rows = await qb.getMany();
      for (const li of rows) {
        const score = connectionCandidateMatch(incoming, {
          name: li.cliente?.nome || null,
          title: li.headline,
          city: li.location,
          current: li.company,
        });
        consider({
          score,
          source: 'profile',
          clienteNome: li.cliente?.nome || null,
          profileId: li.id,
          profileUrl: li.profileUrl,
        });
      }
    }

    const best = bestBox.current;
    if (!best || !best.score.matched) {
      return {
        ...empty,
        matchScore: best?.score.matchScore ?? 0,
        nameSimilarity: best?.score.nameSimilarity ?? 0,
        titleSimilarity: best?.score.titleSimilarity ?? 0,
        citySimilarity: best?.score.citySimilarity ?? 0,
        currentSimilarity: best?.score.currentSimilarity ?? 0,
      };
    }

    // Já pendente/conectado → some de Candidatos (soft-delete profiles ativos).
    if (
      best.source === 'connection' &&
      isInvitedOrConnected(best.status)
    ) {
      await this.softDeleteActiveProfilesMatching(incoming);
    }

    return {
      matched: true,
      matchScore: best.score.matchScore,
      nameSimilarity: best.score.nameSimilarity,
      titleSimilarity: best.score.titleSimilarity,
      citySimilarity: best.score.citySimilarity,
      currentSimilarity: best.score.currentSimilarity,
      source: best.source,
      connectionId: best.connectionId ?? null,
      agentId: best.agentId ?? null,
      status: best.status ?? null,
      clienteNome: best.clienteNome ?? null,
      profileId: best.profileId ?? null,
      profileUrl: best.profileUrl ?? null,
    };
  }

  /**
   * Soft-delete candidatos ativos que batem com o card (já convidado/conectado).
   * Nunca apaga linha que já tem conexão (1|2) nem órfã sem `cliente`.
   */
  private async softDeleteActiveProfilesMatching(incoming: {
    name: string;
    title: string | null;
    city: string | null;
    current: string | null;
  }): Promise<number> {
    const tokens = nameTokens(incoming.name);
    if (!tokens.length) return 0;
    const last = tokens[tokens.length - 1];
    const rows = await this.clienteLinkedin
      .createQueryBuilder('li')
      .leftJoinAndSelect('li.cliente', 'cl')
      .where('li.deletedAt IS NULL')
      .andWhere('cl.id IS NOT NULL')
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM client_connection_linkedin cc
          WHERE cc.cliente_linkedin_id = li.id AND cc.status IN (1, 2)
        )`,
      )
      .andWhere(`${sqlUnaccentLower('cl.nome')} LIKE :plast`, {
        plast: `%${last}%`,
      })
      .take(40)
      .getMany();
    const at = new Date();
    let n = 0;
    for (const li of rows) {
      const score = connectionCandidateMatch(incoming, {
        name: li.cliente?.nome || null,
        title: li.headline,
        city: li.location,
        current: li.company,
      });
      if (!score.matched) continue;
      await this.clienteLinkedin.update({ id: li.id }, { deletedAt: at });
      n += 1;
    }
    if (n) {
      this.logger.log(
        `softDeleteActiveProfilesMatching name=${incoming.name} deleted=${n}`,
      );
    }
    return n;
  }

  /**
   * Conexão obriga `cliente_linkedin` + `cliente` vivos: revive soft-delete
   * de quem já está pendente/conectado.
   */
  async reviveConnectedSoftDeleted(): Promise<number> {
    const result = await this.clienteLinkedin
      .createQueryBuilder()
      .update(ClienteLinkedin)
      .set({ deletedAt: null })
      .where('deleted_at IS NOT NULL')
      .andWhere(
        `id IN (
          SELECT cc.cliente_linkedin_id FROM client_connection_linkedin cc
          WHERE cc.status IN (1, 2)
        )`,
      )
      .execute();
    const n = result.affected ?? 0;
    if (n) {
      this.logger.log(`reviveConnectedSoftDeleted revived=${n}`);
    }
    return n;
  }

  /**
   * Foto já vive em `cliente_linkedin` após unificação.
   * Enrich residual: outra linha ativa com mesmo prefixo de slug.
   */
  private async enrichClienteLinkedinPhotos(
    rows: ClientConnectionLinkedin[],
  ): Promise<void> {
    const need = rows.filter(
      (r) => r.clienteLinkedin && !r.clienteLinkedin.photoBase64,
    );
    if (!need.length) return;

    for (const row of need) {
      const li = row.clienteLinkedin!;
      const url = normalizeProfileUrl(li.profileUrl || '');
      const prefix = slugNamePrefix(slugFromProfileUrl(url));
      if (!prefix || prefix.length < 3) continue;
      const hit = await this.clienteLinkedin
        .createQueryBuilder('li')
        .where('li.photoBase64 IS NOT NULL')
        .andWhere("li.photoBase64 <> ''")
        .andWhere('li.profileUrl ILIKE :pref', {
          pref: `%linkedin.com/in/${prefix}%`,
        })
        .andWhere('li.id <> :id', { id: li.id })
        .take(1)
        .getOne();
      if (hit?.photoBase64) li.photoBase64 = hit.photoBase64;
    }
  }

  /**
   * Cruza lista recente (OCR Connections) com convites pendentes do agente.
   * Quem aparece na lista → `status: 2` (conectado).
   */
  async markAcceptedByRecentList(dto: MarkAcceptedConnectionsDto): Promise<{
    ok: true;
    agentId: string;
    pendingChecked: number;
    updated: Array<{
      id: string;
      name: string;
      profileUrl: string | null;
      clienteLinkedinId: string;
    }>;
    unmatched: string[];
  }> {
    const agentId = String(dto.agentId || '').trim();
    if (!agentId) {
      throw new BadRequestException('agentId obrigatório');
    }
    const items = Array.isArray(dto.connections) ? dto.connections : [];
    if (!items.length) {
      throw new BadRequestException('connections[] obrigatório');
    }

    const pending = await this.connections.find({
      where: {
        agentId,
        status: ClientConnectionLinkedinStatus.PENDING,
      },
      relations: { clienteLinkedin: { cliente: true } },
    });

    /** @type {Map<string, ClientConnectionLinkedin>} */
    const byName = new Map<string, ClientConnectionLinkedin>();
    for (const row of pending) {
      const nome = row.clienteLinkedin?.cliente?.nome;
      if (!nome) continue;
      const key = normalizePersonName(nome);
      if (!key || byName.has(key)) continue;
      byName.set(key, row);
    }

    const updated: Array<{
      id: string;
      name: string;
      profileUrl: string | null;
      clienteLinkedinId: string;
    }> = [];
    const unmatched: string[] = [];
    const now = new Date();

    for (const item of items) {
      const key = normalizePersonName(item.name);
      if (!key) {
        unmatched.push(String(item.name || ''));
        continue;
      }
      const row = byName.get(key);
      if (!row) {
        unmatched.push(item.name);
        continue;
      }
      row.status = ClientConnectionLinkedinStatus.CONNECTED;
      row.connectedAt = row.connectedAt ?? now;
      await this.connections.save(row);
      updated.push({
        id: row.id,
        name: item.name,
        profileUrl: row.clienteLinkedin?.profileUrl ?? null,
        clienteLinkedinId: row.clienteLinkedinId,
      });
      byName.delete(key);
    }

    return {
      ok: true,
      agentId,
      pendingChecked: pending.length,
      updated,
      unmatched,
    };
  }

  private async resolveClienteLinkedinId(
    dto: CreateClientConnectionLinkedinDto,
  ): Promise<string> {
    if (dto.clienteLinkedinId) {
      const row = await this.clienteLinkedin.findOne({
        where: { id: dto.clienteLinkedinId },
        relations: { cliente: true },
      });
      if (!row) {
        throw new NotFoundException(
          `cliente_linkedin não encontrado: ${dto.clienteLinkedinId}`,
        );
      }
      await this.ensureClienteForLinkedin(row, dto);
      if (row.deletedAt) {
        row.deletedAt = null;
        await this.clienteLinkedin.save(row);
      }
      return row.id;
    }

    const profileUrl = normalizeProfileUrl(dto.profileUrl || '');
    if (!profileUrl) {
      throw new BadRequestException(
        'passe clienteLinkedinId ou profileUrl linkedin.com/in/…',
      );
    }

    let row = await this.clienteLinkedin.findOne({
      where: { profileUrl },
      relations: { cliente: true },
    });
    if (row) {
      await this.ensureClienteForLinkedin(row, dto);
      if (row.deletedAt) {
        row.deletedAt = null;
        await this.clienteLinkedin.save(row);
      }
      return row.id;
    }

    const nome =
      String(dto.peerName || dto.nome || '').trim() ||
      nomeFromProfileUrl(profileUrl);
    const cliente = await this.clientes.save(this.clientes.create({ nome }));
    row = await this.clienteLinkedin.save(
      this.clienteLinkedin.create({
        clienteId: cliente.id,
        profileUrl,
        deletedAt: null,
      }),
    );
    return row.id;
  }

  /** Conexão sem `cliente` é inválida — recria o pai se faltar. */
  private async ensureClienteForLinkedin(
    row: ClienteLinkedin,
    dto: CreateClientConnectionLinkedinDto,
  ): Promise<void> {
    if (row.clienteId) {
      const existing = await this.clientes.findOneBy({ id: row.clienteId });
      if (existing) {
        row.cliente = existing;
        return;
      }
    }
    const nome =
      String(dto.peerName || dto.nome || '').trim() ||
      (row.profileUrl ? nomeFromProfileUrl(row.profileUrl) : '') ||
      'LinkedIn';
    const cliente = await this.clientes.save(this.clientes.create({ nome }));
    row.clienteId = cliente.id;
    row.cliente = cliente;
    row.deletedAt = null;
    await this.clienteLinkedin.save(row);
    this.logger.warn(
      `ensureClienteForLinkedin recriou cliente id=${cliente.id} para li=${row.id}`,
    );
  }
}
