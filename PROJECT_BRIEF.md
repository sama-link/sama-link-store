# Project Brief — Sama Link Store

## Business Goal

Build a modern, scalable e-commerce platform ("Sama Link Store") that enables merchants to sell products online with a high-quality customer experience across languages and regions.

The platform must be operable by a small team, maintainable long-term, and extensible to new features without requiring architectural rewrites.

---

## Product Vision

A composable e-commerce store that:
- Looks and performs at the level of top-tier consumer brands
- Works seamlessly in Arabic and English (RTL/LTR)
- Is indexable, rankable, and shareable (SEO-first)
- Is AI-assistant-friendly in its content and data model
- Provides merchants with clear, practical admin tools
- Can grow from MVP to full-featured platform in measured phases

---

## Core Capabilities (Full Product)

| Capability | Description |
|---|---|
| Product catalog | Categories, variants, images, pricing, inventory |
| Search & filtering | Fast, typo-tolerant product discovery |
| Cart & checkout | Multi-step, payment integration, guest + account |
| Orders | Order lifecycle, confirmations, status tracking |
| Customer accounts | Registration, login, order history, saved addresses |
| Admin/dashboard | Product, order, customer, promotion management |
| Localization | Arabic/English UI, RTL layout, multi-currency |
| SEO | Metadata, structured data, sitemap, canonical URLs |
| Marketing | Promotions, discount codes, email hooks |
| Analytics | Basic sales reporting, traffic integration |

---

## MVP Scope (Phases 0–5)

The MVP delivers a functioning store with:
- Product catalog (browseable, searchable via basic filters)
- Cart and checkout with Stripe payment
- Guest checkout + basic customer accounts
- Order confirmation flow
- Admin: product and order management
- Arabic + English language support
- Core SEO foundations

### MVP Non-Goals

- Advanced promotions engine
- Loyalty / points system
- Multi-vendor marketplace
- Native mobile apps
- Real-time inventory sync with external WMS
- Advanced analytics / BI dashboards
- Subscription / recurring billing
- Social login (deferred to post-MVP)

---

## Success Criteria (MVP)

- A customer can browse products, add to cart, checkout, and receive an order confirmation.
- Merchant can manage products and view orders from the admin dashboard.
- Storefront scores 90+ Lighthouse performance on product listing and detail pages.
- Pages are indexable by Google with correct metadata and structured data.
- Arabic (RTL) and English UIs both function correctly.
- No critical security vulnerabilities at launch.

---

## Assumptions (documented here as decisions are made)

1. Primary market: Arabic-speaking region; Arabic is the primary language, English is secondary.
2. Currency: Single currency at MVP, multi-currency planned post-MVP.
3. Payments: Stripe as primary payment gateway at MVP.
4. Hosting: Vercel for storefront, Node/VPS for backend.
5. Authentication: Medusa's built-in auth for customers; custom or Medusa Admin for merchants.
6. Image storage: S3-compatible object storage (AWS S3 or Cloudflare R2).
