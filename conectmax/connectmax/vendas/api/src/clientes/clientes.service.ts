import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository, SelectQueryBuilder } from 'typeorm';
import { matchScore, nameTokens } from '../profiles/profile-match';
import {
  ProfileDetailItem,
  ProfileListItem,
  toProfileDetailItem,
  toProfileListItem,
} from './cliente-linkedin-facade';
import { ClienteLinkedin } from './cliente-linkedin.entity';
import { Cliente } from './cliente.entity';
import {
  CreateClienteDto,
  UpdateClienteDto,
  UpsertClienteLinkedinDto,
} from './create-cliente.dto';
import { normalizeInviteStatus } from './invite-status';
import {
  looksLikeSlugStubName,
  normalizeLinkedInProfileUrl,
  stubNameFromLinkedInUrl,
} from './linkedin-url';

export type ExtractListUpsert = {
  name: string;
  title?: string | null;
  searchQuery?: string | null;
  level?: string | null;
  connection?: string | null;
  city?: string | null;
  mutualConnections?: string | null;
  current?: string | null;
  past?: string | null;
  photoBase64?: string | null;
  coverBase64?: string | null;
  cardBase64?: string | null;
  rawOcr?: object | null;
  extractedAt?: string | null;
  round?: number | null;
  profileUrl?: string | null;
};

export type ExtractDetailUpsert = {
  profileId?: string;
  name?: string | null;
  company?: string | null;
  headline?: string | null;
  location?: string | null;
  connections?: string | null;
  mutualConnections?: string | null;
  canConnect?: boolean | null;
  canMessage?: boolean | null;
  inviteStatus?: string | null;
  profileUrl?: string | null;
  connectionDegree?: string | null;
  about?: string | null;
  experience?: string | null;
  education?: string | null;
  skills?: string | null;
  searchQuery?: string | null;
  past?: string | null;
  round?: number | null;
  photoBase64?: string | null;
  coverBase64?: string | null;
  cardBase64?: string | null;
  rawOcr?: object | null;
  extractedAt?: string | null;
};

@Injectable()
export class ClientesService {
  private readonly logger = new Logger(ClientesService.name);

  constructor(
    @InjectRepository(Cliente)
    private readonly clientes: Repository<Cliente>,
    @InjectRepository(ClienteLinkedin)
    private readonly linkedin: Repository<ClienteLinkedin>,
  ) {}

  async findAll(opts?: {
    page?: number;
    limit?: number;
    q?: string;
  }): Promise<{
    meta: { total: number; page: number; limit: number; pages: number };
    data: Cliente[];
  }> {
    const page = Math.max(1, Number(opts?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(opts?.limit) || 100));
    const q = opts?.q?.trim() ?? '';

    const qb = this.clientes
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.linkedin', 'li')
      .orderBy('c.createdAt', 'DESC');

    if (q) {
      qb.andWhere(
        `(c.nome ILIKE :q OR c.email ILIKE :q OR c.empresa ILIKE :q OR c.cargo ILIKE :q OR c.cidade ILIKE :q OR li.profileUrl ILIKE :q OR li.headline ILIKE :q)`,
        { q: `%${q}%` },
      );
    }

    const total = await qb.getCount();
    const pages = Math.max(1, Math.ceil(total / limit) || 1);
    const safePage = Math.min(page, pages);

    const data = await qb
      .skip((safePage - 1) * limit)
      .take(limit)
      .getMany();

    return {
      meta: { total, page: safePage, limit, pages },
      data,
    };
  }

  async findOne(id: string): Promise<Cliente> {
    const row = await this.clientes.findOne({
      where: { id },
      relations: { linkedin: true },
    });
    if (!row) {
      throw new NotFoundException(`cliente não encontrado: ${id}`);
    }
    return row;
  }

  async create(dto: CreateClienteDto): Promise<Cliente> {
    const cliente = await this.clientes.save(
      this.clientes.create({
        nome: dto.nome,
        email: dto.email ?? null,
        telefone: dto.telefone ?? null,
        empresa: dto.empresa ?? null,
        cargo: dto.cargo ?? null,
        cidade: dto.cidade ?? null,
        notas: dto.notas ?? null,
      }),
    );

    if (dto.linkedin) {
      await this.upsertLinkedin(cliente.id, dto.linkedin);
    }

    return this.findOne(cliente.id);
  }

