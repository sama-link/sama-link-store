# Data & Content Implementation Model — Sama Link Store

**Layer:** Implementation
**Derives from:** Technical Requirements · Architecture Overview · Project Definition
**Implements constraints from:** ADR-003 (Medusa v2) · ADR-004 (PostgreSQL) · ADR-008 (next-intl)
**Notion source:** https://www.notion.so/33a13205fce681bbab48e31f6826334e

---

## Data Ownership Principle

All persistent commerce data is owned by the backend (Medusa + PostgreSQL). The storefront holds no authoritative state — it reads from the backend API and caches responses for rendering. State changes are always executed server-side via API calls.

This principle applies without exception to: product data, pricing, inventory, orders, customer accounts, and discount configurations.

---

## Product Data Model

Medusa v2 product entities and their ownership:

| Entity | Owner | Description |
|---|---|---|
| Product | Backend (Medusa) | Top-level product record — title, description, handle, status, metadata |
| ProductVariant | Backend (Medusa) | SKU-level record — price, inventory, option values (size, color, etc.) |
| ProductCategory | Backend (Medusa) | Hierarchical category tree — used for browsing and filtering |
| ProductImage | Backend (Medusa) | Image references — URLs point to object storage (S3/R2); not stored in DB |
| ProductTag | Backend (Medusa) | Flat tag set — used for cross-category grouping and filtering |

Product handles are URL-stable identifiers. Changing a handle breaks existing URLs and cache tags — handle changes require a redirect strategy.

---

## Localization Structure

Localization operates at two levels:

| Level | Mechanism | Scope |
|---|---|---|
| UI strings | next-intl message files (`messages/ar.json`, `messages/en.json`) | Labels, navigation, static interface copy |
| Commerce content | Medusa locale-aware fields on Product/Category entities | Product titles, descriptions, SEO metadata per locale |

Medusa stores locale variants on product and category records. The storefront requests locale-specific fields by passing the active locale in API calls. UI strings are resolved client-side via next-intl.

Default locale is Arabic (`ar`). All content must exist in Arabic before English is considered complete.

---

## Source of Truth by Data Type

| Data Type | Source of Truth | Storefront Access Pattern |
|---|---|---|
| Product catalog (titles, descriptions, images) | Medusa backend | Server Component fetch; ISR cache with `products` tag |
| Pricing | Medusa backend (PriceList / PricingModule) | Server-side only; never in client-accessible vars |
| Inventory / stock levels | Medusa backend (InventoryModule) | Server-side; real-time for cart/checkout, cached for listing |
| Cart state | Medusa backend (authoritative) + client state (optimistic UI) | Client manages optimistic state; server state resolves on conflict |
| Customer account data | Medusa backend | Server-authenticated route; no public caching |

---

## Content Publishing Flow

1. Merchant creates or updates product via Medusa Admin (or admin API)
2. Product is saved to PostgreSQL via Medusa data layer
3. On publish: Medusa emits `product.updated` lifecycle event
4. Subscriber triggers Next.js cache revalidation via `revalidateTag('products')`
5. Next ISR serves fresh content on next request after revalidation

Draft products are not exposed to the storefront API. Only published products appear in catalog routes.

---

## Cache Invalidation

| Trigger | Cache Tag(s) Invalidated | Revalidation Mechanism |
|---|---|---|
| Product published / updated | `products`, `product-[handle]` | Medusa subscriber → Next.js revalidate API |
| Category updated | `categories`, `category-[handle]` | Medusa subscriber → Next.js revalidate API |
| Pricing rule changed | `products` (all affected variants) | Medusa subscriber → Next.js revalidate API |
| Inventory level change | Not invalidated — stock display uses real-time fetch at cart/checkout | N/A for catalog pages |

Cache tags map to content types, not individual pages, to enable targeted revalidation without full cache purges.

---

## Image Storage

- Product images are stored in S3-compatible object storage (AWS S3 or Cloudflare R2 — ADR decision pending)
- Medusa stores image URLs, not image binaries, in PostgreSQL
- Next.js `Image` component handles responsive sizing and format optimization
- Image CDN configuration (loader, domains) is an open dependency — see `environment-model.md`

---

## Open Dependencies

| Open Item | Impact on This Page | Blocks |
|---|---|---|
| Image CDN / Next.js image loader configuration | Determines how `next/image` resolves and optimizes product images | Product image display implementation |
| Search provider selection | Determines whether product index is maintained in Medusa or pushed to external search index | Search feature data flow |
| Medusa locale field configuration | Determines how product content locale variants are structured in the data model | Locale-specific product content |
| Cache revalidation hosting support | Determines whether ISR revalidation via cache tags is supported in chosen hosting environment | Cache invalidation implementation |

---

## Related Implementation Files

- [`backend-patterns.md`](backend-patterns.md) — Commerce backend architectural patterns and extension model
- [`storefront-patterns.md`](storefront-patterns.md) — Storefront rendering strategy and data fetching patterns
- [`environment-model.md`](environment-model.md) — Environment topology and object storage configuration
- [`seo-guidelines.md`](seo-guidelines.md) — Structured data and metadata patterns for product pages
