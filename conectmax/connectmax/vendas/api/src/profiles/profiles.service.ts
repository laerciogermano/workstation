import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { ClientesService } from '../clientes/clientes.service';
import { ProfileListItem } from '../clientes/cliente-linkedin-facade';
import { normalizeInviteStatus } from '../clientes/invite-status';
import { ClientConnectionLinkedinStatus } from '../client-connections-linkedin/client-connection-linkedin-status';
import { ClientConnectionsLinkedinService } from '../client-connections-linkedin/client-connections-linkedin.service';
import { CreateProfileDto } from './create-profile.dto';

export type { ProfileListItem };
export { normalizeLinkedInProfileUrl } from '../clientes/linkedin-url';

function connectionStatusFromInvite(
  connection: string | null | undefined,
): ClientConnectionLinkedinStatus | null {
  const invite = normalizeInviteStatus(connection);
  if (invite === 'pending') return ClientConnectionLinkedinStatus.PENDING;
  if (invite === 'connected') return ClientConnectionLinkedinStatus.CONNECTED;
  if (invite === 'connect') return ClientConnectionLinkedinStatus.NOT_SENT;
  return null;
}

/** Fachada GET/POST /profiles → `cliente_linkedin` (+ reserva por agente). */
@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(
    private readonly clientes: ClientesService,
    private readonly connections: ClientConnectionsLinkedinService,
  ) {}

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

  async upsertOne(dto: CreateProfileDto): Promise<ProfileListItem> {
    const profile = await this.clientes.upsertFromListExtract(dto);
    await this.maybeReserveForAgent(dto, profile);
    return profile;
  }

  async upsertMany(dtos: CreateProfileDto[]) {
    for (const dto of dtos) {
      await this.upsertOne(dto);
    }
    return { saved: dtos.length };
  }

  /**
   * Com `agentId`, cria/atualiza `client_connection_linkedin` no mesmo POST.
   * Connect → 0 (candidato); Pending → 1; Message/connected → 2.
   */
  private async maybeReserveForAgent(
    dto: CreateProfileDto,
    profile: ProfileListItem,
  ): Promise<void> {
    const agentId = String(dto.agentId || '').trim();
    if (!agentId) return;

    const status = connectionStatusFromInvite(dto.connection);
    if (status == null) {
      this.logger.debug(
        `profiles agentId sem status (connection=${dto.connection ?? '-'}) id=${profile.id}`,
      );
      return;
    }

    try {
      await this.connections.upsertOne({
        agentId,
        clienteLinkedinId: profile.id,
        profileUrl: dto.profileUrl ?? undefined,
        status,
        steps: ['extract-profile'],
      });
    } catch (e) {
      if (e instanceof ConflictException) {
        this.logger.warn(
          `profiles reserve conflito agent=${agentId} profile=${profile.id}: ${e.message}`,
        );
        return;
      }
      throw e;
    }
  }
}
