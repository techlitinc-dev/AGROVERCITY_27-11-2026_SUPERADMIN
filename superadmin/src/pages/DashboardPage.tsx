import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { PERSONAS } from '../lib/personas';
import { api, ApiClientError, type DashboardKpis, type PersonaCountItem, type TrendDay } from '../lib/api';

/* ---------- constants (mirror backend/app/routers/dashboard.py) ---------- */

type WidgetKey = 'users' | 'personas' | 'trend' | 'kyc' | 'approvals' | 'activity' | 'coins';
type ExportFormat = 'csv' | 'json';

const WIDGET_LABELS: Record<WidgetKey, string> = {
  users: 'Total users',
  personas: 'Users per persona',
  trend: 'Registrations trend',
  kyc: 'Pending KYC',
  approvals: 'Pending approvals',
  activity: "Today's activity",
  coins: 'Coins in circulation',
};

/** Widgets whose owning module is live — clicking navigates there directly. */
const DRILL_ROUTES: Partial<Record<WidgetKey, string>> = {
  users: '/users',
  personas: '/users',
  trend: '/users',
  kyc: '/kyc',
};

const RANGE_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: 'custom', label: 'Custom' },
] as const;

type RangeKey = (typeof RANGE_OPTIONS)[number]['key'];

const fmt = (n: number): string => n.toLocaleString('en-IN');

/* ---------- export helpers ---------- */

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
}

function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function widgetPayload(widget: WidgetKey, data: DashboardKpis): { rows: Record<string, unknown>[] } {
  const stamp = { generatedAt: data.generatedAt };
  switch (widget) {
    case 'users':
      return { rows: [{ ...data.users, ...stamp }] };
    case 'personas':
      return { rows: data.personas.items.map((i) => ({ ...i, ...stamp })) };
    case 'trend':
      return {
        rows: data.trend.days.map((d) => ({
          ...d,
          window: `${data.trendWindow.start}..${data.trendWindow.end}`,
        })),
      };
    case 'kyc':
      return { rows: [{ ...data.kyc, ...stamp }] };
    case 'approvals':
      return { rows: data.approvals.items.map((i) => ({ ...i, total: data.approvals.total, ...stamp })) };
    case 'activity':
      return { rows: [{ ...data.activity, ...stamp }] };
    case 'coins':
      return { rows: [{ ...data.coins, ...stamp }] };
  }
}

/* ---------- charts (zero-dependency SVG) ---------- */

function BarChart({ items }: { items: PersonaCountItem[] }) {
  const W = 360;
  const H = 190;
  const padT = 18;
  const padB = 56;
  const padX = 6;
  const plotH = H - padT - padB;
  const max = Math.max(1, ...items.map((i) => i.count));
  const slot = (W - padX * 2) / Math.max(items.length, 1);
  const barW = Math.min(slot * 0.6, 26);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Users per persona bar chart">
      {items.map((it, i) => {
        const h = it.count === 0 ? 2 : (it.count / max) * plotH;
        const x = padX + i * slot + (slot - barW) / 2;
        const y = padT + plotH - h;
        const cx = padX + i * slot + slot / 2;
        return (
          <g key={it.key}>
            <rect x={x} y={y} width={barW} height={h} rx="3" className={it.count ? 'fill-emerald-600' : 'fill-slate-200'} />
            <text x={cx} y={y - 5} textAnchor="middle" fontSize="9" className="fill-slate-600">
              {fmt(it.count)}
            </text>
            <text
              x={cx}
              y={H - padB + 14}
              textAnchor="end"
              fontSize="8"
              className="fill-slate-500"
              transform={`rotate(-30 ${cx} ${H - padB + 14})`}
            >
              {it.label}
            </text>
          </g>
        );
      })}
      <line x1={padX} y1={padT + plotH} x2={W - padX} y2={padT + plotH} className="stroke-slate-200" />
    </svg>
  );
}

