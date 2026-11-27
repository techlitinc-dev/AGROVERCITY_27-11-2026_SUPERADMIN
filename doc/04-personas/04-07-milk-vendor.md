# Module 04.07 — Persona: Milk Vendor (Doodhwala)

> Source: `superadmin_modules.md` §4.4.7 · Module 4 of 7 · Pages: 1 overview + 8 feature views = 9
> Shared anatomy & theme: [README](../README.md) §3–4 · Design rules: [README](../README.md) §2

## Purpose

Data-analyst module for the Milk Vendor (Doodhwala) persona: 1 overview page + 8 persona-specific feature views (read + export only — billing figures are never edited from superadmin).

## Persona Overview

**Route**: `/personas/milk-vendor`

KPIs: total vendors · active clients · daily volume (L, today) · monthly billing (current month) · collection rate % · active delivery routes. Recent records strip + trend.

**Persona dropdown menu** (two partitions):
- **PERSONA-SPECIFIC FEATURES**: Bills & Payments · Clients · Customer Passbook · Delivery Analytics · Milk and Rates · Monthly Billing and Pay · Punch Sheet · Todays Schedule
- **COMMON FEATURES**: 16 hubs pre-filtered to Milk Vendor.

## Feature views

### Bills & Payments
- Route: `/personas/milk-vendor/bills-payments`
- KPIs: bills issued (month) · paid · overdue · collection %.
- Table: bill no · period · customer · amount · paid date · mode · status badge. Filters: status, period, mode, amount range.

### Clients
- Route: `/personas/milk-vendor/clients`
- KPIs: total clients · active · paused · new (30d).
- Table: customer (name+mobile) · vendor · daily qty (L) · rate · start date · status badge. Filters: status, vendor, date, search.

### Customer Passbook
- Route: `/personas/milk-vendor/customer-passbook`
- KPIs: entries (30d) · advance balance total · avg daily entries per client.
- Table: date · customer · vendor · debit · credit · balance · note. Filters: customer, vendor, date range, entry type.

### Delivery Analytics
- Route: `/personas/milk-vendor/delivery-analytics`
- KPIs: deliveries today · on-time % · skipped · avg route time.
- Table: date · vendor · route · stops planned vs done · litres delivered · on-time %. Filters: vendor, date, route.

### Milk and Rates
- Route: `/personas/milk-vendor/milk-rates`
- KPIs: rate cards · avg fat/SNF · rate changes (30d).
- Table: vendor · milk type (buffalo/cow) · fat % · SNF · rate (₹/L) · effective date. Filters: milk type, vendor, date.

### Monthly Billing and Pay
- Route: `/personas/milk-vendor/monthly-billing`
- KPIs: cycles open · generated · settled · disputed.
- Table: cycle (month) · vendor · customers billed · gross · adjustments · net · status badge. Filters: cycle, status, vendor.

### Punch Sheet
- Route: `/personas/milk-vendor/punch-sheet`
- KPIs: punches today · missed · avg qty/punch · corrections.
- Table: date · vendor · customer · morning/evening qty · fat · SNF · correction flag. Filters: date, vendor, customer, corrections-only.

### Todays Schedule
- Route: `/personas/milk-vendor/todays-schedule`
- KPIs: routes today · stops done/pending · litres delivered so far · delayed stops.
- Table: route · vendor · stop order · customer · planned qty · delivered qty · time · status badge. Filters: route, vendor, status.
- Live mode: auto-refresh 60 s during delivery hours.

## Admin actions & audit

None — read-only persona (billing figures are never edited from superadmin). Every export still requires a mandatory reason via `AuditModal` and is written to the [Audit Log](../07-audit-log.md).

## Acceptance criteria

- [ ] Dropdown partitions exactly as above; persona-specific items A–Z (8 items).
- [ ] All 8 views use the shared template, pre-filtered to Milk Vendor.
- [ ] Read + export only — billing numbers are never edited from superadmin.
- [ ] Each view exports CSV/JSON (audited).

## Traceability

Pages (9): 1 overview + 8 persona-specific views — matches `superadmin_modules.md` §4.4.7 and §5 (Milk Vendor = 8 features).
