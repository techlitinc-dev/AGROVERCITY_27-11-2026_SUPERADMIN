import { useCallback, useEffect, useState } from 'react';
import Modal from '../components/Modal';
import DataTable, { type Column } from '../components/DataTable';
import ExportMenu, { type ExportPayload } from '../components/ExportMenu';
import KpiStat from '../components/KpiStat';
import { api, ApiClientError, type KycDoc } from '../lib/api';
import { fmtNum } from '../lib/exporters';

const pick = (row: Record<string, unknown>, keys: string[]): unknown => {
  for (const k of keys) if (row[k] !== undefined && row[k] !== null && row[k] !== '') return row[k];
  return undefined;
};

const docId = (d: KycDoc) => String(d.docId ?? d.id ?? '');
const submittedAt = (d: KycDoc) => String(pick(d, ['submittedAt', 'submitted_at', 'createdAt', 'created_at']) ?? '');
const reviewer = (d: KycDoc) => String(pick(d, ['reviewer', 'reviewedBy', 'reviewerName']) ?? '—');
const remark = (d: KycDoc) => String(pick(d, ['remark', 'comment', 'reviewNote']) ?? '—');
const images = (d: KycDoc): string[] => {
  const raw = pick(d, ['images', 'imageUrls', 'documents', 'docs']);
  if (Array.isArray(raw)) return raw.filter((u): u is string => typeof u === 'string');
  return [];
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-harvest-100 text-harvest-800',
  verified: 'bg-emerald-100 text-emerald-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-700',
};

const isToday = (iso: string): boolean => {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
};

function fmtDateTime(value: string): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString('en-IN');
}

