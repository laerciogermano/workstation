import { Injectable } from '@nestjs/common';
import { ClientesService } from '../clientes/clientes.service';
import { CreateProfileDetailDto } from './create-profile-detail.dto';

/** Fachada GET/POST /profile-details → `cliente_linkedin`. */
@Injectable()
export class ProfileDetailsService {
  constructor(private readonly clientes: ClientesService) {}

  findAll(opts?: { hasUrl?: boolean }) {
    return this.clientes.findDetailsList(opts);
  }

  findByProfileId(profileId: string) {
    return this.clientes.findDetailById(profileId);
  }

  async findByProfileUrl(rawUrl: string) {
    const hit = await this.clientes.existsByProfileUrl(rawUrl);
    if (!hit.exists || !hit.profileId) return null;
    return this.clientes.findDetailById(hit.profileId);
  }

  existsByProfileUrl(rawUrl: string) {
    return this.clientes.existsByProfileUrl(rawUrl);
  }

  upsertOne(dto: CreateProfileDetailDto) {
    return this.clientes.upsertFromDetailExtract(dto);
  }
}
