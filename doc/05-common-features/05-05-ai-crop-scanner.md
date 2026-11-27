# Common Feature 05.05 — AI Crop Scanner

> Source: `superadmin_modules.md` §4.5 row 5 · Module 5 of 7 · Pages: 1
> Shared anatomy & theme: [README](../README.md) §3–4 · Design rules: [README](../README.md) §2

## Purpose

Cross-persona view of **crop scans: detected issues and accuracy flags**. Oversight of AI plant-health diagnoses, including quality control on accuracy. Same view the per-persona dropdown opens, pre-filtered.

**Route**: `/common/ai-crop-scanner`

## KPI cards

Scans (30d) · unique users · top detected issue · low-confidence scans % · user-flagged wrong %.

## Table columns

Scan id · timestamp · user (name+persona) · crop · detected issue · confidence % · accuracy flag (none / low-confidence / user-flagged wrong) · status badge.

## Filters

**Persona filter (mandatory, 9 in-scope, multi)** · crop · issue · confidence band · accuracy flag · date range.

## Detail drawer

Uploaded photo(s) (zoomable), detected issue + confidence, AI remedy output, user feedback/flag, geotag if present.

## Admin actions

- **Flag scan as inaccurate** (feeds model QA dataset, `AuditModal` reason mandatory).
- Read-only otherwise.

## Export

CSV/JSON of the filtered table (audited).

## Acceptance criteria

- [ ] Photo + AI output always shown together; zoom works on mobile.
- [ ] Accuracy flags filterable and clearly badged.
- [ ] Flag-as-inaccurate is audited with a mandatory reason.

## Traceability

Pages (1) — matches `superadmin_modules.md` §4.5 row 5 and §5 (Common feature views = 16).
