# Module 04.02 — Persona: Agri Vyapari

> Source: `superadmin_modules.md` §4.4.2 · Module 4 of 7 · Pages: 1 overview + 4 feature views = 5
> Shared anatomy & theme: [README](../README.md) §3–4 · Design rules: [README](../README.md) §2

## Purpose

Data-analyst module for the Agri Vyapari persona: 1 overview page + 4 persona-specific feature views (read + export only).

## Persona Overview

**Route**: `/personas/agri-vyapari`

KPIs: total vyaparis · active this week · requirements posted (30d) · connections made (30d) · produce searches (30d). Recent records strip + registrations mini-trend.

**Persona dropdown menu** (two partitions):
- **PERSONA-SPECIFIC FEATURES**: Find Produce · Mandi Prices · My Connections · Post Requirement
- **COMMON FEATURES**: 16 hubs pre-filtered to Agri Vyapari.

## Feature views

### Find Produce
- Route: `/personas/agri-vyapari/find-produce`
- KPIs: searches (30d) · unique searchers · top searched crop · zero-result searches.
- Table: timestamp · vyapari · crop/commodity · quantity · region · result count. Filters: crop, region, date, zero-result flag.

### Mandi Prices
- Route: `/personas/agri-vyapari/mandi-prices`
- KPIs: crops tracked · mandis covered · price updates (7d) · biggest 7-day mover (↑/↓).
- Table: crop · mandi · modal price (₹/quintal) · min–max · date · trend spark. Filters: crop, mandi, date range.

### My Connections
- Route: `/personas/agri-vyapari/connections`
- KPIs: total connections · new (30d) · by counterpart persona · most connected vyapari.
- Table: vyapari · counterpart (name+persona) · connected date · shared requirements count. Filters: counterpart persona, date, search.

### Post Requirement
- Route: `/personas/agri-vyapari/requirements`
- KPIs: open · matched · fulfilled · expired.
- Table: requirement id · date · vyapari · crop · qty · budget · region · status badge · responses count. Filters: status, crop, region, date.

## Admin actions & audit

None — read-only persona. Every export still requires a mandatory reason via `AuditModal` and is written to the [Audit Log](../07-audit-log.md).

## Acceptance criteria

- [ ] Dropdown partitions exactly as above; persona-specific items A–Z.
- [ ] All 4 views use the shared template, pre-filtered to Agri Vyapari.
- [ ] No admin mutation actions exist in this persona (read + export only) — no state-changing buttons should be present.
- [ ] Each view exports CSV/JSON (audited).

## Traceability

Pages (5): 1 overview + 4 persona-specific views — matches `superadmin_modules.md` §4.4.2 and §5 (Agri Vyapari = 4 features).
