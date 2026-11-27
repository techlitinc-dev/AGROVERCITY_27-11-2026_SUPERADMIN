# Module 04.01 — Persona: Agri Market Seller

> Source: `superadmin_modules.md` §4.4.1 · Module 4 of 7 · Pages: 1 overview + 7 feature views = 8
> Shared anatomy & theme: [README](../README.md) §3–4 · Design rules: [README](../README.md) §2

## Purpose

Data-analyst module for the Agri Market Seller persona: 1 overview page + 7 persona-specific feature views (read + export; approve/suspend on shops only).

## Persona Overview

**Route**: `/personas/agri-market-seller`

KPI wall for this persona: total sellers · shops live · products listed · orders (30d) · revenue (30d) · open enquiries. Plus a **recent records** strip (newest shops, orders, enquiries — click-through to the view below) and a registrations mini-trend.

**Persona dropdown menu** (two partitions, exactly as the user app):
- **PERSONA-SPECIFIC FEATURES**: Enquiry Management · My Products · Offers & Discounts · Orders Received · Quotation Management · Shop Profile · Stock Management
- **COMMON FEATURES**: the 16 hubs ([Module 05](../README.md#module-5--common-features-16-cross-persona-hubs)), each opening pre-filtered to Agri Market Seller.

## Feature views (each = shared template, pre-filtered to this persona)

### Enquiry Management
- Route: `/personas/agri-market-seller/enquiries`
- KPIs: open · replied today · avg response time · conversion %.
- Table: date · buyer (name+mobile) · seller shop · product · message excerpt · status badge. Sort/filter: date, status, shop, search buyer/product.

### My Products
- Route: `/personas/agri-market-seller/products`
- KPIs: live · out of stock · low stock · avg price.
- Table: product · category · shop · price · stock qty · status badge · listed date. Filters: category, status, stock level, price range.

### Offers & Discounts
- Route: `/personas/agri-market-seller/offers`
- KPIs: active · scheduled · expired · avg discount %.
- Table: title · shop · scope (product/category/cart) · discount · validity window · status badge. Filters: status, shop, date range.

### Orders Received
- Route: `/personas/agri-market-seller/orders`
- KPIs: today · pending · delivered (30d) · returned · GMV (30d).
- Table: order id · date · buyer · shop · items · amount · payment status · fulfilment status. Filters: date, status, payment, amount range.

### Quotation Management
- Route: `/personas/agri-market-seller/quotations`
- KPIs: sent · accepted · expired · acceptance rate.
- Table: quote id · date · buyer · shop · amount · validity · status badge. Filters: status, date, shop.

### Shop Profile
- Route: `/personas/agri-market-seller/shops`
- KPIs: shops total · live · pending approval · suspended.
- Table: shop name · owner (name+mobile) · location · rating · products count · status badge. Filters: status, location, search.
- Drawer: full shop profile incl. documents, cover image, payout details (masked).
- Actions: **approve shop**, **suspend shop** (`AuditModal` reason mandatory).

### Stock Management
- Route: `/personas/agri-market-seller/stock`
- KPIs: SKUs tracked · low stock · out of stock · stock value.
- Table: product · shop · qty · reorder level · last movement · movement trend spark. Filters: shop, stock level, category.

## Common admin actions

Approve/suspend (shops only) require a reason and land in the [Audit Log](../07-audit-log.md). Everything else is read + export.

## Acceptance criteria

- [ ] Dropdown shows exactly the two partitions above; persona-specific items are A–Z.
- [ ] All 7 views render the shared template pre-filtered to Agri Market Seller; no other persona's data leaks into any table.
- [ ] Shop approval/suspension is audited with a mandatory reason.
- [ ] Each view exports its filtered table as CSV/JSON (audited).

## Traceability

Pages (8): 1 overview + 7 persona-specific views — matches `superadmin_modules.md` §4.4.1 and §5 (Agri Market Seller = 7 features).
