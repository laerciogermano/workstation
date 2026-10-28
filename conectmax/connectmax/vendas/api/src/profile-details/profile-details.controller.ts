import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Resource } from '../auth/resource.decorator';
import { CreateProfileDetailDto } from './create-profile-detail.dto';
import { ProfileDetailsService } from './profile-details.service';

@Controller('profile-details')
@Resource('profiles')
export class ProfileDetailsController {
  constructor(private readonly profileDetailsService: ProfileDetailsService) {}

  /**
   * Lista detalhes. `?hasUrl=1` → só quem tem `profileUrl` LinkedIn.
   * Ex.: GET /profile-details?hasUrl=1
   */
  @Get()
  findAll(@Query('hasUrl') hasUrl?: string) {
    const withUrl = hasUrl === '1' || hasUrl === 'true';
    return this.profileDetailsService.findAll({ hasUrl: withUrl });
  }

  /**
   * Existe detail com esta URL? 1:1.
   * Ex.: GET /profile-details/by-url?url=https://www.linkedin.com/in/…
   */
  @Get('by-url')
  existsByUrl(
    @Query('url') url?: string,
    @Query('profileUrl') profileUrl?: string,
  ) {
    return this.profileDetailsService.existsByProfileUrl(url || profileUrl || '');
  }

  @Get(':profileId')
  findOne(@Param('profileId') profileId: string) {
    return this.profileDetailsService.findByProfileId(profileId);
  }

  @Post()
  create(@Body() dto: CreateProfileDetailDto) {
    return this.profileDetailsService.upsertOne(dto);
  }
}
