// ============================================================================
// export-live-seed-fixture.mjs
// ----------------------------------------------------------------------------
// Read-only export from the live/GCP Medusa Admin API → sanitized JSON fixture.
//
// USAGE
//   export LIVE_MEDUSA_BACKEND_URL='https://sama-backend-XXXXXXXX-XX.a.run.app'
//   export LIVE_MEDUSA_ADMIN_EMAIL='you@example.com'
//   export LIVE_MEDUSA_ADMIN_PASSWORD='your-live-admin-password'
//   node apps/backend/src/scripts/export-live-seed-fixture.mjs
//
// OUTPUT
//   apps/backend/src/scripts/fixtures/live-store-setup.json
//   (Pretty-printed, sorted by stable natural keys, IDs stripped.)
//
// SAFETY GUARANTEES (verifiable by reading this file)
//   1. Exactly one fetch() call site, inside httpRequest().
//   2. Exactly one POST in the whole file: AUTH_LOGIN_PATH below.
//   3. adminGet() rejects any path not in ALLOWED_GET_PREFIXES.
//   4. The JWT is held in a module-local variable — never written to disk,
//      never logged.
//   5. Every request prints "<METHOD>  <URL>" before it is sent so you can
//      Ctrl-C if anything looks wrong.
//   6. The script never reads from or writes to the local Docker/Postgres
//      stack — it is a pure outbound-HTTPS read against the live URL.
//
// REQUIRED vs OPTIONAL endpoints
//   Catalog-core endpoints are required: products, product-categories,
//   product-tags, collections, regions, sales-channels. A failure on these
//   aborts the export with a non-zero exit code.
//
//   Setup endpoints that may not exist on every Medusa configuration are
//   optional: payment-providers, fulfillment-providers, shipping-options,
//   shipping-profiles, stock-locations, inventory-items. A 404 on these is
//   logged as a warning, stored as an empty array in the fixture, and the
//   export continues. Any other HTTP status (500, 401, etc.) still aborts.
//
// EXCLUDED (never fetched, never written): customers, orders, carts, payments,
// payment-collections, refunds, returns, users, invites, api-key tokens,
// sessions, password hashes, JWT/cookie secrets, Stripe/webhook secrets, any PII.
// ============================================================================

import { writeFile, mkdir } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const FIXTURE_PATH = resolve(__dirname, "fixtures", "live-store-setup.json")

// ─────────── Constants ────────────────────────────────────────────────────
const AUTH_LOGIN_PATH = "/auth/user/emailpass"

const ALLOWED_GET_PREFIXES = [
  "/admin/regions",
  "/admin/sales-channels",
  "/admin/stock-locations",
  "/admin/shipping-profiles",
  "/admin/fulfillment-providers",
  "/admin/payment-providers",
  "/admin/shipping-options",
  "/admin/product-categories",
  "/admin/product-tags",
  "/admin/collections",
  "/admin/products",
  "/admin/inventory-items",
]

// ─────────── Env ──────────────────────────────────────────────────────────
function requireEnv(name) {
  const v = process.env[name]
  if (!v || !v.trim()) {
    throw new Error(
      `Missing required env var: ${name}. See the USAGE block at the top of this file.`
    )
  }
  return v.trim()
}

const BASE_URL = requireEnv("LIVE_MEDUSA_BACKEND_URL").replace(/\/+$/, "")
const ADMIN_EMAIL = requireEnv("LIVE_MEDUSA_ADMIN_EMAIL")
const ADMIN_PASSWORD = requireEnv("LIVE_MEDUSA_ADMIN_PASSWORD")

// ─────────── HTTP (the ONLY fetch site) ───────────────────────────────────
let _jwt = null

async function httpRequest({ method, path, body, tolerate404 = false }) {
  const url = `${BASE_URL}${path}`
  // Audit log — every request is announced before it goes out.
  console.log(`[export]  ${method.padEnd(4)}  ${url}`)

  const headers = { "Content-Type": "application/json" }
  if (_jwt) headers["Authorization"] = `Bearer ${_jwt}`

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  // Optional endpoints surface 404 to the caller as `null` rather than
  // throwing — see paginate(). Every other status (incl. 401, 403, 5xx,
  // and 404 on required endpoints) still aborts the export.
  if (tolerate404 && res.status === 404) {
    return null
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(
      `HTTP ${res.status} ${method} ${path}: ${text.slice(0, 500)}`
    )
  }
  if (res.status === 204) return null
  return await res.json()
}

