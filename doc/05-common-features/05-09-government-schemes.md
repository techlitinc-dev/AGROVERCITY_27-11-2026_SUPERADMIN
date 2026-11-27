# Common Feature 05.09 — Government Schemes

> Source: `superadmin_modules.md` §4.5 row 9 · Module 5 of 7 · Pages: 1
> Shared anatomy & theme: [README](../README.md) §3–4 · Design rules: [README](../README.md) §2

## Purpose

Cross-persona view of **schemes listed in the app and user applications/assists**. Same view the per-persona dropdown opens, pre-filtered.

**Route**: `/common/government-schemes`

## KPI cards

Schemes listed · applications (30d) · applications by status · assist views (30d) · top scheme.

## Table columns

Two tabs:
- **Schemes**: scheme · category · level (central/state) · states · benefit summary · applications count · status badge.
- **Applications**: application id · date · user (name+persona) · scheme · status badge · last update.

## Filters

**Persona filter (mandatory, 9 in-scope, multi)** · category · level · state · status · date range.

## Detail drawer

Scheme: full eligibility + benefit text, document checklist. Application: user-submitted data, attached documents (view), status timeline.

## Admin actions

- **Update application status** (submitted → under review → approved/rejected) — **status + mandatory remark** via `AuditModal`; user is notified.
- Schemes themselves are content-managed elsewhere; this page is oversight.

## Export

CSV/JSON per active tab (audited).

## Acceptance criteria

- [ ] Status change always requires a remark and is audited.
- [ ] Application drawer shows exactly what the user submitted (immutable snapshot).
- [ ] Filters by level/state produce consistent counts vs KPI cards.

## Traceability

Pages (1) — matches `superadmin_modules.md` §4.5 row 9 and §5 (Common feature views = 16).
