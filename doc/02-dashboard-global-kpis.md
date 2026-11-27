# Module 02 — Dashboard (Global KPIs)

> Source: `superadmin_modules.md` §4.2 · Module 2 of 7 · Pages: 1
> Shared anatomy & theme: [README](README.md) §3–4 · Design rules: [README](README.md) §2

## Purpose

The landing page after login: a global KPI wall answering "how is the platform doing today?" at a glance. Read-only; the only actions are drill-downs (click a KPI → filtered module page) and per-widget export.

**Route**: `/`

## KPI wall

Analyst layout — 12-col grid, `KpiCard` tiles with `slide-up` stagger, skeleton shimmer on load, auto-refresh every 60 s.

| # | Widget | Type | Data | Drill-down |
|---|---|---|---|---|
| 1 | Total users | KPI | count, +delta vs yesterday | [03 Users Directory](03-users-and-kyc.md) |
| 2 | Users per persona | bar chart | 9 in-scope personas, alphabetical | filtered directory |
| 3 | Registrations trend | line chart | last 30 days, daily | filtered directory |
| 4 | Pending KYC | KPI (harvest accent) | count + oldest waiting | [03 KYC Queue](03-users-and-kyc.md) |
| 5 | Pending approvals | stacked list | per feature: courses, shops, equipment, listings, ads | matching module page |
| 6 | Today's activity | KPI row | orders · bookings · trips (3 mini-cards) | matching module page, today filter |
| 7 | Coins in circulation | KPI | total balance outstanding | [05-07 Coins & Rewards](05-common-features/05-07-coins-and-rewards.md) |

Each widget header has an **⋮ Export** menu → CSV/JSON of the widget's underlying data (not a screenshot). Exports are audited (`AuditModal` reason, target = widget name).

## Filter bar (page level)

Date range (today / 7d / 30d / custom) applied to trend and activity widgets; persona selector (multi) applied to widgets 2, 5, 6.

## Detail behaviour

No drawer on this page — every widget drills into its owning module with the same filter pre-applied (preserves the 2-click rule: Dashboard → module).

## Admin actions & audit

- Export any widget → mandatory reason → Audit Log (module = dashboard, target = widget id).
- No data mutation anywhere on this page.

## Acceptance criteria

- [ ] All 7 widgets render within 2 s on seed data; skeletons shown while loading.
- [ ] Widget 2 lists exactly the 9 in-scope personas, alphabetical, and never the 5 out-of-scope personas.
- [ ] Clicking any KPI lands on the owning module with identical filters in ≤ 2 clicks.
- [ ] Every export appears in the Audit Log with operator, widget, reason, timestamp.

## Operator notes

Use this page for the daily morning check: pending KYC + pending approvals first, then today's activity. Anything needing action is one click away; nothing is actioned here.

## Traceability

Pages (1): Dashboard — matches `superadmin_modules.md` §4.2 and §5 (Dashboard = 1).
