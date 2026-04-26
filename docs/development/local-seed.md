# Local development seed baseline

After a fresh clone the local Postgres has no admin user, no products,
no Egypt region, and no publishable API key — the storefront cannot
connect and `/app` cannot be logged into. This doc describes the
single command that makes the local dev stack usable, what it creates,
and how to keep the baseline reproducible.

## TL;DR — fresh-clone flow

```bash
git clone https://github.com/sama-link/sama-link-store.git
cd sama-link-store
npm install                                                       # workspace install (root)
cp .env.example apps/backend/.env                                 # MEDUSA_ADMIN_EMAIL/PASSWORD live here
docker compose -f docker-compose.dev.yml up -d postgres backend   # postgres + medusa
docker compose -f docker-compose.dev.yml exec backend \
  sh -c "cd /app/apps/backend && npm run seed:local"              # admin + catalog + region + key

# Copy the printed NEXT_PUBLIC_* lines into apps/storefront/.env.local
cp apps/storefront/.env.local.example apps/storefront/.env.local
# (paste the seed output's two reg_… and pk_… values)

npm run dev:storefront                                            # http://localhost:3000
```

## What `npm run seed:local` does

Two steps, in order, both idempotent:

1. **Admin user** — `medusa user -e $MEDUSA_ADMIN_EMAIL -p $MEDUSA_ADMIN_PASSWORD`.
   This is Medusa's official CLI command. It wires the auth identity
   correctly (provider `emailpass`, password hash, app metadata link).
   We do NOT create users from inside `seed.ts` — bypassing the auth
   identity layer produces broken logins. On re-runs the command errors
   with "user already exists"; the npm script's `|| true` swallows that
   so the seed step still runs.

2. **Store setup + catalog + region + publishable key** —
   `medusa exec ./src/scripts/seed.ts`. Loads the sanitized live-derived
   fixture at `apps/backend/src/scripts/fixtures/live-store-setup.json`
   and ensures each entity. Check-before-create everywhere, so re-runs
   are no-ops:
   - Egypt region (`currency_code=egp`, `countries=[eg]`)
   - Default Sales Channel (auto-created by Medusa boot; resolved by name)
   - Singleton store: `name`, `default_currency_code`,
     `supported_currencies`, `default_region_id`, `default_sales_channel_id`
     — read via `query.graph`, written via `updateStores(id, data)`
     (the only signature that actually persists; see seed.ts header note)
   - Stock locations (1: `Sama Link`) with full `address` at create time
   - Shipping profiles (1: `Default Shipping Profile`)
   - **Service zones** under each fulfillment_set, with geo_zones
   - **Shipping options** with prices, rules, type — looked up by name
     within their (location → fulfillment_set → service_zone) tree
   - **29 brands** (custom `brand` module — apps/backend/src/modules/brand)
   - 26 product categories (parents-first, deterministic by handle)
   - 461 product tags (deterministic by `value`)
   - 917 products from the fixture — **5 skipped** because their only
     variant has no SKU; SKU is the natural idempotency key for pricing
   - 1 variant per product (916) + 1 product with 2 variants → 913 priced
     variants in EGP (amount per fixture)
   - Real GCS thumbnails + image URLs from the fixture (no migration —
     URLs are passed through and rendered by the storefront's
     `images.remotePatterns` for `storage.googleapis.com` and
     `placehold.co`)
   - **Product → brand link** via `metadata.brand_id` — set at product
     create time AND backfilled by a sweep over existing products so
     pre-brand-fixture installs converge on the right link
   - Publishable API key titled `Storefront Default`, linked to the
     Default Sales Channel
   - Older hand-rolled demo handles (`gigabit-switch-8-port`,
     `dual-band-wifi-router-ac1200`, `cat6-ethernet-cable-3m`,
     `medusa-coffee-mug`, `medusa-sweatpants`, `test`) get drafted on
     every run if they exist locally — fully reversible from the admin

The seed ends with a `Local development summary` block that prints the
admin URL, admin email, region ID, publishable token, store name +
default currency, catalog counts, fulfillment counts, and the exact
five `NEXT_PUBLIC_*` lines to paste into `apps/storefront/.env.local`.

### Skipped with warning

