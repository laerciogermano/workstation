import { Body, Controller, Post } from '@nestjs/common';
import { CreateInviteDto } from './create-invite.dto';
import { InvitesService } from './invites.service';

@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  /** Callback do screen-robot após Connect+Skip+Pending. */
  @Post()
  create(@Body() dto: CreateInviteDto) {
    return this.invitesService.upsertOne(dto);
  }
}