export default function KycQueuePage() {
  const [status, setStatus] = useState('pending');
  const [rows, setRows] = useState<KycDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<KycDoc | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.kycQueue({ status, page: 1, pageSize: 100 });
      const sorted = [...(res.data ?? [])].sort((a, b) => submittedAt(a).localeCompare(submittedAt(b))); // oldest first
      setRows(sorted);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not load the KYC queue.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  // KPI counts are computed from the fetched rows (per-status fetch).
  const pendingCount = status === 'pending' ? rows.length : undefined;
  const approvedToday = rows.filter((d) => (String(d.status).toLowerCase().includes('verif') || String(d.status).toLowerCase() === 'approved') && isToday(String(pick(d, ['reviewedAt', 'updatedAt']) ?? submittedAt(d)))).length;
  const rejectedToday = rows.filter((d) => String(d.status).toLowerCase() === 'rejected' && isToday(String(pick(d, ['reviewedAt', 'updatedAt']) ?? submittedAt(d)))).length;
  const turnaroundDays = rows
    .map((d) => {
      const sub = new Date(submittedAt(d)).getTime();
      const rev = new Date(String(pick(d, ['reviewedAt', 'updatedAt']) ?? '')).getTime();
      return sub && rev ? (rev - sub) / 86_400_000 : null;
    })
    .filter((v): v is number => v !== null);
  const avgTurnaround = turnaroundDays.length
    ? Math.round((turnaroundDays.reduce((s, v) => s + v, 0) / turnaroundDays.length) * 10) / 10
    : null;

  const exportQueue = (): ExportPayload => ({
    name: 'kyc_queue',
    rows: rows.map((d) => ({
      docId: docId(d),
      docType: d.docType ?? '',
      user: d.user?.name ?? '',
      phone: d.user?.phone ?? '',
      status: d.status ?? '',
      submitted: submittedAt(d),
      reviewer: reviewer(d),
      remark: remark(d),
    })),
  });

  const decide = async (action: 'verify' | 'reject', text: string) => {
    if (!reviewTarget) return 'Nothing selected.';
    try {
      if (action === 'verify') await api.kycVerify(docId(reviewTarget), text || undefined);
      else await api.kycReject(docId(reviewTarget), text);
      setReviewTarget(null);
      setNotice(action === 'verify' ? 'Document approved — recorded in the audit log.' : 'Document rejected — user notified with your remark.');
      await load();
      return null;
    } catch (err) {
      return err instanceof ApiClientError ? err.message : 'Action failed.';
    }
  };

  const columns: Column<KycDoc>[] = [
    { key: 'submitted', label: 'Submitted', render: (d) => <span className="text-slate-600">{fmtDateTime(submittedAt(d))}</span> },
    {
      key: 'user',
      label: 'User',
      render: (d) => (
        <span>
          <span className="block font-semibold text-slate-900">{d.user?.name ?? '—'}</span>
          <span className="text-xs text-slate-400">{d.user?.phone ?? ''}</span>
        </span>
      ),
    },
    { key: 'docType', label: 'Doc type', render: (d) => d.docType ?? '—' },
    {
      key: 'status',
      label: 'Status',
      render: (d) => (
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${STATUS_BADGE[String(d.status).toLowerCase()] ?? 'bg-slate-100 text-slate-500'}`}>
          {d.status ?? '—'}
        </span>
      ),
    },
    { key: 'reviewer', label: 'Reviewer', render: (d) => reviewer(d) },
    { key: 'remark', label: 'Remark', render: (d) => <span className="text-xs text-slate-500">{remark(d)}</span> },
  ];

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">KYC Queue</h1>
          <p className="text-sm text-slate-500">Oldest submission first — fairness. Click a row to review.</p>
        </div>
        <ExportMenu getPayload={exportQueue} disabled={loading} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiStat label="Pending" value={pendingCount ?? '—'} tone={pendingCount ? 'harvest' : 'default'} />
        <KpiStat label="Approved today" value={status === 'pending' ? '—' : approvedToday} sub={status === 'pending' ? 'switch status filter' : undefined} />
        <KpiStat label="Rejected today" value={status === 'pending' ? '—' : rejectedToday} sub={status === 'pending' ? 'switch status filter' : undefined} />
        <KpiStat label="Avg turnaround (days)" value={avgTurnaround ?? '—'} />
      </div>

      <div className="card flex flex-wrap items-center gap-2 p-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</span>
        {(['pending', 'verified', 'rejected'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
              status === s ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {notice && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
          {notice}
        </div>
      )}

      <div className="card p-5">
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(d) => docId(d) || submittedAt(d)}
          loading={loading}
          error={error}
          empty="Queue clear — nothing here."
          onRowClick={(d) => setReviewTarget(d)}
        />
        <p className="mt-3 text-xs text-slate-400">{fmtNum(rows.length)} record(s)</p>
      </div>

      {reviewTarget && (
        <Modal title={`Review ${reviewTarget.docType ?? 'document'}`} onClose={() => setReviewTarget(null)}>
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <p><span className="font-semibold text-slate-700">User:</span> {reviewTarget.user?.name ?? '—'} {reviewTarget.user?.phone ? `(${reviewTarget.user.phone})` : ''}</p>
              <p><span className="font-semibold text-slate-700">Submitted:</span> {fmtDateTime(submittedAt(reviewTarget))}</p>
              <p><span className="font-semibold text-slate-700">Status:</span> {reviewTarget.status ?? '—'}</p>
            </div>

            {images(reviewTarget).length ? (
              <div className="grid grid-cols-2 gap-3">
                {images(reviewTarget).map((src) => (
                  <button key={src} type="button" onClick={() => setZoomImage(src)} className="overflow-hidden rounded-xl border border-slate-200">
                    <img src={src} alt="KYC document" className="h-40 w-full object-cover transition hover:scale-105" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-400">
                No document images provided by the upstream API for this entry.
              </p>
            )}

            <ReviewActions onDecide={decide} />
          </div>
        </Modal>
      )}

      {zoomImage && (
        <Modal title="Document image" onClose={() => setZoomImage(null)}>
          <img src={zoomImage} alt="KYC document zoomed" className="w-full rounded-xl" />
        </Modal>
      )}
    </div>
  );
}

function ReviewActions({ onDecide }: { onDecide: (action: 'verify' | 'reject', text: string) => Promise<string | null> }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doDecide = async (action: 'verify' | 'reject') => {
    if (action === 'reject' && text.trim().length < 3) {
      setError('A remark is mandatory for rejection (min 3 characters) — the user sees it.');
      return;
    }
    setBusy(true);
    setError(null);
    const failure = await onDecide(action, text.trim());
    setBusy(false);
    if (failure) setError(failure);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void doDecide('verify');
      }}
      className="space-y-3"
      noValidate
    >
      <div>
        <label htmlFor="kyc-note" className="mb-1 block text-sm font-medium text-slate-700">
          Comment / remark <span className="text-xs font-normal text-slate-400">(remark mandatory for reject; recorded in the audit log)</span>
        </label>
        <textarea id="kyc-note" rows={3} value={text} onChange={(e) => setText(e.target.value)} className="input-field" />
      </div>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" disabled={busy} onClick={() => void doDecide('reject')} className="btn-danger !px-4 !py-2">
          Reject
        </button>
        <button type="submit" disabled={busy} className="btn-primary !px-4 !py-2">
          {busy ? 'Working…' : 'Approve'}
        </button>
      </div>
    </form>
  );
}
