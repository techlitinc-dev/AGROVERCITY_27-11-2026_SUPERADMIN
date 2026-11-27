import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DataTable, { type Column } from '../components/DataTable';
import ExportMenu, { type ExportPayload } from '../components/ExportMenu';
import { api, ApiClientError } from '../lib/api';
import { fmtNum } from '../lib/exporters';

type Row = Record<string, unknown>;

interface FeatureConfig {
  title: string;
  description: string;
  kpis?: (rows: Row[]) => { label: string; value: string | number }[];
  fetcher?: (params: Record<string, string | undefined>) => Promise<{ data: Row[]; total: number }>;
  params?: (filters: Record<string, string>) => Record<string, string | undefined>;
  columns: Column<Row>[];
  filters?: { key: string; label: string; options: { value: string; label: string }[] }[];
  searchable?: boolean;
  exportName: string;
}

const s = (v: unknown): string => (v === null || v === undefined ? '' : String(v));
const first = (row: Row, keys: string[]): string => {
  for (const k of keys) if (row[k] !== undefined && row[k] !== null && row[k] !== '') return s(row[k]);
  return '—';
};
const fmtDate = (v: string) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('en-IN');
};
const money = (v: unknown) => (v === null || v === undefined || v === '' ? '—' : `₹${fmtNum(Math.round(Number(v)))}`);
const badge = (text: string, tone: 'emerald' | 'harvest' | 'red' | 'slate' = 'slate') => {
  const tones = {
    emerald: 'bg-emerald-100 text-emerald-800',
    harvest: 'bg-harvest-100 text-harvest-800',
    red: 'bg-red-100 text-red-700',
    slate: 'bg-slate-100 text-slate-500',
  };
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${tones[tone]}`}>{text || '—'}</span>;
};
const statusBadge = (status: string) =>
  badge(status, status === 'live' || status === 'active' || status === 'delivered' ? 'emerald' : status === 'pending' ? 'harvest' : status === 'rejected' || status === 'suspended' ? 'red' : 'slate');

const CONFIGS: Record<string, FeatureConfig> = {
  products: {
    title: 'My Products',
    description: 'Products listed by Agri Market Sellers across shops.',
    fetcher: (p) => api.marketProducts(p),
    searchable: true,
    filters: [
      { key: 'status', label: 'Status', options: [{ value: 'live', label: 'Live' }, { value: 'out_of_stock', label: 'Out of stock' }, { value: 'delisted', label: 'Delisted' }] },
    ],
    columns: [
      { key: 'name', label: 'Product', render: (r) => <span className="font-semibold text-slate-900">{s(r.name)}</span> },
      { key: 'category', label: 'Category', render: (r) => s(r.category) },
      { key: 'shop', label: 'Shop', render: (r) => first(r, ['shopName', 'shop', 'sellerName']) },
      { key: 'price', label: 'Price', render: (r) => money(r.price) },
      { key: 'stockQty', label: 'Stock', render: (r) => fmtNum(Number(r.stockQty ?? r.stock ?? 0)) },
      { key: 'status', label: 'Status', render: (r) => statusBadge(s(r.status)) },
      { key: 'createdAt', label: 'Listed', render: (r) => fmtDate(first(r, ['createdAt', 'listedAt'])) },
    ],
    exportName: 'ams_products',
  },
  orders: {
    title: 'Orders Received',
    description: 'Marketplace orders placed with Agri Market Seller shops.',
    fetcher: (p) => api.marketOrders(p),
    searchable: true,
    filters: [
      { key: 'status', label: 'Status', options: [{ value: 'placed', label: 'Placed' }, { value: 'shipped', label: 'Shipped' }, { value: 'delivered', label: 'Delivered' }, { value: 'cancelled', label: 'Cancelled' }, { value: 'returned', label: 'Returned' }] },
      { key: 'paymentStatus', label: 'Payment', options: [{ value: 'paid', label: 'Paid' }, { value: 'pending', label: 'Pending' }, { value: 'refunded', label: 'Refunded' }] },
    ],
    columns: [
      { key: 'id', label: 'Order', render: (r) => <span className="font-semibold text-slate-900">{first(r, ['id', 'orderId'])}</span> },
      { key: 'date', label: 'Date', render: (r) => fmtDate(first(r, ['createdAt', 'placedAt', 'date'])) },
      { key: 'buyer', label: 'Buyer', render: (r) => first(r, ['buyerName', 'buyer', 'customerName']) },
      { key: 'shop', label: 'Shop', render: (r) => first(r, ['shopName', 'shop', 'sellerName']) },
      { key: 'items', label: 'Items', render: (r) => fmtNum(Number(r.itemsCount ?? r.items ?? 0)) },
      { key: 'amount', label: 'Amount', render: (r) => money(r.amount ?? r.total) },
      { key: 'paymentStatus', label: 'Payment', render: (r) => statusBadge(s(r.paymentStatus)) },
      { key: 'status', label: 'Fulfilment', render: (r) => statusBadge(s(r.status)) },
    ],
    exportName: 'ams_orders',
  },
  shops: {
    title: 'Shop Profile',
    description: 'Seller accounts with the Agri Market Seller persona (shop entities are not exposed upstream yet).',
    fetcher: (p) => api.amsShops(p.search).then((r) => ({ data: r.data as Row[], total: r.total })),
    searchable: true,
    columns: [
      { key: 'name', label: 'Shop / owner', render: (u: Row) => <span className="font-semibold text-slate-900">{s(u.name ?? u.full_name)}</span> },
      { key: 'phone', label: 'Mobile', render: (u) => s(u.phone) },
      { key: 'location', label: 'Location', render: (u) => [s(u.village), s(u.district), s(u.state)].filter(Boolean).join(', ') || '—' },
      { key: 'kyc', label: 'KYC', render: (u) => statusBadge(s(u.kycStatus)) },
      { key: 'coins', label: 'Coins', render: (u) => fmtNum(Number(u.agriCoins ?? 0)) },
      { key: 'joined', label: 'Joined', render: (u) => fmtDate(s(u.createdAt)) },
    ],
    exportName: 'ams_shops',
  },
};

export default function PersonaFeaturePage() {
  const { feature = '' } = useParams();
  const config = CONFIGS[feature];

  const [filters, setFilters] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!config?.fetcher) return;
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | undefined> = { ...filters };
      if (config.searchable && search) params.search = search;
      const res = await config.fetcher(params);
      setRows(res.data ?? []);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not load data.');
    } finally {
      setLoading(false);
    }
  }, [config, filters, search]);

  useEffect(() => {
    setFilters({});
    setSearch('');
  }, [feature]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!config) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Unknown view</h1>
        <p className="mt-2 text-sm text-slate-500">No feature view named “{feature}” exists for this persona.</p>
      </div>
    );
  }

  const exportRows = (): ExportPayload => ({
    name: config.exportName,
    rows: rows.map((r) =>
      Object.fromEntries(config.columns.map((c) => [c.key, first(r, [c.key])])),
    ),
  });

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            <a href="/personas/agri-market-seller" className="hover:underline">Agri Market Seller</a> / feature view
          </p>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">{config.title}</h1>
          <p className="text-sm text-slate-500">{config.description}</p>
        </div>
        <ExportMenu getPayload={exportRows} disabled={loading} />
      </div>

      <div className="card flex flex-wrap items-center gap-2 p-4">
        {config.searchable && (
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="input-field !w-56"
          />
        )}
        {config.filters?.map((f) => (
          <select
            key={f.key}
            value={filters[f.key] ?? ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, [f.key]: e.target.value }))}
            className="input-field !w-40"
          >
            <option value="">{f.label}: all</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ))}
        <span className="ml-auto text-xs text-slate-400">{fmtNum(rows.length)} row(s) on this page</span>
      </div>

      <div className="card p-5">
        <DataTable columns={config.columns} rows={rows} rowKey={(r) => s(r.id ?? r.orderId ?? r.phone ?? JSON.stringify(r)).slice(0, 40)} loading={loading} error={error} />
      </div>
    </div>
  );
}
