import { copy } from '../copy/en';

/**
 * Fetch-based API client.
 *
 * Auth uses an HTTP-only session cookie: every request sends credentials and
 * no token is ever stored in web storage. All money fields crossing this
 * boundary are integer cents.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export type ApiErrorCode =
  | 'NETWORK_UNAVAILABLE'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_FAILED'
  | 'INSUFFICIENT_STOCK'
  | 'DUPLICATE_ACTIVE_ORDER'
  | 'SERVER_ERROR'
  | 'UNKNOWN';

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode | string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  formData?: FormData;
  idempotencyKey?: string;
  signal?: AbortSignal;
}

function fallbackMessageFor(status: number): string {
  if (status === 401) return copy.errors.unauthorized;
  if (status === 403) return copy.errors.forbidden;
  if (status === 404) return copy.errors.notFound;
  if (status === 400 || status === 422) return copy.errors.validation;
  if (status >= 500) return copy.errors.server;
  return copy.errors.generic;
}

function fallbackCodeFor(status: number): ApiErrorCode {
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 400 || status === 422) return 'VALIDATION_FAILED';
  if (status >= 500) return 'SERVER_ERROR';
  return 'UNKNOWN';
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (!options.formData) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: options.method ?? 'GET',
      credentials: 'include',
      headers,
      body: options.formData
        ? options.formData
        : options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined,
      signal: options.signal,
    });
  } catch {
    throw new ApiError(0, 'NETWORK_UNAVAILABLE', copy.errors.network);
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const body = (payload ?? {}) as { code?: string; message?: string; details?: unknown };
    const code = typeof body.code === 'string' ? body.code : fallbackCodeFor(response.status);
    const message =
      typeof body.message === 'string' && body.message.length > 0
        ? body.message
        : fallbackMessageFor(response.status);
    throw new ApiError(response.status, code, message, body.details);
  }

  return payload as T;
}

/** Build a query string, skipping empty values. */
export function toQueryString(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : '';
}

/** Map any thrown value to an actionable English message for UI display. */
export function describeError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return copy.errors.generic;
}
