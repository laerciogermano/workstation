import { Body, Controller, Post } from '@nestjs/common';
import { CreateProfileDto, CreateProfilesBatchDto } from './create-profile.dto';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  /** Um perfil (callback onProfile do extract). */
  @Post()
  create(@Body() dto: CreateProfileDto) {
    return this.profilesService.upsertOne(dto);
  }

  /** Lote (ex.: profiles.json completo). */
  @Post('batch')
  createBatch(@Body() body: CreateProfilesBatchDto) {
    return this.profilesService.upsertMany(body.profiles);
  }
}