function LineChart({ days }: { days: TrendDay[] }) {
  const W = 360;
  const H = 170;
  const padT = 18;
  const padB = 24;
  const padX = 10;
  const plotH = H - padT - padB;
  const plotW = W - padX * 2;
  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((s, d) => s + d.count, 0);
  const x = (i: number) => padX + (days.length <= 1 ? plotW / 2 : (i / (days.length - 1)) * plotW);
  const y = (c: number) => padT + plotH - (c / max) * plotH;
  const pts = days.map((d, i) => `${x(i)},${y(d.count)}`).join(' ');
  const last = x(days.length - 1);
  const base = padT + plotH;

  const labelFor = (i: number) => days[i]?.date.slice(5) ?? '';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Registrations trend line chart">
      <polygon points={`${padX},${base} ${pts} ${last},${base}`} className="fill-emerald-100 opacity-70" />
      <polyline
        points={pts}
        fill="none"
        strokeWidth="2"
        className={total ? 'stroke-emerald-600' : 'stroke-slate-300'}
        strokeDasharray={total ? undefined : '4 4'}
      />
      {days.map((d, i) =>
        d.count ? <circle key={d.date} cx={x(i)} cy={y(d.count)} r="2.5" className="fill-emerald-700" /> : null,
      )}
      <text x={W - padX} y={padT - 6} textAnchor="end" fontSize="9" className="fill-slate-400">
        {total ? `peak ${fmt(max)}/day` : 'no registrations in this window'}
      </text>
      <line x1={padX} y1={base} x2={W - padX} y2={base} className="stroke-slate-200" />
      <text x={padX} y={H - 8} fontSize="8" className="fill-slate-400">{labelFor(0)}</text>
      <text x={W / 2} y={H - 8} textAnchor="middle" fontSize="8" className="fill-slate-400">
        {labelFor(Math.floor(days.length / 2))}
      </text>
      <text x={W - padX} y={H - 8} textAnchor="end" fontSize="8" className="fill-slate-400">
        {labelFor(days.length - 1)}
      </text>
    </svg>
  );
}

/* ---------- widget shell ---------- */

interface WidgetShellProps {
  widget: WidgetKey;
  sub?: string;
  loading: boolean;
  error: string | null;
  onExport: (widget: WidgetKey, format: ExportFormat) => void;
  onDrill?: (widget: WidgetKey) => void;
  className?: string;
  children: ReactNode;
}

function WidgetShell({ widget, sub, loading, error, onExport, onDrill, className = '', children }: WidgetShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <section className={`card flex flex-col p-5 transition-shadow hover-lift ${className}`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{WIDGET_LABELS[widget]}</h2>
          {sub && <p className="text-xs text-slate-400">{sub}</p>}
        </div>
        <div className="relative">
          <button
            type="button"
            aria-label={`Export ${WIDGET_LABELS[widget]}`}
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-xl border border-slate-200 px-1.5 text-lg leading-none text-slate-400 transition hover:bg-slate-50 hover:text-emerald-700"
          >
            ⋮
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} role="presentation" />
              <div className="absolute right-0 z-20 mt-1 w-32 rounded-xl border border-slate-200 bg-white py-1 shadow-lg animate-fade-in">
                {(['csv', 'json'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    disabled={loading || !!error}
                    onClick={() => {
                      setMenuOpen(false);
                      onExport(widget, f);
                    }}
                    className="block w-full px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Export {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 space-y-2">
          <div className="h-6 w-2/3 rounded shimmer-bg" />
          <div className="h-4 w-1/3 rounded shimmer-bg" />
          <div className="h-16 w-full rounded shimmer-bg" />
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center">
          <p className="text-xs text-red-600" role="alert">{error}</p>
        </div>
      ) : (
        <div
          className={`flex-1 ${onDrill ? 'cursor-pointer' : ''}`}
          onClick={onDrill ? () => onDrill(widget) : undefined}
          role={onDrill ? 'button' : undefined}
          tabIndex={onDrill ? 0 : undefined}
          onKeyDown={onDrill ? (e) => e.key === 'Enter' && onDrill(widget) : undefined}
        >
          {children}
        </div>
      )}
    </section>
  );
}

/* ---------- modals ---------- */

