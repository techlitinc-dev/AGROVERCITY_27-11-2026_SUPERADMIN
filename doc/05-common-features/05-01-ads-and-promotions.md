# Common Feature 05.01 — Ads & Promotions

> Source: `superadmin_modules.md` §4.5 row 1 · Module 5 of 7 · Pages: 1
> Shared anatomy & theme: [README](../README.md) §3–4 · Design rules: [README](../README.md) §2

## Purpose

Cross-persona view of **ad campaigns created by users**: status and performance. This is the same view the per-persona dropdown opens, pre-filtered to that persona.

**Route**: `/common/ads-promotions`

## KPI cards

Active campaigns · impressions (30d) · clicks (30d) · CTR % · spend collected (30d).

## Table columns

Campaign · advertiser (name+mobile) · persona · type · region · start–end · impressions · clicks · CTR · status badge.

## Filters

**Persona filter (mandatory on this page, all 9 in-scope personas, multi-select)** · status · type · region · date range · search advertiser/campaign.

## Detail drawer

Campaign config (creative preview, targeting, budget), day-wise performance sparklines, payment record.

## Admin actions

- **Pause / resume campaign** — misuse or policy issues only (`AuditModal` reason mandatory).
- Everything else read-only.

## Export

CSV/JSON of the filtered table (audited).

## Acceptance criteria

- [ ] Persona filter defaults to all 9 personas and works multi-select; per-persona dropdown entry opens this page with that persona pre-selected.
- [ ] Pause/resume is audited with a mandatory reason and reflected immediately.
- [ ] Creative preview renders exactly as shown in the user app.

## Traceability

Pages (1) — matches `superadmin_modules.md` §4.5 row 1 and §5 (Common feature views = 16).
