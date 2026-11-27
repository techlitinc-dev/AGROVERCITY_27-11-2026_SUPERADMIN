# Common Feature 05.10 — Invite & Earn

> Source: `superadmin_modules.md` §4.5 row 10 · Module 5 of 7 · Pages: 1
> Shared anatomy & theme: [README](../README.md) §3–4 · Design rules: [README](../README.md) §2

## Purpose

Cross-persona view of **referral chains, rewards paid, and fraud flags**. Same view the per-persona dropdown opens, pre-filtered.

**Route**: `/common/invite-earn`

## KPI cards

Referrals (30d) · signups via referral (30d) · rewards paid (coins) · fraud flags open · top referrer.

## Table columns

Two tabs:
- **Referrals**: referrer (name+persona) · invitee (name+mobile) · code · date · reward status badge · fraud flag.
- **Chains**: root referrer · depth · signups in chain · rewards in chain · flag status.

## Filters

**Persona filter (mandatory, 9 in-scope, multi — referrer persona)** · reward status · fraud flag · date range · search user/code.

## Detail drawer

Referrer profile link ([User 360°](../03-users-and-kyc.md)), full chain diagram (depth ≤ 3 visual), reward ledger entries.

## Admin actions

- **Flag fraud / unflag** — `AuditModal` reason mandatory; flagged referrals stop paying rewards.
- **Reverse reward** — fraud settlements; double-confirm + reason (audited).

## Export

CSV/JSON per active tab (audited).

## Acceptance criteria

- [ ] Flagging blocks future rewards for the flagged referral within one cycle.
- [ ] Chain view never shows users outside the flag's chain.
- [ ] Reverse reward is audited with a mandatory reason and reflected in [Coins & Rewards](05-07-coins-and-rewards.md) ledger.

## Traceability

Pages (1) — matches `superadmin_modules.md` §4.5 row 10 and §5 (Common feature views = 16).