  async update(id: string, dto: UpdateClienteDto): Promise<Cliente> {
    const cliente = await this.findOne(id);
    const patch: Partial<Cliente> = {};
    if (dto.nome !== undefined) patch.nome = dto.nome;
    if (dto.email !== undefined) patch.email = dto.email ?? null;
    if (dto.telefone !== undefined) patch.telefone = dto.telefone ?? null;
    if (dto.empresa !== undefined) patch.empresa = dto.empresa ?? null;
    if (dto.cargo !== undefined) patch.cargo = dto.cargo ?? null;
    if (dto.cidade !== undefined) patch.cidade = dto.cidade ?? null;
    if (dto.notas !== undefined) patch.notas = dto.notas ?? null;
    Object.assign(cliente, patch);
    await this.clientes.save(cliente);
    return this.findOne(id);
  }

  async upsertLinkedin(
    clienteId: string,
    dto: UpsertClienteLinkedinDto,
  ): Promise<ClienteLinkedin> {
    await this.findOne(clienteId);
    const existing = await this.linkedin.findOneBy({ clienteId });
    const patch = this.toLinkedinPatch(clienteId, dto);
    if (existing) {
      this.mergeLinkedin(existing, patch);
      return this.linkedin.save(existing);
    }
    return this.linkedin.save(this.linkedin.create(patch));
  }

  async findLinkedin(clienteId: string): Promise<ClienteLinkedin> {
    const row = await this.linkedin.findOneBy({ clienteId });
    if (!row) {
      throw new NotFoundException(
        `cliente_linkedin não encontrado para cliente: ${clienteId}`,
      );
    }
    return row;
  }

  // ─── Fachada extract (/profiles + /profile-details) ─────────────────────

  async findProfilesList(opts?: {
    page?: number;
    limit?: number;
    q?: string;
    /**
     * Se setado: só reservados (`status=0`) deste agente.
     * Pool livre (sem 0|1|2) fica no claim do worker — não no funil.
     */
    agentId?: string;
  }): Promise<{
    meta: { total: number; page: number; limit: number; pages: number };
    data: ProfileListItem[];
  }> {
    const page = Math.max(1, Number(opts?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(opts?.limit) || 100));
    const q = opts?.q?.trim() ?? '';
    const agentId = String(opts?.agentId || '').trim() || undefined;

    const total = await this.buildActiveLinkedinQuery(q, agentId).getCount();
    const pages = Math.max(1, Math.ceil(total / limit) || 1);
    const safePage = Math.min(page, pages);

    const rows = await this.buildActiveLinkedinQuery(q, agentId)
      .skip((safePage - 1) * limit)
      .take(limit)
      .getMany();

    return {
      meta: { total, page: safePage, limit, pages },
      data: rows.map((li) => toProfileListItem(li, li.cliente)),
    };
  }

  async findProfileById(id: string): Promise<ProfileListItem> {
    const li = await this.linkedin.findOne({
      where: { id },
      relations: { cliente: true },
    });
    if (!li) throw new NotFoundException(`profile ${id} not found`);
    if (!li.cliente) {
      throw new NotFoundException(
        `profile ${id} sem cliente (conexão exige cliente)`,
      );
    }
    if (li.deletedAt) {
      const connected = await this.hasInviteOrConnection(li.id);
      if (!connected) {
        throw new NotFoundException(`profile ${id} not found`);
      }
      // Conexão obriga perfil vivo: revive soft-delete.
      await this.linkedin.update({ id: li.id }, { deletedAt: null });
      li.deletedAt = null;
    }
    return toProfileListItem(li, li.cliente);
  }

  async softDeleteAllActive(): Promise<{ deleted: number; at: string }> {
    const at = new Date();
    const result = await this.linkedin
      .createQueryBuilder()
      .update(ClienteLinkedin)
      .set({ deletedAt: at })
      .where('deleted_at IS NULL')
      .andWhere(
        `id NOT IN (
          SELECT cc.cliente_linkedin_id FROM client_connection_linkedin cc
          WHERE cc.status IN (1, 2)
        )`,
      )
      .execute();
    const deleted = result.affected ?? 0;
    this.logger.log(`softDeleteAllActive deleted=${deleted}`);
    return { deleted, at: at.toISOString() };
  }

