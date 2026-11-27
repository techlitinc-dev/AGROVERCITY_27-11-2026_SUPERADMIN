# Common Feature 05.02 — Agri Market

> Source: `superadmin_modules.md` §4.5 row 2 · Module 5 of 7 · Pages: 1
> Shared anatomy & theme: [README](../README.md) §3–4 · Design rules: [README](../README.md) §2

## Purpose

Cross-persona view of the **marketplace: products & orders across all buyers/sellers**. Same view the per-persona dropdown opens, pre-filtered.

**Route**: `/common/agri-market`

## KPI cards

GMV (30d) · orders (30d) · products live · sellers active · avg order value · return rate.

## Table columns

Two tabs:
- **Products**: product · seller (name+persona) · category · price · stock · status badge · listed date.
- **Orders**: order id · date · buyer (name+persona) · seller · items · amount · payment status · fulfilment status.

## Filters

**Persona filter (mandatory, 9 in-scope, multi)** · category · status · date range · amount range · search product/order.

## Detail drawer

Product: photos, specs, price history. Order: items breakdown, payment trail, status timeline.

## Admin actions

- **Force-cancel order** (fraud/dispute, `AuditModal` reason mandatory).
- Read-only otherwise.

## Export

CSV/JSON per active tab (audited).

## Acceptance criteria

- [ ] Tabs stay in sync with the global filter set; counts in KPI cards match the union of both tabs.
- [ ] Force-cancel is audited with a mandatory reason.
- [ ] Per-persona dropdown entry opens this page on the relevant tab with the persona pre-selected.

## Traceability

Pages (1) — matches `superadmin_modules.md` §4.5 row 2 and §5 (Common feature views = 16).
