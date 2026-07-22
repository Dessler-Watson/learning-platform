import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Database Connection (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /database/health - debe retornar estado connected', () => {
    return request(app.getHttpServer())
      .get('/database/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status', 'connected');
        expect(res.body).toHaveProperty('timestamp');
      });
  });
});
