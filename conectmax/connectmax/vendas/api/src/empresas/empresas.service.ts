import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  CreateEmpresaDto,
  UpdateEmpresaDto,
} from './create-empresa.dto';
import { Empresa } from './empresa.entity';

function digitsOnly(cnpj: string | null | undefined): string | null {
  if (!cnpj) return null;
  const d = cnpj.replace(/\D/g, '');
  return d.length === 14 ? d : null;
}

function formatCnpj(digits: string): string {
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

@Injectable()
export class EmpresasService {
  constructor(
    @InjectRepository(Empresa)
    private readonly empresas: Repository<Empresa>,
  ) {}

  async findAll(opts?: {
    page?: number;
    limit?: number;
    q?: string;
    comCnpj?: boolean;
  }): Promise<{
    meta: {
      total: number;
      page: number;
      limit: number;
      pages: number;
      comCnpj: number;
      semCnpj: number;
    };
    data: Empresa[];
  }> {
    const page = Math.max(1, Number(opts?.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(opts?.limit) || 100));
    const q = opts?.q?.trim() ?? '';

    const qb = this.empresas.createQueryBuilder('e');

    if (opts?.comCnpj === true) {
      qb.andWhere('e.cnpjDigits IS NOT NULL');
    } else if (opts?.comCnpj === false) {
      qb.andWhere('e.cnpjDigits IS NULL');
    }

    if (q) {
      qb.andWhere(
        `(e.razaoSocial ILIKE :q OR e.nomeFantasia ILIKE :q OR e.cnpj ILIKE :q OR e.cnpjDigits ILIKE :q)`,
        { q: `%${q}%` },
      );
    }

    qb.orderBy('e.pedidosValor', 'DESC').addOrderBy('e.razaoSocial', 'ASC');

    const total = await qb.getCount();
    const pages = Math.max(1, Math.ceil(total / limit) || 1);
    const safePage = Math.min(page, pages);

    const data = await qb
      .skip((safePage - 1) * limit)
      .take(limit)
      .getMany();

    const semCnpj = await this.empresas.count({
      where: { cnpjDigits: IsNull() },
    });
    const all = await this.empresas.count();

    return {
      meta: {
        total,
        page: safePage,
        limit,
        pages,
        comCnpj: all - semCnpj,
        semCnpj,
      },
      data,
    };
  }

  async findOne(id: string): Promise<Empresa> {
    const row = await this.empresas.findOneBy({ id });
    if (!row) {
      throw new NotFoundException(`empresa não encontrada: ${id}`);
    }
    return row;
  }

  async create(dto: CreateEmpresaDto): Promise<Empresa> {
    const cnpjDigits = digitsOnly(dto.cnpj ?? null);
    const cnpj = cnpjDigits ? formatCnpj(cnpjDigits) : null;
    return this.empresas.save(
      this.empresas.create({
        cnpj,
        cnpjDigits,
        razaoSocial: dto.razaoSocial,
        nomeFantasia: dto.nomeFantasia ?? null,
        fontes: dto.fontes ?? [],
        pedidosQtd: dto.pedidosQtd ?? 0,
        pedidosValor: String(dto.pedidosValor ?? 0),
        orcamentosQtd: dto.orcamentosQtd ?? 0,
        orcamentosValor: String(dto.orcamentosValor ?? 0),
        vendedores: dto.vendedores ?? [],
      }),
    );
  }

  async update(id: string, dto: UpdateEmpresaDto): Promise<Empresa> {
    const row = await this.findOne(id);
    if (dto.cnpj !== undefined) {
      const d = digitsOnly(dto.cnpj);
      row.cnpjDigits = d;
      row.cnpj = d ? formatCnpj(d) : null;
    }
    if (dto.razaoSocial !== undefined) row.razaoSocial = dto.razaoSocial;
    if (dto.nomeFantasia !== undefined) {
      row.nomeFantasia = dto.nomeFantasia ?? null;
    }
    if (dto.fontes !== undefined) row.fontes = dto.fontes;
    if (dto.pedidosQtd !== undefined) row.pedidosQtd = dto.pedidosQtd;
    if (dto.pedidosValor !== undefined) {
      row.pedidosValor = String(dto.pedidosValor);
    }
    if (dto.orcamentosQtd !== undefined) {
      row.orcamentosQtd = dto.orcamentosQtd;
    }
    if (dto.orcamentosValor !== undefined) {
      row.orcamentosValor = String(dto.orcamentosValor);
    }
    if (dto.vendedores !== undefined) row.vendedores = dto.vendedores;
    return this.empresas.save(row);
  }

  /**
   * Upsert em lote: por `cnpjDigits` se houver; senão por `razaoSocial` (sem CNPJ).
   */
  async importMany(items: CreateEmpresaDto[]): Promise<{
    upserted: number;
    created: number;
    updated: number;
  }> {
    let created = 0;
    let updated = 0;

    const withCnpj = items.filter((i) => digitsOnly(i.cnpj ?? null));
    const without = items.filter((i) => !digitsOnly(i.cnpj ?? null));

    if (withCnpj.length) {
      const digits = withCnpj
        .map((i) => digitsOnly(i.cnpj ?? null))
        .filter((d): d is string => !!d);
      const existing = await this.empresas
        .createQueryBuilder('e')
        .where('e.cnpjDigits IN (:...digits)', { digits })
        .getMany();
      const byDigits = new Map(existing.map((e) => [e.cnpjDigits!, e]));

      const toSave: Empresa[] = [];
      for (const dto of withCnpj) {
        const cnpjDigits = digitsOnly(dto.cnpj ?? null)!;
        const cnpj = formatCnpj(cnpjDigits);
        const patch = this.toPatch(dto, cnpj, cnpjDigits);
        const row = byDigits.get(cnpjDigits);
        if (row) {
          Object.assign(row, patch);
          toSave.push(row);
          updated += 1;
        } else {
          toSave.push(this.empresas.create(patch));
          created += 1;
        }
      }
      await this.empresas.save(toSave);
    }

    for (const dto of without) {
      const existing = await this.empresas.findOne({
        where: { razaoSocial: dto.razaoSocial, cnpjDigits: IsNull() },
      });
      const patch = this.toPatch(dto, null, null);
      if (existing) {
        Object.assign(existing, patch);
        await this.empresas.save(existing);
        updated += 1;
      } else {
        await this.empresas.save(this.empresas.create(patch));
        created += 1;
      }
    }

    return { upserted: created + updated, created, updated };
  }

  private toPatch(
    dto: CreateEmpresaDto,
    cnpj: string | null,
    cnpjDigits: string | null,
  ) {
    return {
      cnpj,
      cnpjDigits,
      razaoSocial: dto.razaoSocial,
      nomeFantasia: dto.nomeFantasia ?? null,
      fontes: dto.fontes ?? [],
      pedidosQtd: dto.pedidosQtd ?? 0,
      pedidosValor: String(dto.pedidosValor ?? 0),
      orcamentosQtd: dto.orcamentosQtd ?? 0,
      orcamentosValor: String(dto.orcamentosValor ?? 0),
      vendedores: dto.vendedores ?? [],
    };
  }
}
