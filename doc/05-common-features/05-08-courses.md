# Common Feature 05.08 — Courses

> Source: `superadmin_modules.md` §4.5 row 8 · Module 5 of 7 · Pages: 1
> Shared anatomy & theme: [README](../README.md) §3–4 · Design rules: [README](../README.md) §2

## Purpose

Cross-persona view of **all courses, enrollments, and completion** (Gurukul ecosystem-wide). Same view the per-persona dropdown opens, pre-filtered.

**Route**: `/common/courses`

## KPI cards

Courses live · enrollments (30d) · completions (30d) · completion rate · revenue (30d, if paid).

## Table columns

Two tabs:
- **Courses**: course · instructor (name) · category · lessons · enrolled · completion % · rating · status badge.
- **Enrollments**: enrollment id · date · learner (name+persona) · course · progress % · completed date · certificate issued badge.

## Filters

**Persona filter (mandatory, 9 in-scope, multi — learner persona)** · category · status · date range · search course/learner.

## Detail drawer

Course: curriculum outline, pricing, enrollment trend. Learner: progress timeline, quiz scores, certificate link.

## Admin actions

- **Suspend course** (policy violation, `AuditModal` reason mandatory). Approval of new courses happens in the persona view ([04.06 Course Builder](../04-personas/04-06-gurukul-instructor.md)).
- Read-only otherwise.

## Export

CSV/JSON per active tab (audited).

## Acceptance criteria

- [ ] Completion rate KPI = completed/enrolled over the filtered set, recomputed on filter change.
- [ ] Suspend is audited with a mandatory reason.
- [ ] Certificate links open the verification view (read-only).

## Traceability

Pages (1) — matches `superadmin_modules.md` §4.5 row 8 and §5 (Common feature views = 16).
