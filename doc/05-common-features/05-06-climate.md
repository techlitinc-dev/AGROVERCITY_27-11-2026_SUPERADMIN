# Common Feature 05.06 — Climate

> Source: `superadmin_modules.md` §4.5 row 6 · Module 5 of 7 · Pages: 1
> Shared anatomy & theme: [README](../README.md) §3–4 · Design rules: [README](../README.md) §2

## Purpose

Cross-persona view of **climate/weather data viewed per region** — which users consume which weather data. Same view the per-persona dropdown opens, pre-filtered.

**Route**: `/common/climate`

## KPI cards

Lookups (30d) · regions covered · unique users · alert views · top region.

## Table columns

Timestamp · user (name+persona) · region (state/district) · data type (forecast/advisory/alert) · crop context if any · source.

## Filters

**Persona filter (mandatory, 9 in-scope, multi)** · state · district · data type · date range.

## Detail drawer

The exact weather/advisory payload the user saw (snapshot at view time).

## Admin actions & audit

None. Exports require a mandatory reason via `AuditModal` and are written to the [Audit Log](../07-audit-log.md).

## Export

CSV/JSON of the filtered table (audited).

## Acceptance criteria

- [ ] Drawer replays the viewed payload snapshot, not live data (what the user saw, not what weather is now).
- [ ] Region filters drill state → district consistently.
- [ ] No mutation buttons exist on this page.

## Traceability

Pages (1) — matches `superadmin_modules.md` §4.5 row 6 and §5 (Common feature views = 16).