These fixture sections are deliberately not seeded:

| Section | Reason |
|---|---|
| `inventory_levels` | Live admin API returned 404 on `/admin/inventory-items` and the fixture is empty. |
| `fulfillment_providers` | Registered at boot via `medusa-config`, not via API. The `manual_manual` provider is already present in any local Medusa install. |
| `payment_providers` | Live admin API returned 404 (provider config differs per Medusa setup). |
| `collections` | Fixture is empty. |
| Pickup-type fulfillment_set (`Sama Link pick up`) | Auto-created by Medusa with the stock location, but its `service_zones` array is empty in the fixture, so no real pickup option to seed. The fulfillment_set sits ready for an operator to add a zone in the admin UI. |
| Stock-location address backfill on existing locations | `updateStockLocations(id, {address})` inserts a NEW `stock_location_address` row each call (it doesn't update in place). Address is set at create time on fresh DBs; existing locations are left alone to avoid orphan-row accumulation. |

## Idempotency guarantees

| Entity              | Re-run behavior                                                   |
|---------------------|-------------------------------------------------------------------|
| Admin user          | `medusa user` errors → `\|\| true` keeps the chain alive          |
| Egypt region        | Looked up by `currency_code=egp`; reused if found                 |
| Sales channel       | Looked up by name (`Default Sales Channel`); never created        |
| Store               | Read via `query.graph`; updated only when name / supported_currencies / default_region_id / default_sales_channel_id differ from desired |
| Stock locations     | Looked up by `name`; address set at create time only              |
| Shipping profiles   | Looked up by `name`; reused                                       |
| Service zones       | Listed per fulfillment_set; created per zone-name only when missing |
| Shipping options    | Listed by `name`; created only when missing (and prices deduped)  |
| Brands              | Bulk pre-fetch + per-handle defensive lookup before each create. Same `select: ["id","handle"]` pattern as categories |
| Categories          | Bulk pre-fetch + per-handle defensive lookup before each create. Both calls pass `select: ["id","handle"]` because Medusa's default DTO omits the handle |
| Tags                | Bulk pre-fetch with `select: ["id","value"]`; reused              |
| Products            | Bulk pre-fetch with `select: ["id","handle"]`; reused             |
| Variants/options    | Created with the parent product (no separate ensure step)         |
| Variant prices      | Batched `query.graph` lookup; only adds EGP price if missing      |
| Product → brand link | Sweep with `select: ["id","handle","metadata"]`; updates `metadata.brand_id` only when missing/wrong, preserving other metadata keys |
| Thumbnails / images | Set at product create time from fixture URLs; not touched on re-runs |
| Publishable key     | Looked up by title + type; reused                                 |
| Key ↔ channel link  | Created only when the key was just created                        |

Validated by running the command twice — second run produces zero new
rows of any seeded entity and emits the "already up-to-date" log line
for the store. (Total runtime ~6 seconds for the all-skip case;
~18 seconds for the first run including the brand-link sweep across
910 products; subsequent runs collapse to ~6 seconds again.)

### Medusa v2 quirks worth knowing

A handful of Medusa v2 module-service signatures took experimentation
to nail down. Hard-won facts encoded in seed.ts:

- `listProductCategories` / `listProductTags` / `listProducts` /
  `listSalesChannels` / `listStockLocations` / `listShippingProfiles`
  return DTOs with the natural-key field (handle / value / name) **omitted by default**.
  Always pass `select: ["id", "<key>", ...]`.
- `StoreModuleService` does NOT expose `listStores`. Read via
  `query.graph({entity: "store", fields: [...]})`.
- `updateStores` only persists in the **two-arg form**:
  `updateStores(id, data)`. The single-object and array forms silently
  no-op (Mikro-ORM treats every key as a filter, matches zero rows,
  returns success).
- `updateStockLocations(id, {address})` inserts a NEW
  `stock_location_address` row instead of updating in place. So we
  set the address only at create time and leave existing locations alone.
- `updateProducts([...])` errors with "Trying to query by not existing
  property Product.0". Use `updateProducts(id, data)` per item.

## What this seed does NOT include

These are deliberately out-of-scope to keep the committed baseline
safe and the local stack obviously distinct from production:

- Real customer records, addresses, or PII
- Real orders, carts, payments, refunds, returns
- Stripe / payment provider secrets, webhook secrets
- `JWT_SECRET`, `COOKIE_SECRET`, API tokens (the publishable token is
  generated locally by Medusa, not copied from anywhere)
- Password hashes or auth identities (created by `medusa user`)
- Sessions, access/refresh tokens

If a future feature needs e.g. a sample order for testing, add it as
an explicit sanitized fixture inside `seed.ts` — never via a DB dump.

## Refreshing the fixture from live/GCP

The fixture at `apps/backend/src/scripts/fixtures/live-store-setup.json`
is a sanitized snapshot of the live/GCP store setup, generated by
`apps/backend/src/scripts/export-live-seed-fixture.mjs`. To refresh:

```bash
# from the repo root, on a feature branch
export LIVE_MEDUSA_BACKEND_URL='https://sama-backend-XXXXXXXX-XX.a.run.app'
export LIVE_MEDUSA_ADMIN_EMAIL='you@example.com'
export LIVE_MEDUSA_ADMIN_PASSWORD='your-live-admin-password'

node apps/backend/src/scripts/export-live-seed-fixture.mjs
```

The script:

- Authenticates **once** via `POST /auth/user/emailpass` (the only
  non-GET in the entire file). Verify with:
  `grep -nE 'method:\s*"(POST|PUT|PATCH|DELETE)"' apps/backend/src/scripts/export-live-seed-fixture.mjs`
  → must show exactly one line, the auth POST.
- Then issues only `GET /admin/{regions,sales-channels,stock-locations,
  shipping-profiles,fulfillment-providers,payment-providers,
  shipping-options,product-categories,product-tags,collections,products,
  inventory-items}`. The 6 setup endpoints are optional — a 404 on any
  of them is logged and the section becomes `[]`.
- Strips live IDs and surfaces cross-references via natural keys
  (handle, sku, value, name, currency_code). Image URLs are passed
  through only when they look like `http(s)://...`.
- Hard-excludes every forbidden table and field: customers, orders,
  carts, payments, refunds, returns, users, auth identities, sessions,
  password hashes, JWT/cookie/Stripe/webhook secrets.
- Writes the sanitized result to
  `apps/backend/src/scripts/fixtures/live-store-setup.json` (overwrites
  on each run; never persists raw data).

After refresh, re-run `npm run seed:local` twice on a fresh local DB to
prove idempotency, then commit the updated fixture.

The `LIVE_*` env vars belong in your shell only or in a local
`.env.export.live` file — both are git-ignored. Never commit live
admin credentials.

## Storefront env values

`apps/storefront/.env.local` only ever holds `NEXT_PUBLIC_*` values
because Next.js bundles them into the client. The two values that
change per local DB are:

```
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY=<pk_… from seed output>
NEXT_PUBLIC_MEDUSA_REGION_ID=<reg_… from seed output>
```

The other three are stable across machines:

```
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_LOCALE=ar
```

Do NOT put backend secrets (`JWT_SECRET`, `COOKIE_SECRET`,
`DATABASE_URL`, Stripe keys) in this file — they would be shipped to
the browser. Backend secrets belong in `apps/backend/.env`.

## Why admin creation lives in the npm script, not in `seed.ts`

Medusa v2 splits authentication across three tables (`user`,
`auth_identity`, `provider_identity`) and hashes passwords through the
`emailpass` provider. Re-implementing that flow inside `seed.ts` would
require us to either copy a known-good password hash (forbidden — the
production hash never enters this repo) or to call the auth provider
manually (fragile and version-coupled to internal Medusa code).

The official `medusa user` CLI does all of this correctly, so the npm
script orchestrates the two steps:

```
"seed:local": "(medusa user -e \"$MEDUSA_ADMIN_EMAIL\" -p \"$MEDUSA_ADMIN_PASSWORD\" || true) && medusa exec ./src/scripts/seed.ts"
```

The script is sh-flavored and is intended to run inside the alpine
backend container (where Medusa's CLI is installed). On Windows hosts,
invoke it via `docker compose exec backend sh -c "…"` as shown in the
TL;DR; do not run it in PowerShell or cmd.exe directly.
