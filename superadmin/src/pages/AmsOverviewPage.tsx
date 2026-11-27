import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import KpiStat from '../components/KpiStat';
import { api, ApiClientError, type AmsOverview } from '../lib/api';
import { fmtNum } from '../lib/exporters';

const FEATURE_ITEMS = [
  { to: 'products', label: 'My Products' },
  { to: 'orders', label: 'Orders Received' },
  { to: 'shops', label: 'Shop Profile' },
];

const fmtMoney = (n?: number) => (n == null ? '—' : `₹${fmtNum(Math.round(n))}`);

export default function AmsOverviewPage() {
  const [data, setData] = useState<AmsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api.amsOverview().then(setData).catch((err) =>
      setError(err instanceof ApiClientError ? err.message : 'Could not load persona overview.'),
    );
  }, []);

  const k = data?.kpis;
  const maxMonthly = Math.max(1, ...(k?.monthlyGmv ?? []).map((m) => m.amount));

  return (
    <div className="animate-fade-in space-y-4">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Agri Market Seller</h1>
        <p className="text-sm text-slate-500">
          Persona overview — KPI wall, recent records, and the seven persona-specific feature views.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <KpiStat label="Sellers" value={k?.sellers != null ? fmtNum(k.sellers) : '—'} />
        <KpiStat label="Products" value={data ? fmtNum(data.products.total) : '—'} />
        <KpiStat label="Orders" value={k?.totalOrders != null ? fmtNum(k.totalOrders) : '—'} />
        <KpiStat label="GMV" value={fmtMoney(k?.gmv)} />
        <KpiStat label="Avg order" value={fmtMoney(k?.aov)} />
        <KpiStat label="Return rate" value={k?.returnRate != null ? `${k.returnRate}%` : '—'} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* monthly GMV mini chart */}
        <section className="card p-5">
          <h2 className="mb-3 text-sm font-bold text-slate-900">GMV trend (12 months)</h2>
          {k?.monthlyGmv?.length ? (
            <div className="flex h-32 items-end gap-1">
              {k.monthlyGmv.slice(-12).map((m) => (
                <div key={m.month} className="group flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-emerald-500/80 transition group-hover:bg-emerald-600"
                    style={{ height: `${Math.max(2, (m.amount / maxMonthly) * 100)}%` }}
                    title={`${m.month}: ${fmtMoney(m.amount)}`}
                  />
                  <span className="text-[8px] text-slate-400">{m.month.slice(5)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No GMV data yet.</p>
          )}
        </section>

        {/* feature menu (two partitions, per doc) */}
        <section className="card p-5">
          <h2 className="mb-3 text-sm font-bold text-slate-900">Feature views</h2>
          <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Persona-specific features</p>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {FEATURE_ITEMS.map((f) => (
              <Link
                key={f.to}
                to={`/personas/agri-market-seller/${f.to}`}
                className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-900"
              >
                {f.label}
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* recent records strips */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Newest products</h2>
            <Link to="/personas/agri-market-seller/products" className="text-xs font-bold text-emerald-700 hover:underline">
              View all
            </Link>
          </div>
          {data?.products.error ? (
            <p className="text-xs text-red-600">{data.products.error}</p>
          ) : data?.products.recent.length ? (
            <ul className="space-y-2">
              {data.products.recent.map((p) => (
                <li key={String(p.id)} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs">
                  <span className="font-semibold text-slate-700">{String(p.name ?? p.title ?? '—')}</span>
                  <span className="text-slate-400">{String(p.category ?? '')}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400">No products listed yet.</p>
          )}
        </section>

        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Newest orders</h2>
            <Link to="/personas/agri-market-seller/orders" className="text-xs font-bold text-emerald-700 hover:underline">
              View all
            </Link>
          </div>
          {data?.orders.error ? (
            <p className="text-xs text-red-600">{data.orders.error}</p>
          ) : data?.orders.recent.length ? (
            <ul className="space-y-2">
              {data.orders.recent.map((o) => (
                <li key={String(o.id ?? o.orderId)} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs">
                  <span className="font-semibold text-slate-700">{String(o.id ?? o.orderId ?? '—')}</span>
                  <span className="text-slate-400">{fmtMoney(Number(o.amount ?? o.total ?? 0))}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400">No orders yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
