export interface AuthUser {
  id?: string;
  name?: string;
  phone?: string;
  isAdmin?: boolean;
  adminRole?: string;
  status?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface SessionInfo {
  jti: string;
  userAgent?: string;
  ip?: string;
  createdAt?: string;
  lastActiveAt?: string;
  current?: boolean;
  [key: string]: unknown;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
  user: AuthUser;
}

const TOKEN_KEY = 'sa.accessToken';
const REFRESH_KEY = 'sa.refreshToken';

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function persistSession(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export class ApiClientError extends Error {
  status: number;
  code: string;
  fieldErrors: Record<string, string>;
  raw: unknown;

  constructor(status: number, code: string, message: string, fieldErrors: Record<string, string>, raw: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.raw = raw;
  }
}

async function request<T>(method: string, path: string, opts: { json?: unknown; headers?: Record<string, string> } = {}): Promise<T> {
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  const token = getAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let body: string | undefined;
  if (opts.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.json);
  }

  const res = await fetch(path, { method, headers, body });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const envelope = (data ?? {}) as { error?: { code?: string; message?: string; fieldErrors?: Record<string, string> } };
    const err = envelope.error ?? {};
    throw new ApiClientError(
      res.status,
      err.code ?? 'UNKNOWN',
      err.message ?? `Request failed (${res.status})`,
      err.fieldErrors ?? {},
      data,
    );
  }
  return data as T;
}

export const api = {
  login: (phone: string, mpin: string) =>
    request<LoginResponse>('POST', '/api/auth/login', { json: { phone, mpin } }),

  me: () => request<AuthUser>('GET', '/api/auth/me'),

  refresh: (refreshToken: string) =>
    request<LoginResponse>('POST', '/api/auth/refresh', { json: { refreshToken } }),

  logout: (refreshToken: string) =>
    request<{ ok: boolean }>('POST', '/api/auth/logout', { json: { refreshToken } }),

  sessions: () => request<unknown>('GET', '/api/auth/sessions'),

  revokeSession: (jti: string, reason: string) =>
    request<{ ok: boolean }>('DELETE', `/api/auth/sessions/${encodeURIComponent(jti)}`, {
      headers: { 'X-Audit-Reason': reason },
    }),

  changeMpin: (oldMpin: string, newMpin: string, reason?: string) =>
    request<{ ok: boolean }>('POST', '/api/auth/change-mpin', {
      json: { oldMpin, newMpin },
      headers: reason ? { 'X-Audit-Reason': reason } : {},
    }),
};

/** Upstream session list shape varies; normalize to an array. */
export function normalizeSessions(data: unknown): SessionInfo[] {
  if (Array.isArray(data)) return data as SessionInfo[];
  const wrapped = (data ?? {}) as { sessions?: SessionInfo[]; data?: SessionInfo[] };
  return wrapped.sessions ?? wrapped.data ?? [];
}
