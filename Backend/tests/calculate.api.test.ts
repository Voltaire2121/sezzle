import request from 'supertest';
import { createApp } from '../src/app';
import * as calculator from '../src/services/calculator';

const app = createApp();

describe('POST /api/calculate request body validation', () => {
  it.each([
    ['missing expression', {}],
    ['expression as a number', { expression: 44 }],
    ['extra keys', { expression: '4+4', foo: 1 }],
    ['non-object body', []],
  ])('returns 400 Syntax Error for %s', async (_label, body) => {
    const res = await request(app).post('/api/calculate').send(body as object);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Syntax Error');
  });

  it('returns 400 Syntax Error for malformed JSON', async () => {
    const res = await request(app)
      .post('/api/calculate')
      .set('Content-Type', 'application/json')
      .send('{"expression": "4+4"');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Syntax Error');
  });
});

describe('unexpected failures', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns 500 without leaking internal details', async () => {
    jest.spyOn(calculator, 'calculate').mockImplementation(() => {
      throw new Error('database exploded');
    });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const res = await request(app).post('/api/calculate').send({ expression: '4+4' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal Server Error' });
  });
});

describe('unknown routes', () => {
  it('returns 404 JSON', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not Found' });
  });
});

describe('GET /api/health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
