# Common Feature 05.04 — AI Analysis

> Source: `superadmin_modules.md` §4.5 row 4 · Module 5 of 7 · Pages: 1
> Shared anatomy & theme: [README](../README.md) §3–4 · Design rules: [README](../README.md) §2

## Purpose

Cross-persona view of **AI analysis runs: inputs and results**. Oversight of what users ask the AI and what it answers. Same view the per-persona dropdown opens, pre-filtered.

**Route**: `/common/ai-analysis`

## KPI cards

Runs (30d) · unique users · avg response time · failure rate · top analysis type.

## Table columns

Run id · timestamp · user (name+persona) · analysis type · input summary · language · response time · status badge · feedback thumb (↑/↓ if given).

## Filters

**Persona filter (mandatory, 9 in-scope, multi)** · analysis type · language · status · feedback · date range · search input text.

## Detail drawer

Full input (prompt/form data), full AI output, model/version tag, latency, user feedback.

## Admin actions & audit

None (pure oversight) — no mutating AI runs. Exports require a mandatory reason via `AuditModal` and are written to the [Audit Log](../07-audit-log.md).

## Export

CSV/JSON of the filtered table (audited).

## Acceptance criteria

- [ ] Input/output pair is always shown together in the drawer (full auditability of AI advice).
- [ ] Model/version tag visible on every run for reproducibility.
- [ ] No mutation buttons exist on this page.

## Traceability

Pages (1) — matches `superadmin_modules.md` §4.5 row 4 and §5 (Common feature views = 16).
