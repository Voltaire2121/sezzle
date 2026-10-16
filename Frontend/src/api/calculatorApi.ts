import { API_BASE_URL } from '../config';

/** Raw backend answer. Status 0 means the request never reached the server. */
export type ApiCalculateResponse =
  | { ok: true; result: number }
  | { ok: false; status: number; error: string; message?: string };

export const NETWORK_ERROR = 'Network Error';
const UNKNOWN_ERROR = 'Unknown Error';

type ResponseBody = { result?: unknown; error?: unknown; message?: unknown };

/** POST /api/calculate. Never throws: every failure is returned as { ok: false }. */
export async function calculateExpression(expression: string): Promise<ApiCalculateResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expression }),
    });
  } catch {
    return { ok: false, status: 0, error: NETWORK_ERROR };
  }

  const body: ResponseBody = await response.json().catch(() => ({}));

  if (response.ok && typeof body.result === 'number') {
    return { ok: true, result: body.result };
  }

  return {
    ok: false,
    status: response.status,
    error: typeof body.error === 'string' ? body.error : UNKNOWN_ERROR,
    ...(typeof body.message === 'string' && { message: body.message }),
  };
}
