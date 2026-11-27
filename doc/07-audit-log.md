# Module 07 — Audit Log

> Source: `superadmin_modules.md` §4.7 · Module 7 of 7 · Pages: 1
> Shared anatomy & theme: [README](README.md) §3–4 · Design rules: [README](README.md) §2

## Purpose

The platform's memory: **every admin action** — timestamp, operator, module, target record, action, and the **mandatory reason**. Immutable and append-only; it is the trust anchor for the whole superadmin (see rule 5 in [README](README.md) §2). This module is built in **Phase 1** because every other module writes here.

**Route**: `/audit`

## KPI cards

Actions (24h) · actions (30d) · by operator · by module · failed actions · exports (30d).

## Table columns

Timestamp (ISO 8601, IST display) · operator (name+mobile) · module · action · target record (type + id, deep-links to its data view) · reason · IP/session.

## Filters

Operator · module · action type · date range · target type · search reason/target id.

## Detail drawer

Full event payload: request context (IP, user-agent, session id), before/after diff where a state change occurred, correlation id to trace related events.

## Immutability rules (hard requirements)

- **No edit, no delete, no bulk-delete UI exists** — not even for superadmins (verified in DOM snapshot test).
- Storage is append-only (database-enforced: no UPDATE/DELETE grants for the audit table's application role).
- Failed/attempted actions (validation rejections, lockouts) are logged too, marked `attempted`.
- Retention: configurable (default 24 months), retention jobs never delete — only archive to cold storage, and archival itself is audited.

## Export

CSV/JSON of the filtered view (audited — an export-of-exports entry is written).

## Acceptance criteria

- [ ] Every action type listed in modules [01](01-admin-auth-and-profile.md)–[06](06-reports-and-exports.md) appears here with its mandatory reason.
- [ ] Deep-link from a row opens the exact target record in its owning module.
- [ ] DOM snapshot test confirms zero mutation controls on this page.
- [ ] Direct API attempts to modify/delete audit rows are rejected at the database layer.

## Operator notes

When investigating "who did what", start from the target record (any data view → its audit trail filter) rather than this global page; use this page for operator-level or time-range reviews.

## Traceability

Pages (1): Audit Log — matches `superadmin_modules.md` §4.7 and §5 (Audit Log = 1).
