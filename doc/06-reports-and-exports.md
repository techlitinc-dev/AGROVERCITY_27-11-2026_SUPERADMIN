# Module 06 — Reports & Exports

> Source: `superadmin_modules.md` §4.6 · Module 6 of 7 · Pages: 1
> Shared anatomy & theme: [README](README.md) §3–4 · Design rules: [README](README.md) §2

## Purpose

The analyst's report builder: pick a data source → constrain → preview → export CSV/JSON. Every export across the whole superadmin funnels through this module's engine, so all exports share one format, one audit behaviour, and one async-job pipeline (large exports must never block the UI).

**Route**: `/reports`

## Builder flow (4 steps, wizard on the shared template)

1. **Pick source** — module → persona (optional) → feature. The picker tree mirrors the navbar exactly (2-partition rule, A–Z), so anything reachable in the UI is reachable here.
2. **Date range + filters** — date presets (today/7d/30d/custom) plus the chosen feature's standard filters (status, region, persona…).
3. **Preview table** — first 50 rows live, full row count shown; column picker to reorder/remove columns.
4. **Export** — CSV or JSON → async job → download link + email-optional; every export audited with a mandatory reason.

## Pre-built reports (cards on the page, one click each)

| # | Report | Source |
|---|---|---|
| 1 | Registrations by persona | [03 Users Directory](03-users-and-kyc.md) |
| 2 | KYC turnaround | [03 KYC Queue](03-users-and-kyc.md) |
| 3 | Orders summary | [05-02 Agri Market](05-common-features/05-02-agri-market.md) |
| 4 | Booking summary | [04-03 Equipment](04-personas/04-03-equipment-owner.md) + [04-05 Book Vehicle](04-personas/04-05-farmer.md) |
| 5 | Coins liability | [05-07 Coins & Rewards](05-common-features/05-07-coins-and-rewards.md) |
| 6 | Referral payouts | [05-10 Invite & Earn](05-common-features/05-10-invite-and-earn.md) |

Pre-built reports keep their date-range picker; all other filters are fixed by the report definition.

## Admin actions & audit

- Every export (builder or pre-built) → `AuditModal` reason → [Audit Log](07-audit-log.md) entry with source, filters, row count, format.
- Async job statuses: queued → running → ready (download) / failed (retry). Jobs list per operator, last 30 days.

## Acceptance criteria

- [ ] Any module page's export produces byte-identical output when rebuilt here with the same filters.
- [ ] Preview count matches exported row count exactly.
- [ ] Export of 100k+ rows runs async with progress and never freezes the page.
- [ ] Every export appears in the Audit Log with reason, operator, and filter snapshot.

## Operator notes

Build ad-hoc reports here; use per-page export buttons only for quick one-offs. If you find yourself rebuilding the same custom report weekly, ask platform ops to promote it to a pre-built report.

## Traceability

Pages (1): Reports & Exports — matches `superadmin_modules.md` §4.6 and §5 (Reports & Exports = 1; the 6 pre-built reports listed in §4.6 are all covered).
