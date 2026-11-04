import { Body, Controller, Delete, Get, HttpCode, Patch, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { DeleteMeBody, type Me, PreferencesBody, PrivacyBody, UpdateMeBody } from '@rolego/contracts';
import { AllowNoConsent, CurrentViewer, type Viewer } from '../../../shared/auth/viewer';
import { AppError, unwrap } from '../../../shared/errors/app-error';
import { parseOrThrow } from '../../../shared/http/zod';
import { MeService } from '../application/me.service';

const upload = FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 } });

@Controller('me')
export class MeController {
  constructor(private readonly me: MeService) {}

  private async load(userId: string): Promise<Me> {
    const me = await this.me.getMe(userId);
    if (!me) throw new AppError('UNAUTHENTICATED');
    return me;
  }

  @Get()
  @AllowNoConsent()
  get(@CurrentViewer() v: Viewer): Promise<Me> {
    return this.load(v.userId);
  }

  @Patch()
  async update(@CurrentViewer() v: Viewer, @Body() body: unknown): Promise<Me> {
    unwrap(await this.me.update(v.userId, parseOrThrow(UpdateMeBody, body)));
    return this.load(v.userId);
  }

  @Put('photo')
  @Throttle({ default: { limit: 20, ttl: 3600_000 } })
  @UseInterceptors(upload)
  async photo(@CurrentViewer() v: Viewer, @UploadedFile() file: Express.Multer.File | undefined): Promise<Me> {
    unwrap(await this.me.setPhoto(v.userId, file?.buffer));
    return this.load(v.userId);
  }

  @Delete('photo')
  async removePhoto(@CurrentViewer() v: Viewer): Promise<Me> {
    await this.me.removePhoto(v.userId);
    return this.load(v.userId);
  }

  @Patch('preferences')
  async preferences(@CurrentViewer() v: Viewer, @Body() body: unknown): Promise<Me> {
    unwrap(await this.me.setPreferences(v.userId, parseOrThrow(PreferencesBody, body)));
    return this.load(v.userId);
  }

  @Post('onboarding/complete')
  @HttpCode(200)
  async complete(@CurrentViewer() v: Viewer): Promise<Me> {
    unwrap(await this.me.completeOnboarding(v.userId));
    return this.load(v.userId);
  }

  @Patch('privacy')
  async privacy(@CurrentViewer() v: Viewer, @Body() body: unknown): Promise<Me> {
    await this.me.setPrivacy(v.userId, parseOrThrow(PrivacyBody, body).showPresence);
    return this.load(v.userId);
  }

  @Delete()
  @HttpCode(202)
  @AllowNoConsent()
  async remove(@CurrentViewer() v: Viewer, @Body() body: unknown): Promise<void> {
    parseOrThrow(DeleteMeBody, body);
    await this.me.deleteAccount(v.userId);
  }
}
