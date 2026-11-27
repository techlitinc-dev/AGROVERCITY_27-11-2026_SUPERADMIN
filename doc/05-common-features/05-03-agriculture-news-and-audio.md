# Common Feature 05.03 — Agriculture News & Audio

> Source: `superadmin_modules.md` §4.5 row 3 · Module 5 of 7 · Pages: 1
> Shared anatomy & theme: [README](../README.md) §3–4 · Design rules: [README](../README.md) §2

## Purpose

Cross-persona view of **published news/audio items and their engagement**. Same view the per-persona dropdown opens, pre-filtered.

**Route**: `/common/agriculture-news-audio`

## KPI cards

Items published (30d) · total views · total listens · likes · shares · avg engagement time.

## Table columns

Item · type (news/audio) · category · language · published date · author/source · views · listens · likes · shares · status badge.

## Filters

**Persona filter (mandatory, 9 in-scope, multi — engagement segmented by persona)** · type · category · language · date range · search title.

## Detail drawer

Full content preview (article body / audio player), engagement funnel, regional split.

## Admin actions

- **Unpublish item** (misinformation/policy, `AuditModal` reason mandatory).
- Read-only otherwise.

## Export

CSV/JSON of the filtered table (audited).

## Acceptance criteria

- [ ] Audio items render an inline player in the drawer.
- [ ] Unpublish is audited with a mandatory reason and the item disappears from the user app immediately.
- [ ] Persona filter segments engagement, never hides other personas' rows silently.

## Traceability

Pages (1) — matches `superadmin_modules.md` §4.5 row 3 and §5 (Common feature views = 16).
