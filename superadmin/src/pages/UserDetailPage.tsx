import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Modal from '../components/Modal';
import ExportMenu, { type ExportPayload } from '../components/ExportMenu';
import { api, ApiClientError } from '../lib/api';
import { fmtNum } from '../lib/exporters';

const PERSONA_LABELS: Record<string, string> = {
  farmer: 'Farmer', farmlandlord: 'Farm Landlord', transporter: 'Transporter',
  broker: 'Agri Vyapari', seller: 'Agri Market Seller', agrimarketseller: 'Agri Market Seller',
  equipmentrental: 'Equipment Owner', equipmentowner: 'Equipment Owner',
  instructor: 'Gurukul Instructor', gurukulinstructor: 'Gurukul Instructor',
  milkseller: 'Milk Vendor', dairymanager: 'Milk Vendor', milkvendor: 'Milk Vendor',
  womenhub: 'Women Hub', transport: 'Transporter',
};
const personaLabel = (raw: string): string =>
  PERSONA_LABELS[raw.toLowerCase()] ?? raw.replace(/([a-z])([A-Z])/g, '$1 $2');

function Section({ title, children, error }: { title: string; children: ReactNode; error?: string | null }) {
  return (
    <section className="card p-5">
      <h2 className="mb-3 text-sm font-bold text-slate-900">{title}</h2>
      {error ? <p className="text-xs text-red-600">{error}</p> : children}
    </section>
  );
}