async function loginOnce() {
  // ── The ONLY POST in this entire file. ────────────────────────────────
  const data = await httpRequest({
    method: "POST",
    path: AUTH_LOGIN_PATH,
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  })
  if (!data?.token) {
    throw new Error("Login succeeded but no JWT was returned.")
  }
  _jwt = data.token
  console.log("[export]  authenticated; switching to GET-only mode")
}

async function adminGet(path, { optional = false } = {}) {
  if (!ALLOWED_GET_PREFIXES.some((p) => path.startsWith(p))) {
    throw new Error(
      `adminGet refused — path '${path}' is not on ALLOWED_GET_PREFIXES.`
    )
  }
  return httpRequest({ method: "GET", path, tolerate404: optional })
}

// ─────────── Pagination helper ────────────────────────────────────────────
function pickArray(payload) {
  if (!payload || typeof payload !== "object") return []
  for (const v of Object.values(payload)) {
    if (Array.isArray(v)) return v
  }
  return []
}

async function paginate(basePath, { fields, pageSize = 100, optional = false } = {}) {
  const items = []
  let offset = 0
  for (;;) {
    const sep = basePath.includes("?") ? "&" : "?"
    const fieldsParam = fields
      ? `&fields=${encodeURIComponent(fields)}`
      : ""
    const path = `${basePath}${sep}limit=${pageSize}&offset=${offset}${fieldsParam}`
    const data = await adminGet(path, { optional })
    if (data === null) {
      // Optional endpoint returned 404 — log once and stop. The caller
      // receives an empty array, which sanitizers handle naturally.
      if (offset === 0) {
        console.warn(
          `[export]  ⚠ optional endpoint not available (404), skipping: ${basePath}`
        )
      }
      return items
    }
    const page = pickArray(data)
    items.push(...page)
    const total = typeof data?.count === "number" ? data.count : items.length
    offset += page.length
    if (page.length === 0 || offset >= total) break
  }
  return items
}

// ─────────── Sanitizers ───────────────────────────────────────────────────
// Each sanitizer takes the raw API row and returns a plain object containing
// ONLY whitelisted fields. Live IDs are stripped; cross-references are
// replaced with natural keys (handle, sku, name, currency_code) so the seed
// can re-resolve them in the local DB.

const SAFE_IMAGE_PROTOCOLS = ["http://", "https://"]
function sanitizeImageUrl(url) {
  if (!url || typeof url !== "string") return null
  return SAFE_IMAGE_PROTOCOLS.some((p) => url.startsWith(p)) ? url : null
}

function sanitizeRegion(r) {
  return {
    name: r.name ?? null,
    currency_code: (r.currency_code ?? "").toLowerCase() || null,
    countries: (r.countries ?? [])
      .map((c) => (c?.iso_2 ?? "").toLowerCase())
      .filter(Boolean)
      .sort(),
  }
}

function sanitizeSalesChannel(s) {
  return {
    name: s.name ?? null,
    description: s.description ?? null,
    is_disabled: Boolean(s.is_disabled),
  }
}

function sanitizeStockLocation(loc) {
  return { name: loc.name ?? null }
}

function sanitizeShippingProfile(p) {
  return { name: p.name ?? null, type: p.type ?? null }
}

function sanitizeProvider(p) {
  return { id: p.id ?? null, is_enabled: p.is_enabled ?? null }
}

function sanitizeShippingOption(opt, regionsById, profilesById) {
  return {
    name: opt.name ?? null,
    price_type: opt.price_type ?? null,
    provider_id: opt.provider_id ?? null,
    profile_name: profilesById.get(opt.shipping_profile_id) ?? null,
    region_name: regionsById.get(opt.region_id) ?? null,
    prices: (opt.prices ?? []).map((p) => ({
      amount: p.amount ?? null,
      currency_code: (p.currency_code ?? "").toLowerCase() || null,
    })),
    rules: (opt.rules ?? []).map((r) => ({
      attribute: r.attribute ?? null,
      operator: r.operator ?? null,
      value: r.value ?? null,
    })),
  }
}

function sanitizeCategory(c, categoryHandleById) {
  return {
    name: c.name ?? null,
    handle: c.handle ?? null,
    is_active: c.is_active ?? true,
    rank: typeof c.rank === "number" ? c.rank : 0,
    parent_handle: c.parent_category_id
      ? categoryHandleById.get(c.parent_category_id) ?? null
      : null,
  }
}

function sanitizeTag(t) {
  return { value: t.value ?? null }
}

function sanitizeCollection(c) {
  return { title: c.title ?? null, handle: c.handle ?? null }
}

