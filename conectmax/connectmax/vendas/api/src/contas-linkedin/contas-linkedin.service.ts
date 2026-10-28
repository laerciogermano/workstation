import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agente } from '../agentes/agente.entity';
import {
  ContaLinkedin,
  ContaLinkedinInfracao,
} from './conta-linkedin.entity';
import {
  AddInfracaoDto,
  CreateContaLinkedinDto,
  UpdateContaLinkedinDto,
} from './create-conta-linkedin.dto';

@Injectable()
export class ContasLinkedinService {
  constructor(
    @InjectRepository(ContaLinkedin)
    private readonly contas: Repository<ContaLinkedin>,
    @InjectRepository(Agente)
    private readonly agentesRepo: Repository<Agente>,
  ) {}

  async findAll(opts?: {
    page?: number;
    limit?: number;
    q?: string;
    status?: string;
    agenteId?: string;
  }): Promise<{
    meta: {
      total: number;
      page: number;
      limit: number;
      pages: number;
      ativas: number;
      restritas: number;
    };
    data: ContaLinkedin[];
  }> {
    const page = Math.max(1, Number(opts?.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(opts?.limit) || 50));
    const q = opts?.q?.trim() ?? '';

    const qb = this.contas
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.agente', 'a')
      .orderBy('c.nome', 'ASC');

    if (opts?.status) {
      qb.andWhere('c.status = :st', { st: opts.status });
    }
    if (opts?.agenteId) {
      qb.andWhere('c.agente_id = :aid', { aid: opts.agenteId });
    }
    if (q) {
      qb.andWhere(
        `(c.nome ILIKE :q OR c.usuario ILIKE :q OR c.profile_url ILIKE :q OR c.headline ILIKE :q OR a.nome ILIKE :q)`,
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

    const ativas = await this.contas.count({ where: { status: 'ativa' } });
    const restritas = await this.contas.count({
      where: { status: 'restrita' },
    });

    return {
      meta: {
        total,
        page: safePage,
        limit,
        pages,
        ativas,
        restritas,
      },
      data,
    };
  }

  async findOne(id: string): Promise<ContaLinkedin> {
    const row = await this.contas.findOne({
      where: { id },
      relations: ['agente'],
    });
    if (!row) {
      throw new NotFoundException(`conta linkedin não encontrada: ${id}`);
    }
    return row;
  }

  private async assertAgenteFree(
    agenteId: string,
    exceptId?: string,
  ): Promise<Agente> {
    const avd = await this.agentesRepo.findOne({
      where: { id: agenteId },
      });
    if (!avd) {
      throw new NotFoundException(`agente não encontrado: ${agenteId}`);
    }
    const existing = await this.contas.findOneBy({ agenteId });
    if (existing && existing.id !== exceptId) {
      throw new ConflictException(
        `Agente ${avd.nome} já tem conta LinkedIn (${existing.usuario})`,
      );
    }
    return avd;
  }

  private normalizeInfracoes(
    list?: ContaLinkedinInfracao[] | null,
  ): ContaLinkedinInfracao[] {
    if (!Array.isArray(list)) return [];
    return list.map((i) => ({
      tipo: String(i.tipo || '').trim(),
      descricao: String(i.descricao || '').trim(),
      data: i.data ?? null,
      resolvida: Boolean(i.resolvida),
    }));
  }

  async create(dto: CreateContaLinkedinDto): Promise<ContaLinkedin> {
    await this.assertAgenteFree(dto.agenteId);

    const usuario = dto.usuario.trim().toLowerCase();
    const byUser = await this.contas.findOneBy({ usuario });
    if (byUser) {
      throw new ConflictException(`usuário já cadastrado: ${usuario}`);
    }

    return this.contas.save(
      this.contas.create({
        agenteId: dto.agenteId,
        nome: dto.nome.trim(),
        usuario,
        senha: dto.senha,
        profileUrl: dto.profileUrl?.trim() || null,
        headline: dto.headline?.trim() || null,
        photoBase64: dto.photoBase64 || null,
        status: dto.status ?? 'ativa',
        infracoes: this.normalizeInfracoes(dto.infracoes),
        notas: dto.notas ?? null,
      }),
    );
  }

  async update(
    id: string,
    dto: UpdateContaLinkedinDto,
  ): Promise<ContaLinkedin> {
    const row = await this.findOne(id);

    if (dto.agenteId !== undefined && dto.agenteId !== row.agenteId) {
      await this.assertAgenteFree(dto.agenteId, id);
      row.agenteId = dto.agenteId;
    }
    if (dto.nome !== undefined) row.nome = dto.nome.trim();
    if (dto.usuario !== undefined) {
      const usuario = dto.usuario.trim().toLowerCase();
      if (usuario !== row.usuario) {
        const byUser = await this.contas.findOneBy({ usuario });
        if (byUser) {
          throw new ConflictException(`usuário já cadastrado: ${usuario}`);
        }
        row.usuario = usuario;
      }
    }
    if (dto.senha !== undefined) row.senha = dto.senha;
    if (dto.profileUrl !== undefined) {
      row.profileUrl = dto.profileUrl?.trim() || null;
    }
    if (dto.headline !== undefined) {
      row.headline = dto.headline?.trim() || null;
    }
    if (dto.photoBase64 !== undefined) {
      row.photoBase64 = dto.photoBase64 || null;
    }
    if (dto.status !== undefined) row.status = dto.status;
    if (dto.infracoes !== undefined) {
      row.infracoes = this.normalizeInfracoes(dto.infracoes);
    }
    if (dto.notas !== undefined) row.notas = dto.notas ?? null;

    await this.contas.save(row);
    return this.findOne(id);
  }

  async addInfracao(
    id: string,
    dto: AddInfracaoDto,
  ): Promise<ContaLinkedin> {
    const row = await this.findOne(id);
    const next: ContaLinkedinInfracao = {
      tipo: dto.tipo.trim(),
      descricao: dto.descricao.trim(),
      data: dto.data ?? new Date().toISOString().slice(0, 10),
      resolvida: Boolean(dto.resolvida),
    };
    row.infracoes = [...(row.infracoes || []), next];
    if (row.status === 'ativa' && !next.resolvida) {
      row.status = 'restrita';
    }
    await this.contas.save(row);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ ok: true; id: string }> {
    const row = await this.findOne(id);
    await this.contas.remove(row);
    return { ok: true, id };
  }
}
