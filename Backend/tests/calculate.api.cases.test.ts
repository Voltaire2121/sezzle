import request from 'supertest';
import { createApp } from '../src/app';
import { advancedCases } from './fixtures/advancedExpressions';
import { allCases } from './fixtures/expressions';
import type { ExpressionCase } from './fixtures/helpers';

const app = createApp();

async function expectApiResponse({ input, expected }: ExpressionCase) {
  const res = await request(app).post('/api/calculate').send({ expression: input });

  if ('result' in expected) {
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ result: expected.result });
  } else {
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(expected.error);
    expect(typeof res.body.message).toBe('string');
  }
}

describe('POST /api/calculate against the phase-1 expression fixtures', () => {
  it.each(allCases)('#$id "$input"', expectApiResponse);
});

describe('POST /api/calculate against the advanced expression fixtures', () => {
  it.each(advancedCases)('#$id "$input"', expectApiResponse);
});
