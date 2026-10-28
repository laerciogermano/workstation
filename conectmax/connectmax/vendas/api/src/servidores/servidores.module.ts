import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Servidor } from './servidor.entity';
import { ServidoresController } from './servidores.controller';
import { ServidoresService } from './servidores.service';

@Module({
  imports: [TypeOrmModule.forFeature([Servidor])],
  controllers: [ServidoresController],
  providers: [ServidoresService],
  exports: [ServidoresService],
})
export class ServidoresModule {}
