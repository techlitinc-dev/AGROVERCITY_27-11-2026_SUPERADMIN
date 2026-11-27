interface KpiStatProps {
  label: string;
  value: string | number;
  sub?: string;
  tone?: 'default' | 'harvest' | 'danger';
}

export default function KpiStat({ label, value, sub, tone = 'default' }: KpiStatProps) {
  const valueClass =
    tone === 'harvest' ? 'text-harvest-700' : tone === 'danger' ? 'text-red-600' : 'text-slate-900';
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1.5 text-2xl font-extrabold tracking-tight ${valueClass}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
