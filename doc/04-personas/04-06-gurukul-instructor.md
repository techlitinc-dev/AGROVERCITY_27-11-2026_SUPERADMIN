# Module 04.06 — Persona: Gurukul Instructor

> Source: `superadmin_modules.md` §4.4.6 · Module 4 of 7 · Pages: 1 overview + 3 feature views = 4
> Shared anatomy & theme: [README](../README.md) §3–4 · Design rules: [README](../README.md) §2

## Purpose

Data-analyst module for the Gurukul Instructor persona: 1 overview page + 3 persona-specific feature views (read + export; approve/suspend courses).

## Persona Overview

**Route**: `/personas/gurukul-instructor`

KPIs: total instructors · active courses · total enrollments · completions (30d) · questions answered %. Recent records strip + trend.

**Persona dropdown menu** (two partitions):
- **PERSONA-SPECIFIC FEATURES**: Academic Studio · Batches & Questions · Course Builder
- **COMMON FEATURES**: 16 hubs pre-filtered to Gurukul Instructor.

## Feature views

### Academic Studio
- Route: `/personas/gurukul-instructor/academic-studio`
- KPIs: studio items published · drafts · engagement (views, 30d) · avg rating.
- Table: item · type (video/article/quiz) · instructor · published date · views · rating. Filters: type, date, instructor, search.

### Batches & Questions
- Route: `/personas/gurukul-instructor/batches-questions`
- KPIs: active batches · total students · open questions · avg response time.
- Table (batches tab): batch · course · instructor · students · start date · status badge. Filters: course, status, date.
- Table (questions tab): question · batch · student · asked date · answered badge · response time. Filters: answered flag, batch, date.

### Course Builder
- Route: `/personas/gurukul-instructor/course-builder`
- KPIs: courses total · published · pending approval · draft.
- Table: course · instructor · lessons count · enrollments · completion % · status badge. Filters: status, instructor, search.
- Drawer: curriculum outline, pricing, certificate config.
- Actions: **approve course**, **suspend course** (`AuditModal` reason mandatory).

## Acceptance criteria

- [ ] Dropdown partitions exactly as above; persona-specific items A–Z.
- [ ] All 3 views use the shared template, pre-filtered to Gurukul Instructor.
- [ ] Course approve/suspend is audited with a mandatory reason.
- [ ] Each view exports CSV/JSON (audited).

## Traceability

Pages (4): 1 overview + 3 persona-specific views — matches `superadmin_modules.md` §4.4.6 and §5 (Gurukul Instructor = 3 features).
