import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('ProfilesController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /profiles', async () => {
    const res = await request(app.getHttpServer())
      .post('/profiles')
      .send({
        name: 'Alexandre Silva',
        title: 'Comprador',
        level: '2nd',
        connection: 'Pending',
        city: 'Belo Horizonte, Minas',
        mutualConnections: '2 mutual connections',
        current: 'Comprador at Grupo GPS',
        past: null,
      })
      .expect(201);

    expect(res.body.name).toBe('Alexandre Silva');
    expect(res.body.id).toBeDefined();
  });
});
