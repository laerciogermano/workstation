import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInviteDto } from './create-invite.dto';
import { Invite } from './invite.entity';

@Injectable()
export class InvitesService {
  constructor(
    @InjectRepository(Invite)
    private readonly invites: Repository<Invite>,
  ) {}

  async upsertOne(dto: CreateInviteDto): Promise<Invite> {
    const profileUrl = String(dto.profileUrl || '').trim().replace(/\/$/, '');
    const status = dto.status || 'Pending';
    const invitedAt = dto.invitedAt ? new Date(dto.invitedAt) : new Date();
    const steps = dto.steps ?? null;

    await this.invites.upsert(
      { profileUrl, status, invitedAt, steps },
      {
        conflictPaths: ['profileUrl'],
        skipUpdateIfNoValuesChanged: true,
      },
    );
    return this.invites.findOneByOrFail({ profileUrl });
  }
}
