# Module 03 — Users & KYC

> Source: `superadmin_modules.md` §4.3 · Module 3 of 7 · Pages: 3
> Shared anatomy & theme: [README](README.md) §3–4 · Design rules: [README](README.md) §2

## Purpose

The operator's people workspace: find any user, see their complete cross-persona footprint, and clear the KYC queue. The only state-changing actions in this module are **suspend / reactivate**, **MPIN reset**, and **KYC approve / reject** — all audited with a mandatory reason.

## Page 1 — Users Directory

**Route**: `/users`

**KPI cards**: total users · KYC-verified % · suspended count · new today.

**Table columns**: Name · Mobile · Persona(s) (chips, alphabetical) · KYC status badge · Joined date · Suspended badge (if any). Sort on every column; default sort = joined date desc.

**Filters**: search (name/mobile) · persona (9 in-scope, multi) · KYC status · suspended · joined date range.

**Detail drawer**: row click → open [User 360°](#page-2--user-360-detail) for that user.

**Export**: CSV/JSON of the filtered set (audited).

## Page 2 — User 360° Detail

**Route**: `/users/:userId`

Full footprint for one user, as stacked read-only sections (each lazy-loads):

1. **Profile** — name, mobile, personas, joined, language, referral code.
2. **KYC documents** — doc type, number (masked), images, status; link to queue entry.
3. **Activity by feature** — for every feature the user has touched (A–Z): record count + last active; row click jumps to that feature's data view pre-filtered to this user.
4. **Coins** — balance, lifetime earned/spent, last 20 ledger entries (link [05-07](05-common-features/05-07-coins-and-rewards.md)).
5. **Referrals** — invited users, rewards paid (link [05-10](05-common-features/05-10-invite-and-earn.md)).
6. **Ratings & reviews** — given and received (link [05-14](05-common-features/05-14-ratings-and-reviews.md)).

**Admin actions** (each opens `AuditModal`, reason mandatory):
- **Suspend** / **Reactivate** — toggles access; suspended users see a block screen in the app.
- **MPIN reset** — issues a temporary MPIN (shown once to operator, forced change on next login).

**Export**: full 360° report as CSV/JSON bundle (audited).

## Page 3 — KYC Queue

**Route**: `/kyc`

**KPI cards**: pending · approved today · rejected today · avg turnaround (days).

**Table columns**: Submitted · User (name+mobile) · Persona · Doc type · Status badge · Reviewer · Remark. Default sort = submitted asc (oldest first — fairness).

**Filters**: status · persona · doc type · date range.

**Detail drawer**: document images side-by-side with the captured fields; zoom on images.

**Admin actions**:
- **Approve** → status verified; audited, reason auto-note `kyc_approved` + optional comment.
- **Reject** → **remark is mandatory** (field inside `AuditModal`, blocked until filled); user is notified with the remark.

**Export**: queue snapshot CSV/JSON (audited).

## Cross-module rules

- Suspend/reactivate, MPIN reset, and every KYC decision must appear in the [Audit Log](07-audit-log.md) before the UI marks the action complete (optimistic UI allowed only with rollback on failure).
- The directory's persona filter offers only the 9 in-scope personas.

## Acceptance criteria

- [ ] Directory search finds a user by partial mobile within 300 ms on seed data.
- [ ] 360° shows every feature the user has used, A–Z, with correct counts; deep-links carry the user filter.
- [ ] Reject without a remark cannot be submitted; approve/reject reflect in the directory's KYC status immediately.
- [ ] Suspended user cannot log in to the app (verified against backend), and all six action types appear in the Audit Log.

## Operator notes

Work the KYC queue oldest-first. Use User 360° before any suspension — the page exists so decisions are made on full context, not a single row.

## Traceability

Pages (3): Users Directory, User 360° Detail, KYC Queue — matches `superadmin_modules.md` §4.3 and §5 (Users & KYC = 3).
