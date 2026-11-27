import { NavLink } from 'react-router-dom';
import { BUILT_PERSONAS } from '../lib/personas';

/* Hand-rolled stroke icons (zero-dependency), farmer-app style. */

const I = {
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  users: (
    <>
      <circle cx="8.5" cy="8" r="3.25" />
      <path d="M3 18.5c.6-3 2.9-4.5 5.5-4.5s4.9 1.5 5.5 4.5" />
      <circle cx="15.5" cy="9" r="2.5" />
      <path d="M15.5 14.2c2.1.3 3.6 1.6 4 4" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3.5l8.5 4.75L12 13 3.5 8.25 12 3.5z" />
      <path d="M3.5 12.5L12 17.25 20.5 12.5" />
    </>
  ),
  doc: (
    <>
      <path d="M6.5 3.5h6l4 4v13h-10v-17z" />
      <path d="M12.5 3.5v4h4" />
      <path d="M9 12h5M9 15.5h5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 2.75v6c0 4.2-3.6 6.9-7 8.25-3.4-1.35-7-4.05-7-8.25v-6L12 3z" />
      <path d="M9.25 11.75l2 2 3.5-3.75" />
    </>
  ),
  apps: (
    <>
      <rect x="4" y="4" width="5" height="5" rx="1" />
      <rect x="11.5" y="4" width="5" height="5" rx="1" />
      <rect x="4" y="11.5" width="5" height="5" rx="1" />
      <rect x="11.5" y="11.5" width="5" height="5" rx="1" />
    </>
  ),
  user: (
    <>
      <circle cx="10" cy="7" r="3.5" />
      <path d="M3.5 19.5c.7-3.6 3.4-5.5 6.5-5.5s5.8 1.9 6.5 5.5" />
    </>
  ),
};

function Icon({ kind, className = 'h-4 w-4 flex-shrink-0' }: { kind: keyof typeof I; className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {I[kind]}
    </svg>
  );
}

interface SidebarProps {
  open: boolean;
  activePersona: string | null;
  onSelectPersona: (key: string) => void;
  onClose: () => void;
}

const itemBase =
  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all';
const itemActive = 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20';
const itemIdle = 'text-slate-600 hover:bg-slate-50 hover:text-slate-900';
const sectionTitle = 'px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400';

function SidebarBody({ activePersona, onSelectPersona, onClose }: Omit<SidebarProps, 'open'>) {
  return (
    <div className="flex min-h-full flex-col space-y-6 p-4">
      <div className="space-y-1">
        <h4 className={sectionTitle}>Overview</h4>
        <div className="mt-2 space-y-1">
          <NavLink to="/" end onClick={onClose} className={({ isActive }) => `${itemBase} ${isActive ? itemActive : itemIdle}`}>
            <Icon kind="grid" />
            <span className="truncate">Dashboard</span>
          </NavLink>
        </div>
      </div>

      <div className="space-y-1">
        <h4 className={sectionTitle}>Personas</h4>
        <div className="mt-2 space-y-1">
          {BUILT_PERSONAS.map((p) => {
            const active = activePersona === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  onSelectPersona(p.key);
                  onClose();
                }}
                className={`w-full ${itemBase} ${active ? itemActive : itemIdle}`}
              >
                <Icon kind="users" />
                <span className="truncate">{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1">
        <h4 className={sectionTitle}>Modules</h4>
        <div className="mt-2 space-y-1">
          <NavLink to="/users" onClick={onClose} className={({ isActive }) => `${itemBase} ${isActive ? itemActive : itemIdle}`}>
            <Icon kind="shield" />
            <span className="truncate">Users &amp; KYC</span>
          </NavLink>
          <NavLink to="/kyc" onClick={onClose} className={({ isActive }) => `${itemBase} ${isActive ? itemActive : itemIdle}`}>
            <Icon kind="doc" />
            <span className="truncate">KYC Queue</span>
          </NavLink>
        </div>
      </div>

      <div className="mt-auto space-y-1 border-t border-slate-100 pt-4">
        <NavLink to="/profile" onClick={onClose} className={({ isActive }) => `${itemBase} ${isActive ? itemActive : itemIdle}`}>
          <Icon kind="user" />
          <span className="truncate">Admin Profile</span>
        </NavLink>
      </div>
    </div>
  );
}

export default function Sidebar(props: SidebarProps) {
  const { open, onClose } = props;
  if (!open) return null;

  return (
    <>
      {/* mobile overlay */}
      <div className="fixed inset-0 z-30 bg-slate-900/40 animate-fade-in lg:hidden" onClick={onClose} role="presentation" />
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 animate-fade-in flex-col overflow-y-auto border-r border-slate-200/80 bg-white lg:static lg:z-auto lg:min-h-[calc(100vh-3.5rem)]">
        <SidebarBody {...props} />
      </aside>
    </>
  );
}
