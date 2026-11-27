# Module 04.08 — Persona: Transporter

> Source: `superadmin_modules.md` §4.4.8 · Module 4 of 7 · Pages: 1 overview + 7 feature views = 8
> Shared anatomy & theme: [README](../README.md) §3–4 · Design rules: [README](../README.md) §2

## Purpose

Data-analyst module for the Transporter persona: 1 overview page + 7 persona-specific feature views (read + export; approve/suspend vehicles; only 13 of the 16 common hubs are visible — see exceptions below).

## Persona Overview

**Route**: `/personas/transporter`

KPIs: total transporters · vehicles & drivers registered · trips (30d) · live trips now · booking requests pending · trip revenue (30d). Recent records strip + trend.

**Persona dropdown menu** (two partitions):
- **PERSONA-SPECIFIC FEATURES**: Bilty · Booking Requests · Load Board · Live Trips · My Connections · Trip P&L · Vehicles and Drivers
- **COMMON FEATURES — EXCEPTIONS APPLY**: only 13 of the 16 hubs are visible for this persona. **My Diary, Ads & Promotions, and Ratings & Reviews are hidden in the user app for Transporter and must be hidden here too** (`superadmin_modules.md` §4.4.8). All other common hubs open pre-filtered to Transporter.

## Feature views

### Bilty
- Route: `/personas/transporter/bilty`
- KPIs: bilty issued (30d) · pending acknowledgement · disputed.
- Table: bilty no · date · transporter · consignor → consignee · goods · freight · status badge. Filters: status, date, search.
- Drawer: full bilty with print-style layout (read-only; uses app print styles).

### Booking Requests
- Route: `/personas/transporter/booking-requests`
- KPIs: pending · accepted · declined · expired.
- Table: request id · date · farmer (name+mobile) · vehicle type · route · fare · status badge. Filters: status, vehicle type, date.

### Load Board
- Route: `/personas/transporter/load-board`
- KPIs: loads posted · matched · fulfilled · avg match time.
- Table: load id · date · poster (name+persona) · goods · qty · route · budget · status badge. Filters: status, route, date.

### Live Trips
- Route: `/personas/transporter/live-trips`
- KPIs: live now · delayed · completed today · avg trip time.
- Table: trip id · started · transporter · vehicle · route · progress % · ETA · status badge. Filters: status, date, live-only toggle.
- Live mode: auto-refresh 60 s.

### My Connections
- Route: `/personas/transporter/connections`
- KPIs: total connections · new (30d) · by counterpart persona.
- Table: transporter · counterpart (name+persona) · connected date · shared trips count. Filters: counterpart persona, date, search.

### Trip P&L
- Route: `/personas/transporter/trip-pnl`
- KPIs: trips with P&L (30d) · profitable % · total freight · total expense.
- Table: trip id · transporter · freight · diesel · tolls · driver · misc · profit/loss · margin %. Filters: margin sign, date, transporter.

### Vehicles and Drivers
- Route: `/personas/transporter/vehicles-drivers`
- KPIs: vehicles · drivers · verified pairs · pending approval.
- Table: vehicle no · type · capacity · driver name · licence status · documents badge · status. Filters: type, status, search.
- Drawer: RC, licence, insurance docs (images).
- Actions: **approve vehicle**, **suspend vehicle** (`AuditModal` reason mandatory).

## Acceptance criteria

- [ ] Dropdown partitions exactly as above; persona-specific items A–Z (7 items).
- [ ] Common-features partition shows exactly 13 hubs — My Diary, Ads & Promotions, Ratings & Reviews are absent.
- [ ] All 7 views use the shared template, pre-filtered to Transporter.
- [ ] Vehicle approve/suspend is audited with a mandatory reason; everything else read + export.
- [ ] Each view exports CSV/JSON (audited).

## Traceability

Pages (8): 1 overview + 7 persona-specific views — matches `superadmin_modules.md` §4.4.8 and §5 (Transporter = 7 features; the 3 hidden common features are documented exceptions, not pages).
