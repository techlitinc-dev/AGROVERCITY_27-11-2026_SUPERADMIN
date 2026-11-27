# Common Feature 05.16 — Tree Plantation

> Source: `superadmin_modules.md` §4.5 row 16 · Module 5 of 7 · Pages: 1
> Shared anatomy & theme: [README](../README.md) §3–4 · Design rules: [README](../README.md) §2

## Purpose

Cross-persona view of **planted-tree records, photos, and survival verification** — the platform's green-impact ledger. Same view the per-persona dropdown opens, pre-filtered.

**Route**: `/common/tree-plantation`

## KPI cards

Trees recorded · survival-verified · verification rate % · planted (30d) · verified (30d) · geotagged %.

## Table columns

Record id · planted date · user (name+persona) · species · location (district) · photos badge · geotag badge · survival status badge · verified by · verified date.

## Filters

**Persona filter (mandatory, 9 in-scope, multi)** · species · district · survival status · date range · photos-only · geotagged-only.

## Detail drawer

Photo timeline (planting → updates), geotag mini-map, survival verification notes, coin reward link (if rewarded, see [05.07](05-07-coins-and-rewards.md)).

## Admin actions

- **Mark survival verified / failed** — field-verification decision + **mandatory remark** via `AuditModal`.
- Read-only otherwise.

## Export

CSV/JSON of the filtered table (audited); exports feed impact reports.

## Acceptance criteria

- [ ] Verify/fail requires a remark and is audited.
- [ ] Mini-map pin matches the geotag; no pin for non-geotagged records.
- [ ] Survival KPIs recompute with filters and match the table rows.

## Traceability

Pages (1) — matches `superadmin_modules.md` §4.5 row 16 and §5 (Common feature views = 16).
