# Module 04.03 — Persona: Equipment Owner

> Source: `superadmin_modules.md` §4.4.3 · Module 4 of 7 · Pages: 1 overview + 4 feature views = 5
> Shared anatomy & theme: [README](../README.md) §3–4 · Design rules: [README](../README.md) §2

## Purpose

Data-analyst module for the Equipment Owner persona: 1 overview page + 4 persona-specific feature views (read + export; force-cancel bookings and approve/suspend listings).

## Persona Overview

**Route**: `/personas/equipment-owner`

KPIs: total owners · equipment listed · bookings (30d) · booking value (30d) · utilization % · pending booking requests. Recent records strip + trend.

**Persona dropdown menu** (two partitions):
- **PERSONA-SPECIFIC FEATURES**: Booking Request · Equipment Schedule · My Equipment · Progress Status
- **COMMON FEATURES**: 16 hubs pre-filtered to Equipment Owner.

## Feature views

### Booking Request
- Route: `/personas/equipment-owner/booking-requests`
- KPIs: pending · accepted · declined · expired.
- Table: request id · date · farmer (name+mobile) · equipment · period · rent · status badge. Filters: status, date, equipment type.
- Drawer: full request detail + timeline (requested → accepted/declined → completed).
- Actions: **force-cancel booking** (fraud/dispute cases only, `AuditModal` reason mandatory).

### Equipment Schedule
- Route: `/personas/equipment-owner/schedule`
- KPIs: units booked today · utilization % · idle units · upcoming returns.
- Table: equipment · owner · current booking · period · next booking · utilization bar. Filters: date window, owner, status.
- View mode: calendar-style week grid per unit (read-only).

### My Equipment
- Route: `/personas/equipment-owner/equipment`
- KPIs: listed · live · pending approval · suspended.
- Table: equipment · type · owner (name+mobile) · location · rate · status badge. Filters: type, status, location.
- Drawer: photos, specs, documents.
- Actions: **approve listing**, **suspend listing** (`AuditModal` reason mandatory).

### Progress Status
- Route: `/personas/equipment-owner/progress`
- KPIs: in-progress · delayed · completed (30d) · avg completion time.
- Table: booking id · equipment · farmer · start date · expected end · progress % · status badge. Filters: status, date range.

## Acceptance criteria

- [ ] Dropdown partitions exactly as above; persona-specific items A–Z.
- [ ] All 4 views use the shared template, pre-filtered to Equipment Owner.
- [ ] Force-cancel and listing approve/suspend are audited with mandatory reasons.
- [ ] Schedule week grid is read-only and never blocks/conflicts with user-side bookings.

## Traceability

Pages (5): 1 overview + 4 persona-specific views — matches `superadmin_modules.md` §4.4.3 and §5 (Equipment Owner = 4 features).
