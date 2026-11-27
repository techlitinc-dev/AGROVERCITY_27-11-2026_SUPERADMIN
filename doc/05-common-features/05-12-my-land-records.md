# Common Feature 05.12 — My Land Records (7/12)

> Source: `superadmin_modules.md` §4.5 row 12 · Module 5 of 7 · Pages: 1
> Shared anatomy & theme: [README](../README.md) §3–4 · Design rules: [README](../README.md) §2

## Purpose

Cross-persona view of **uploaded 7/12 (land record) documents and their verification status**. Documents are identity-grade evidence — handle with the KYC module's care. Same view the per-persona dropdown opens, pre-filtered.

**Route**: `/common/my-land-records`

## KPI cards

Documents uploaded · verified · pending verification · rejected · verification turnaround (avg days).

## Table columns

Upload date · user (name+persona) · document no · village/district · land area · status badge · verifier · verified date.

## Filters

**Persona filter (mandatory, 9 in-scope, multi)** · status · district · date range · search user/doc no.

## Detail drawer

Document images (zoomable, side-by-side pages), extracted fields vs uploaded values, verification timeline.

## Admin actions

- **Mark verified / rejected** — verification decision + **mandatory remark** via `AuditModal`; rejection notifies the user.
- Read-only otherwise.

## Export

CSV/JSON of the filtered table (audited, sensitive export).

## Acceptance criteria

- [ ] Verify/reject requires a remark and is audited with the verifier identity.
- [ ] Document images load with masked-watermark overlay in list; clean view only in drawer.
- [ ] Status changes reflect instantly in the user's app record view.

## Traceability

Pages (1) — matches `superadmin_modules.md` §4.5 row 12 and §5 (Common feature views = 16).
