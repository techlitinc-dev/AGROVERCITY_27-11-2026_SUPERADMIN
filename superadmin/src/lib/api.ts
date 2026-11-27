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

/* --- Module 02: Dashboard (Global KPIs) — envelope mirrors backend/app/routers/dashboard.py --- */

export interface DashboardWidget {
  error: string | null;
}

export interface PersonaCountItem {
  key: string;
  label: string;
  count: number;
}

export interface TrendDay {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface DashboardKpis {
  generatedAt: string;
  trendWindow: { start: string; end: string; range: string };
  users: DashboardWidget & {
    total: number;
    newToday: number;
    newYesterday: number;
    delta: number;
  };
  personas: DashboardWidget & { items: PersonaCountItem[] };
  trend: DashboardWidget & { days: TrendDay[] };
  kyc: DashboardWidget & { pending: number; oldestWaiting: string | null };
  approvals: DashboardWidget & {
    items: { key: string; label: string; count: number }[];
    total: number;
    personaFiltered: boolean;
  };
  activity: DashboardWidget & {
    orders: number;
    bookings: number;
    trips: number;
    personaFiltered: boolean;
  };
  coins: DashboardWidget & { inCirculation: number };
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
  login: (email: string, password: string) =>
    request<LoginResponse>('POST', '/api/auth/login-email', { json: { email, password } }),

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

  changePassword: (currentPassword: string, newPassword: string, reason?: string) =>
    request<{ ok: boolean }>('POST', '/api/auth/change-password', {
      json: { currentPassword, newPassword },
      headers: reason ? { 'X-Audit-Reason': reason } : {},
    }),

  recoveryEmail: () => request<{ email: string | null }>('GET', '/api/auth/recovery-email'),

  setRecoveryEmail: (email: string, currentPassword: string) =>
    request<{ ok: boolean; email: string }>('PUT', '/api/auth/recovery-email', {
      json: { email, currentPassword },
    }),

  dashboardKpis: (params: { dateRange?: string; personas?: string[]; from?: string; to?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.dateRange) qs.set('date_range', params.dateRange);
    if (params.personas && params.personas.length) qs.set('personas', params.personas.join(','));
    if (params.from) qs.set('from', params.from);
    if (params.to) qs.set('to', params.to);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request<DashboardKpis>('GET', `/api/dashboard/kpis${suffix}`);
  },

  logExport: (widget: string, format: 'csv' | 'json', reason: string) =>
    request<{ ok: boolean }>('POST', '/api/dashboard/export', {
      json: { widget, format, reason },
    }),

  /* --- Module 03: Users & KYC --- */

  usersList: (params: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && qs.set(k, String(v)));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request<{ data: AdminUser[]; total: number; page?: number; totalPages?: number }>('GET', `/api/users${suffix}`);
  },

  usersStats: () => request<UsersStats>('GET', '/api/users/stats'),

  userDetail: (userId: string) =>
    request<{
      userId: string;
      profile: { data?: UserProfile; error: string | null };
      activity: { data?: UserActivitySummary; error: string | null };
      kyc: { data?: unknown; error: string | null };
      reviews: { data?: { data?: unknown[]; total?: number }; error: string | null };
    }>('GET', `/api/users/${encodeURIComponent(userId)}`),

  userSetStatus: (userId: string, action: 'suspend' | 'reactivate', reason: string) =>
    request<unknown>('POST', `/api/users/${encodeURIComponent(userId)}/status`, { json: { action, reason } }),

  userResetMpin: (userId: string, reason: string) =>
    request<{ tempMpin?: string }>('POST', `/api/users/${encodeURIComponent(userId)}/reset-mpin`, { json: { reason } }),

