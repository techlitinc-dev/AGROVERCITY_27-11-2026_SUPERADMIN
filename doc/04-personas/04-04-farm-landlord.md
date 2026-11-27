# Module 04.04 — Persona: Farm Landlord

> Source: `superadmin_modules.md` §4.4.4 · Module 4 of 7 · Pages: 1 overview + 3 feature views = 4
> Shared anatomy & theme: [README](../README.md) §3–4 · Design rules: [README](../README.md) §2

## Purpose

Data-analyst module for the Farm Landlord persona: 1 overview page + 3 persona-specific feature views (read + export only).

## Persona Overview

**Route**: `/personas/farm-landlord`

KPIs: total landlords · land requests posted (30d) · requirement requests received (30d) · connections made (30d) · fulfilment rate. Recent records strip + trend.

**Persona dropdown menu** (two partitions):
- **PERSONA-SPECIFIC FEATURES**: My Connections · Post Land Request · Requirement Requests
- **COMMON FEATURES**: 16 hubs pre-filtered to Farm Landlord.

## Feature views

### My Connections
- Route: `/personas/farm-landlord/connections`
- KPIs: total connections · new (30d) · by counterpart persona · most connected landlord.
- Table: landlord · counterpart (name+persona) · connected date · shared deals count. Filters: counterpart persona, date, search.

### Post Land Request
- Route: `/personas/farm-landlord/land-requests`
- KPIs: open · matched · leased · expired.
- Table: request id · date · landlord · land size (acres) · rent · region · tenure months · status badge · responses. Filters: status, region, size range, date.

### Requirement Requests
- Route: `/personas/farm-landlord/requirement-requests`
- KPIs: received (30d) · accepted · declined · pending.
- Table: request id · date · requester (name+persona) · land need (size/region/tenure) · status badge. Filters: status, date, requester persona.

## Admin actions & audit

None — read-only persona. Every export still requires a mandatory reason via `AuditModal` and is written to the [Audit Log](../07-audit-log.md).

## Acceptance criteria

- [ ] Dropdown partitions exactly as above; persona-specific items A–Z.
- [ ] All 3 views use the shared template, pre-filtered to Farm Landlord.
- [ ] Read + export only — no mutation actions in this persona.
- [ ] Each view exports CSV/JSON (audited).

## Traceability

Pages (4): 1 overview + 3 persona-specific views — matches `superadmin_modules.md` §4.4.4 and §5 (Farm Landlord = 3 features).
