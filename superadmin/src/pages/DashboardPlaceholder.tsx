import { useAuth } from '../context/AuthContext';

const UPCOMING_WIDGETS = [
  'Total users',
  'Users per persona',
  'Registrations trend',
  'Pending KYC',
  'Pending approvals',
  "Today's activity",
  'Coins in circulation',
];

export default function DashboardPlaceholder() {
  const { user } = useAuth();

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Namaste, {user?.name ?? 'operator'} — global KPIs land here (Module 02, build Phase 1).
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-harvest-300 bg-harvest-50 px-4 py-3 text-sm text-harvest-800">
        Module 02 — Dashboard (Global KPIs) is not implemented yet. The KPI wall below is a layout
        placeholder so the login → dashboard flow is complete end-to-end.
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {UPCOMING_WIDGETS.map((label) => (
          <div key={label} className="card p-5">
            <div className="mb-3 h-3 w-20 animate-pulse rounded bg-slate-200" />
            <div className="mb-2 h-7 w-24 animate-pulse rounded bg-slate-200" />
            <p className="text-xs text-slate-400">{label}</p>
          </div>
        ))}
        <div className="card col-span-1 p-5 sm:col-span-2 lg:col-span-3">
          <div className="mb-3 h-3 w-28 animate-pulse rounded bg-slate-200" />
          <div className="h-28 w-full animate-pulse rounded bg-slate-100" />
          <p className="mt-2 text-xs text-slate-400">Registrations trend (line)</p>
        </div>
      </div>
    </div>
  );
}