  async softDeleteOne(
    id: string,
  ): Promise<{ id: string; deleted: true; at: string }> {
    const row = await this.linkedin.findOneBy({ id, deletedAt: IsNull() });
    if (!row) throw new NotFoundException(`profile ${id} not found`);
    if (await this.hasInviteOrConnection(id)) {
      throw new ConflictException(
        'não remove candidato com conexão pendente/conectada — conexão exige cliente',
      );
    }
    const at = new Date();
    await this.linkedin.update({ id }, { deletedAt: at });
    return { id, deleted: true, at: at.toISOString() };
  }

  async softDeleteActiveMatching(incoming: {
    name: string;
    title?: string | null;
    city?: string | null;
    current?: string | null;
  }): Promise<number> {
    const tokens = nameTokens(incoming.name);
    if (!tokens.length) return 0;
    const last = tokens[tokens.length - 1];
    const rows = await this.linkedin
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
      .andWhere(`LOWER(COALESCE(cl.nome, '')) LIKE :plast`, {
        plast: `%${last}%`,
      })
      .take(40)
      .getMany();
    const at = new Date();
    let n = 0;
    for (const li of rows) {
      const m = matchScore(
        {
          name: incoming.name,
          current: incoming.current,
        },
        {
          name: li.cliente?.nome,
          current: li.company,
        },
      );
      if (!m.shouldMerge) continue;
      await this.linkedin.update({ id: li.id }, { deletedAt: at });
      n += 1;
    }
    return n;
  }

  /** Pendente (1) ou conectado (2) → não soft-delete / perfil deve permanecer. */
  private async hasInviteOrConnection(clienteLinkedinId: string): Promise<boolean> {
    const row = await this.linkedin.manager
      .createQueryBuilder()
      .select('1')
      .from('client_connection_linkedin', 'cc')
      .where('cc.cliente_linkedin_id = :id', { id: clienteLinkedinId })
      .andWhere('cc.status IN (:...st)', { st: [1, 2] })
      .limit(1)
      .getRawOne();
    return Boolean(row);
  }

  async ensureForLinkedInUrl(rawUrl: string): Promise<{
    id: string;
    profileUrl: string;
    created: boolean;
  }> {
    const profileUrl = normalizeLinkedInProfileUrl(rawUrl);
    if (!profileUrl) {
      throw new BadRequestException(
        'passe url linkedin.com/in/… (query url ou profileUrl)',
      );
    }

    const existing = await this.linkedin.findOne({
      where: { profileUrl },
      relations: { cliente: true },
    });
    if (existing) {
      if (existing.deletedAt) {
        const invited = await this.hasInviteOrConnection(existing.id);
        if (!invited) {
          await this.linkedin.update({ id: existing.id }, { deletedAt: null });
        }
      }
      return { id: existing.id, profileUrl, created: false };
    }

    // Mesmo lead com URL truncada / soft-delete de outro agente.
    const loose = await this.findExistingLinkedinForExtract({
      name: stubNameFromLinkedInUrl(profileUrl),
      profileUrl,
    });
    if (loose) {
      if (!loose.profileUrl || loose.profileUrl.length < profileUrl.length) {
        loose.profileUrl = profileUrl;
      }
      await this.applyCandidatoVisibility(loose);
      await this.linkedin.save(loose);
      return { id: loose.id, profileUrl: loose.profileUrl || profileUrl, created: false };
    }

    const nome = stubNameFromLinkedInUrl(profileUrl);
    const cliente = await this.clientes.save(this.clientes.create({ nome }));
    const li = await this.linkedin.save(
      this.linkedin.create({
        clienteId: cliente.id,
        profileUrl,
        deletedAt: null,
      }),
    );
    this.logger.log(`ensureForLinkedInUrl created id=${li.id} url=${profileUrl}`);
    return { id: li.id, profileUrl, created: true };
  }