function sanitizeProduct(p, collectionHandleById, channelNameById) {
  return {
    title: p.title ?? null,
    subtitle: p.subtitle ?? null,
    handle: p.handle ?? null,
    description: p.description ?? null,
    status: p.status ?? "draft",
    thumbnail: sanitizeImageUrl(p.thumbnail),
    images: (p.images ?? [])
      .map((i) => sanitizeImageUrl(i?.url))
      .filter(Boolean)
      .map((url) => ({ url })),
    collection_handle: p.collection_id
      ? collectionHandleById.get(p.collection_id) ?? null
      : null,
    category_handles: (p.categories ?? [])
      .map((c) => c?.handle)
      .filter(Boolean)
      .sort(),
    tag_values: (p.tags ?? [])
      .map((t) => t?.value)
      .filter(Boolean)
      .sort(),
    sales_channel_names: (p.sales_channels ?? [])
      .map((sc) => channelNameById.get(sc?.id))
      .filter(Boolean)
      .sort(),
    options: (p.options ?? []).map((o) => ({
      title: o.title ?? null,
      values: (o.values ?? [])
        .map((v) => (typeof v === "string" ? v : v?.value))
        .filter(Boolean)
        .sort(),
    })),
    variants: (p.variants ?? []).map((v) => sanitizeVariant(v)),
  }
}

function sanitizeVariant(v) {
  // Reduce options to a {title: value} map so the seed doesn't need to
  // re-resolve option-value IDs.
  const optionMap = {}
  for (const ov of v.options ?? []) {
    const title = ov?.option?.title ?? ov?.title ?? null
    const value = typeof ov === "string" ? ov : ov?.value ?? null
    if (title && value) optionMap[title] = value
  }
  return {
    title: v.title ?? null,
    sku: v.sku ?? null,
    options: optionMap,
    prices: (v.prices ?? []).map((p) => ({
      amount: p.amount ?? null,
      currency_code: (p.currency_code ?? "").toLowerCase() || null,
      // region_id is intentionally not surfaced — local seeding maps prices
      // to currency only. If region-scoped pricing is needed later, add a
      // region_name lookup here using the regions map.
    })),
  }
}

function sanitizeInventoryLevel(item, locationNameById) {
  // One inventory_item can span many locations — flatten to one row per
  // (sku, location_name) pair.
  const sku = item.sku ?? null
  if (!sku) return []
  return (item.location_levels ?? [])
    .map((lvl) => ({
      sku,
      location_name: locationNameById.get(lvl?.location_id) ?? null,
      stocked_quantity:
        typeof lvl?.stocked_quantity === "number" ? lvl.stocked_quantity : 0,
    }))
    .filter((row) => row.location_name)
}

// ─────────── Determinism ──────────────────────────────────────────────────
function sortBy(arr, keyFn) {
  return [...arr].sort((a, b) => {
    const ka = keyFn(a) ?? ""
    const kb = keyFn(b) ?? ""
    return ka < kb ? -1 : ka > kb ? 1 : 0
  })
}

