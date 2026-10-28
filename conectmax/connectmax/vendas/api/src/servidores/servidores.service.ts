import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateServidorDto,
  UpdateServidorDto,
} from './create-servidor.dto';
import { Servidor } from './servidor.entity';

@Injectable()
export class ServidoresService {
  constructor(
    @InjectRepository(Servidor)
    private readonly servidores: Repository<Servidor>,
  ) {}

  async findAll(opts?: {
    page?: number;
    limit?: number;
    q?: string;
    status?: string;
  }): Promise<{
    meta: { total: number; page: number; limit: number; pages: number };
    data: Servidor[];
  }> {
    const page = Math.max(1, Number(opts?.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(opts?.limit) || 50));
    const q = opts?.q?.trim() ?? '';
    const status = opts?.status?.trim() ?? '';

    const qb = this.servidores.createQueryBuilder('s');

    if (status) {
      qb.andWhere('s.status = :status', { status });
    }

    if (q) {
      qb.andWhere(
        `(s.nome ILIKE :q OR s.provedor ILIKE :q OR s.hostname ILIKE :q
          OR s.ipPublico ILIKE :q OR s.ipPrivado ILIKE :q OR s.produto ILIKE :q)`,
        { q: `%${q}%` },
      );
    }

    qb.orderBy('s.nome', 'ASC');

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

  async findOne(id: string): Promise<Servidor> {
    const row = await this.servidores.findOneBy({ id });
    if (!row) {
      throw new NotFoundException(`servidor não encontrado: ${id}`);
    }
    return row;
  }

  private resolveIp(dto: {
    localhost?: boolean;
    ipPublico?: string;
  }): string {
    if (dto.localhost) {
      return (dto.ipPublico?.trim() || '127.0.0.1');
    }
    const ip = dto.ipPublico?.trim();
    if (!ip) {
      throw new BadRequestException(
        'ipPublico obrigatório quando não é localhost',
      );
    }
    return ip;
  }

  async create(dto: CreateServidorDto): Promise<Servidor> {
    const localhost = Boolean(dto.localhost);
    return this.servidores.save(
      this.servidores.create({
        nome: dto.nome,
        provedor: dto.provedor ?? (localhost ? 'local' : null),
        produto: dto.produto ?? null,
        hostname: dto.hostname ?? (localhost ? 'localhost' : null),
        ipPublico: this.resolveIp(dto),
        ipPrivado: localhost ? null : (dto.ipPrivado ?? null),
        localhost,
        sshUser: dto.sshUser ?? 'root',
        sshPort: dto.sshPort ?? 22,
        sshPassword: localhost ? null : (dto.sshPassword ?? null),
        ramGb: dto.ramGb ?? null,
        nestedKvm: dto.nestedKvm ?? false,
        notas: dto.notas ?? null,
        status: dto.status ?? 'active',
      }),
    );
  }

  async update(id: string, dto: UpdateServidorDto): Promise<Servidor> {
    const row = await this.findOne(id);
    if (dto.nome !== undefined) row.nome = dto.nome;
    if (dto.provedor !== undefined) row.provedor = dto.provedor ?? null;
    if (dto.produto !== undefined) row.produto = dto.produto ?? null;
    if (dto.hostname !== undefined) row.hostname = dto.hostname ?? null;
    if (dto.localhost !== undefined) row.localhost = Boolean(dto.localhost);
    if (dto.ipPublico !== undefined || dto.localhost) {
      row.ipPublico = this.resolveIp({
        localhost: row.localhost,
        ipPublico: dto.ipPublico ?? row.ipPublico,
      });
    }
    if (dto.ipPrivado !== undefined) {
      row.ipPrivado = row.localhost ? null : (dto.ipPrivado ?? null);
    }
    if (dto.sshUser !== undefined) row.sshUser = dto.sshUser;
    if (dto.sshPort !== undefined) row.sshPort = dto.sshPort;
    if (dto.sshPassword !== undefined || row.localhost) {
      row.sshPassword = row.localhost
        ? null
        : dto.sshPassword !== undefined
          ? dto.sshPassword ?? null
          : row.sshPassword;
    }
    if (dto.ramGb !== undefined) row.ramGb = dto.ramGb ?? null;
    if (dto.nestedKvm !== undefined) row.nestedKvm = dto.nestedKvm;
    if (dto.notas !== undefined) row.notas = dto.notas ?? null;
    if (dto.status !== undefined) row.status = dto.status;
    return this.servidores.save(row);
  }

  async remove(id: string): Promise<{ ok: true; id: string }> {
    const row = await this.findOne(id);
    await this.servidores.remove(row);
    return { ok: true, id };
  }

  /**
   * Upsert por `hostname` (se houver) ou `ipPublico`.
   */
  async upsertOne(dto: CreateServidorDto): Promise<{
    created: boolean;
    servidor: Servidor;
  }> {
    let existing: Servidor | null = null;
    if (dto.hostname) {
      existing = await this.servidores.findOneBy({ hostname: dto.hostname });
    }
    if (!existing) {
      existing = await this.servidores.findOneBy({
        ipPublico: dto.ipPublico,
      });
    }
    if (existing) {
      return {
        created: false,
        servidor: await this.update(existing.id, dto),
      };
    }
    return { created: true, servidor: await this.create(dto) };
  }
}
