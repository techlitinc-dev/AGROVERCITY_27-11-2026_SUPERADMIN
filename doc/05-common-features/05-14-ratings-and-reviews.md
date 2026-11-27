# Common Feature 05.14 — Ratings & Reviews

> Source: `superadmin_modules.md` §4.5 row 14 · Module 5 of 7 · Pages: 1
> Shared anatomy & theme: [README](../README.md) §3–4 · Design rules: [README](../README.md) §2

## Purpose

Cross-persona view of **all reviews across personas plus moderation flags**. This is the moderation desk for user-generated content. Same view the per-persona dropdown opens, pre-filtered. **Hidden for Transporter** (see [04.08](../04-personas/04-08-transporter.md) exceptions).

**Route**: `/common/ratings-reviews`

## KPI cards

Reviews (30d) · avg rating · 1-star % · flagged open · removed (30d).

## Table columns

Date · reviewer (name+persona) · reviewee (name+persona) · context (order/booking/course) · rating · text excerpt · flag badge · status badge.

## Filters

**Persona filter (mandatory, 9 in-scope minus hidden personas, multi — both reviewer & reviewee)** · rating · flag · status · date range · search text.

## Detail drawer

Full review text, linked transaction context, flag history, reviewer/reviewee profile links.

## Admin actions

- **Remove review / restore review** — moderation with **mandatory reason** via `AuditModal`; reviewer may be notified per policy.
- **Clear flag** — with note (audited).

## Export

CSV/JSON of the filtered table (audited).

## Acceptance criteria

- [ ] Remove/restore/clear-flag are audited with mandatory reasons; restored reviews reappear in the app.
- [ ] Flagged reviews sort-first option available (default: open flags first).
- [ ] Hidden for Transporter — never exposed via its persona menu or filter.

## Traceability

Pages (1) — matches `superadmin_modules.md` §4.5 row 14 and §5 (Common feature views = 16).
