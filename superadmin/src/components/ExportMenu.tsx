import { useState, type FormEvent } from 'react';
import Modal from './Modal';
import { api, ApiClientError } from '../lib/api';
import { download, toCsv } from '../lib/exporters';

/** Per-page export payloads: CSV rows + the JSON envelope, named for the audit log. */
export interface ExportPayload {
  name: string; // audit target, e.g. "users_directory"
  rows: Record<string, unknown>[];
}

function ReasonModal({ target, onClose }: { target: ExportPayload; onClose: () => void }) {
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
      const stamp = new Date().toISOString().slice(0, 10);
      download(`${target.name}-${stamp}.csv`, toCsv(target.rows), 'text/csv');
      await api.logExport(target.name, 'csv', reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Export failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Export ${target.name.replace(/_/g, ' ')} (CSV)`} onClose={() => !busy && onClose()}>
      <p className="mb-4 text-sm text-slate-600">
        Downloads the current data set (not a screenshot). The export is recorded in the audit log.
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
            {busy ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** Widget/page header "⋮" menu → audited CSV export. */
export default function ExportMenu({ getPayload, disabled }: { getPayload: () => ExportPayload | Promise<ExportPayload>; disabled?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [target, setTarget] = useState<ExportPayload | null>(null);
  const [busy, setBusy] = useState(false);

  const openReason = async () => {
    setBusy(true);
    try {
      setTarget(await getPayload());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Export"
        onClick={() => setMenuOpen((v) => !v)}
        disabled={disabled}
        className="rounded-xl border border-slate-200 px-1.5 text-lg leading-none text-slate-400 transition hover:bg-slate-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ⋮
      </button>
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} role="presentation" />
          <div className="absolute right-0 z-20 mt-1 w-32 rounded-xl border border-slate-200 bg-white py-1 shadow-lg animate-fade-in">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                void openReason();
              }}
              disabled={busy}
              className="block w-full px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {busy ? 'Preparing…' : 'Export CSV'}
            </button>
          </div>
        </>
      )}
      {target && <ReasonModal target={target} onClose={() => setTarget(null)} />}
    </div>
  );
}
