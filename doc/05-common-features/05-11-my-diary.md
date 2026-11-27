# Common Feature 05.11 — My Diary

> Source: `superadmin_modules.md` §4.5 row 11 · Module 5 of 7 · Pages: 1
> Shared anatomy & theme: [README](../README.md) §3–4 · Design rules: [README](../README.md) §2

## Purpose

**Read-only oversight** of **diary entries per user**. Sensitive personal content — superadmin sees it for support/abuse investigations only. Same view the per-persona dropdown opens, pre-filtered. **Hidden for Transporter** (see [04.08](../04-personas/04-08-transporter.md) exceptions).

**Route**: `/common/my-diary`

## KPI cards

Entries (30d) · active diarists · entries with photos · avg entries/user.

## Table columns

Date · user (name+persona) · title/excerpt · tags · has photos badge · last edited.

## Filters

**Persona filter (mandatory, 9 in-scope minus hidden personas, multi)** · date range · has-photos · search title/text · search user.

## Detail drawer

Full entry text + photos (zoomable), entry history if edited. **Read-only: no edit, no delete, no comment.**

## Admin actions & audit

None. This page is strictly read + export — exports require a mandatory reason via `AuditModal` and are written to the [Audit Log](../07-audit-log.md); any moderation need routes through user suspension in [03 Users & KYC](../03-users-and-kyc.md).

## Export

CSV/JSON of the filtered table (audited, treated as sensitive export).

## Acceptance criteria

- [ ] Zero mutation controls rendered (verified in DOM snapshot test).
- [ ] Accessing this page writes an audit entry noting page view (sensitive-content access pattern).
- [ ] Hidden for Transporter — persona filter and per-persona dropdown never expose it for that persona.

## Traceability

Pages (1) — matches `superadmin_modules.md` §4.5 row 11 and §5 (Common feature views = 16).
