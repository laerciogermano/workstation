import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CreateProfileDto } from './create-profile.dto';
import { Profile } from './profile.entity';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profiles: Repository<Profile>,
  ) {}

  async upsertOne(dto: CreateProfileDto): Promise<Profile> {
    const row = this.toEntity(dto);
    await this.profiles.upsert(row, {
      conflictPaths: ['name', 'current'],
      skipUpdateIfNoValuesChanged: true,
    });
    return this.profiles.findOneByOrFail({
      name: row.name!,
      current: row.current == null ? IsNull() : row.current,
    });
  }

  async upsertMany(dtos: CreateProfileDto[]): Promise<{ saved: number }> {
    if (!dtos.length) return { saved: 0 };
    const rows = dtos.map((d) => this.toEntity(d));
    await this.profiles.upsert(rows, {
      conflictPaths: ['name', 'current'],
      skipUpdateIfNoValuesChanged: true,
    });
    return { saved: rows.length };
  }

  private toEntity(dto: CreateProfileDto): Partial<Profile> {
    return {
      name: dto.name,
      title: dto.title ?? null,
      level: dto.level ?? null,
      connection: dto.connection ?? null,
      city: dto.city ?? null,
      mutualConnections: dto.mutualConnections ?? null,
      current: dto.current ?? null,
      past: dto.past ?? null,
      extractedAt: dto.extractedAt ? new Date(dto.extractedAt) : null,
      round: dto.round ?? null,
    };
  }
}
