# Module 04.09 — Persona: Women Hub

> Source: `superadmin_modules.md` §4.4.9 · Module 4 of 7 · Pages: 1 overview + 3 feature views = 4
> Shared anatomy & theme: [README](../README.md) §3–4 · Design rules: [README](../README.md) §2

## Purpose

Data-analyst module for the Women Hub persona: 1 overview page + 3 persona-specific feature views (read + export only).

## Persona Overview

**Route**: `/personas/women-hub`

KPIs: total women-hub users · active enterprises · income recorded (30d) · kitchen gardens active · business ledger entries (30d). Recent records strip + trend.

**Persona dropdown menu** (two partitions):
- **PERSONA-SPECIFIC FEATURES**: Home Enterprise Income · Kitchen Garden Planner · My Business & Management
- **COMMON FEATURES**: 16 hubs pre-filtered to Women Hub.

## Feature views

### Home Enterprise Income
- Route: `/personas/women-hub/home-enterprise-income`
- KPIs: income entries (30d) · total income (30d) · avg per user · top enterprise category.
- Table: date · user (name+mobile) · enterprise · category · amount · note. Filters: category, date range, amount range.

### Kitchen Garden Planner
- Route: `/personas/women-hub/kitchen-garden-planner`
- KPIs: gardens planned · active · harvests logged · top grown item.
- Table: user · garden size · items planted · planted date · stage · harvests logged. Filters: stage, item, date.

### My Business & Management
- Route: `/personas/women-hub/business-management`
- KPIs: ledgers active · customer profit/loss entries (30d) · remaining payments outstanding · cash payments (30d).
- Tables (tabs):
  - **Customer P&L**: customer · income · expense · profit/loss · period. Filters: period, profit sign.
  - **Remaining-payment ledger**: customer · amount due · since · last reminder. Filters: ageing bucket.
  - **Cash-payment ledger**: date · customer · amount · received by. Filters: date, customer.
- Note: ledgers include customer profit/loss, remaining-payment and cash-payment ledgers per `superadmin_modules.md` §4.4.9.

## Admin actions & audit

None — read-only persona. Every export still requires a mandatory reason via `AuditModal` and is written to the [Audit Log](../07-audit-log.md).

## Acceptance criteria

- [ ] Dropdown partitions exactly as above; persona-specific items A–Z.
- [ ] All 3 views use the shared template, pre-filtered to Women Hub; Business & Management has all three ledger tabs.
- [ ] Read + export only — no mutation actions in this persona.
- [ ] Each view exports CSV/JSON (audited).

## Traceability

Pages (4): 1 overview + 3 persona-specific views — matches `superadmin_modules.md` §4.4.9 and §5 (Women Hub = 3 features).