  async upsertFromListExtract(dto: ExtractListUpsert): Promise<ProfileListItem> {
    const name = String(dto.name || '').trim();
    if (!name) throw new BadRequestException('name obrigatório');

    const normalizedUrl = dto.profileUrl
      ? normalizeLinkedInProfileUrl(dto.profileUrl)
      : null;

    // Dedupe global (qualquer agente / soft-delete): URL exata, prefixo truncado, fuzzy nome.
    let li = await this.findExistingLinkedinForExtract({
      name,
      current: dto.current ?? null,
      profileUrl: normalizedUrl,
    });

    const patch: Partial<ClienteLinkedin> = {
      profileUrl: normalizedUrl,
      headline: dto.title ?? null,
      searchQuery: dto.searchQuery ?? null,
      connectionDegree: dto.level ?? null,
      inviteStatus: normalizeInviteStatus(dto.connection) ?? null,
      location: dto.city ?? null,
      mutualConnections: dto.mutualConnections ?? null,
      company: dto.current ?? null,
      past: dto.past ?? null,
      photoBase64: dto.photoBase64 ?? null,
      coverBase64: dto.coverBase64 ?? null,
      cardBase64: dto.cardBase64 ?? null,
      rawOcr:
        dto.rawOcr == null ? null : (dto.rawOcr as Record<string, unknown>),
      extractedAt: dto.extractedAt ? new Date(dto.extractedAt) : null,
      round: dto.round ?? null,
    };

    if (li) {
      this.mergeLinkedin(li, patch);
      await this.applyCandidatoVisibility(li);
      await this.linkedin.save(li);
      await this.maybeUpdateClienteNome(li.clienteId, name, li.profileUrl);
      if (dto.current) {
        await this.clientes.update(li.clienteId, {
          empresa: dto.current,
          cargo: dto.title ?? undefined,
          cidade: dto.city ?? undefined,
        } as never);
      }
      const fresh = await this.linkedin.findOneOrFail({
        where: { id: li.id },
        relations: { cliente: true },
      });
      return toProfileListItem(fresh, fresh.cliente);
    }

    const cliente = await this.clientes.save(
      this.clientes.create({
        nome: name,
        empresa: dto.current ?? null,
        cargo: dto.title ?? null,
        cidade: dto.city ?? null,
      }),
    );
    const created = await this.linkedin.save(
      this.linkedin.create({
        clienteId: cliente.id,
        ...patch,
        deletedAt: null,
      }),
    );
    await this.applyCandidatoVisibility(created);
    if (created.deletedAt) await this.linkedin.save(created);
    const fresh = await this.linkedin.findOneOrFail({
      where: { id: created.id },
      relations: { cliente: true },
    });
    return toProfileListItem(fresh, fresh.cliente);
  }

  async upsertManyFromList(
    dtos: ExtractListUpsert[],
  ): Promise<{ saved: number }> {
    for (const dto of dtos) {
      await this.upsertFromListExtract(dto);
    }
    return { saved: dtos.length };
  }

  async findDetailsList(opts?: {
    hasUrl?: boolean;
  }): Promise<{ meta: { total: number }; data: ProfileDetailItem[] }> {
    const qb = this.linkedin
      .createQueryBuilder('li')
      .leftJoinAndSelect('li.cliente', 'cl')
      .where('li.deletedAt IS NULL')
      .orderBy('li.createdAt', 'DESC');
    if (opts?.hasUrl) {
      qb.andWhere('li.profileUrl IS NOT NULL').andWhere("li.profileUrl <> ''");
    }
    const [data, total] = await qb.getManyAndCount();
    return {
      meta: { total },
      data: data.map((li) => toProfileDetailItem(li, li.cliente)),
    };
  }

  async findDetailById(id: string): Promise<ProfileDetailItem> {
    const li = await this.linkedin.findOne({
      where: { id },
      relations: { cliente: true },
    });
    if (!li) {
      throw new NotFoundException(`profile-detail não encontrado: ${id}`);
    }
    return toProfileDetailItem(li, li.cliente);
  }

  async existsByProfileUrl(rawUrl: string): Promise<{
    exists: boolean;
    profileUrl: string | null;
    profileId: string | null;
    detailId: string | null;
  }> {
    const profileUrl = normalizeLinkedInProfileUrl(rawUrl);
    if (!profileUrl) {
      return {
        exists: false,
        profileUrl: null,
        profileId: null,
        detailId: null,
      };
    }
    const row = await this.findExistingLinkedinForExtract({
      name: stubNameFromLinkedInUrl(profileUrl),
      profileUrl,
    });
    return {
      exists: Boolean(row),
      profileUrl,
      profileId: row?.id ?? null,
      detailId: row?.id ?? null,
    };
  }

