# Module 04.05 — Persona: Farmer

> Source: `superadmin_modules.md` §4.4.5 · Module 4 of 7 · Pages: 1 overview + 10 feature views = 11
> Shared anatomy & theme: [README](../README.md) §3–4 · Design rules: [README](../README.md) §2

## Purpose

Data-analyst module for the Farmer persona (the largest persona module): 1 overview page + 10 persona-specific feature views (read + export; force-cancel on vehicle bookings only).

## Persona Overview

**Route**: `/personas/farmer`

KPIs: total farmers · KYC-verified % · active this week · crops registered · produce listed (30d) · vehicle bookings (30d). Recent records strip + registrations trend.

**Persona dropdown menu** (two partitions):
- **PERSONA-SPECIFIC FEATURES**: AI Crop Plan · AI Doctor · Book Vehicle · Mandi Prices · My Connections · My Crops · My Produce · Rent Land · Rent Machinery · Vyapari Requirements
- **COMMON FEATURES**: 16 hubs pre-filtered to Farmer.

## Feature views

### AI Crop Plan
- Route: `/personas/farmer/ai-crop-plan`
- KPIs: plans generated (30d) · unique farmers · top planned crop · avg plan steps completed.
- Table: date · farmer (name+mobile) · crop · season · land size · plan status badge. Filters: crop, season, date, status.
- Drawer: full plan steps + AI inputs (soil, region, irrigation).

### AI Doctor
- Route: `/personas/farmer/ai-doctor`
- KPIs: consultations (30d) · top detected issue · photo-based % · escalation rate.
- Table: date · farmer · crop · detected issue · confidence % · status badge. Filters: issue, crop, confidence band, date.
- Drawer: symptom text + uploaded photo (zoomable) + AI remedy output.

### Book Vehicle
- Route: `/personas/farmer/book-vehicle`
- KPIs: bookings (30d) · pending · completed · cancelled.
- Table: booking id · date · farmer · vehicle type · transporter · route · fare · status badge. Filters: status, vehicle type, date.
- Drawer: trip timeline (booked → assigned → in transit → delivered).
- Actions: **force-cancel booking** (dispute cases, `AuditModal` reason mandatory).

### Mandi Prices
- Route: `/personas/farmer/mandi-prices`
- KPIs: crops tracked · mandis covered · updates (7d) · biggest 7-day mover.
- Table: crop · mandi · modal price (₹/quintal) · min–max · date · trend spark. Filters: crop, mandi, date range.

### My Connections
- Route: `/personas/farmer/connections`
- KPIs: total connections · new (30d) · by counterpart persona · most connected farmer.
- Table: farmer · counterpart (name+persona) · connected date · shared activity count. Filters: counterpart persona, date, search.

### My Crops
- Route: `/personas/farmer/crops`
- KPIs: crops registered · hectares covered · growing · harvested.
- Table: farmer · crop · area (acres) · sowing date · stage · expected harvest. Filters: crop, stage, date, region.

### My Produce
- Route: `/personas/farmer/produce`
- KPIs: listings (30d) · live · sold · qty sold (30d, quintals).
- Table: listing id · date · farmer · produce · qty · price · status badge · views. Filters: status, produce, date, price range.

### Rent Land
- Route: `/personas/farmer/rent-land`
- KPIs: enquiries (30d) · leases signed · active leases · avg rent/acre.
- Table: enquiry id · date · farmer · landlord · land size · rent · tenure · status badge. Filters: status, date, region.
- Drawer: lease terms + both parties' details.

### Rent Machinery
- Route: `/personas/farmer/rent-machinery`
- KPIs: bookings (30d) · active rentals · completed · revenue (30d).
- Table: booking id · date · farmer · equipment · owner · period · rent · status badge. Filters: status, equipment type, date.
- Drawer: booking timeline + condition notes.

### Vyapari Requirements
- Route: `/personas/farmer/vyapari-requirements`
- KPIs: requirements visible · farmer responses (30d) · matched · fulfilment %.
- Table: requirement · vyapari · crop · qty · budget · region · responses · status badge. Filters: crop, region, status.

## Acceptance criteria

- [ ] Dropdown partitions exactly as above; persona-specific items A–Z (10 items).
- [ ] All 10 views use the shared template, pre-filtered to Farmer.
- [ ] AI Doctor drawer always pairs the uploaded photo with the AI output (auditability of AI advice).
- [ ] Only force-cancel (Book Vehicle) mutates state, audited with a mandatory reason; everything else is read + export.
- [ ] Each view exports CSV/JSON (audited).

## Traceability

Pages (11): 1 overview + 10 persona-specific views — matches `superadmin_modules.md` §4.4.5 and §5 (Farmer = 10 features).
