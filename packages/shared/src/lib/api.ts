/**
 * Shared API client — the single HTTP layer for all six role apps.
 *
 * Talks to the Bab Rizq NestJS backend, which serves every endpoint under the
 * `/api/v1` prefix and wraps responses in a standard envelope
 * (`ApiResponseInterceptor`):
 *
 *   { isSuccess, isError, errors, topError, value }
 *
 * This module:
 *   - unwraps the envelope so callers receive the payload directly,
 *   - attaches the Bearer token from sessionStorage on every request,
 *   - normalises backend errors into typed `ApiError`s,
 *   - exposes small auth helpers (login / me) shared by every app's
 *     auth context.
 *
 * The mock constants in each app's entity `api.ts` remain the page-facing
 * source of truth for now; this client is what replaces them function by
 * function as screens migrate (Phase 4 of REFACTOR_PLAN.md).
 */

// ---------------------------------------------------------------------------
// Session storage
// ---------------------------------------------------------------------------

/** sessionStorage keys — shared with the per-app auth contexts. */
export const TOKEN_KEY = 'babrizq_token';
export const ROLE_KEY = 'babrizq_role';
export const REFRESH_TOKEN_KEY = 'babrizq_refresh_token';

/** Returns the current access token, or null when signed out (or non-browser). */
export function getAccessToken(): string | null {
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(TOKEN_KEY) : null;
  } catch {
    return null;
  }
}

/** Persists a fresh token pair + role after login/refresh. */
export function setSession(
  tokens: { accessToken: string; refreshToken: string },
  role: string,
): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, tokens.accessToken);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    sessionStorage.setItem(ROLE_KEY, role);
  } catch {
    // Non-browser environments (unit tests) simply skip persistence.
  }
}

/** Clears the session on logout. */
export function clearSession(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(ROLE_KEY);
  } catch {
    // Non-browser environments (unit tests) simply skip persistence.
  }
}

// ---------------------------------------------------------------------------
// API base URL
// ---------------------------------------------------------------------------

interface ImportMetaEnv {
  VITE_API_URL?: string;
}
interface ImportMetaWithEnv {
  env?: ImportMetaEnv;
}

/**
 * Base URL of the backend. Defaults to the NestJS global prefix `/api/v1`;
 * override per environment with `VITE_API_URL` (e.g. a deployed API host).
 */
export const API_BASE_URL = ((import.meta as ImportMetaWithEnv).env?.VITE_API_URL ?? '/api/v1').replace(
  /\/+$/,
  '',
);

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/** Thrown for every non-2xx response (envelope error already unwrapped). */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details: string[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ---------------------------------------------------------------------------
// Low-level request helper
// ---------------------------------------------------------------------------

/** Standard backend envelope (`ApiResponseInterceptor`). */
export interface ApiEnvelope<T> {
  isSuccess: boolean;
  isError: boolean;
  errors: string[];
  topError: { code?: string; message?: string } | null;
  value: T;
}

/** Server-side list payload — either a raw array or the `Paginated<T>` shape. */
export type MaybePaginated<T> = T[] | { items: T[] };

/** Normalises a paginated/array payload into a plain array. */
export function unwrapList<T>(data: MaybePaginated<T> | null | undefined): T[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray((data as { items?: T[] }).items)) return (data as { items: T[] }).items;
  return [];
}

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  formData?: FormData;
  params?: Record<string, string | number | boolean | string[] | undefined | null>;
}

/** Builds a query string from params (arrays join as comma-separated lists). */
function buildQuery(params: RequestOptions['params']): string {
  const entries = Object.entries(params ?? {})
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => {
      const v = Array.isArray(value) ? value.join(',') : String(value);
      return `${encodeURIComponent(key)}=${encodeURIComponent(v)}`;
    });
  return entries.length > 0 ? `?${entries.join('&')}` : '';
}

async function request<T>(options: RequestOptions): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };

  // Attach the bearer token when present (guard: non-browser test env).
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData; // multipart — let the browser set the boundary
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${options.path}${buildQuery(options.params)}`, {
    method: options.method,
    headers,
    body,
  });

  // 204 No Content — nothing to unwrap.
  if (response.status === 204) return undefined as T;

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok) {
    const topError = payload?.topError;
    const message =
      topError?.message ??
      (payload?.errors?.length ? payload.errors.join(', ') : `Request failed (${response.status})`);
    throw new ApiError(message, response.status, topError?.code, payload?.errors ?? []);
  }

  // Envelope unwrap (routes marked @SkipApiResponse pass the payload through raw).
  if (payload && typeof payload === 'object' && 'isSuccess' in payload) {
    return payload.value;
  }
  return payload as T;
}

// ---------------------------------------------------------------------------
// Public verb helpers
// ---------------------------------------------------------------------------

export const api = {
  get: <T>(path: string, params?: RequestOptions['params']) =>
    request<T>({ method: 'GET', path, params }),

  post: <T>(path: string, body?: unknown) =>
    request<T>({ method: 'POST', path, body }),

  put: <T>(path: string, body?: unknown) =>
    request<T>({ method: 'PUT', path, body }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>({ method: 'PATCH', path, body }),

  del: <T>(path: string) => request<T>({ method: 'DELETE', path }),

  /** Multipart upload (e.g. proof-of-delivery photos). */
  upload: <T>(path: string, formData: FormData) =>
    request<T>({ method: 'PUT', path, formData }),
};

// ---------------------------------------------------------------------------
// Auth helpers (consumed by every app's auth context)
// ---------------------------------------------------------------------------

/** Response of POST /auth/login and POST /auth/refresh. */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Profile returned by GET /auth/me (the user row minus the password hash). */
export interface AuthProfile {
  id: string;
  email: string;
  nameEn: string;
  nameAr: string;
  phone?: string | null;
  role: string;
  status: 'active' | 'suspended';
  createdAt?: string;
}

/** POST /auth/login — email + password → token pair. */
export async function loginWithPassword(email: string, password: string): Promise<AuthTokens> {
  return api.post<AuthTokens>('/auth/login', { email, password });
}

/** GET /auth/me — the current user's profile (requires a stored bearer token). */
export async function fetchCurrentUser(): Promise<AuthProfile> {
  return api.get<AuthProfile>('/auth/me');
}

/** POST /auth/google/token — exchange a Google id_token for a token pair (SPA flow). */
export async function loginWithGoogleIdToken(idToken: string): Promise<AuthTokens> {
  return api.post<AuthTokens>('/auth/google/token', { idToken });
}
