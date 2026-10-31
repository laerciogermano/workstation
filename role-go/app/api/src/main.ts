import 'reflect-metadata'
import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'
import { setupApp } from './setup'

async function bootstrap() {
  if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'troque-isto')) {
    throw new Error('Defina JWT_SECRET em produção.')
  }
  const app = setupApp(await NestFactory.create<NestExpressApplication>(AppModule))
  const port = Number(process.env.PORT ?? 3000)
  await app.listen(port)
  Logger.log(`RoleGo API em http://localhost:${port}/api`, 'Bootstrap')
}
bootstrap()
