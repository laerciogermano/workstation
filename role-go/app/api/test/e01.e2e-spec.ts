import { Test } from '@nestjs/testing'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import request from 'supertest'

const uploadDir = mkdtempSync(join(tmpdir(), 'rolego-e2e-'))
Object.assign(process.env, {
  DB_PATH: ':memory:',
  DB_SYNC: 'true',
  JWT_SECRET: 'test-secret',
  UPLOAD_DIR: uploadDir,
  APP_URL: 'http://app.test',
  SMTP_HOST: '',
  GOOGLE_CLIENT_ID: '',
  APPLE_CLIENT_ID: '',
})

import { AppModule } from '../src/app.module'
import { MailService } from '../src/mail/mail.service'
import { setupApp } from '../src/setup'

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

describe('E01 — conta, onboarding e perfil', () => {
  let app: NestExpressApplication
  const sentLinks: string[] = []

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({ sendPasswordReset: async (_: string, link: string) => sentLinks.push(link) })
      .compile()
    app = setupApp(mod.createNestApplication<NestExpressApplication>())
    await app.init()
  })

  afterAll(async () => {
    await app.close()
    rmSync(uploadDir, { recursive: true, force: true })
  })

  const agent = () => request.agent(app.getHttpServer())

  it('cadastro valida confirmação de senha e tamanho mínimo', async () => {
    const a = agent()
    await a
      .post('/api/auth/register')
      .send({ email: 'x@rolego.com.br', password: '123456', confirmPassword: '654321' })
      .expect(400)
    const res = await a
      .post('/api/auth/register')
      .send({ email: 'x@rolego.com.br', password: '123', confirmPassword: '123' })
      .expect(400)
    expect(JSON.stringify(res.body.message)).toContain('mínima')
  })

  it('cadastro → onboarding → perfil → logout → login', async () => {
    const a = agent()
    const ok = await a
      .post('/api/auth/register')
      .send({ email: ' Ana@RoleGo.com.br ', password: 'segredo1', confirmPassword: 'segredo1' })
      .expect(201)
    expect(ok.body.user).toMatchObject({ email: 'ana@rolego.com.br', onboarded: false, radiusKm: 20 })
    expect(ok.headers['set-cookie'][0]).toMatch(/rolego_session=.*HttpOnly/)

    await a
      .post('/api/auth/register')
      .send({ email: 'ana@rolego.com.br', password: 'segredo1', confirmPassword: 'segredo1' })
      .expect(409)

    // concluir sem preferências é recusado
    await a.post('/api/me/onboarding/complete').expect(400)

    await a.patch('/api/me/preferences').send({ eventTypes: ['Festas', 'Inexistente'] }).expect(400)
    await a.patch('/api/me/preferences').send({ eventTypes: ['Festas', 'Shows'] }).expect(200)
    await a.patch('/api/me/preferences').send({ city: 'Curitiba' }).expect(200)
    await a
      .patch('/api/me/preferences')
      .send({ locationGranted: true, latitude: -25.43, longitude: -49.27 })
      .expect(200)
    await a.patch('/api/me/preferences').send({ radiusKm: 101 }).expect(400)
    await a.patch('/api/me/preferences').send({ radiusKm: 0 }).expect(400)
    await a.patch('/api/me/preferences').send({ radiusKm: 35 }).expect(200)
    const done = await a.post('/api/me/onboarding/complete').expect(200)
    expect(done.body).toMatchObject({
      onboarded: true,
      eventTypes: ['Festas', 'Shows'],
      city: 'Curitiba',
      locationGranted: true,
      radiusKm: 35,
    })

    const edited = await a
      .patch('/api/me')
      .send({ name: '  Ana Souza ', email: 'ana.souza@rolego.com.br' })
      .expect(200)
    expect(edited.body).toMatchObject({ name: 'Ana Souza', email: 'ana.souza@rolego.com.br' })

    await a.post('/api/auth/logout').expect(204)
    await a.get('/api/me').expect(401)

    await a.post('/api/auth/login').send({ email: 'ana.souza@rolego.com.br', password: 'errada' }).expect(401)
    const login = await a
      .post('/api/auth/login')
      .send({ email: 'ANA.SOUZA@rolego.com.br', password: 'segredo1' })
      .expect(200)
    expect(login.body.user.onboarded).toBe(true)
  })

  it('editar e-mail para um já usado retorna 409', async () => {
    const a = agent()
    await a
      .post('/api/auth/register')
      .send({ email: 'bia@rolego.com.br', password: 'segredo1', confirmPassword: 'segredo1' })
      .expect(201)
    await a.patch('/api/me').send({ email: 'ana.souza@rolego.com.br' }).expect(409)
  })

  it('foto de perfil: aceita imagem real, recusa outro arquivo, remove', async () => {
    const a = agent()
    await a
      .post('/api/auth/register')
      .send({ email: 'caio@rolego.com.br', password: 'segredo1', confirmPassword: 'segredo1' })
      .expect(201)

    await a
      .put('/api/me/photo')
      .attach('photo', Buffer.from('<script>alert(1)</script>'), { filename: 'x.png', contentType: 'image/png' })
      .expect(400)

    const up = await a.put('/api/me/photo').attach('photo', PNG, 'foto.png').expect(200)
    expect(up.body.photoUrl).toMatch(/^\/api\/uploads\/[\w-]+\.png\?v=\d+$/)
    await a.get(up.body.photoUrl.split('?')[0]).expect(200).expect('content-type', /image\/png/)

    const del = await a.delete('/api/me/photo').expect(200)
    expect(del.body.photoUrl).toBeNull()
  })

  it('recuperar senha: link de uso único, derruba sessões antigas', async () => {
    const old = agent()
    await old
      .post('/api/auth/register')
      .send({ email: 'duda@rolego.com.br', password: 'segredo1', confirmPassword: 'segredo1' })
      .expect(201)

    // e-mail sem conta responde igual e não envia nada
    await agent().post('/api/auth/forgot-password').send({ email: 'ninguem@rolego.com.br' }).expect(204)
    expect(sentLinks).toHaveLength(0)

    await agent().post('/api/auth/forgot-password').send({ email: 'duda@rolego.com.br' }).expect(204)
    expect(sentLinks).toHaveLength(1)
    const token = new URL(sentLinks[0]).searchParams.get('token')!
    expect(sentLinks[0]).toMatch(/^http:\/\/app\.test\/redefinir-senha\?token=/)

    const b = agent()
    await b
      .post('/api/auth/reset-password')
      .send({ token, password: 'novasenha', confirmPassword: 'outra' })
      .expect(400)
    await b
      .post('/api/auth/reset-password')
      .send({ token, password: 'novasenha', confirmPassword: 'novasenha' })
      .expect(200)
    await b.get('/api/me').expect(200)
    await old.get('/api/me').expect(401)

    await agent()
      .post('/api/auth/reset-password')
      .send({ token, password: 'denovo12', confirmPassword: 'denovo12' })
      .expect(400)
    await agent().post('/api/auth/login').send({ email: 'duda@rolego.com.br', password: 'novasenha' }).expect(200)
  })

  it('Google/Apple sem credenciais configuradas respondem 503', async () => {
    const providers = await agent().get('/api/auth/providers').expect(200)
    expect(providers.body).toEqual({ google: null, apple: null })
    await agent().post('/api/auth/google').send({ code: 'x' }).expect(503)
    await agent().post('/api/auth/apple').send({ idToken: 'x' }).expect(503)
  })
})
