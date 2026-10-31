import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FileInterceptor } from '@nestjs/platform-express'
import { AuthGuard, CurrentUser } from '../auth/auth.guard'
import { User } from '../users/user.entity'
import { UsersService } from '../users/users.service'
import { UpdatePreferencesDto, UpdateProfileDto } from './dto'
import { PHOTO_MAX_BYTES, removePhoto, savePhoto } from './photo'

@Controller('me')
@UseGuards(AuthGuard)
export class MeController {
  constructor(
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  private get uploadDir() {
    return this.config.get<string>('UPLOAD_DIR') ?? './uploads'
  }

  @Get()
  me(@CurrentUser() user: User) {
    return this.users.toPublic(user)
  }

  @Patch()
  async updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.users.toPublic(await this.users.update(user, dto))
  }

  @Patch('preferences')
  async updatePreferences(@CurrentUser() user: User, @Body() dto: UpdatePreferencesDto) {
    const patch: Partial<User> = { ...dto }
    if (dto.locationGranted === false) {
      patch.latitude = null
      patch.longitude = null
    }
    return this.users.toPublic(await this.users.update(user, patch))
  }

  @Post('onboarding/complete')
  @HttpCode(200)
  async completeOnboarding(@CurrentUser() user: User) {
    const missing: string[] = []
    if (!user.eventTypes?.length) missing.push('tipos de evento')
    if (!user.city) missing.push('cidade')
    if (missing.length) {
      throw new BadRequestException(`Falta definir: ${missing.join(', ')}.`)
    }
    const onboardedAt = user.onboardedAt ?? new Date()
    return this.users.toPublic(await this.users.update(user, { onboardedAt }))
  }

  @Put('photo')
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: PHOTO_MAX_BYTES, files: 1 } }))
  async uploadPhoto(@CurrentUser() user: User, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Escolha uma imagem.')
    const old = user.photoFile
    const photoFile = savePhoto(this.uploadDir, file.buffer)
    const saved = await this.users.update(user, { photoFile })
    removePhoto(this.uploadDir, old)
    return this.users.toPublic(saved)
  }

  @Delete('photo')
  async deletePhoto(@CurrentUser() user: User) {
    const old = user.photoFile
    const saved = await this.users.update(user, { photoFile: null })
    removePhoto(this.uploadDir, old)
    return this.users.toPublic(saved)
  }
}
