import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { type Column } from '../components/DataTable';
import ExportMenu, { type ExportPayload } from '../components/ExportMenu';
import KpiStat from '../components/KpiStat';
import { api, ApiClientError, type AdminUser, type UsersStats } from '../lib/api';
import { PERSONAS } from '../lib/personas';
import { fmtNum } from '../lib/exporters';

const PROFILE_LABELS: Record<string, string> = Object.fromEntries(
  PERSONAS.flatMap((p) => [
    [p.key.toLowerCase(), p.label],
    [p.label.toLowerCase(), p.label],
  ]),
);
const profileLabel = (raw: string): string =>
  PROFILE_LABELS[raw.toLowerCase()] ?? raw.replace(/([a-z])([A-Z])/g, '$1 $2');

const personaChips = (u: AdminUser): string[] => {
  const raw = u.linkedProfiles?.length ? u.linkedProfiles : [u.primaryProfile ?? u.activeProfile ?? ''];
  return [...new Set(raw.filter(Boolean).map(profileLabel))].sort((a, b) => a.localeCompare(b));
};

const KYC_BADGE: Record<string, string> = {
  verified: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-harvest-100 text-harvest-800',
  rejected: 'bg-red-100 text-red-700',
};

function fmtDate(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-IN');
}

const PAGE_SIZE = 15;

export default function UsersDirectoryPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<UsersStats | null>(null);

  const [q, setQ] = useState('');
  const [personas, setPersonas] = useState<string[]>([]);
  const [kycStatus, setKycStatus] = useState('');
  const [suspendedOnly, setSuspendedOnly] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState<{ key: string; order: 'asc' | 'desc' }>({ key: 'createdAt', order: 'desc' });
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const params = useCallback(
    () => ({
      q: q || undefined,
      role: personas.length ? personas.join(',') : undefined,
      kyc_status: kycStatus || undefined,
      is_blocked: suspendedOnly ? 'true' : undefined,
      start_date: from || undefined,
      end_date: to || undefined,
      sort_by: sort.key,
      order: sort.order,
      page,
      pageSize: PAGE_SIZE,
    }),
    [q, personas, kycStatus, suspendedOnly, from, to, sort, page],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.usersList(params());
      setRows(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not load users.');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void api.usersStats().then(setStats).catch(() => setStats(null));
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const exportAll = async (): Promise<ExportPayload> => {
    const first = await api.usersList({ ...params(), page: 1, pageSize: 100 });
    const all = [...(first.data ?? [])];
    const pages = Math.min(first.totalPages ?? 1, 5);
    for (let p = 2; p <= pages; p++) {
      const more = await api.usersList({ ...params(), page: p, pageSize: 100 });
      all.push(...(more.data ?? []));
    }
    return {
      name: 'users_directory',
      rows: all.map((u) => ({
        id: u.id,
        name: u.name ?? u.full_name ?? '',
        phone: u.phone ?? '',
        personas: personaChips(u).join('|'),
        kycStatus: u.kycStatus ?? '',
        joined: u.createdAt ?? '',
        suspended: u.is_blocked === true ? 'yes' : 'no',
      })),
    };
  };

  const columns: Column<AdminUser>[] = [
    { key: 'name', label: 'Name', sortable: true, render: (u) => <span className="font-semibold text-slate-900">{u.name ?? u.full_name ?? '—'}</span> },
    { key: 'phone', label: 'Mobile', render: (u) => u.phone ?? '—' },
    {
      key: 'personas',
      label: 'Persona(s)',
      render: (u) => (
        <span className="flex flex-wrap gap-1">
          {personaChips(u).map((p) => (
            <span key={p} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
              {p}
            </span>
          ))}
        </span>
      ),
    },
    {
      key: 'kyc',
      label: 'KYC',
      render: (u) =>
        u.kycStatus ? (
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${KYC_BADGE[u.kycStatus] ?? 'bg-slate-100 text-slate-500'}`}>
            {u.kycStatus}
          </span>
        ) : (
          '—'
        ),
    },
    { key: 'createdAt', label: 'Joined', sortable: true, render: (u) => fmtDate(u.createdAt) },
    {
      key: 'status',
      label: 'Status',
      render: (u) =>
        u.is_blocked ? (
          <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-700">suspended</span>
        ) : (
          <span className="text-xs text-slate-400">active</span>
        ),
    },
  ];

  const onSort = (key: string) =>
    setSort((prev) => (prev.key === key ? { key, order: prev.order === 'asc' ? 'desc' : 'asc' } : { key, order: 'asc' }));

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Users Directory</h1>
          <p className="text-sm text-slate-500">Every registered user — search, filter, sort; row click opens User 360°.</p>
        </div>
        <ExportMenu getPayload={exportAll} disabled={loading} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiStat label="Total users" value={stats?.total_users != null ? fmtNum(stats.total_users) : '—'} />
        <KpiStat label="New (range)" value={stats?.new_users_in_range != null ? fmtNum(stats.new_users_in_range) : '—'} />
        <KpiStat label="KYC verified" value={stats?.kycVerifiedPct != null ? `${stats.kycVerifiedPct}%` : '—'} />
        <KpiStat label="KYC pending" value={stats?.kyc_backlog != null ? fmtNum(stats.kyc_backlog) : '—'} tone={stats?.kyc_backlog ? 'harvest' : 'default'} />
        <KpiStat label="Suspended" value={stats?.blocked_accounts != null ? fmtNum(stats.blocked_accounts) : '—'} tone={stats?.blocked_accounts ? 'danger' : 'default'} />
      </div>

      {/* filter bar */}
      <div className="card space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search name or mobile…"
            className="input-field !w-60"
          />
          <select
            value={kycStatus}
            onChange={(e) => {
              setKycStatus(e.target.value);
              setPage(1);
            }}
            className="input-field !w-40"
          >
            <option value="">KYC: all</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={suspendedOnly}
              onChange={(e) => {
                setSuspendedOnly(e.target.checked);
                setPage(1);
              }}
              className="h-4 w-4 accent-emerald-600"
            />
            Suspended only
          </label>
          <span className="flex items-center gap-2 text-xs text-slate-500">
            <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="input-field !w-auto !py-1" />
            →
            <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="input-field !w-auto !py-1" />
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Personas</span>
          {PERSONAS.map((p) => {
            const active = personas.includes(p.key);
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  setPersonas((prev) => (active ? prev.filter((k) => k !== p.key) : [...prev, p.key]));
                  setPage(1);
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card p-5">
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(u) => u.id}
          loading={loading}
          error={error}
          sortKey={sort.key}
          sortOrder={sort.order}
          onSort={onSort}
          onRowClick={(u) => navigate(`/users/${u.id}`)}
        />
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span>{fmtNum(total)} user(s)</span>
          <span className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-ghost !px-3 !py-1 disabled:opacity-40">
              Prev
            </button>
            <span className="font-semibold text-slate-600">{page} / {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="btn-ghost !px-3 !py-1 disabled:opacity-40">
              Next
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
