import type { ApiCalculateResponse } from '../api/calculatorApi';
import { strings } from '../strings/strings';
import type { CalculationResult } from '../types/calculator';

const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 12 });
const EXPONENTIAL_ABOVE = 1e16;
const EXPONENTIAL_BELOW = 1e-9;

/** Formats a result for display: "1,234.5", or exponential notation for very large/small values. */
export function formatResult(value: number): string {
  const magnitude = Math.abs(value);
  if (magnitude !== 0 && (magnitude >= EXPONENTIAL_ABOVE || magnitude < EXPONENTIAL_BELOW)) {
    return value.toExponential();
  }
  return numberFormatter.format(value);
}

function errorLabelFor(response: Extract<ApiCalculateResponse, { ok: false }>): string {
  if (response.status === 0) return strings.errors.network;
  if (response.status === 400 && response.error === 'Syntax Error') return strings.errors.syntax;
  if (response.status === 400 && response.error === 'Math Error') return strings.errors.math;
  return strings.errors.generic;
}

/** Maps the raw API answer to what the UI needs. */
export function toCalculationResult(response: ApiCalculateResponse): CalculationResult {
  if (response.ok) {
    return { kind: 'success', value: response.result, display: formatResult(response.result) };
  }
  return { kind: 'error', display: errorLabelFor(response) };
}
