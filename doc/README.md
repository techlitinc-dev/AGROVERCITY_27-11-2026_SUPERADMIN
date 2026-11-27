# Agrovercity Superadmin — Module Instruction Docs

Build-ready instruction set for the **Agrovercity Superadmin** web application — a read-only **Data Analyst** admin panel over the Agrovercity ecosystem.

> **Source of truth**: [`superadmin_modules.md`](../superadmin_modules.md) (module index, navigation structure, design principles). Every instruction file in this folder traces back to a section of that document. Do not invent features that are not there.
> **App theme reference**: production web app (`website/` in [AGROVERCITY-05_10_2026](https://github.com/techlitinc-dev/AGROVERCITY-05_10_2026)) and the legacy superadmin v1 app (`superadmin/` in the same repo — reusable components, old persona scope).

---

## 1. How to use these docs

- One file per module / persona / common feature. Numbering matches the module index in `superadmin_modules.md` §3.
- Each file specifies: purpose → routes → KPI cards → data-table columns → filters → detail drawer → admin actions → export → operator notes → acceptance criteria.
- The shared page anatomy and theme tokens below apply to **every** screen; individual files only state what differs.

## 2. Global design rules (from `superadmin_modules.md` §1 — must hold on every screen)

1. **Read-first**: every module page = KPI cards → filterable/sortable data table → record detail drawer → CSV/JSON export. No screen mutates user-side business flows.
2. **Sorted & structured**: personas and features are listed **alphabetically (A–Z)** in navbar, dropdowns, and module lists.
3. **Two-partition rule**: inside every persona menu, features are grouped into exactly **Persona-Specific Features** and **Common Features** partitions — mirroring the user app.
4. **Max 2 clicks** from login to any data table (Navbar → Persona → Feature).
5. **Traceability**: every admin action (approve / reject / suspend / reactivate / MPIN reset / export / adjustment) opens the audit-reason modal and writes to the Audit Log (Module 7) with a **mandatory reason**.

## 3. Shared page anatomy (reusable template)

All 82 pages are one reusable table+detail template instantiated per feature. Build order inside every page:

1. **Page header** — feature title (matches menu label exactly), persona filter chip when pre-filtered, Export button (CSV/JSON).
2. **KPI cards row** — 3–6 `KpiCard`s specific to the feature (counts, sums, pending/rates).
3. **Filter bar** — search input + feature-relevant filters (status, date range, persona, region…).
4. **Data table** — sortable columns, pagination, skeleton shimmer while loading, row click → detail drawer.
5. **Record detail drawer** — `EntityDrawer`, slides in from right (`slide-in-right`), read-only field set + action buttons where specified.
6. **Admin actions** — destructive/state-changing buttons open `AuditModal`; submission is blocked until a reason is entered; action + reason land in the Audit Log.
7. **Empty state** — friendly slate-50 panel, no dead buttons.

Reusable v1 components to port: `KpiCard`, `EntityDrawer`, `AuditModal`, `Sidebar`, `TopBar`, `AuthContext`, `api.ts` (from `superadmin/` in the source repo).

## 4. Theme tokens (must match the main app)

| Token | Value |
|---|---|
| Primary palette | `agri` green: 50 `#f0fdf4` · 100 `#dcfce7` · 200 `#bbf7d0` · 300 `#86efac` · 400 `#4ade80` · 500 `#22c55e` · 600 `#16a34a` · **700 `#15803d`** · **800 `#166534`** (brand/theme-color) · 900 `#14532d` · 950 `#052e16` |
| Accent palette | `harvest` amber (warnings, pending states, highlights) |
| Neutral palette | `earth` browns + Tailwind `slate` |
| Background / text | `bg-slate-50` / `text-slate-900` |
| Font | Inter (Devanagari: Noto Sans Devanagari) |
| Primary buttons | `bg-agri-700 hover:bg-agri-800 text-white`, `hover-glow` on key CTAs |
| Cards / tables | white cards, `hover-lift`, `slide-up` entrance, thin `slate` scrollbars |
| Drawer | `slide-in-right`, 480px max width, overlay `bg-slate-900/40` |
| Loading | `shimmer-bg` skeletons; `fade-in` for content |
| Status colors | success `agri`, warning `harvest-500`, danger `red`, info `slate` |

## 5. Scope guardrails

- **In scope personas (9)**: Agri Market Seller, Agri Vyapari, Equipment Owner, Farm Landlord, Farmer, Gurukul Instructor, Milk Vendor (Doodhwala), Transporter, Women Hub.
- **Out of scope** (implemented in app, no superadmin screens): Agri Exporter, Cold Storage Owner, Direct Buyer, Gaushala & Sanctuary, Nursery.
- **Transporter exceptions**: My Diary, Ads & Promotions, Ratings & Reviews are hidden for Transporter in the app — the superadmin persona menu for Transporter must mirror that (13 common features, not 16).

## 6. File map

### Core modules
| File | Module | Pages |
|---|---|---|
| [01-admin-auth-and-profile.md](01-admin-auth-and-profile.md) | Admin Auth & Profile | 2 |
| [02-dashboard-global-kpis.md](02-dashboard-global-kpis.md) | Dashboard (Global KPIs) | 1 |
| [03-users-and-kyc.md](03-users-and-kyc.md) | Users & KYC | 3 |
| [06-reports-and-exports.md](06-reports-and-exports.md) | Reports & Exports | 1 |
| [07-audit-log.md](07-audit-log.md) | Audit Log | 1 |

### Module 4 — Persona modules (9 overviews + 49 persona-specific feature views)
| File | Persona | Persona-specific views |
|---|---|---|
| [04-personas/04-01-agri-market-seller.md](04-personas/04-01-agri-market-seller.md) | Agri Market Seller | 7 |
| [04-personas/04-02-agri-vyapari.md](04-personas/04-02-agri-vyapari.md) | Agri Vyapari | 4 |
| [04-personas/04-03-equipment-owner.md](04-personas/04-03-equipment-owner.md) | Equipment Owner | 4 |
| [04-personas/04-04-farm-landlord.md](04-personas/04-04-farm-landlord.md) | Farm Landlord | 3 |
| [04-personas/04-05-farmer.md](04-personas/04-05-farmer.md) | Farmer | 10 |
| [04-personas/04-06-gurukul-instructor.md](04-personas/04-06-gurukul-instructor.md) | Gurukul Instructor | 3 |
| [04-personas/04-07-milk-vendor.md](04-personas/04-07-milk-vendor.md) | Milk Vendor (Doodhwala) | 8 |
| [04-personas/04-08-transporter.md](04-personas/04-08-transporter.md) | Transporter | 7 (+3 hidden common) |
| [04-personas/04-09-women-hub.md](04-personas/04-09-women-hub.md) | Women Hub | 3 |

### Module 5 — Common features (16 cross-persona hubs)
[05-common-features/05-01-ads-and-promotions.md](05-common-features/05-01-ads-and-promotions.md) · [05-02-agri-market.md](05-common-features/05-02-agri-market.md) · [05-03-agriculture-news-and-audio.md](05-common-features/05-03-agriculture-news-and-audio.md) · [05-04-ai-analysis.md](05-common-features/05-04-ai-analysis.md) · [05-05-ai-crop-scanner.md](05-common-features/05-05-ai-crop-scanner.md) · [05-06-climate.md](05-common-features/05-06-climate.md) · [05-07-coins-and-rewards.md](05-common-features/05-07-coins-and-rewards.md) · [05-08-courses.md](05-common-features/05-08-courses.md) · [05-09-government-schemes.md](05-common-features/05-09-government-schemes.md) · [05-10-invite-and-earn.md](05-common-features/05-10-invite-and-earn.md) · [05-11-my-diary.md](05-common-features/05-11-my-diary.md) · [05-12-my-land-records.md](05-common-features/05-12-my-land-records.md) · [05-13-profit-and-loss.md](05-common-features/05-13-profit-and-loss.md) · [05-14-ratings-and-reviews.md](05-common-features/05-14-ratings-and-reviews.md) · [05-15-saved-and-following.md](05-common-features/05-15-saved-and-following.md) · [05-16-tree-plantation.md](05-common-features/05-16-tree-plantation.md)

## 7. Page count reconciliation

2 (01) + 1 (02) + 3 (03) + 9 overviews + 49 persona views (04) + 16 (05) + 1 (06) + 1 (07) = **82 pages** — matches `superadmin_modules.md` §5.

## 8. Suggested build order (from `superadmin_modules.md` §6)

1. **Phase 1**: 01 Admin Auth, 02 Dashboard, 03 Users & KYC, 07 Audit Log, reusable data-table template (README §3).
2. **Phase 2**: Module 5 common features (16 pages on the shared template).
3. **Phase 3**: Module 4 personas by live data volume: Farmer → Agri Market Seller → Transporter → Equipment Owner → Agri Vyapari → rest A–Z.
4. **Phase 4**: 06 Reports & Exports builder.
