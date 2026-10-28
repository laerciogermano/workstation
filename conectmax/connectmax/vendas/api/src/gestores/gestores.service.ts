import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../auth/user.entity';
import { UserRole, userHasRole } from '../auth/roles';
import { Agente } from '../agentes/agente.entity';
import { SetGestorAgentesDto } from './create-gestor.dto';
import { GestorAgente } from './gestor-agente.entity';

export type GestorRow = {
  id: string;
  nome: string;
  email: string;
  active: boolean;
  agentes: {
    id: string;
    agentId: string;
    nome?: string;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class GestoresService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(GestorAgente)
    private readonly gestorAgentes: Repository<GestorAgente>,
    @InjectRepository(Agente)
    private readonly agentesCadastro: Repository<Agente>,
  ) {}

  private async toRow(
    user: User,
    agentes: GestorAgente[],
  ): Promise<GestorRow> {
    const ids = agentes.map((a) => a.agentId).filter(Boolean);
    const cadastro = ids.length
      ? await this.agentesCadastro.find({ where: { id: In(ids) } })
      : [];
    const nomeById = new Map(cadastro.map((a) => [a.id, a.nome]));
    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      active: user.active,
      agentes: agentes.map((a) => ({
        id: a.id,
        agentId: a.agentId,
        nome: nomeById.get(a.agentId),
        createdAt: a.createdAt,
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async assertGestorUser(id: string): Promise<User> {
    const user = await this.users.findOne({ where: { id } });
    if (!user || !userHasRole(user.roles, UserRole.Gestor)) {
      throw new NotFoundException(`gestor não encontrado: ${id}`);
    }
    return user;
  }

  /**
   * AVDs como opções de agente (+ se já tem gestor).
   * Evita exigir `avds:read` no form.
   */
  async listAgenteOptions(): Promise<{
    data: {
      agentId: string;
      nome: string;
      agenteId: string;
      hostNome: string | null;
      gestorId: string | null;
      gestorNome: string | null;
    }[];
  }> {
    const agentes = await this.agentesCadastro.find({
      order: { nome: 'ASC' },
    });
    const links = await this.gestorAgentes.find({ relations: ['gestor'] });
    const byAgent = new Map(
      links.map((l) => [
        l.agentId,
        {
          gestorId: l.gestorId,
          gestorNome: l.gestor?.nome ?? null,
        },
      ]),
    );
    return {
      data: agentes.map((a) => {
        const link = byAgent.get(a.id);
        return {
          agentId: a.id,
          nome: a.nome,
          agenteId: a.id,
          hostNome: a.hostNome ?? null,
          gestorId: link?.gestorId ?? null,
          gestorNome: link?.gestorNome ?? null,
        };
      }),
    };
  }

  async findAll(opts?: {
    page?: number;
    limit?: number;
    q?: string;
    agentId?: string;
    active?: boolean;
  }): Promise<{
    meta: { total: number; page: number; limit: number; pages: number };
    data: GestorRow[];
  }> {
    const page = Math.max(1, Number(opts?.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(opts?.limit) || 50));
    const q = opts?.q?.trim() ?? '';

    const qb = this.users
      .createQueryBuilder('u')
      .where(`u.roles @> :roleJson`, {
        roleJson: JSON.stringify([UserRole.Gestor]),
      })
      .orderBy('u.nome', 'ASC');

    if (opts?.active !== undefined) {
      qb.andWhere('u.active = :active', { active: opts.active });
    }
    if (opts?.agentId) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM gestor_agentes ga
          WHERE ga.gestor_id = u.id AND ga.agent_id = :aid
        )`,
        { aid: opts.agentId },
      );
    }
    if (q) {
      qb.andWhere(
        `(u.nome ILIKE :q OR u.email ILIKE :q OR EXISTS (
          SELECT 1 FROM gestor_agentes ga2
          WHERE ga2.gestor_id = u.id AND ga2.agent_id ILIKE :q
        ))`,
        { q: `%${q}%` },
      );
    }

    const total = await qb.getCount();
    const pages = Math.max(1, Math.ceil(total / limit) || 1);
    const safePage = Math.min(page, pages);
    const users = await qb
      .skip((safePage - 1) * limit)
      .take(limit)
      .getMany();

    const ids = users.map((u) => u.id);
    const links = ids.length
      ? await this.gestorAgentes.find({
          where: { gestorId: In(ids) },
          order: { agentId: 'ASC' },
        })
      : [];
    const byGestor = new Map<string, GestorAgente[]>();
    for (const l of links) {
      const list = byGestor.get(l.gestorId) ?? [];
      list.push(l);
      byGestor.set(l.gestorId, list);
    }

    return {
      meta: { total, page: safePage, limit, pages },
      data: await Promise.all(
        users.map((u) => this.toRow(u, byGestor.get(u.id) ?? [])),
      ),
    };
  }

  async findOne(id: string): Promise<GestorRow> {
    const user = await this.assertGestorUser(id);
    const agentes = await this.gestorAgentes.find({
      where: { gestorId: id },
      order: { agentId: 'ASC' },
    });
    return this.toRow(user, agentes);
  }

  private normalizeAgentIds(ids?: string[]): string[] {
    if (!ids?.length) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of ids) {
      const id = String(raw ?? '').trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
    return out;
  }

  private async assertAgentsFree(
    agentIds: string[],
    exceptGestorId?: string,
  ): Promise<void> {
    if (!agentIds.length) return;

    const found = await this.agentesCadastro.find({ where: { id: In(agentIds) } });
    const known = new Set(found.map((a) => a.id));
    const missing = agentIds.filter((id) => !known.has(id));
    if (missing.length) {
      throw new NotFoundException(
        `agente(s) não encontrado(s): ${missing.join(', ')}`,
      );
    }

    const taken = await this.gestorAgentes.find({
      where: { agentId: In(agentIds) },
      relations: ['gestor'],
    });
    const conflicts = taken.filter((t) => t.gestorId !== exceptGestorId);
    if (conflicts.length) {
      const detail = conflicts
        .map(
          (c) =>
            `${c.agentId} → gestor “${c.gestor?.nome ?? c.gestorId}”`,
        )
        .join('; ');
      throw new ConflictException(`Agente(s) já vinculados: ${detail}`);
    }
  }

  async setAgentes(
    id: string,
    dto: SetGestorAgentesDto,
  ): Promise<GestorRow> {
    await this.assertGestorUser(id);
    if (!Array.isArray(dto.agentIds)) {
      throw new BadRequestException('agentIds é obrigatório');
    }
    const agentIds = this.normalizeAgentIds(dto.agentIds);
    await this.assertAgentsFree(agentIds, id);
    await this.gestorAgentes.delete({ gestorId: id });
    if (agentIds.length) {
      await this.gestorAgentes.save(
        agentIds.map((agentId) =>
          this.gestorAgentes.create({ gestorId: id, agentId }),
        ),
      );
    }
    return this.findOne(id);
  }
}
