import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import ParticleNetworkCanvas from '../components/ParticleNetworkCanvas';
import { ApiClientError } from '../lib/api';
import { useAuth } from '../context/AuthContext';

function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Pull a retry-after hint out of the 429 envelope (best effort). */
function lockoutSecondsFrom(err: ApiClientError): number {
  const raw = (err.raw ?? {}) as { error?: { retryAfterSeconds?: number; retryAfterMinutes?: number; message?: string } };
  if (raw.error?.retryAfterSeconds) return raw.error.retryAfterSeconds;
  if (raw.error?.retryAfterMinutes) return raw.error.retryAfterMinutes * 60;
  const message = raw.error?.message ?? err.message;
  const minutes = /(\d+)\s*minute/i.exec(message);
  if (minutes) return parseInt(minutes[1], 10) * 60;
  const seconds = /(\d+)\s*second/i.exec(message);
  if (seconds) return parseInt(seconds[1], 10);
  return 900; // documented default: 15 minutes
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockSecondsLeft, setLockSecondsLeft] = useState<number | null>(null);

  const locked = lockSecondsLeft !== null && lockSecondsLeft > 0;

  useEffect(() => {
    if (lockSecondsLeft === null) return;
    if (lockSecondsLeft <= 0) {
      setLockSecondsLeft(null);
      return;
    }
    const t = setTimeout(() => setLockSecondsLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [lockSecondsLeft]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (locked || submitting) return;
    setError(null);

    const trimmedEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(trimmedEmail, password);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiClientError && (err.status === 429 || /LOCK/i.test(err.code))) {
        setLockSecondsLeft(lockoutSecondsFrom(err));
      } else if (err instanceof ApiClientError) {
        setError(err.message || 'Invalid email or password.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-950 via-emerald-950/80 to-slate-950 p-4 sm:p-6 lg:p-10">
      <ParticleNetworkCanvas className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-75" />

      {/* ambient glow lights */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/15 blur-[160px]" />
      <div className="pointer-events-none absolute bottom-10 right-10 h-[600px] w-[600px] rounded-full bg-teal-500/15 blur-[140px]" />
      <div className="pointer-events-none absolute right-1/3 top-10 h-[400px] w-[400px] rounded-full bg-amber-500/10 blur-[120px]" />

      {/* glassmorphic container */}
      <div className="relative z-10 flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-emerald-500/30 bg-white/95 text-slate-900 shadow-[0_20px_70px_-10px_rgba(5,150,105,0.3)] backdrop-blur-2xl animate-slide-up lg:flex-row">
        {/* brand panel */}
        <div className="relative flex flex-col overflow-hidden border-b border-emerald-900/50 bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 p-7 text-white sm:p-9 lg:w-5/12 lg:border-b-0 lg:border-r">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl" />

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center space-y-5 py-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <img
                src="/app_logo.png"
                alt="Agrovercity"
                className="w-28 rounded-3xl bg-white p-2 shadow-2xl shadow-emerald-500/30 ring-4 ring-emerald-400/20 transition-transform hover:scale-105 sm:w-32"
              />
              <div>
                <span className="block text-3xl font-black tracking-tight text-white sm:text-4xl">AGROVERCITY</span>
                <span className="mt-1.5 block text-sm font-extrabold uppercase tracking-widest text-emerald-300">
                  Superadmin Console
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-4 py-1.5 text-sm font-bold text-emerald-300 shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span>Platform Operations · Live</span>
            </div>
          </div>
        </div>

        {/* auth console */}
        <div className="flex flex-col justify-between space-y-6 bg-white p-6 sm:p-9 lg:w-7/12">
          <div>
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <h3 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                <span>Sign In to Console</span>
                <span className="hidden rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 sm:inline-block">
                  Data Analyst
                </span>
              </h3>
            </div>

            {locked && (
              <div
                className="mt-4 flex items-center gap-2 rounded-2xl border border-harvest-300 bg-harvest-50 p-3 text-xs font-semibold text-harvest-800 animate-fade-in"
                role="alert"
              >
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-harvest-500" />
                <span>
                  Account locked after too many failed attempts. Try again in{' '}
                  <span className="font-mono font-bold">{formatCountdown(lockSecondsLeft ?? 0)}</span>.
                </span>
              </div>
            )}
            {error && !locked && (
              <div
                className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800 animate-fade-in"
                role="alert"
              >
                <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={(e) => void onSubmit(e)} className="mt-5 space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Operator Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="you@example.com"
                  value={email}
                  disabled={locked || submitting}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field !rounded-2xl !py-3 font-semibold"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Your password"
                    value={password}
                    disabled={locked || submitting}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field !rounded-2xl !py-3 !pr-16 font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 px-3 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                    disabled={locked || submitting}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={locked || submitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 py-3.5 text-sm font-black text-white shadow-md shadow-emerald-700/20 transition-all hover:from-emerald-500 hover:to-teal-600 active:scale-95 disabled:opacity-50"
              >
                <span>{submitting ? 'Signing in…' : 'Sign In'}</span>
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M3 10a.75.75 0 01.75-.75h9.69L10.22 5.03a.75.75 0 111.06-1.06l5 5a.75.75 0 010 1.06l-5 5a.75.75 0 11-1.06-1.06l3.22-3.22H3.75A.75.75 0 013 10z" />
                </svg>
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-400">
            Access is provisioned by platform operations. No self sign-up.
          </p>
        </div>
      </div>
    </div>
  );
}
