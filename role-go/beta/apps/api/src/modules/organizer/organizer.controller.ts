import { Body, Controller, Patch, Post } from '@nestjs/common';
import { OrganizerInput, type OrganizerDto } from '@rolego/contracts';
import { CurrentViewer, type Viewer } from '../../shared/auth/viewer';
import { unwrap } from '../../shared/errors/app-error';
import { parseOrThrow } from '../../shared/http/zod';
import { OrganizerService } from './organizer.service';

@Controller('organizer')
export class OrganizerController {
  constructor(private readonly orgs: OrganizerService) {}

  @Post()
  async activate(@CurrentViewer() v: Viewer, @Body() body: unknown): Promise<OrganizerDto> {
    return this.orgs.toDto(unwrap(await this.orgs.activate(v.userId, parseOrThrow(OrganizerInput, body))));
  }

  @Patch()
  async update(@CurrentViewer() v: Viewer, @Body() body: unknown): Promise<OrganizerDto> {
    return this.orgs.toDto(unwrap(await this.orgs.update(v.userId, parseOrThrow(OrganizerInput.partial(), body))));
  }
}
