# Common Feature 05.13 — Profit & Loss

> Source: `superadmin_modules.md` §4.5 row 13 · Module 5 of 7 · Pages: 1
> Shared anatomy & theme: [README](../README.md) §3–4 · Design rules: [README](../README.md) §2

## Purpose

Cross-persona view of **per-user P&L entries and summaries** — what users record as income/expense and the computed profit position. Same view the per-persona dropdown opens, pre-filtered.

**Route**: `/common/profit-loss`

## KPI cards

Entries (30d) · income recorded (30d, ₹) · expense recorded (30d, ₹) · net position ₹ · profitable users %.

## Table columns

Two tabs:
- **Entries**: date · user (name+persona) · type (income/expense) · category · amount · note · linked feature.
- **Summaries**: user (name+persona) · period · income · expense · net · entries count · trend spark.

## Filters

**Persona filter (mandatory, 9 in-scope, multi)** · type · category · period · amount range · search user.

## Detail drawer

User's entries for the selected period (grouped by category), running total, link to [User 360°](../03-users-and-kyc.md).

## Admin actions & audit

None — users own their books; superadmin never edits. Exports require a mandatory reason via `AuditModal` and are written to the [Audit Log](../07-audit-log.md).

## Export

CSV/JSON per active tab (audited).

## Acceptance criteria

- [ ] Summary tab recomputes on every filter change and matches the entries tab totals.
- [ ] No mutation controls exist on this page.
- [ ] ₹ formatting follows Indian numbering (lakh/crore) throughout.

## Traceability

Pages (1) — matches `superadmin_modules.md` §4.5 row 13 and §5 (Common feature views = 16).
