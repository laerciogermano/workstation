import { Module } from '@nestjs/common';
import { ProfilesModule } from '../profiles/profiles.module';
import { ExtractController } from './extract.controller';
import { ExtractService } from './extract.service';

@Module({
  imports: [ProfilesModule],
  controllers: [ExtractController],
  providers: [ExtractService],
})
export class ExtractModule {}