function ReasonModal({
  widget,
  format,
  payload,
  onClose,
}: {
  widget: WidgetKey;
  format: ExportFormat;
  payload: { rows: Record<string, unknown>[] };
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 3) {
      setError('A reason is mandatory (min 3 characters) — it is recorded in the audit log.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const filename = `dashboard-${widget}-${new Date().toISOString().slice(0, 10)}.${format}`;
      if (format === 'csv') {
        download(filename, toCsv(payload.rows), 'text/csv');
      } else {
        download(filename, JSON.stringify({ widget, format, data: payload.rows }, null, 2), 'application/json');
      }
      await api.logExport(widget, format, reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Export failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Export ${WIDGET_LABELS[widget]} (${format.toUpperCase()})`} onClose={() => !busy && onClose()}>
      <p className="mb-4 text-sm text-slate-600">
        Downloads the widget&apos;s underlying data (not a screenshot). The export is recorded in the audit log.
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="export-reason" className="mb-1 block text-sm font-medium text-slate-700">
            Reason <span className="text-red-600">*</span>
          </label>
          <textarea
            id="export-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this data being exported? Recorded in the audit log."
            className="input-field"
          />
        </div>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost" disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn-primary !px-4 !py-2" disabled={busy}>
            {busy ? 'Exporting…' : `Export ${format.toUpperCase()}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- page ---------- */

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const personaParam = searchParams.get('persona');
  const [range, setRange] = useState<RangeKey>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);

  const [data, setData] = useState<DashboardKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [exportTarget, setExportTarget] = useState<{
    widget: WidgetKey;
    format: ExportFormat;
    payload: { rows: Record<string, unknown>[] };
  } | null>(null);

  const seq = useRef(0);
  const personasKey = selectedPersonas.join(',');

  const load = useCallback(async () => {
    const mySeq = ++seq.current;
    setLoading((prev) => (data === null ? true : prev));
    try {
      const params: { dateRange?: string; personas?: string[]; from?: string; to?: string } = {};
      if (range === 'custom') {
        if (!customFrom || !customTo) {
          setLoading(false);
          return;
        }
        params.from = customFrom;
        params.to = customTo;
      } else {
        params.dateRange = range;
      }
      if (selectedPersonas.length) params.personas = selectedPersonas;
      const res = await api.dashboardKpis(params);
      if (mySeq !== seq.current) return;
      setData(res);
      setLoadError(null);
      setLastUpdated(new Date());
    } catch (err) {
      if (mySeq !== seq.current) return;
      setLoadError(
        err instanceof ApiClientError && err.status === 401
          ? 'Session expired — please sign in again.'
          : err instanceof ApiClientError
            ? err.message
            : 'Could not load dashboard. Please try again.',
      );
    } finally {
      if (mySeq === seq.current) setLoading(false);
    }
  }, [range, customFrom, customTo, personasKey, data]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => void load(), 60_000);
    return () => clearInterval(t);
  }, [load]);

  const togglePersona = (key: string) => {
    if (personaParam) setSearchParams({}, { replace: true });
    setSelectedPersonas((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  // Persona selected from the top bar / sidebar (URL ?persona=) focuses the KPI filter.
  useEffect(() => {
    if (personaParam && PERSONAS.some((p) => p.key === personaParam)) {
      setSelectedPersonas((prev) => (prev.length === 1 && prev[0] === personaParam ? prev : [personaParam]));
    }
  }, [personaParam]);

  const openExport = (widget: WidgetKey, format: ExportFormat) => {
    if (!data) return;
    setExportTarget({ widget, format, payload: widgetPayload(widget, data) });
  };

  const customIncomplete = range === 'custom' && (!customFrom || !customTo);

  const drill = (widget: WidgetKey) => {
    const route = DRILL_ROUTES[widget];
    if (route) navigate(route);
  };

  return (
    <div className="animate-fade-in">
      {/* farmer-app hero banner */}
      <section className="relative mb-4 overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 to-teal-900 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-600/20 blur-2xl" />
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Namaste, {user?.name ?? 'operator'}
            </h1>
            <p className="max-w-xl text-xs text-emerald-100/90 sm:text-sm">
              Global KPIs — how is the platform doing today? Read-only; drill-downs open the owning module.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-emerald-100/80">
            {lastUpdated && <span>Updated {lastUpdated.toLocaleTimeString()} · auto-refresh 60s</span>}
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center rounded-2xl border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
      </section>

      {/* filter bar */}
      <div className="card mb-4 space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Range</span>
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                range === r.key ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {r.label}
            </button>
          ))}
          {range === 'custom' && (
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="input-field !w-auto !py-1" />
              →
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="input-field !w-auto !py-1" />
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Personas</span>
          {PERSONAS.map((p) => {
            const active = selectedPersonas.includes(p.key);
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => togglePersona(p.key)}
                className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                  active ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            );
          })}
          {selectedPersonas.length > 0 && (
            <button type="button" onClick={() => setSelectedPersonas([])} className="text-xs font-bold text-emerald-700 hover:underline">
              Clear
            </button>
          )}
        </div>
        {customIncomplete && <p className="text-xs text-harvest-700">Pick both dates to load the trend.</p>}
      </div>

      {loadError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {loadError}
        </div>
      )}

      {/* KPI wall: 12-col grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
        <WidgetShell widget="users" className="lg:col-span-3" loading={loading} error={data?.users.error ?? null} onExport={openExport} onDrill={drill}
          sub={`${data?.users.newToday ?? 0} joined today`}>
          {data && (
            <>
              <p className="text-3xl font-extrabold tracking-tight text-slate-900">{fmt(data.users.total)}</p>
              <p className="mt-1 text-xs">
                <span className={data.users.delta > 0 ? 'font-semibold text-emerald-600' : data.users.delta < 0 ? 'font-semibold text-red-600' : 'text-slate-400'}>
                  {data.users.delta > 0 ? `+${fmt(data.users.delta)}` : fmt(data.users.delta)}
                </span>{' '}
                <span className="text-slate-400">vs yesterday ({fmt(data.users.newYesterday)} new)</span>
              </p>
            </>
          )}
        </WidgetShell>

        <WidgetShell widget="kyc" className="lg:col-span-3" loading={loading} error={data?.kyc.error ?? null} onExport={openExport} onDrill={drill}
          sub="Verification queue">
          {data && (
            <>
              <p className={`text-3xl font-extrabold tracking-tight ${data.kyc.pending ? 'text-harvest-700' : 'text-slate-900'}`}>{fmt(data.kyc.pending)}</p>
              <p className="mt-1 text-xs text-slate-400">
                {data.kyc.pending
                  ? `Oldest waiting: ${Math.max(1, Math.ceil((Date.now() - new Date(data.kyc.oldestWaiting ?? Date.now()).getTime()) / 86_400_000))} day(s)`
                  : 'Queue clear — nothing waiting'}
              </p>
            </>
          )}
        </WidgetShell>

        <WidgetShell widget="coins" className="lg:col-span-3" loading={loading} error={data?.coins.error ?? null} onExport={openExport}
          sub="Sum of user balances">
          {data && (
            <>
              <p className="text-3xl font-extrabold tracking-tight text-slate-900">{fmt(data.coins.inCirculation)}</p>
              <p className="mt-1 text-xs text-slate-400">AgriCoins outstanding across all users</p>
            </>
          )}
        </WidgetShell>

        <WidgetShell widget="activity" className="lg:col-span-3" loading={loading} error={data?.activity.error ?? null} onExport={openExport}
          sub={data?.activity.personaFiltered === false && selectedPersonas.length ? 'Persona filter not applied (unsupported upstream)' : 'All personas · lifetime totals'}>
          {data && (
            <div className="space-y-2">
              {(
                [
                  ['Orders', data.activity.orders],
                  ['Bookings', data.activity.bookings],
                  ['Trips', data.activity.trips],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5">
                  <span className="text-xs font-medium text-slate-500">{label}</span>
                  <span className="text-sm font-bold text-slate-900">{fmt(value)}</span>
                </div>
              ))}
            </div>
          )}
        </WidgetShell>

        <WidgetShell widget="personas" className="lg:col-span-6" loading={loading} error={data?.personas.error ?? null} onExport={openExport} onDrill={drill}
          sub={selectedPersonas.length ? `${selectedPersonas.length} selected` : '9 in-scope personas · alphabetical'}>
          {data && <BarChart items={data.personas.items} />}
        </WidgetShell>

        <WidgetShell widget="trend" className="lg:col-span-6" loading={loading} error={data?.trend.error ?? null} onExport={openExport} onDrill={drill}
          sub={`Daily registrations · ${data?.trendWindow.start ?? ''} → ${data?.trendWindow.end ?? ''}`}>
          {data && <LineChart days={data.trend.days} />}
        </WidgetShell>

        <WidgetShell widget="approvals" className="lg:col-span-12" loading={loading} error={data?.approvals.error ?? null} onExport={openExport}
          sub={`${data?.approvals.total ?? 0} item(s) waiting review${selectedPersonas.length ? ' · persona filter not applied (unsupported upstream)' : ''}`}>
          {data && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {data.approvals.items.map((it) => {
                const max = Math.max(1, ...data.approvals.items.map((a) => a.count));
                return (
                  <div key={it.key} className="rounded-lg bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">{it.label}</span>
                      <span className={`text-sm font-bold ${it.count ? 'text-harvest-700' : 'text-slate-400'}`}>{fmt(it.count)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded bg-slate-200">
                      <div className="h-1.5 rounded bg-harvest-500" style={{ width: `${(it.count / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </WidgetShell>
      </div>

      {exportTarget && (
        <ReasonModal
          widget={exportTarget.widget}
          format={exportTarget.format}
          payload={exportTarget.payload}
          onClose={() => setExportTarget(null)}
        />
      )}

    </div>
  );
}
