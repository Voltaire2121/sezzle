import { API_BASE_URL } from '../config';
import { calculateExpression, NETWORK_ERROR } from './calculatorApi';

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('calculateExpression', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('POSTs the expression as JSON to /api/calculate', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { result: 8 }));

    await calculateExpression('4+4');

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/api/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expression: '4+4' }),
    });
  });

  it('returns the result on 200', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { result: 8 }));
    await expect(calculateExpression('4+4')).resolves.toEqual({ ok: true, result: 8 });
  });

  it('returns a Syntax Error on 400', async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { error: 'Syntax Error', message: 'Unexpected operator "+"' }));
    await expect(calculateExpression('4++4')).resolves.toEqual({
      ok: false,
      status: 400,
      error: 'Syntax Error',
      message: 'Unexpected operator "+"',
    });
  });

  it('returns a Math Error on 400', async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { error: 'Math Error', message: 'Division by zero' }));
    await expect(calculateExpression('8/0')).resolves.toMatchObject({ ok: false, status: 400, error: 'Math Error' });
  });

  it('returns the server error on 500', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, { error: 'Internal Server Error' }));
    await expect(calculateExpression('4+4')).resolves.toEqual({
      ok: false,
      status: 500,
      error: 'Internal Server Error',
    });
  });

  it('handles a response without a JSON body', async () => {
    fetchMock.mockResolvedValue(new Response('Bad Gateway', { status: 502 }));
    await expect(calculateExpression('4+4')).resolves.toEqual({ ok: false, status: 502, error: 'Unknown Error' });
  });

  it('returns status 0 when the server cannot be reached', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(calculateExpression('4+4')).resolves.toEqual({ ok: false, status: 0, error: NETWORK_ERROR });
  });
});