// ─────────── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log(`[export]  base URL: ${BASE_URL}`)
  console.log(`[export]  fixture: ${FIXTURE_PATH}`)
  await loginOnce()

  // Round 1 — entities that are needed to resolve cross-references.
  const rawRegions = await paginate("/admin/regions", {
    fields: "id,name,currency_code,countries.iso_2",
    pageSize: 200,
  })
  const rawChannels = await paginate("/admin/sales-channels", {
    fields: "id,name,description,is_disabled",
    pageSize: 200,
  })
  const rawLocations = await paginate("/admin/stock-locations", {
    fields: "id,name",
    pageSize: 200,
    optional: true,
  })
  const rawProfiles = await paginate("/admin/shipping-profiles", {
    fields: "id,name,type",
    pageSize: 200,
    optional: true,
  })
  const rawCategories = await paginate("/admin/product-categories", {
    fields: "id,name,handle,is_active,parent_category_id,rank",
    pageSize: 500,
  })
  const rawCollections = await paginate("/admin/collections", {
    fields: "id,title,handle",
    pageSize: 500,
  })

  // Maps for cross-reference resolution.
  const regionsById = new Map(rawRegions.map((r) => [r.id, r.name]))
  const channelsById = new Map(rawChannels.map((s) => [s.id, s.name]))
  const locationsById = new Map(rawLocations.map((l) => [l.id, l.name]))
  const profilesById = new Map(rawProfiles.map((p) => [p.id, p.name]))
  const collectionHandleById = new Map(
    rawCollections.map((c) => [c.id, c.handle])
  )
  const categoryHandleById = new Map(
    rawCategories.map((c) => [c.id, c.handle])
  )

  // Round 2 — entities that depend on the maps above. The provider and
  // shipping endpoints are marked optional because they are configuration
  // surfaces that not every Medusa setup exposes (the live store hit a
  // 404 on /admin/payment-providers, for example).
  const rawProviders = {
    fulfillment: await paginate("/admin/fulfillment-providers", {
      pageSize: 200,
      optional: true,
    }),
    payment: await paginate("/admin/payment-providers", {
      pageSize: 200,
      optional: true,
    }),
  }
  const rawShippingOptions = await paginate("/admin/shipping-options", {
    fields:
      "id,name,price_type,service_zone_id,shipping_profile_id,provider_id,prices.amount,prices.currency_code,rules.attribute,rules.operator,rules.value",
    pageSize: 200,
    optional: true,
  })
  const rawTags = await paginate("/admin/product-tags", {
    fields: "id,value",
    pageSize: 1000,
  })
  const rawProducts = await paginate("/admin/products", {
    fields:
      "id,title,subtitle,handle,description,status,thumbnail,images.url,collection_id," +
      "categories.handle,tags.value,sales_channels.id," +
      "options.title,options.values.value," +
      "variants.id,variants.title,variants.sku,variants.options.option.title,variants.options.value," +
      "variants.prices.amount,variants.prices.currency_code",
    pageSize: 100,
  })
  const rawInventory = await paginate("/admin/inventory-items", {
    fields: "id,sku,location_levels.location_id,location_levels.stocked_quantity",
    pageSize: 200,
    optional: true,
  })

  // ── Sanitize ─────────────────────────────────────────────────────────
  const regions = sortBy(rawRegions.map(sanitizeRegion), (r) => r.name)
  const sales_channels = sortBy(
    rawChannels.map(sanitizeSalesChannel),
    (s) => s.name
  )
  const stock_locations = sortBy(
    rawLocations.map(sanitizeStockLocation),
    (l) => l.name
  )
  const shipping_profiles = sortBy(
    rawProfiles.map(sanitizeShippingProfile),
    (p) => p.name
  )
  const fulfillment_providers = sortBy(
    rawProviders.fulfillment.map(sanitizeProvider),
    (p) => p.id
  )
  const payment_providers = sortBy(
    rawProviders.payment.map(sanitizeProvider),
    (p) => p.id
  )
  const shipping_options = sortBy(
    rawShippingOptions.map((o) =>
      sanitizeShippingOption(o, regionsById, profilesById)
    ),
    (o) => `${o.region_name ?? ""}::${o.profile_name ?? ""}::${o.name ?? ""}`
  )
  const product_categories = sortBy(
    rawCategories.map((c) => sanitizeCategory(c, categoryHandleById)),
    (c) => c.handle
  )
  const product_tags = sortBy(rawTags.map(sanitizeTag), (t) => t.value)
  const collections = sortBy(
    rawCollections.map(sanitizeCollection),
    (c) => c.handle
  )
  const products = sortBy(
    rawProducts.map((p) =>
      sanitizeProduct(p, collectionHandleById, channelsById)
    ),
    (p) => p.handle
  )
  const inventory_levels = sortBy(
    rawInventory.flatMap((i) => sanitizeInventoryLevel(i, locationsById)),
    (i) => `${i.sku}::${i.location_name}`
  )

  const fixture = {
    $schema: "live-store-setup.v1",
    exported_at: new Date().toISOString(),
    counts: {
      regions: regions.length,
      sales_channels: sales_channels.length,
      stock_locations: stock_locations.length,
      shipping_profiles: shipping_profiles.length,
      fulfillment_providers: fulfillment_providers.length,
      payment_providers: payment_providers.length,
      shipping_options: shipping_options.length,
      product_categories: product_categories.length,
      product_tags: product_tags.length,
      collections: collections.length,
      products: products.length,
      variants: products.reduce((n, p) => n + (p.variants?.length ?? 0), 0),
      inventory_levels: inventory_levels.length,
    },
    regions,
    sales_channels,
    stock_locations,
    shipping_profiles,
    fulfillment_providers,
    payment_providers,
    shipping_options,
    product_categories,
    product_tags,
    collections,
    products,
    inventory_levels,
  }

  await mkdir(dirname(FIXTURE_PATH), { recursive: true })
  await writeFile(FIXTURE_PATH, JSON.stringify(fixture, null, 2) + "\n", "utf8")

  console.log("\n[export]  ── done ─────────────────────────────────────────")
  for (const [k, v] of Object.entries(fixture.counts)) {
    console.log(`[export]    ${k.padEnd(24)} ${v}`)
  }
  console.log(`[export]  wrote ${FIXTURE_PATH}`)
}

main().catch((err) => {
  console.error(`[export]  FAILED: ${err.message}`)
  process.exitCode = 1
})
