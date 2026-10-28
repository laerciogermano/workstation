import { Injectable } from '@nestjs/common';
import { ClientesService } from '../clientes/clientes.service';
import { ProfileListItem } from '../clientes/cliente-linkedin-facade';
import { CreateProfileDto } from './create-profile.dto';

export type { ProfileListItem };
export { normalizeLinkedInProfileUrl } from '../clientes/linkedin-url';

/** Fachada GET/POST /profiles → `cliente_linkedin`. */
@Injectable()
export class ProfilesService {
  constructor(private readonly clientes: ClientesService) {}

  findAll(opts?: {
    page?: number;
    limit?: number;
    q?: string;
    agentId?: string;
  }) {
    return this.clientes.findProfilesList(opts);
  }

  findOne(id: string): Promise<ProfileListItem> {
    return this.clientes.findProfileById(id);
  }

  softDeleteAllActive() {
    return this.clientes.softDeleteAllActive();
  }

  softDeleteOne(id: string) {
    return this.clientes.softDeleteOne(id);
  }

  ensureForLinkedInUrl(rawUrl: string) {
    return this.clientes.ensureForLinkedInUrl(rawUrl);
  }

  upsertOne(dto: CreateProfileDto): Promise<ProfileListItem> {
    return this.clientes.upsertFromListExtract(dto);
  }

  upsertMany(dtos: CreateProfileDto[]) {
    return this.clientes.upsertManyFromList(dtos);
  }
}
