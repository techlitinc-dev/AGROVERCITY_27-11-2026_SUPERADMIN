# Common Feature 05.07 — Coins & Rewards

> Source: `superadmin_modules.md` §4.5 row 7 · Module 5 of 7 · Pages: 1
> Shared anatomy & theme: [README](../README.md) §3–4 · Design rules: [README](../README.md) §2

## Purpose

Cross-persona view of the **coin economy: balances, credit/debit ledger, adjustments**. This page carries financial-liability data — treat every number as reportable. Same view the per-persona dropdown opens, pre-filtered.

**Route**: `/common/coins-rewards`

## KPI cards

Total coins in circulation · coins earned (30d) · coins spent (30d) · liability estimate (₹ equivalent) · adjustments (30d).

## Table columns

Two tabs:
- **Balances**: user (name+persona) · balance · lifetime earned · lifetime spent · last activity.
- **Ledger**: entry id · timestamp · user · type (credit/debit/adjustment) · amount · balance after · reason · source feature.

## Filters

**Persona filter (mandatory, 9 in-scope, multi)** · entry type · source feature · date range · amount range · search user.

## Detail drawer

User coin summary + last 50 ledger entries; link to [User 360°](../03-users-and-kyc.md).

## Admin actions

- **Manual adjustment** (credit/debit) — support corrections only; amount, direction, and **mandatory reason** via `AuditModal`; double-confirm for debits > 500 coins.
- Everything else read-only.

## Export

CSV/JSON per active tab (audited); ledger export is treated as a sensitive export.

## Acceptance criteria

- [ ] Balance tab always reconciles with the ledger tab (running balance check on sample users).
- [ ] Adjustments are audited with a mandatory reason and appear in the ledger instantly.
- [ ] Liability KPI matches the sum of all balances.

## Traceability

Pages (1) — matches `superadmin_modules.md` §4.5 row 7 and §5 (Common feature views = 16).
