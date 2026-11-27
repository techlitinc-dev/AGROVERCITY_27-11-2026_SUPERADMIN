import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-agri-950 via-agri-900 to-agri-800 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl animate-slide-up">
        <div className="mb-8 text-center">
          <p className="text-2xl font-bold text-agri-800">Agrovercity Superadmin</p>
          <p className="mt-1 text-sm text-slate-500">Operator sign-in — email + password</p>
        </div>

        {locked && (
          <div className="mb-4 rounded-lg border border-harvest-300 bg-harvest-50 px-4 py-3 text-sm text-harvest-800" role="alert">
            Account locked after too many failed attempts. Try again in{' '}
            <span className="font-mono font-semibold">{formatCountdown(lockSecondsLeft ?? 0)}</span>.
          </div>
        )}
        {error && !locked && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="you@example.com"
              value={email}
              disabled={locked || submitting}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
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
                className="input-field pr-16"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 text-xs font-semibold text-agri-700 hover:text-agri-800"
                disabled={locked || submitting}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={locked || submitting} className="btn-primary w-full !py-2.5">
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Access is provisioned by platform operations. No self sign-up.
        </p>
      </div>
    </div>
  );
}