  kycQueue: (params: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && qs.set(k, String(v)));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request<{ data: KycDoc[]; total: number }>('GET', `/api/kyc/queue${suffix}`);
  },

  kycVerify: (docId: string, comment?: string) =>
    request<unknown>('POST', `/api/kyc/${encodeURIComponent(docId)}/verify`, { json: { comment } }),

  kycReject: (docId: string, remark: string) =>
    request<unknown>('POST', `/api/kyc/${encodeURIComponent(docId)}/reject`, { json: { remark } }),

  /* --- Module 04.01: Agri Market Seller --- */

  amsOverview: () => request<AmsOverview>('GET', '/api/personas/agri-market-seller/overview'),

  marketProducts: (params: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && qs.set(k, String(v)));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request<{ data: Record<string, unknown>[]; total: number }>('GET', `/api/marketplace/products${suffix}`);
  },

  marketOrders: (params: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && qs.set(k, String(v)));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request<{ data: Record<string, unknown>[]; total: number }>('GET', `/api/marketplace/orders${suffix}`);
  },

  amsShops: (search?: string) =>
    request<{ data: AdminUser[]; total: number }>(
      'GET',
      `/api/personas/agri-market-seller/shops${search ? `?search=${encodeURIComponent(search)}` : ''}`,
    ),
};

/* --- Module 03/04 entity shapes (upstream camelCase/snake_case mixed — normalized at render) --- */

export interface AdminUser {
  id: string;
  name?: string;
  full_name?: string;
  phone?: string;
  primaryProfile?: string;
  activeProfile?: string;
  linkedProfiles?: string[];
  kycStatus?: string;
  createdAt?: string;
  is_blocked?: boolean;
  status?: string;
  agriCoins?: number;
  [key: string]: unknown;
}

export interface UsersStats {
  total_users?: number;
  new_users_in_range?: number;
  blocked_accounts?: number;
  kyc_backlog?: number;
  kycVerifiedPct?: number | null;
  [key: string]: unknown;
}

export interface UserProfile {
  id: string;
  full_name?: string;
  phone?: string;
  email?: string | null;
  status?: string;
  is_blocked?: boolean;
  kyc_status?: string;
  created_at?: string;
  trust_score?: number;
  personas?: { role: string; is_active?: boolean }[];
  [key: string]: unknown;
}

export interface UserActivitySummary {
  userId?: string;
  lotsCount?: number;
  ordersCount?: number;
  tripsCount?: number;
  reviewsCount?: number;
  productsCount?: number;
  uploadsCount?: number;
  [key: string]: unknown;
}

export interface KycDoc {
  docId?: string;
  id?: string;
  docType?: string;
  status?: string;
  submittedAt?: string;
  createdAt?: string;
  reviewer?: string;
  remark?: string;
  user?: { name?: string; phone?: string };
  images?: string[];
  [key: string]: unknown;
}

export interface AmsOverview {
  analytics: { data?: Record<string, unknown>; error: string | null };
  products: { total: number; recent: Record<string, unknown>[]; error: string | null };
  orders: { total: number; recent: Record<string, unknown>[]; error: string | null };
  kpis: {
    sellers?: number;
    gmv?: number;
    totalOrders?: number;
    aov?: number;
    returnRate?: number;
    monthlyGmv?: { month: string; amount: number }[];
    ordersByStatus?: Record<string, number>;
    topProducts?: { name?: string; quantity?: number; revenue?: number }[];
    topSellers?: { name?: string; revenue?: number }[];
  };
}

/** Upstream session list shape varies; normalize to the fields the table needs.
 *  Real API returns {id, userId, device, createdAt, lastUsedAt}; older mocks used
 *  {jti, userAgent, ip, lastActiveAt, current}. We accept both. */
export function normalizeSessions(data: unknown): SessionInfo[] {
  const wrap = (data ?? {}) as { sessions?: unknown[]; data?: unknown[] };
  const raw = Array.isArray(data) ? data : (wrap.sessions ?? wrap.data ?? []);
  const browserUa = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  return raw
    .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
    .map((s) => {
      const device = (s.device ?? s.userAgent ?? '') as string;
      return {
        ...s,
        jti: (s.jti ?? s.id ?? '') as string,
        userAgent: device || undefined,
        ip: (s.ip ?? undefined) as string | undefined,
        createdAt: s.createdAt as string | undefined,
        lastActiveAt: (s.lastActiveAt ?? s.lastUsedAt) as string | undefined,
        current: s.current === undefined ? browserUa !== '' && device === browserUa : (s.current as boolean),
      };
    })
    .filter((s) => s.jti !== '');
}