  async upsertFromDetailExtract(
    dto: ExtractDetailUpsert,
  ): Promise<ProfileDetailItem> {
    const normalizedUrl = dto.profileUrl
      ? normalizeLinkedInProfileUrl(dto.profileUrl)
      : null;
    const nameHint = String(dto.name || '').trim();

    let li: ClienteLinkedin | null = null;
    if (dto.profileId) {
      li = await this.linkedin.findOne({
        where: { id: dto.profileId },
        relations: { cliente: true },
      });
    }
    if (!li) {
      li = await this.findExistingLinkedinForExtract({
        name: nameHint || (normalizedUrl ? stubNameFromLinkedInUrl(normalizedUrl) : ''),
        current: dto.company ?? null,
        profileUrl: normalizedUrl,
      });
    }

    const patch: Partial<ClienteLinkedin> = {
      profileUrl: normalizedUrl,
      company: dto.company ?? null,
      headline: dto.headline ?? null,
      location: dto.location ?? null,
      connections: dto.connections ?? null,
      mutualConnections: dto.mutualConnections ?? null,
      canConnect: dto.canConnect ?? null,
      canMessage: dto.canMessage ?? null,
      inviteStatus: normalizeInviteStatus(dto.inviteStatus) ?? null,
      connectionDegree: dto.connectionDegree ?? null,
      about: dto.about ?? null,
      experience: dto.experience ?? null,
      education: dto.education ?? null,
      skills: dto.skills ?? null,
      searchQuery: dto.searchQuery ?? null,
      past: dto.past ?? null,
      round: dto.round ?? null,
      photoBase64: dto.photoBase64 ?? null,
      coverBase64: dto.coverBase64 ?? null,
      cardBase64: dto.cardBase64 ?? null,
      rawOcr:
        dto.rawOcr == null ? null : (dto.rawOcr as Record<string, unknown>),
      extractedAt: dto.extractedAt ? new Date(dto.extractedAt) : null,
    };

    if (li) {
      this.mergeLinkedin(li, patch);
      await this.applyCandidatoVisibility(li);
      await this.linkedin.save(li);
      if (dto.name) {
        await this.maybeUpdateClienteNome(li.clienteId, dto.name, li.profileUrl);
      }
      if (dto.company || dto.headline || dto.location) {
        await this.clientes.update(li.clienteId, {
          ...(dto.company
            ? { empresa: dto.company.split('\n')[0]?.trim() || dto.company }
            : {}),
          ...(dto.headline ? { cargo: dto.headline } : {}),
          ...(dto.location ? { cidade: dto.location } : {}),
        } as never);
      }
      const fresh = await this.linkedin.findOneOrFail({
        where: { id: li.id },
        relations: { cliente: true },
      });
      return toProfileDetailItem(fresh, fresh.cliente);
    }

    if (!normalizedUrl && !dto.profileId) {
      throw new BadRequestException('profileId ou profileUrl obrigatório');
    }

    const nome =
      String(dto.name || '').trim() ||
      (normalizedUrl ? stubNameFromLinkedInUrl(normalizedUrl) : 'LinkedIn');
    const cliente = await this.clientes.save(
      this.clientes.create({
        nome,
        empresa: dto.company
          ? dto.company.split('\n')[0]?.trim() || dto.company
          : null,
        cargo: dto.headline ?? null,
        cidade: dto.location ?? null,
      }),
    );
    const created = await this.linkedin.save(
      this.linkedin.create({
        clienteId: cliente.id,
        ...patch,
        profileUrl: normalizedUrl,
        deletedAt: null,
      }),
    );
    await this.applyCandidatoVisibility(created);
    if (created.deletedAt) await this.linkedin.save(created);
    const fresh = await this.linkedin.findOneOrFail({
      where: { id: created.id },
      relations: { cliente: true },
    });
    return toProfileDetailItem(fresh, fresh.cliente);
  }

  /** Query builder ativo p/ dashboard / match. */
  activeLinkedinQb(): SelectQueryBuilder<ClienteLinkedin> {
    return this.linkedin
      .createQueryBuilder('li')
      .leftJoinAndSelect('li.cliente', 'cl')
      .where('li.deletedAt IS NULL');
  }

