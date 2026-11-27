# Common Feature 05.15 — Saved & Following

> Source: `superadmin_modules.md` §4.5 row 15 · Module 5 of 7 · Pages: 1
> Shared anatomy & theme: [README](../README.md) §3–4 · Design rules: [README](../README.md) §2

## Purpose

**Read-only oversight** of **saved items and follows per user** — interest graph of the platform. Same view the per-persona dropdown opens, pre-filtered.

**Route**: `/common/saved-following`

## KPI cards

Saves (30d) · follows (30d) · unique savers · most saved item type · most followed entity.

## Table columns

Two tabs:
- **Saved**: date · user (name+persona) · item type (product/course/news/scheme…) · item ref · saved to collection.
- **Following**: date · follower (name+persona) · followed entity (shop/seller/instructor…) · entity persona.

## Filters

**Persona filter (mandatory, 9 in-scope, multi)** · item/entity type · date range · search user/item.

## Detail drawer

Item snapshot (what was saved/followed) + user profile link ([User 360°](../03-users-and-kyc.md)). Read-only.

## Admin actions & audit

None — pure read + export; exports require a mandatory reason via `AuditModal` and are written to the [Audit Log](../07-audit-log.md).

## Export

CSV/JSON per active tab (audited).

## Acceptance criteria

- [ ] Zero mutation controls rendered.
- [ ] Item snapshots match the live user-app rendering (title, image, price where applicable).
- [ ] Persona filter covers both follower and followed personas without leakage.

## Traceability

Pages (1) — matches `superadmin_modules.md` §4.5 row 15 and §5 (Common feature views = 16).
