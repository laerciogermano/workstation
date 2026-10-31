import { ValidationPipe } from '@nestjs/common'
import type { NestExpressApplication } from '@nestjs/platform-express'
import cookieParser from 'cookie-parser'
import { resolve } from 'node:path'

// Config compartilhada entre main.ts e os testes e2e.
export function setupApp(app: NestExpressApplication) {
  app.setGlobalPrefix('api')
  app.use(cookieParser())
  app.set('trust proxy', 1)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
    }),
  )
  app.useStaticAssets(resolve(process.env.UPLOAD_DIR ?? './uploads'), {
    prefix: '/api/uploads/',
    index: false,
    dotfiles: 'deny',
    maxAge: '7d',
  })
  return app
}
