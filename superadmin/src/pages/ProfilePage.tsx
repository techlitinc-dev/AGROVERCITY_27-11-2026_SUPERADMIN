import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { api, ApiClientError, normalizeSessions, type SessionInfo } from '../lib/api';

function fmtDate(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

function isWeakMpin(mpin: string): boolean {
  if (/^(\d)\1{3}$/.test(mpin)) return true; // repeated: 1111
  const ascending = '0123456789';
  const descending = '9876543210';
  return ascending.includes(mpin) || descending.includes(mpin); // sequential: 1234, 3210
}

/* ---------- Change MPIN ---------- */

function ChangeMpinForm() {
  const [oldMpin, setOldMpin] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!/^\d{4}$/.test(oldMpin) || !/^\d{4}$/.test(newMpin)) {
      setError('MPIN must be exactly 4 digits.');
      return;
    }
    if (newMpin === oldMpin) {
      setError('New MPIN must be different from the current MPIN.');
      return;
    }
    if (isWeakMpin(newMpin)) {
      setError('New MPIN is too predictable — avoid repeated or sequential digits.');
      return;
    }
    if (newMpin !== confirmMpin) {
      setError('New MPIN and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await api.changeMpin(oldMpin, newMpin, reason.trim() || undefined);
      setSuccess(true);
      setOldMpin('');
      setNewMpin('');
      setConfirmMpin('');
      setReason('');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not change MPIN. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card p-6">
      <h2 className="mb-1 text-base font-semibold text-slate-900">Change MPIN</h2>
      <p className="mb-4 text-sm text-slate-500">Your current MPIN is required. The change is written to the audit log.</p>

      {success && (
        <div className="mb-4 rounded-lg border border-agri-300 bg-agri-50 px-4 py-3 text-sm text-agri-800" role="status">
          MPIN changed successfully.
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={(e) => void onSubmit(e)} className="grid grid-cols-1 gap-4 sm:grid-cols-3" noValidate>
        <div>
          <label htmlFor="old-mpin" className="mb-1 block text-sm font-medium text-slate-700">
            Current MPIN
          </label>
          <input
            id="old-mpin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={oldMpin}
            onChange={(e) => setOldMpin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="new-mpin" className="mb-1 block text-sm font-medium text-slate-700">
            New MPIN
          </label>
          <input
            id="new-mpin"
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            value={newMpin}
            onChange={(e) => setNewMpin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="confirm-mpin" className="mb-1 block text-sm font-medium text-slate-700">
            Confirm new MPIN
          </label>
          <input
            id="confirm-mpin"
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            value={confirmMpin}
            onChange={(e) => setConfirmMpin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="input-field"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="mpin-reason" className="mb-1 block text-sm font-medium text-slate-700">
            Reason <span className="font-normal text-slate-400">(optional, recorded in audit log)</span>
          </label>
          <input
            id="mpin-reason"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. routine rotation"
            className="input-field"
          />
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Updating…' : 'Update MPIN'}
          </button>
        </div>
      </form>
    </section>
  );
}

/* ---------- Sessions ---------- */

function SessionsSection() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<SessionInfo | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setSessions(normalizeSessions(await api.sessions()));
    } catch (err) {
      setLoadError(err instanceof ApiClientError ? err.message : 'Could not load sessions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openRevoke = (s: SessionInfo) => {
    setRevokeTarget(s);
    setRevokeReason('');
    setRevokeError(null);
  };

  const submitRevoke = async (e: FormEvent) => {
    e.preventDefault();
    if (!revokeTarget) return;
    if (revokeReason.trim().length < 3) {
      setRevokeError('A reason is mandatory (min 3 characters) — it is recorded in the audit log.');
      return;
    }
    setRevoking(true);
    setRevokeError(null);
    try {
      await api.revokeSession(revokeTarget.jti, revokeReason.trim());
      setRevokeTarget(null);
      await load();
    } catch (err) {
      setRevokeError(err instanceof ApiClientError ? err.message : 'Could not revoke the session.');
    } finally {
      setRevoking(false);
    }
  };

  return (
    <section className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Active sessions</h2>
          <p className="text-sm text-slate-500">Devices currently signed in to this operator account.</p>
        </div>
        <button type="button" onClick={() => void load()} className="btn-ghost !py-1.5" disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {loadError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {loadError}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
              <th className="py-2 pr-4 font-medium">Device</th>
              <th className="py-2 pr-4 font-medium">IP</th>
              <th className="py-2 pr-4 font-medium">Created</th>
              <th className="py-2 pr-4 font-medium">Last active</th>
              <th className="py-2 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.jti} className="border-b border-slate-100 last:border-0">
                <td className="py-2.5 pr-4 text-slate-700">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full bg-agri-500 align-middle" />
                  {s.userAgent ?? 'Unknown device'}
                  {s.current && (
                    <span className="ml-2 rounded bg-agri-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-agri-800">
                      current
                    </span>
                  )}
                </td>
                <td className="py-2.5 pr-4 text-slate-600">{s.ip ?? '—'}</td>
                <td className="py-2.5 pr-4 text-slate-600">{fmtDate(s.createdAt)}</td>
                <td className="py-2.5 pr-4 text-slate-600">{fmtDate(s.lastActiveAt)}</td>
                <td className="py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => openRevoke(s)}
                    disabled={s.current}
                    title={s.current ? 'The current session cannot revoke itself' : 'Revoke this session'}
                    className="btn-danger"
                  >
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
            {!loading && sessions.length === 0 && !loadError && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-slate-400">
                  No sessions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {revokeTarget && (
        <Modal title="Revoke session" onClose={() => !revoking && setRevokeTarget(null)}>
          <p className="mb-4 text-sm text-slate-600">
            Revoke <span className="font-medium">{revokeTarget.userAgent ?? 'this device'}</span> ({revokeTarget.ip ?? 'unknown IP'})?
            The device will be signed out immediately.
          </p>
          <form onSubmit={(e) => void submitRevoke(e)} className="space-y-4" noValidate>
            <div>
              <label htmlFor="revoke-reason" className="mb-1 block text-sm font-medium text-slate-700">
                Reason <span className="text-red-600">*</span>
              </label>
              <textarea
                id="revoke-reason"
                rows={3}
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Why is this session being revoked? Recorded in the audit log."
                className="input-field"
              />
            </div>
            {revokeError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {revokeError}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setRevokeTarget(null)} className="btn-ghost" disabled={revoking}>
                Cancel
              </button>
              <button type="submit" className="btn-danger !px-4 !py-2" disabled={revoking}>
                {revoking ? 'Revoking…' : 'Revoke session'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}

/* ---------- Page ---------- */

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Admin Profile</h1>
        <p className="text-sm text-slate-500">Your operator account, MPIN, and active sessions.</p>
      </div>

      <section className="card flex flex-wrap items-center gap-4 p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-agri-100 text-xl font-bold text-agri-800">
          {(user?.name ?? 'A').trim().charAt(0).toUpperCase()}
        </div>
        <div className="min-w-40">
          <p className="text-base font-semibold text-slate-900">{user?.name ?? '—'}</p>
          <p className="text-sm text-slate-500">{user?.phone ?? '—'}</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded bg-agri-100 px-2 py-1 font-semibold uppercase tracking-wide text-agri-800">
            {user?.adminRole ?? 'superadmin'}
          </span>
          <span className="rounded bg-slate-100 px-2 py-1 font-semibold uppercase tracking-wide text-slate-600">
            {user?.status ?? 'active'}
          </span>
        </div>
      </section>

      <ChangeMpinForm />
      <SessionsSection />
    </div>
  );
}