function ReasonActionModal({
  title,
  cta,
  onConfirm,
  onClose,
  textareaLabel = 'Reason',
  mandatory = true,
}: {
  title: string;
  cta: string;
  onConfirm: (text: string) => Promise<string | null>; // returns error message or null on success
  onClose: () => void;
  textareaLabel?: string;
  mandatory?: boolean;
}) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (mandatory && text.trim().length < 3) {
      setError(`${textareaLabel} is mandatory (min 3 characters) — recorded in the audit log.`);
      return;
    }
    setBusy(true);
    setError(null);
    const failure = await onConfirm(text.trim());
    setBusy(false);
    if (failure) setError(failure);
    else onClose();
  };

  return (
    <Modal title={title} onClose={() => !busy && onClose()}>
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="action-reason" className="mb-1 block text-sm font-medium text-slate-700">
            {textareaLabel} {mandatory && <span className="text-red-600">*</span>}
          </label>
          <textarea
            id="action-reason"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="input-field"
            placeholder="Recorded in the audit log."
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
            {busy ? 'Working…' : cta}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function UserDetailPage() {
  const { userId = '' } = useParams();
  const navigate = useNavigate();
  const [bundle, setBundle] = useState<Awaited<ReturnType<typeof api.userDetail>> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [action, setAction] = useState<'suspend' | 'reactivate' | 'mpin' | null>(null);
  const [tempMpin, setTempMpin] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setBundle(await api.userDetail(userId));
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof ApiClientError ? err.message : 'Could not load this user.');
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const profile = bundle?.profile.data;
  const activity = bundle?.activity.data;
  const blocked = profile?.is_blocked === true || profile?.status === 'SUSPENDED';

  const doStatus = async (reason: string): Promise<string | null> => {
    try {
      await api.userSetStatus(userId, blocked ? 'reactivate' : 'suspend', reason);
      await load();
      return null;
    } catch (err) {
      return err instanceof ApiClientError ? err.message : 'Action failed.';
    }
  };

  const doMpinReset = async (reason: string): Promise<string | null> => {
    try {
      const res = await api.userResetMpin(userId, reason);
      setTempMpin(res.tempMpin ?? 'issued (not returned by upstream — user will set a new MPIN at next login)');
      return null;
    } catch (err) {
      return err instanceof ApiClientError ? err.message : 'MPIN reset failed.';
    }
  };

  const exportBundle = (): ExportPayload => ({
    name: `user_360_${userId}`,
    rows: [
      {
        section: 'profile',
        id: profile?.id,
        name: profile?.full_name,
        phone: profile?.phone,
        email: profile?.email ?? '',
        status: profile?.status,
        kyc: profile?.kyc_status,
        trust: profile?.trust_score,
        personas: (profile?.personas ?? []).map((p) => personaLabel(p.role)).join('|'),
        joined: profile?.created_at,
      },
      ...(activity
        ? ([
            ['lots', activity.lotsCount],
            ['orders', activity.ordersCount],
            ['trips', activity.tripsCount],
            ['reviews', activity.reviewsCount],
            ['products', activity.productsCount],
            ['uploads', activity.uploadsCount],
          ] as const).map(([feature, count]) => ({ section: 'activity', feature, count }))
        : []),
    ],
  });

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/users')} className="btn-ghost !px-3 !py-1.5">
            ← Directory
          </button>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              User 360° <span className="text-sm font-semibold text-slate-400">/ {profile?.full_name ?? userId}</span>
            </h1>
            <p className="text-sm text-slate-500">Complete cross-persona footprint — read-only context for decisions.</p>
          </div>
        </div>
        <ExportMenu getPayload={exportBundle} disabled={!bundle} />
      </div>

      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {loadError}
        </div>
      )}

      {/* profile header + actions */}
      <section className="card p-6">
        {bundle?.profile.error ? (
          <p className="text-xs text-red-600">{bundle.profile.error}</p>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-800">
              {(profile?.full_name ?? 'U').trim().charAt(0).toUpperCase()}
            </div>
            <div className="min-w-44">
              <p className="text-base font-bold text-slate-900">{profile?.full_name ?? '—'}</p>
              <p className="text-sm text-slate-500">{profile?.phone ?? '—'}{profile?.email ? ` · ${profile.email}` : ''}</p>
              <p className="mt-1 flex flex-wrap gap-1">
                {(profile?.personas ?? []).map((p) => (
                  <span key={p.role} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                    {personaLabel(p.role)}
                  </span>
                ))}
              </p>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2 text-xs">
              <span className={`rounded px-2 py-1 font-bold uppercase tracking-wide ${blocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}`}>
                {blocked ? 'suspended' : (profile?.status ?? 'active')}
              </span>
              <span className="rounded bg-slate-100 px-2 py-1 font-bold uppercase tracking-wide text-slate-600">
                KYC {profile?.kyc_status ?? '—'}
              </span>
              {profile?.trust_score != null && (
                <span className="rounded bg-slate-100 px-2 py-1 font-bold uppercase tracking-wide text-slate-600">
                  trust {profile.trust_score}
                </span>
              )}
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <button type="button" onClick={() => setAction(blocked ? 'reactivate' : 'suspend')} className={blocked ? 'btn-primary' : 'btn-danger !px-4 !py-2'}>
                {blocked ? 'Reactivate' : 'Suspend'}
              </button>
              <button type="button" onClick={() => setAction('mpin')} className="btn-ghost">
                Reset MPIN
              </button>
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="KYC documents" error={bundle?.kyc.error}>
          {(() => {
            const docs = (bundle?.kyc.data as { data?: Record<string, unknown>[] } | undefined)?.data ?? [];
            return docs.length ? (
              <ul className="space-y-2">
                {docs.map((d, i) => (
                  <li key={String(d.docId ?? i)} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs">
                    <span className="font-semibold text-slate-700">{String(d.docType ?? 'document')}</span>
                    <span className="rounded bg-harvest-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-harvest-800">
                      {String(d.status ?? 'pending')}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">No KYC documents on file.</p>
            );
          })()}
        </Section>

        <Section title="Activity by feature" error={bundle?.activity.error}>
          {(() => {
            const features = activity
              ? (Object.entries({
                  Lots: activity.lotsCount,
                  Orders: activity.ordersCount,
                  Trips: activity.tripsCount,
                  Reviews: activity.reviewsCount,
                  Products: activity.productsCount,
                  Uploads: activity.uploadsCount,
                }).filter(([, c]) => (c ?? 0) > 0) as [string, number][])
              : [];
            return features.length ? (
              <ul className="space-y-2">
                {features
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([feature, count]) => (
                    <li key={feature} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs">
                      <span className="font-semibold text-slate-700">{feature}</span>
                      <span className="font-bold text-slate-900">{fmtNum(count ?? 0)}</span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">No feature activity recorded yet.</p>
            );
          })()}
        </Section>

        <Section title="Ratings & reviews" error={bundle?.reviews.error}>
          <p className="text-xs text-slate-500">
            {bundle?.reviews.data?.total != null ? `${fmtNum(bundle.reviews.data.total)} review(s) on record.` : 'No reviews on record.'}
          </p>
        </Section>
      </div>

      {action === 'suspend' && (
        <ReasonActionModal title="Suspend user" cta="Suspend" onConfirm={doStatus} onClose={() => setAction(null)} />
      )}
      {action === 'reactivate' && (
        <ReasonActionModal title="Reactivate user" cta="Reactivate" onConfirm={doStatus} onClose={() => setAction(null)} />
      )}
      {action === 'mpin' && (
        <ReasonActionModal title="Reset MPIN" cta="Reset MPIN" onConfirm={doMpinReset} onClose={() => setAction(null)} />
      )}
      {tempMpin && (
        <Modal title="MPIN reset issued" onClose={() => setTempMpin(null)}>
          <p className="mb-4 text-sm text-slate-600">
            Temporary MPIN: <span className="font-mono text-base font-bold text-slate-900">{tempMpin}</span>
          </p>
          <p className="mb-4 text-xs text-slate-400">Shown once. The user will be forced to set a new MPIN at next login.</p>
          <div className="flex justify-end">
            <button type="button" onClick={() => setTempMpin(null)} className="btn-primary !px-4 !py-2">
              Done
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
