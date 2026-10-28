import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServidoresModule } from '../servidores/servidores.module';
import { Avd } from './avd.entity';
import { AvdsController } from './avds.controller';
import { AvdsService } from './avds.service';

@Module({
  imports: [TypeOrmModule.forFeature([Avd]), ServidoresModule],
  controllers: [AvdsController],
  providers: [AvdsService],
  exports: [AvdsService],
})
export class AvdsModule {}
