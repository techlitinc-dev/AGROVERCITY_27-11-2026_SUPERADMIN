import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useMatch, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { BUILT_PERSONAS } from '../lib/personas';

const SIDEBAR_KEY = 'sa.sidebar';

const readSidebarPref = (): boolean => {
  try {
    const saved = localStorage.getItem(SIDEBAR_KEY);
    if (saved === 'open' || saved === 'closed') return saved === 'open';
  } catch {
    /* ignore */
  }
  return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
};

function Hamburger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Toggle sidebar"
      className="rounded-xl border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50 hover:text-emerald-700"
    >
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-5 w-5">
        <path d="M4 6h12M4 10h12M4 14h12" />
      </svg>
    </button>
  );
}

function PersonasDropdown({ activePersona, onSelect }: { activePersona: string | null; onSelect: (key: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const activeLabel = BUILT_PERSONAS.find((p) => p.key === activePersona)?.label;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-xs font-bold transition-all ${
          activeLabel
            ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${activeLabel ? 'bg-emerald-500' : 'bg-slate-300'}`} />
        <span className="truncate">{activeLabel ?? 'Personas'}</span>
        <svg viewBox="0 0 20 20" fill="currentColor" className={`h-3 w-3 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 max-h-96 w-60 overflow-y-auto rounded-2xl border border-slate-100 bg-white py-2 shadow-2xl animate-fade-in">
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setOpen(false);
            }}
            className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold transition-colors ${
              !activeLabel ? 'bg-emerald-50 text-emerald-900' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            All personas
            {!activeLabel && (
              <svg viewBox="0 0 20 20" fill="currentColor" className="ml-auto h-3.5 w-3.5 text-emerald-600">
                <path d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" />
              </svg>
            )}
          </button>
          <div className="my-1 border-t border-slate-100" />
          {BUILT_PERSONAS.map((p) => {
            const active = p.key === activePersona;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  onSelect(p.key);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold transition-colors ${
                  active ? 'bg-emerald-50 text-emerald-900' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                {p.label}
                {active && (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="ml-auto h-3.5 w-3.5 text-emerald-600">
                    <path d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const personaMatch = useMatch('/personas/:personaKey');
  const [sidebarOpen, setSidebarOpen] = useState(readSidebarPref);

  const activePersona = personaMatch?.params.personaKey ?? null;

  // Auto-reload when the continuous builder deploys a new bundle: the shell is
  // served no-store, so its asset hash is always the live one — a changed hash
  // means this tab is stale and should refresh itself.
  useEffect(() => {
    const currentSrc = document.querySelector('script[type="module"]')?.getAttribute('src') ?? '';
    const timer = setInterval(() => {
      if (window.location.pathname === '/login') return; // never interrupt sign-in
      const focused = document.activeElement;
      if (focused && ['INPUT', 'TEXTAREA', 'SELECT'].includes(focused.tagName)) return; // don't mid-edit
      void fetch('/', { cache: 'no-store' })
        .then((r) => r.text())
        .then((html) => {
          const match = /src="\/assets\/(index-[^"]+\.js)"/.exec(html);
          if (match && currentSrc && !currentSrc.includes(match[1])) {
            window.location.reload();
          }
        })
        .catch(() => {
          /* offline or transient error — check again next tick */
        });
    }, 45_000);
    return () => clearInterval(timer);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? 'open' : 'closed');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const selectPersona = (key: string | null) => {
    navigate(key ? `/personas/${key}` : '/');
  };

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Hamburger onClick={toggleSidebar} />

          <NavLink to="/" className="flex min-w-0 items-center gap-2.5">
            <img src="/app_logo.png" alt="Agrovercity" className="h-9 w-9 rounded-lg ring-1 ring-emerald-600/20" />
            <span className="truncate text-base font-extrabold tracking-tight text-slate-900">
              Agrovercity <span className="font-bold text-emerald-700">Superadmin</span>
            </span>
          </NavLink>

          <div className="ml-auto flex items-center gap-3">
            <PersonasDropdown activePersona={activePersona} onSelect={selectPersona} />
            <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-900 ring-1 ring-emerald-200/80 md:inline">
              {user?.name ?? user?.phone ?? ''}
            </span>
            <button type="button" onClick={() => void onLogout()} className="btn-ghost !py-1.5">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl items-start">
        <Sidebar
          open={sidebarOpen}
          activePersona={activePersona}
          onSelectPersona={(key) => selectPersona(activePersona === key ? null : key)}
          onClose={() => {
            if (typeof window !== 'undefined' && window.innerWidth < 1024) setSidebarOpen(false);
          }}
        />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