  private buildActiveLinkedinQuery(
    q: string,
    agentId?: string,
  ): SelectQueryBuilder<ClienteLinkedin> {
    const qb = this.linkedin
      .createQueryBuilder('li')
      .leftJoinAndSelect('li.cliente', 'cl')
      .where('li.deletedAt IS NULL');

    if (agentId) {
      // Funil por agente: só fila já claimada por ele (status=0).
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM client_connection_linkedin mine
          WHERE mine.cliente_linkedin_id = li.id
            AND mine.agent_id = :agentId
            AND mine.status = 0
        )`,
        { agentId },
      );
    } else {
      // Sem agentId: só livres (dono ativo 0|1|2 some de Candidatos).
      qb.andWhere(
        `NOT EXISTS (
          SELECT 1 FROM client_connection_linkedin cc
          WHERE cc.cliente_linkedin_id = li.id AND cc.status IN (0, 1, 2)
        )`,
      );
    }

    qb.orderBy('li.extractedAt', 'DESC', 'NULLS LAST').addOrderBy(
      'li.createdAt',
      'DESC',
    );

    if (q) {
      const like = `%${q.toLowerCase()}%`;
      qb.andWhere(
        `(LOWER(COALESCE(cl.nome, '')) LIKE :like
          OR LOWER(COALESCE(li.headline, '')) LIKE :like
          OR LOWER(COALESCE(li.location, '')) LIKE :like
          OR LOWER(COALESCE(li.company, '')) LIKE :like
          OR LOWER(COALESCE(li.profileUrl, '')) LIKE :like)`,
        { like },
      );
    }
    return qb;
  }

  /**
   * Mesmo lead global: URL exata → URL truncada/prefixo → fuzzy nome.
   * Inclui soft-deleted (evita 2ª linha quando outro agente já convidou).
   */
  private async findExistingLinkedinForExtract(opts: {
    name: string;
    current?: string | null;
    profileUrl?: string | null;
  }): Promise<ClienteLinkedin | null> {
    const normalizedUrl = opts.profileUrl
      ? normalizeLinkedInProfileUrl(opts.profileUrl)
      : null;
    const name = String(opts.name || '').trim();

    if (normalizedUrl) {
      const exact = await this.linkedin.findOne({
        where: { profileUrl: normalizedUrl },
        relations: { cliente: true },
      });
      if (exact) return exact;

      const prefix = await this.findByProfileUrlPrefix(
        normalizedUrl,
        name,
        opts.current ?? null,
      );
      if (prefix) return prefix;
    }

    if (name.length >= 3) {
      return this.findFuzzyLinkedin({
        name,
        current: opts.current ?? null,
      });
    }
    return null;
  }

  /**
   * Une `/in/d` ↔ `/in/débora-…` (clipboard/dump truncado).
   * Sempre exige similaridade de nome para não colidir `/in/m`.
   */
  private async findByProfileUrlPrefix(
    fullUrl: string,
    name: string,
    current?: string | null,
  ): Promise<ClienteLinkedin | null> {
    const slug = fullUrl.replace(
      /^https?:\/\/(?:www\.)?linkedin\.com\/in\//i,
      '',
    );
    if (slug.length < 2) return null;

    const rows = await this.linkedin
      .createQueryBuilder('li')
      .leftJoinAndSelect('li.cliente', 'cl')
      .where('li.profileUrl IS NOT NULL')
      .andWhere("li.profileUrl <> ''")
      .andWhere(
        `(
          :full LIKE CONCAT(li.profile_url, '%')
          OR li.profile_url LIKE CONCAT(:full, '%')
        )`,
        { full: fullUrl },
      )
      .take(30)
      .getMany();

    let best: { li: ClienteLinkedin; score: number } | null = null;
    for (const c of rows) {
      if (c.profileUrl === fullUrl) return c;
      const m = matchScore(
        { name, current },
        { name: c.cliente?.nome, current: c.company },
      );
      // Prefixo curto (ex. /in/d) só com nome forte.
      const shortPrefix =
        String(c.profileUrl || '').replace(
          /^https?:\/\/(?:www\.)?linkedin\.com\/in\//i,
          '',
        ).length < 8 || slug.length < 8;
      if (shortPrefix && m.nameSimilarity < 0.85) continue;
      if (!m.shouldMerge && m.nameSimilarity < 0.9) continue;
      if (!best || m.matchScore > best.score) {
        best = { li: c, score: m.matchScore };
      }
    }
    return best?.li ?? null;
  }

  /** Soft-delete se qualquer agente já tem pending/connected; senão revive candidato. */
  private async applyCandidatoVisibility(li: ClienteLinkedin): Promise<void> {
    const invited = await this.hasInviteOrConnection(li.id);
    if (invited) {
      if (!li.deletedAt) li.deletedAt = new Date();
    } else {
      li.deletedAt = null;
    }
  }

  private async findFuzzyLinkedin(row: {
    name?: string | null;
    current?: string | null;
  }): Promise<ClienteLinkedin | null> {
    const tokens = nameTokens(row.name);
    if (!tokens.length) return null;

    // Inclui soft-deleted: lead de outro agente não vira 2ª linha.
    const qb = this.linkedin
      .createQueryBuilder('li')
      .leftJoinAndSelect('li.cliente', 'cl');
    tokens.forEach((t, i) => {
      qb.andWhere(`LOWER(COALESCE(cl.nome, '')) LIKE :t${i}`, {
        [`t${i}`]: `%${t}%`,
      });
    });
    const candidates = await qb.take(50).getMany();
    let best: { li: ClienteLinkedin; score: number } | null = null;
    for (const c of candidates) {
      const m = matchScore(
        { name: row.name, current: row.current },
        { name: c.cliente?.nome, current: c.company },
      );
      if (!m.shouldMerge) continue;
      if (!best || m.matchScore > best.score) {
        best = { li: c, score: m.matchScore };
      }
    }
    return best?.li ?? null;
  }

  private async maybeUpdateClienteNome(
    clienteId: string,
    nome: string,
    profileUrl: string | null,
  ): Promise<void> {
    const n = String(nome || '').trim();
    if (!n || n.length < 2) return;
    const cliente = await this.clientes.findOneBy({ id: clienteId });
    if (!cliente) return;
    if (
      !cliente.nome ||
      looksLikeSlugStubName(cliente.nome, profileUrl) ||
      /linkedin\.com\/in\//i.test(cliente.nome) ||
      /-/.test(cliente.nome)
    ) {
      cliente.nome = n;
      await this.clientes.save(cliente);
    }
  }

  private toLinkedinPatch(
    clienteId: string,
    dto: UpsertClienteLinkedinDto,
  ): Partial<ClienteLinkedin> {
    return {
      clienteId,
      profileUrl: dto.profileUrl ?? null,
      headline: dto.headline ?? null,
      company: dto.company ?? null,
      location: dto.location ?? null,
      connections: dto.connections ?? null,
      mutualConnections: dto.mutualConnections ?? null,
      connectionDegree: dto.connectionDegree ?? null,
      inviteStatus: normalizeInviteStatus(dto.inviteStatus) ?? null,
      canConnect: dto.canConnect ?? null,
      canMessage: dto.canMessage ?? null,
      about: dto.about ?? null,
      experience: dto.experience ?? null,
      education: dto.education ?? null,
      skills: dto.skills ?? null,
      searchQuery: dto.searchQuery ?? null,
      past: dto.past ?? null,
      round: dto.round ?? null,
      photoBase64: dto.photoBase64 ?? null,
      coverBase64: dto.coverBase64 ?? null,
      cardBase64: dto.cardBase64 ?? null,
      rawOcr:
        dto.rawOcr == null ? null : (dto.rawOcr as Record<string, unknown>),
      extractedAt: dto.extractedAt ? new Date(dto.extractedAt) : null,
    };
  }

  /** null no body não apaga valor existente (merge). */
  private mergeLinkedin(
    row: ClienteLinkedin,
    patch: Partial<ClienteLinkedin>,
  ): void {
    for (const [key, value] of Object.entries(patch)) {
      if (key === 'clienteId' || key === 'id') continue;
      if (value !== null && value !== undefined) {
        (row as unknown as Record<string, unknown>)[key] = value;
      }
    }
  }
}
