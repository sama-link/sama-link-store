// ============================================================================
// seed.ts — local development seed (BACK-3 / BACK-3b + live-derived catalog)
// ----------------------------------------------------------------------------
// Loads apps/backend/src/scripts/fixtures/live-store-setup.json (a sanitized
// snapshot of the live/GCP store setup, exported via the read-only
// export-live-seed-fixture.mjs script) and seeds the local Medusa Postgres
// with the same regions, sales channels, categories, tags, products, variant
// prices, thumbnails, and images.
//
// Idempotent: every entity is looked up by its natural key (handle, sku,
// value, name, currency_code) before create. Re-running this script on a
// populated DB produces zero new rows for already-seeded entities.
//
// Skips with warnings (documented in docs/development/local-seed.md):
//   - shipping options: live export does not capture service zones, which
//     Medusa v2 requires to attach a shipping option safely. Catalog
//     display does not depend on this.
//   - inventory levels: fixture count is 0 (live didn't expose
//     /admin/inventory-items via Admin API). Local-dev compensation:
//     `ensureVariantsPurchasableLocally` flips every variant's
//     manage_inventory to false so the storefront cart can add lines
//     without an inventory_item / inventory_level chain.
//   - fulfillment providers: registered at boot via medusa-config, not via
//     API. Verified present, not seeded.
//
// Bootstrap links ensured every run (idempotent — list-before-create):
//   - Sales Channel ↔ Stock Location: required for Medusa's cart flow to
//     resolve a stock location for any variant in the channel.
//   - Publishable API Key ↔ Sales Channel: required by the publishable-key
//     middleware on every /store/* route.
//
// Admin user is NOT created here — that lives in the npm script
// `seed:local`, which runs `medusa user -e ... -p ...` first. See
// docs/development/local-seed.md.
// ============================================================================

import type {
  CreateProductDTO,
  ExecArgs,
  IApiKeyModuleService,
  IFulfillmentModuleService,
  IProductModuleService,
  IPricingModuleService,
  IRegionModuleService,
  ISalesChannelModuleService,
  IStockLocationService,
  IStoreModuleService,
  RegionDTO,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { Link } from "@medusajs/modules-sdk"
import type { RemoteQueryFunction } from "@medusajs/types"
import { promises as fs } from "fs"
import path from "path"
// Custom Sama Link brand module (apps/backend/src/modules/brand). Resolved
// from the container by string key BRAND_MODULE; products link to brands
// via product.metadata.brand_id (free-form string, not a formal link).
import { BRAND_MODULE } from "../modules/brand"
import type BrandModuleService from "../modules/brand/service"
import {
  parseSamaLabels,
  PRODUCT_LABEL_SLUGS,
  SAMA_LABELS_METADATA_KEY,
  serializeSamaLabels,
} from "../lib/sama-product-labels"

// ─── Constants ───────────────────────────────────────────────────────────────
const SEED_CURRENCY = "egp"

// Drafted on every run so the older hand-rolled demo catalog never appears
// publicly once the live-derived fixture is loaded. We do NOT delete them —
// drafting is fully reversible from the admin UI.
const DEMO_PRODUCT_HANDLES_TO_SUPPRESS = [
  "medusa-coffee-mug",
  "medusa-sweatpants",
  "test",
  "gigabit-switch-8-port",
  "dual-band-wifi-router-ac1200",
  "cat6-ethernet-cable-3m",
] as const

const STOREFRONT_KEY_TITLE = "Storefront Default"

// Bulk operation batch sizes — small enough that a single failure doesn't
// cost the whole seed, large enough to keep total runtime reasonable on
// ~1k products.
const PRODUCT_CREATE_BATCH = 25
const TAG_CREATE_BATCH = 200
const PRICING_GRAPH_BATCH = 100

// ─── Fixture types (must match live-store-setup.json shape) ─────────────────
type FixtureRegion = {
  name: string | null
  currency_code: string | null
  countries: string[]
}
type FixtureCategory = {
  name: string | null
  handle: string | null
  is_active: boolean
  rank: number
  parent_handle: string | null
}
type FixtureTag = { value: string | null }
type FixtureProductOption = { title: string | null; values: string[] }
type FixturePrice = { amount: number | null; currency_code: string | null }
type FixtureVariant = {
  title: string | null
  sku: string | null
  options: Record<string, string>
  prices: FixturePrice[]
}
type FixtureProduct = {
  title: string | null
  subtitle: string | null
  handle: string | null
  description: string | null
  status: "draft" | "published" | "rejected" | "proposed" | null
  thumbnail: string | null
  images: Array<{ url: string }>
  collection_handle: string | null
  category_handles: string[]
  tag_values: string[]
  sales_channel_names: string[]
  brand_handle: string | null
  options: FixtureProductOption[]
  variants: FixtureVariant[]
}
type FixtureSalesChannel = {
  name: string | null
  description: string | null
  is_disabled: boolean
}
type FixtureGeoZone = {
  type: string | null
  country_code: string | null
}
type FixtureServiceZone = {
  name: string | null
  geo_zones: FixtureGeoZone[]
}
type FixtureFulfillmentSet = {
  name: string | null
  type: string | null
  service_zones: FixtureServiceZone[]
}
type FixtureStockLocationAddress = {
  address_1: string | null
  address_2: string | null
  city: string | null
  country_code: string | null
  postal_code: string | null
  province: string | null
}
type FixtureStockLocation = {
  name: string | null
  address: FixtureStockLocationAddress | null
  fulfillment_sets: FixtureFulfillmentSet[]
}
type FixtureShippingProfile = { name: string | null; type: string | null }
type FixtureShippingOption = {
  name: string | null
  price_type: string | null
  provider_id: string | null
  profile_name: string | null
  region_name: string | null
  service_zone: { name: string | null; geo_zones: FixtureGeoZone[] } | null
  type: { label: string | null; code: string | null; description: string | null } | null
  prices: Array<{ amount: number | null; currency_code: string | null }>
  rules: Array<{ attribute: string | null; operator: string | null; value: unknown }>
}
type FixtureBrand = {
  name: string | null
  handle: string | null
  description: string | null
  image_url: string | null
}
type FixtureStore = {
  name: string | null
  default_currency_code: string | null
  supported_currencies: Array<{ currency_code: string | null; is_default: boolean }>
  default_region_name: string | null
  default_sales_channel_name: string | null
}
type Fixture = {
  $schema: string
  exported_at: string
  counts: Record<string, number>
  regions: FixtureRegion[]
  sales_channels: FixtureSalesChannel[]
  store: FixtureStore | null
  brands: FixtureBrand[]
  stock_locations: FixtureStockLocation[]
  shipping_profiles: FixtureShippingProfile[]
  fulfillment_providers: Array<{ id: string | null }>
  payment_providers: Array<{ id: string | null }>
  shipping_options: FixtureShippingOption[]
  product_categories: FixtureCategory[]
  product_tags: FixtureTag[]
  collections: Array<{ title: string | null; handle: string | null }>
  products: FixtureProduct[]
  inventory_levels: unknown[]
}

// ─── Fixture loader (mirrors seed-translations.findTranslationsDir pattern) ─
async function findFixturePath(): Promise<string> {
  const candidates = [
    path.resolve(__dirname, "fixtures", "live-store-setup.json"),
    path.resolve(process.cwd(), "src/scripts/fixtures/live-store-setup.json"),
    path.resolve(
      process.cwd(),
      "../../apps/backend/src/scripts/fixtures/live-store-setup.json"
    ),
  ]
  for (const p of candidates) {
    try {
      const stat = await fs.stat(p)
      if (stat.isFile()) return p
    } catch {
      /* try next */
    }
  }
  throw new Error(
    `Could not find live-store-setup.json. Tried:\n  ${candidates.join("\n  ")}`
  )
}

async function loadFixture(): Promise<Fixture> {
  const fixturePath = await findFixturePath()
  const raw = await fs.readFile(fixturePath, "utf8")
  const fx = JSON.parse(raw) as Fixture
  console.log(
    `[seed] loaded fixture ${path.basename(fixturePath)} (${fx.$schema}, exported ${fx.exported_at})`
  )
  return fx
}

// ─── Demo product suppression (kept from prior seed) ────────────────────────
async function suppressDemoProducts(
  productModuleService: IProductModuleService
): Promise<void> {
  for (const handle of DEMO_PRODUCT_HANDLES_TO_SUPPRESS) {
    const [product] = await productModuleService.listProducts(
      { handle },
      { take: 1 }
    )
    if (!product) continue
    if (product.status === "draft") continue
    if (product.status === "published") {
      await productModuleService.updateProducts(product.id, { status: "draft" })
      console.log(`[seed] suppress: drafted demo handle=${handle}`)
    }
  }
}

// ─── Region (kept from prior seed; matches fixture's Egypt/EGP) ─────────────
async function ensureDefaultRegion(
  regionModuleService: IRegionModuleService
): Promise<RegionDTO> {
  const [egyptRegion] = await regionModuleService.listRegions(
    { currency_code: SEED_CURRENCY },
    { take: 1 }
  )
  if (egyptRegion) {
    console.log(
      `[seed] region: Egypt already exists -> ${egyptRegion.id} (${egyptRegion.name})`
    )
    return egyptRegion
  }
  const created = await regionModuleService.createRegions({
    name: "Egypt",
    currency_code: SEED_CURRENCY,
    countries: ["eg"],
  })
  console.log(`[seed] region: created Egypt -> ${created.id}`)
  return created
}

// ─── Default sales channel ──────────────────────────────────────────────────
// Medusa auto-creates "Default Sales Channel" on first boot. We just need
// its ID so we can attach products to it (otherwise the storefront's
// publishable-key-scoped Store API returns no products).
async function resolveDefaultSalesChannelId(
  salesChannelModuleService: ISalesChannelModuleService
): Promise<string> {
  const channels = await salesChannelModuleService.listSalesChannels(
    {},
    { take: 5, select: ["id", "name"] }
  )
  if (channels.length === 0) {
    throw new Error(
      "[seed] no sales channel found — Medusa should auto-create one on boot. Restart the backend container."
    )
  }
  const preferred =
    channels.find((c) => c.name === "Default Sales Channel") ?? channels[0]!
  console.log(
    `[seed] sales channel: using ${preferred.id} (${preferred.name})`
  )
  return preferred.id
}

// ─── Stock location ─────────────────────────────────────────────────────────
async function ensureStockLocations(
  stockLocationService: IStockLocationService,
  fixture: Fixture
): Promise<Map<string, string>> {
  const nameToId = new Map<string, string>()
  if (fixture.stock_locations.length === 0) return nameToId

  // Need address fields too so we can decide whether to update an existing
  // location's address. Medusa's default DTO omits address — explicit select.
  const existing = await stockLocationService.listStockLocations(
    {},
    {
      take: 100,
      select: [
        "id",
        "name",
        "address.id",
        "address.address_1",
        "address.city",
        "address.country_code",
      ],
    }
  )
  const existingByName = new Map<string, (typeof existing)[number]>()
  for (const e of existing) {
    if (e.name) {
      existingByName.set(e.name, e)
      nameToId.set(e.name, e.id)
    }
  }

  let created = 0
  for (const loc of fixture.stock_locations) {
    if (!loc.name) continue

    const addressInput = loc.address
      ? {
          address_1: loc.address.address_1 ?? "",
          address_2: loc.address.address_2 ?? "",
          city: loc.address.city ?? "",
          country_code: (loc.address.country_code ?? "").toLowerCase(),
          postal_code: loc.address.postal_code ?? "",
          province: loc.address.province ?? "",
        }
      : undefined

    const existingLoc = existingByName.get(loc.name)
    if (existingLoc) {
      // Existing location → leave alone. Medusa v2's
      // updateStockLocations(id, {address}) inserts a NEW row in
      // stock_location_address every call (it doesn't update the linked
      // row in place), so naive backfill on re-runs would accumulate
      // orphaned address rows. Fresh DBs get the address at create time
      // below; existing locations are an admin responsibility from here.
      continue
    }

    const [createdLoc] = await stockLocationService.createStockLocations([
      {
        name: loc.name,
        ...(addressInput ? { address: addressInput } : {}),
      },
    ])
    if (createdLoc?.name) nameToId.set(createdLoc.name, createdLoc.id)
    created++
  }
  console.log(
    `[seed] stock locations: ${created} created, ${existing.length} pre-existing`
  )
  return nameToId
}

// ─── Sales channel ↔ stock location link ────────────────────────────────────
// Medusa's cart flow requires the sales channel to be linked to at least one
// stock location for every variant the cart references — otherwise
// POST /store/carts/:id/line-items errors with
// "Sales channel <id> is not associated with any stock location for variant".
// Live store has this link; the live fixture export doesn't capture link
// rows, so we ensure them here. List-before-create via remoteLink.list,
// idempotent across re-runs.
async function ensureSalesChannelStockLocationLinks(
  remoteLink: Link,
  defaultSalesChannelId: string,
  stockLocationIds: string[]
): Promise<{ created: number; preExisting: number }> {
  let created = 0
  let preExisting = 0
  for (const slId of stockLocationIds) {
    const linkDef = {
      [Modules.SALES_CHANNEL]: { sales_channel_id: defaultSalesChannelId },
      [Modules.STOCK_LOCATION]: { stock_location_id: slId },
    }
    const existing = await remoteLink.list(linkDef)
    if (existing.length > 0) {
      preExisting++
      continue
    }
    await remoteLink.create(linkDef)
    created++
  }
  console.log(
    `[seed] sc↔sl: ${created} link(s) created, ${preExisting} pre-existing (channel=${defaultSalesChannelId}, locations=${stockLocationIds.length})`
  )
  return { created, preExisting }
}

// ─── Shipping profile (presence ensure; options themselves are skipped) ─────
async function ensureShippingProfiles(
  fulfillmentService: IFulfillmentModuleService,
  fixture: Fixture
): Promise<Map<string, string>> {
  const nameToId = new Map<string, string>()
  if (fixture.shipping_profiles.length === 0) return nameToId

  const existing = await fulfillmentService.listShippingProfiles(
    {},
    { take: 100, select: ["id", "name"] }
  )
  for (const p of existing) {
    if (p.name) nameToId.set(p.name, p.id)
  }

  let created = 0
  for (const profile of fixture.shipping_profiles) {
    if (!profile.name || nameToId.has(profile.name)) continue
    const [c] = await fulfillmentService.createShippingProfiles([
      { name: profile.name, type: profile.type ?? "default" },
    ])
    if (c?.name) nameToId.set(c.name, c.id)
    created++
  }
  console.log(
    `[seed] shipping profiles: ${created} created, ${existing.length} pre-existing`
  )
  return nameToId
}

// ─── Brands (custom Sama Link module) ───────────────────────────────────────
async function ensureBrands(
  brandService: BrandModuleService,
  fixture: Fixture
): Promise<Map<string, string>> {
  const handleToId = new Map<string, string>()
  if (fixture.brands.length === 0) return handleToId

  // Same select-explicit pattern used elsewhere — Medusa's default DTO can
  // omit handle from list responses and silently break idempotency.
  const existing = await brandService.listBrands(
    {},
    { take: 1000, select: ["id", "handle"] }
  )
  for (const b of existing as Array<{ id: string; handle: string }>) {
    if (b.handle) handleToId.set(b.handle, b.id)
  }
  const preExisting = handleToId.size

  let created = 0
  for (const fb of fixture.brands) {
    if (!fb.handle) continue
    if (handleToId.has(fb.handle)) continue

    // Defensive per-handle re-check — same rationale as ensureCategories.
    const [perHandle] = (await brandService.listBrands(
      { handle: fb.handle },
      { take: 1, select: ["id", "handle"] }
    )) as Array<{ id: string; handle: string }>
    if (perHandle) {
      handleToId.set(perHandle.handle, perHandle.id)
      continue
    }

    const [b] = (await brandService.createBrands([
      {
        name: fb.name ?? fb.handle,
        handle: fb.handle,
        description: fb.description,
        image_url: fb.image_url,
      },
    ])) as Array<{ id: string; handle: string }>
    if (b?.handle) handleToId.set(b.handle, b.id)
    created++
  }
  console.log(
    `[seed] brands: ${created} created, ${preExisting} pre-existing, ${handleToId.size} total`
  )
  return handleToId
}

// ─── Store settings ─────────────────────────────────────────────────────────
// Updates the singleton Medusa store with the live-derived name, supported
// currencies, and default region/sales-channel. Idempotent — safe to call
// every run because the desired state is identical each time.
async function ensureStoreSettings(
  storeService: IStoreModuleService,
  query: RemoteQueryFunction,
  fixture: Fixture,
  defaultRegionId: string,
  defaultSalesChannelId: string
): Promise<void> {
  if (!fixture.store) return
  // NOTE: Medusa v2's StoreModuleService doesn't expose listStores (only
  // createStores/upsertStores/updateStores). Reading goes through the
  // remote query, which supports the `supported_currencies.*` field path.
  console.log("[seed] store: reading current store via query.graph")
  const { data: stores } = await query.graph({
    entity: "store",
    fields: [
      "id",
      "name",
      "default_region_id",
      "default_sales_channel_id",
      "supported_currencies.currency_code",
      "supported_currencies.is_default",
    ],
  })
  console.log(`[seed] store: query.graph returned ${stores?.length ?? 0} store(s)`)
  if (!stores || stores.length === 0) {
    console.log(
      "[seed] store: no store found — Medusa should auto-create one on boot. Skipping."
    )
    return
  }
  const store = stores[0] as {
    id: string
    name: string
    default_region_id: string | null
    default_sales_channel_id: string | null
    supported_currencies?: Array<{ currency_code: string; is_default: boolean }>
  }

  const desiredName = fixture.store.name ?? store.name
  const desiredCurrencies = fixture.store.supported_currencies
    .filter((c) => c.currency_code)
    .map((c) => ({
      currency_code: c.currency_code!,
      is_default: c.is_default,
    }))

  // Compute whether anything actually needs updating, so the log line is
  // truthful and we avoid touching the row on no-op runs.
  const currentCurrencies = (store.supported_currencies ?? [])
    .map((c) => `${c.currency_code}:${c.is_default ? "1" : "0"}`)
    .sort()
    .join(",")
  const wantedCurrencies = desiredCurrencies
    .map((c) => `${c.currency_code}:${c.is_default ? "1" : "0"}`)
    .sort()
    .join(",")

  const nameMatches = store.name === desiredName
  const currenciesMatch =
    desiredCurrencies.length === 0 || currentCurrencies === wantedCurrencies
  const regionMatches = store.default_region_id === defaultRegionId
  const channelMatches = store.default_sales_channel_id === defaultSalesChannelId

  if (nameMatches && currenciesMatch && regionMatches && channelMatches) {
    console.log(
      `[seed] store: '${store.name}' already up-to-date (default_currency=${desiredCurrencies.find((c) => c.is_default)?.currency_code ?? "(none)"})`
    )
    return
  }

  // NOTE: Medusa v2's StoreModuleService.updateStores requires the
  // (id, data) two-argument form to actually persist. The single-object
  // and array forms silently no-op (Mikro-ORM treats every key as a
  // filter, matches zero rows, and returns success without writing).
  // Verified against the live DB: only this signature changes the row.
  await (storeService.updateStores as unknown as (
    id: string,
    data: Record<string, unknown>
  ) => Promise<unknown>)(store.id, {
    name: desiredName,
    ...(desiredCurrencies.length > 0
      ? { supported_currencies: desiredCurrencies }
      : {}),
    default_region_id: defaultRegionId,
    default_sales_channel_id: defaultSalesChannelId,
  })
  console.log(
    `[seed] store: updated name='${desiredName}', default_currency=${desiredCurrencies.find((c) => c.is_default)?.currency_code ?? "(unchanged)"}, default_region=${defaultRegionId}, default_sales_channel=${defaultSalesChannelId}`
  )
}

// ─── Service zones + shipping options ───────────────────────────────────────
// Matches fixture fulfillment_sets to local ones by name (Medusa auto-creates
// fulfillment_sets named "<location-name> shipping" / "<location-name> pick
// up" when a stock_location is created). For each matched fulfillment_set,
// ensures the fixture's service_zones (with geo_zones) exist. Then ensures
// shipping_options exist, looking up profile_id by name and service_zone_id
// by name. Anything that can't be resolved is skipped with a clear warning.
async function ensureFulfillmentAndShipping(
  fulfillmentService: IFulfillmentModuleService,
  fixture: Fixture,
  shippingProfilesByName: Map<string, string>
): Promise<{
  zonesCreated: number
  zonesPreExisting: number
  optionsCreated: number
  optionsSkipped: number
  optionsPreExisting: number
}> {
  let zonesCreated = 0
  let zonesPreExisting = 0
  let optionsCreated = 0
  let optionsSkipped = 0

  // Match local fulfillment_sets by name.
  const localSets = (await fulfillmentService.listFulfillmentSets(
    {},
    { take: 100, select: ["id", "name", "type"] }
  )) as Array<{ id: string; name: string; type: string }>
  const localSetsByName = new Map(
    localSets.filter((s) => s.name).map((s) => [s.name, s])
  )

  // Build zone-name → zone-id map across all matched sets.
  const zoneNameToId = new Map<string, string>()

  for (const loc of fixture.stock_locations) {
    for (const fs of loc.fulfillment_sets) {
      if (!fs.name) continue
      const localSet = localSetsByName.get(fs.name)
      if (!localSet) {
        console.log(
          `[seed] fulfillment set '${fs.name}' not present locally — skipping its service zones`
        )
        continue
      }
      const localZones = (await fulfillmentService.listServiceZones(
        { fulfillment_set_id: localSet.id },
        { take: 100, select: ["id", "name"] }
      )) as Array<{ id: string; name: string }>
      const localZonesByName = new Map(
        localZones.filter((z) => z.name).map((z) => [z.name, z])
      )

      for (const fz of fs.service_zones) {
        if (!fz.name) continue
        const existingZone = localZonesByName.get(fz.name)
        if (existingZone) {
          zoneNameToId.set(fz.name, existingZone.id)
          zonesPreExisting++
          continue
        }
        const geoZones = fz.geo_zones
          .filter((gz) => gz.country_code)
          .map((gz) => ({
            type: (gz.type ?? "country") as "country",
            country_code: gz.country_code!,
          }))
        try {
          const created = await fulfillmentService.createServiceZones({
            name: fz.name,
            fulfillment_set_id: localSet.id,
            ...(geoZones.length > 0 ? { geo_zones: geoZones } : {}),
          })
          const z = (Array.isArray(created) ? created[0] : created) as
            | { id: string; name: string }
            | undefined
          if (z?.name) {
            zoneNameToId.set(z.name, z.id)
            zonesCreated++
          }
        } catch (e) {
          console.log(
            `[seed] service zone '${fz.name}' creation failed: ${(e as Error).message} — skipping`
          )
        }
      }
    }
  }

  console.log(
    `[seed] service zones: ${zonesCreated} created, ${zonesPreExisting} pre-existing, ${zoneNameToId.size} total`
  )

  // Now shipping options.
  const localOptions = (await fulfillmentService.listShippingOptions(
    {},
    { take: 200, select: ["id", "name"] }
  )) as Array<{ id: string; name: string }>
  const localOptionNames = new Set(
    localOptions.filter((o) => o.name).map((o) => o.name)
  )

  for (const fo of fixture.shipping_options) {
    if (!fo.name) continue
    if (localOptionNames.has(fo.name)) continue

    if (!fo.service_zone?.name) {
      console.log(
        `[seed] shipping option '${fo.name}' has no service_zone — skipping`
      )
      optionsSkipped++
      continue
    }
    const zoneId = zoneNameToId.get(fo.service_zone.name)
    if (!zoneId) {
      console.log(
        `[seed] shipping option '${fo.name}' references unresolved service_zone='${fo.service_zone.name}' — skipping`
      )
      optionsSkipped++
      continue
    }
    const profileId = fo.profile_name
      ? shippingProfilesByName.get(fo.profile_name)
      : undefined
    if (!profileId) {
      console.log(
        `[seed] shipping option '${fo.name}' references unresolved profile='${fo.profile_name}' — skipping`
      )
      optionsSkipped++
      continue
    }

    // Dedupe prices (live often duplicates the same {amount, currency}).
    const seenPriceKeys = new Set<string>()
    const prices: Array<{ amount: number; currency_code: string }> = []
    for (const p of fo.prices) {
      if (typeof p.amount !== "number" || !p.currency_code) continue
      const k = `${p.amount}::${p.currency_code}`
      if (seenPriceKeys.has(k)) continue
      seenPriceKeys.add(k)
      prices.push({ amount: p.amount, currency_code: p.currency_code })
    }

    const optionType = fo.type
      ? {
          label: fo.type.label ?? fo.name,
          code: fo.type.code ?? fo.name.toLowerCase().replace(/\s+/g, "_"),
          description: fo.type.description ?? "",
        }
      : {
          label: fo.name,
          code: fo.name.toLowerCase().replace(/\s+/g, "_"),
          description: "",
        }

    try {
      await fulfillmentService.createShippingOptions({
        name: fo.name,
        price_type: (fo.price_type ?? "flat") as "flat" | "calculated",
        service_zone_id: zoneId,
        shipping_profile_id: profileId,
        provider_id: fo.provider_id ?? "manual_manual",
        type: optionType,
        prices,
        rules: fo.rules
          .filter((r) => r.attribute && r.operator)
          .map((r) => ({
            attribute: r.attribute!,
            operator: r.operator!,
            value: r.value as string,
          })),
      })
      optionsCreated++
    } catch (e) {
      console.log(
        `[seed] shipping option '${fo.name}' creation failed: ${(e as Error).message} — skipping`
      )
      optionsSkipped++
    }
  }

  console.log(
    `[seed] shipping options: ${optionsCreated} created, ${optionsSkipped} skipped, ${localOptions.length} pre-existing`
  )
  return {
    zonesCreated,
    zonesPreExisting,
    optionsCreated,
    optionsSkipped,
    optionsPreExisting: localOptions.length,
  }
}

// ─── Product → brand link sweep ─────────────────────────────────────────────
// Updates product.metadata.brand_id for every fixture product whose brand
// link is missing or wrong. Preserves all other metadata keys. Idempotent —
// products that already have the correct brand_id are skipped.
async function ensureProductBrandLinks(
  productModuleService: IProductModuleService,
  fixture: Fixture,
  brandHandleToId: Map<string, string>
): Promise<{ updated: number; skipped: number }> {
  const expectedByHandle = new Map<string, string>()
  for (const fp of fixture.products) {
    if (!fp.handle || !fp.brand_handle) continue
    const bid = brandHandleToId.get(fp.brand_handle)
    if (bid) expectedByHandle.set(fp.handle, bid)
  }
  if (expectedByHandle.size === 0) return { updated: 0, skipped: 0 }

  let updated = 0
  let skipped = 0
  let offset = 0

  for (;;) {
    const page = (await productModuleService.listProducts(
      {},
      { take: 200, skip: offset, select: ["id", "handle", "metadata"] }
    )) as Array<{
      id: string
      handle: string | null
      metadata: Record<string, unknown> | null
    }>

    const updates: Array<{ id: string; metadata: Record<string, unknown> }> = []
    for (const p of page) {
      if (!p.handle) continue
      const expectedBid = expectedByHandle.get(p.handle)
      if (!expectedBid) continue
      const meta =
        p.metadata && typeof p.metadata === "object" ? { ...p.metadata } : {}
      if (meta.brand_id === expectedBid) {
        skipped++
        continue
      }
      meta.brand_id = expectedBid
      updates.push({ id: p.id, metadata: meta })
    }

    // updateProducts([...]) hits the same Mikro-ORM array-as-filter bug
    // observed on updateStores. Update one at a time — slow on the first
    // sweep (~917 calls) but a fast no-op on every re-run.
    for (const u of updates) {
      await productModuleService.updateProducts(u.id, { metadata: u.metadata })
      updated++
    }

    if (page.length < 200) break
    offset += page.length
  }

  console.log(
    `[seed] brand links: updated metadata.brand_id on ${updated} products (${skipped} already correct)`
  )
  return { updated, skipped }
}

// ─── Categories (parents-first iterative ensure) ────────────────────────────
async function ensureCategories(
  productModuleService: IProductModuleService,
  fixture: Fixture
): Promise<Map<string, string>> {
  const handleToId = new Map<string, string>()
  if (fixture.product_categories.length === 0) return handleToId

  // Medusa v2's list services return a minimal field set by default; we MUST
  // request `handle` explicitly or every row comes back with handle=undefined
  // and the idempotency map stays empty.
  const existing = await productModuleService.listProductCategories(
    {},
    { take: 1000, select: ["id", "handle"] }
  )
  for (const c of existing) {
    if (c.handle) handleToId.set(c.handle, c.id)
  }
  const preExistingCount = handleToId.size

  // Topological create: keep looping while progress is being made. Each
  // pass creates only categories whose parent (if any) is resolved.
  //
  // We do a defensive per-handle lookup before every create. Medusa v2's
  // bulk listProductCategories() applies tree-aware default scoping and
  // intermittently omits categories from the pre-fetch (observed: a root
  // category like "systems" missing from the bulk result), which would
  // otherwise break idempotency by trying to create a duplicate. The
  // per-handle list is unambiguous and adds ~26 queries on a re-run.
  const remaining = fixture.product_categories.filter(
    (c) => c.handle && !handleToId.has(c.handle)
  )
  let createdTotal = 0
  while (remaining.length > 0) {
    const before = remaining.length
    for (let i = remaining.length - 1; i >= 0; i--) {
      const cat = remaining[i]!
      if (cat.parent_handle && !handleToId.has(cat.parent_handle)) continue

      const [perHandle] = await productModuleService.listProductCategories(
        { handle: cat.handle! },
        { take: 1, select: ["id", "handle"] }
      )
      if (perHandle) {
        handleToId.set(perHandle.handle, perHandle.id)
        remaining.splice(i, 1)
        continue
      }

      const parentId = cat.parent_handle
        ? handleToId.get(cat.parent_handle)!
        : undefined
      const [created] = await productModuleService.createProductCategories([
        {
          name: cat.name ?? cat.handle!,
          handle: cat.handle!,
          is_active: cat.is_active,
          rank: cat.rank,
          ...(parentId ? { parent_category_id: parentId } : {}),
        },
      ])
      handleToId.set(created.handle, created.id)
      createdTotal++
      remaining.splice(i, 1)
    }
    if (remaining.length === before) {
      console.log(
        `[seed] categories: WARNING ${remaining.length} categories have unresolved parents and were skipped: ${remaining.map((c) => c.handle).join(", ")}`
      )
      break
    }
  }
  console.log(
    `[seed] categories: ${createdTotal} created, ${handleToId.size - createdTotal} pre-existing, ${handleToId.size} total`
  )
  return handleToId
}

// ─── Tags (bulk ensure) ──────────────────────────────────────────────────────
async function ensureTags(
  productModuleService: IProductModuleService,
  fixture: Fixture
): Promise<Map<string, string>> {
  const valueToId = new Map<string, string>()
  if (fixture.product_tags.length === 0) return valueToId

  const existing = await productModuleService.listProductTags(
    {},
    { take: 5000, select: ["id", "value"] }
  )
  for (const t of existing) {
    if (t.value) valueToId.set(t.value, t.id)
  }
  const preExistingCount = valueToId.size

  const missing = fixture.product_tags.filter(
    (t) => t.value && !valueToId.has(t.value)
  )
  let createdTotal = 0
  for (let i = 0; i < missing.length; i += TAG_CREATE_BATCH) {
    const batch = missing.slice(i, i + TAG_CREATE_BATCH)
    const created = await productModuleService.createProductTags(
      batch.map((t) => ({ value: t.value! }))
    )
    const arr = Array.isArray(created) ? created : [created]
    for (const t of arr) {
      if (t.value) valueToId.set(t.value, t.id)
    }
    createdTotal += arr.length
  }
  console.log(
    `[seed] tags: ${createdTotal} created, ${preExistingCount} pre-existing, ${valueToId.size} total`
  )
  return valueToId
}

// ─── Products (bulk ensure with categories, tags, sales channel, images) ────
type EnsureProductsResult = {
  created: number
  preExisting: number
  skippedNoVariants: number
  skippedNoSku: number
}

async function ensureProducts(
  productModuleService: IProductModuleService,
  fixture: Fixture,
  categoryHandleToId: Map<string, string>,
  tagValueToId: Map<string, string>,
  brandHandleToId: Map<string, string>,
  defaultSalesChannelId: string
): Promise<EnsureProductsResult> {
  // Pre-fetch existing handles (paginate in case there are many).
  // Explicit `select` is required — Medusa's default DTO omits `handle`.
  const existingHandles = new Set<string>()
  let offset = 0
  for (;;) {
    const page = await productModuleService.listProducts(
      {},
      { take: 200, skip: offset, select: ["id", "handle"] }
    )
    for (const p of page) {
      if (p.handle) existingHandles.add(p.handle)
    }
    if (page.length < 200) break
    offset += page.length
  }

  let skippedNoSku = 0
  let skippedNoVariants = 0
  const toCreate: CreateProductDTO[] = []

  for (const fp of fixture.products) {
    if (!fp.handle || existingHandles.has(fp.handle)) continue

    // Build variants. Skip variants with no SKU — SKU is the natural
    // idempotency key for variant pricing on subsequent runs.
    const variants = fp.variants
      .filter((v) => {
        if (!v.sku) {
          skippedNoSku++
          return false
        }
        return true
      })
      .map((v) => ({
        title: v.title ?? "Default",
        sku: v.sku!,
        options: v.options,
        prices: (v.prices ?? [])
          .filter((p) => p.amount !== null && p.currency_code)
          .map((p) => ({
            amount: p.amount!,
            currency_code: p.currency_code!.toLowerCase(),
          })),
      }))

    if (variants.length === 0) {
      skippedNoVariants++
      continue
    }

    const categoryIds = fp.category_handles
      .map((h) => categoryHandleToId.get(h))
      .filter((id): id is string => Boolean(id))
    const tagIds = fp.tag_values
      .map((v) => tagValueToId.get(v))
      .filter((id): id is string => Boolean(id))
    const brandId =
      fp.brand_handle && brandHandleToId.get(fp.brand_handle)
        ? brandHandleToId.get(fp.brand_handle)
        : undefined

    const input: CreateProductDTO = {
      title: fp.title ?? fp.handle,
      handle: fp.handle,
      status: fp.status ?? "published",
      ...(fp.subtitle ? { subtitle: fp.subtitle } : {}),
      ...(fp.description ? { description: fp.description } : {}),
      ...(fp.thumbnail ? { thumbnail: fp.thumbnail } : {}),
      ...(fp.images.length
        ? { images: fp.images.map((i) => ({ url: i.url })) }
        : {}),
      ...(categoryIds.length ? { category_ids: categoryIds } : {}),
      ...(tagIds.length ? { tag_ids: tagIds } : {}),
      // The Sama Link brand link is stored as metadata.brand_id (string) —
      // see apps/backend/src/admin/widgets/sama-product-brand-picker.tsx.
      ...(brandId ? { metadata: { brand_id: brandId } } : {}),
      sales_channels: [{ id: defaultSalesChannelId }],
      options:
        fp.options.length > 0
          ? fp.options.map((o) => ({
              title: o.title ?? "Title",
              values: o.values.length > 0 ? o.values : ["Default"],
            }))
          : [{ title: "Title", values: ["Default"] }],
      variants,
    }
    toCreate.push(input)
  }

  let createdTotal = 0
  for (let i = 0; i < toCreate.length; i += PRODUCT_CREATE_BATCH) {
    const batch = toCreate.slice(i, i + PRODUCT_CREATE_BATCH)
    await productModuleService.createProducts(batch)
    createdTotal += batch.length
    if (
      createdTotal % (PRODUCT_CREATE_BATCH * 4) === 0 ||
      createdTotal === toCreate.length
    ) {
      console.log(
        `[seed] products: created ${createdTotal}/${toCreate.length}`
      )
    }
  }

  return {
    created: createdTotal,
    preExisting: existingHandles.size,
    skippedNoVariants,
    skippedNoSku,
  }
}

// ─── Variant pricing sweep ──────────────────────────────────────────────────
// Kept from prior seed (with batched query.graph) so partial prior runs that
// created products without prices still converge on a fully-priced catalog.
type VariantPriceGraphRow = {
  id: string
  sku?: string | null
  price_set?: {
    id: string
    prices?: Array<{
      currency_code?: string | null
      amount?: number | string | null
    }>
  } | null
}

async function ensureVariantPricesByGraph(
  pricingModuleService: IPricingModuleService,
  remoteLink: Link,
  query: RemoteQueryFunction,
  region: RegionDTO,
  fixture: Fixture
): Promise<{ added: number; createdSets: number }> {
  const skuToAmount = new Map<string, number>()
  for (const fp of fixture.products) {
    for (const v of fp.variants) {
      if (!v.sku) continue
      const egp = v.prices.find(
        (p) => p.currency_code?.toLowerCase() === SEED_CURRENCY
      )
      if (egp && egp.amount !== null) skuToAmount.set(v.sku, egp.amount)
    }
  }
  if (skuToAmount.size === 0) return { added: 0, createdSets: 0 }

  const allSkus = Array.from(skuToAmount.keys())
  let added = 0
  let createdSets = 0

  for (let i = 0; i < allSkus.length; i += PRICING_GRAPH_BATCH) {
    const skus = allSkus.slice(i, i + PRICING_GRAPH_BATCH)
    const { data: rows } = await query.graph({
      entity: "variant",
      fields: [
        "id",
        "sku",
        "price_set.id",
        "price_set.prices.currency_code",
        "price_set.prices.amount",
      ],
      filters: { sku: skus },
      context: {
        currency_code: SEED_CURRENCY,
        region_id: region.id,
      },
    })

    for (const row of (rows ?? []) as VariantPriceGraphRow[]) {
      if (!row.sku) continue
      const expected = skuToAmount.get(row.sku)
      if (expected === undefined) continue
      const hasEgp = row.price_set?.prices?.some(
        (p) =>
          p.currency_code?.toLowerCase() === SEED_CURRENCY &&
          p.amount !== null &&
          p.amount !== undefined &&
          p.amount !== ""
      )
      if (hasEgp) continue

      const existingPriceSetId = row.price_set?.id
      if (existingPriceSetId) {
        await pricingModuleService.addPrices({
          priceSetId: existingPriceSetId,
          prices: [
            { amount: expected, currency_code: SEED_CURRENCY, rules: {} },
          ],
        })
        added++
      } else {
        const priceSet = await pricingModuleService.createPriceSets({
          prices: [
            { amount: expected, currency_code: SEED_CURRENCY, rules: {} },
          ],
        })
        await remoteLink.create([
          {
            [Modules.PRODUCT]: { variant_id: row.id },
            [Modules.PRICING]: { price_set_id: priceSet.id },
          },
        ])
        createdSets++
        added++
      }
    }
  }

  return { added, createdSets }
}

// ─── Publishable key (always-link, regardless of key creation) ──────────────
// The link `publishable_api_key_sales_channel` is what Medusa's middleware
// checks on every /store/* request — a key without it triggers
// "Publishable key needs to have a sales channel configured" and the
// storefront cart bootstrap fails. The link can drift out of the key for
// reasons outside this seed's control (admin actions, soft-deletes during
// channel rebuilds, prior seed iterations). So: every run we also list the
// link and create it if absent, not just when the key itself is new.
//
// Title resolution: prefer STOREFRONT_KEY_TITLE; fall back to ANY existing
// publishable key. The fallback handles repos that were seeded before this
// title was standardised (the live DB had one titled simply "Storefront").
// We never delete or rename the existing key — operators may have wired it
// into env files already.
async function ensureStorefrontPublishableKey(
  apiKeyModuleService: IApiKeyModuleService,
  defaultSalesChannelId: string,
  remoteLink: Link
): Promise<string> {
  let candidates = await apiKeyModuleService.listApiKeys({
    title: STOREFRONT_KEY_TITLE,
    type: "publishable",
  })
  let key = candidates[0]

  if (!key) {
    // Fallback: reuse any existing publishable key (legacy title etc.).
    const fallback = await apiKeyModuleService.listApiKeys({
      type: "publishable",
    })
    key = fallback[0]
    if (key) {
      console.log(
        `[seed] publishable key: reusing existing key (title='${key.title}') -> ${key.token}`
      )
    }
  } else {
    console.log(
      `[seed] publishable key '${STOREFRONT_KEY_TITLE}' already exists -> ${key.token}`
    )
  }

  if (!key) {
    const created = await apiKeyModuleService.createApiKeys({
      title: STOREFRONT_KEY_TITLE,
      type: "publishable",
      created_by: "seed",
    })
    key = Array.isArray(created) ? created[0]! : created
    console.log(
      `[seed] created publishable key '${STOREFRONT_KEY_TITLE}' -> ${key.token}`
    )
  }

  // Always-on link check — survives prior key/channel rebuilds where the
  // link table got cleared without our seeing it.
  const linkDef = {
    [Modules.API_KEY]: { publishable_key_id: key.id },
    [Modules.SALES_CHANNEL]: { sales_channel_id: defaultSalesChannelId },
  }
  const existingLink = await remoteLink.list(linkDef)
  if (existingLink.length === 0) {
    await remoteLink.create(linkDef)
    console.log(
      `[seed] linked publishable key ${key.id} <-> sales channel ${defaultSalesChannelId}`
    )
  } else {
    console.log(
      `[seed] publishable key ${key.id} already linked to sales channel ${defaultSalesChannelId}`
    )
  }
  return key.token
}

// ─── Local-dev variants: take out of inventory management ───────────────────
// The live fixture doesn't capture inventory_items / inventory_levels (the
// live admin API didn't expose them), so any variant left at the live
// default (manage_inventory=true) cannot be added to a cart locally —
// Medusa needs an inventory_level row at a stock location reachable by the
// sales channel. Production deploys solve this through the admin UI; for
// the local seed we flip every variant to manage_inventory=false. This is a
// dev-only convenience and is fully reversible from the admin.
/** Stable pseudo-random score so re-seeding picks the same 50 handles for special-offer tagging. */
function hashProductIdForSample(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(31, h) + id.charCodeAt(i)
  }
  return Math.abs(h >>> 0)
}

// Tag exactly `SPECIAL_OFFER_SAMPLE_COUNT` published products with the
// `special_offer` catalog label (metadata.sama_labels). Idempotent: products
// that already include the label are skipped; the same 50 IDs are preferred
// across runs via deterministic ordering by hash(id).
const SPECIAL_OFFER_SAMPLE_COUNT = 50

async function ensureSpecialOfferLabelsOnSample(
  productModuleService: IProductModuleService
): Promise<{ tagged: number; skippedAlready: number }> {
  type Row = { id: string; metadata: Record<string, unknown> | null }
  const rows: Row[] = []
  let offset = 0
  for (;;) {
    const page = (await productModuleService.listProducts(
      {},
      { take: 200, skip: offset, select: ["id", "metadata", "status"] }
    )) as Array<Row & { status?: string }>
    for (const r of page) {
      if (r.status === "published") {
        rows.push({ id: r.id, metadata: r.metadata })
      }
    }
    if (page.length < 200) break
    offset += page.length
  }

  const scored = rows.map((r) => ({
    ...r,
    score: hashProductIdForSample(r.id),
  }))
  scored.sort((a, b) => a.score - b.score)
  const picked = scored.slice(0, SPECIAL_OFFER_SAMPLE_COUNT)

  let tagged = 0
  let skippedAlready = 0
  const label = PRODUCT_LABEL_SLUGS.SPECIAL_OFFER

  for (const p of picked) {
    const meta =
      p.metadata && typeof p.metadata === "object" ? { ...p.metadata } : {}
    const labels = parseSamaLabels(meta)
    if (labels.includes(label)) {
      skippedAlready++
      continue
    }
    const next = serializeSamaLabels([...labels, label])
    meta[SAMA_LABELS_METADATA_KEY] = next
    await productModuleService.updateProducts(p.id, { metadata: meta })
    tagged++
  }

  console.log(
    `[seed] catalog labels: special_offer on ${tagged} products (${skippedAlready} already tagged in sample set, ${rows.length} published total)`
  )
  return { tagged, skippedAlready }
}

async function ensureVariantsPurchasableLocally(
  productModuleService: IProductModuleService
): Promise<{ updated: number; alreadyOk: number }> {
  // listProductVariants without an explicit `manage_inventory` filter
  // because filtering on a boolean across the whole catalog is fast
  // enough and avoids any module-specific filter-spelling quirks.
  // Explicit select keeps the response payload small.
  const allVariants = (await productModuleService.listProductVariants(
    {},
    { take: 100000, select: ["id", "manage_inventory"] }
  )) as Array<{ id: string; manage_inventory: boolean }>

  const toFlip = allVariants
    .filter((v) => v.manage_inventory)
    .map((v) => v.id)
  const alreadyOk = allVariants.length - toFlip.length

  if (toFlip.length === 0) {
    console.log(
      `[seed] variants: ${alreadyOk} variants already have manage_inventory=false`
    )
    return { updated: 0, alreadyOk }
  }

  // Use the (selector, data) overload — single SQL UPDATE under the hood,
  // unlike updateProducts where the array form silently no-ops (see
  // Medusa-quirks notes in docs/development/local-seed.md).
  await productModuleService.updateProductVariants(
    { id: toFlip },
    { manage_inventory: false }
  )
  console.log(
    `[seed] variants: flipped ${toFlip.length} to manage_inventory=false (${alreadyOk} already ok)`
  )
  return { updated: toFlip.length, alreadyOk }
}

// ─── Final summary (kept from prior seed; augmented with new counts) ────────
function printLocalSummary(args: {
  regionId: string
  publishableToken: string
  fixture: Fixture
  productResult: EnsureProductsResult
  pricingAdded: number
  brandsTotal: number
  brandLinksUpdated: number
  zonesCreated: number
  optionsCreated: number
  optionsSkipped: number
}): void {
  const adminEmail = process.env["MEDUSA_ADMIN_EMAIL"] ?? "admin@example.com"
  const storeName = args.fixture.store?.name ?? "(unchanged)"
  const defaultCurrency =
    args.fixture.store?.supported_currencies.find((c) => c.is_default)
      ?.currency_code ?? args.fixture.store?.default_currency_code ?? "(unset)"

  const lines = [
    "",
    "============================================================",
    "[seed] Local development summary",
    "============================================================",
    "Admin URL:               http://localhost:9000/app",
    `Admin email:             ${adminEmail}`,
    "Admin password:          (from MEDUSA_ADMIN_PASSWORD in apps/backend/.env)",
    `Region ID:               ${args.regionId}`,
    `Publishable API key:     ${args.publishableToken}`,
    "",
    "Store (from live-store-setup.json):",
    `  Name:                      ${storeName}`,
    `  Default currency:          ${defaultCurrency}`,
    "",
    "Catalog (from live-store-setup.json):",
    `  Products created:          ${args.productResult.created}`,
    `  Products pre-existing:     ${args.productResult.preExisting}`,
    `  Products skipped:          ${args.productResult.skippedNoVariants} (no usable variants)`,
    `  Variants skipped (no SKU): ${args.productResult.skippedNoSku}`,
    `  Variant prices added:      ${args.pricingAdded}`,
    `  Categories in fixture:     ${args.fixture.product_categories.length}`,
    `  Tags in fixture:           ${args.fixture.product_tags.length}`,
    `  Brands in DB:              ${args.brandsTotal}`,
    `  Brand links updated:       ${args.brandLinksUpdated}`,
    "",
    "Fulfillment (from live-store-setup.json):",
    `  Service zones created:     ${args.zonesCreated}`,
    `  Shipping options created:  ${args.optionsCreated}`,
    `  Shipping options skipped:  ${args.optionsSkipped}`,
    "",
    "Paste these lines into apps/storefront/.env.local:",
    "------------------------------------------------------------",
    "NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000",
    "NEXT_PUBLIC_BASE_URL=http://localhost:3000",
    "NEXT_PUBLIC_DEFAULT_LOCALE=ar",
    `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY=${args.publishableToken}`,
    `NEXT_PUBLIC_MEDUSA_REGION_ID=${args.regionId}`,
    "============================================================",
    "",
  ]
  for (const line of lines) console.log(line)
}

// ─── Entry point ─────────────────────────────────────────────────────────────
export default async function seed({ container }: ExecArgs): Promise<void> {
  console.log("[seed] starting local-baseline seed (live-derived fixture)")

  const fixture = await loadFixture()

  const productModuleService = container.resolve<IProductModuleService>(
    Modules.PRODUCT
  )
  const regionModuleService = container.resolve<IRegionModuleService>(
    Modules.REGION
  )
  const pricingModuleService = container.resolve<IPricingModuleService>(
    Modules.PRICING
  )
  const salesChannelModuleService = container.resolve<ISalesChannelModuleService>(
    Modules.SALES_CHANNEL
  )
  const apiKeyModuleService = container.resolve<IApiKeyModuleService>(
    Modules.API_KEY
  )
  const stockLocationService = container.resolve<IStockLocationService>(
    Modules.STOCK_LOCATION
  )
  const fulfillmentService = container.resolve<IFulfillmentModuleService>(
    Modules.FULFILLMENT
  )
  const storeService = container.resolve<IStoreModuleService>(Modules.STORE)
  const brandService = container.resolve<BrandModuleService>(BRAND_MODULE)
  const remoteLink = container.resolve<Link>(ContainerRegistrationKeys.LINK)
  const query = container.resolve<RemoteQueryFunction>(
    ContainerRegistrationKeys.QUERY
  )

  await suppressDemoProducts(productModuleService)

  const region = await ensureDefaultRegion(regionModuleService)
  const defaultSalesChannelId = await resolveDefaultSalesChannelId(
    salesChannelModuleService
  )

  // Store-level settings depend on region + sales channel IDs being
  // resolved, so this runs after both ensure-steps above. Idempotent.
  await ensureStoreSettings(
    storeService,
    query,
    fixture,
    region.id,
    defaultSalesChannelId
  )

  const stockLocationNameToId = await ensureStockLocations(
    stockLocationService,
    fixture
  )
  await ensureSalesChannelStockLocationLinks(
    remoteLink,
    defaultSalesChannelId,
    Array.from(stockLocationNameToId.values())
  )
  const shippingProfilesByName = await ensureShippingProfiles(
    fulfillmentService,
    fixture
  )

  // Service zones + shipping options. Skipped per-entry (with warning) if
  // anything cannot be safely resolved.
  const fulfillment = await ensureFulfillmentAndShipping(
    fulfillmentService,
    fixture,
    shippingProfilesByName
  )

  if (fixture.inventory_levels.length > 0) {
    console.log(
      `[seed] inventory levels: WARNING — fixture contains ${fixture.inventory_levels.length} but the local seed skips them (no stock_location ↔ inventory wiring in the export).`
    )
  }

  const brandHandleToId = await ensureBrands(brandService, fixture)
  const categoryHandleToId = await ensureCategories(productModuleService, fixture)
  const tagValueToId = await ensureTags(productModuleService, fixture)

  const productResult = await ensureProducts(
    productModuleService,
    fixture,
    categoryHandleToId,
    tagValueToId,
    brandHandleToId,
    defaultSalesChannelId
  )

  const pricing = await ensureVariantPricesByGraph(
    pricingModuleService,
    remoteLink,
    query,
    region,
    fixture
  )
  console.log(
    `[seed] pricing sweep: added ${pricing.added} (created ${pricing.createdSets} new price sets)`
  )

  // Backfill product → brand links for any products that pre-dated the
  // brand fixture (idempotent — skips products already correctly linked).
  const brandLinkSweep = await ensureProductBrandLinks(
    productModuleService,
    fixture,
    brandHandleToId
  )

  await ensureSpecialOfferLabelsOnSample(productModuleService)

  // Local-dev convenience — see function header. Runs after products+
  // variants are seeded so it covers freshly-created variants in this
  // same run as well as any pre-existing ones.
  await ensureVariantsPurchasableLocally(productModuleService)

  const publishableToken = await ensureStorefrontPublishableKey(
    apiKeyModuleService,
    defaultSalesChannelId,
    remoteLink
  )

  console.log("[seed] local-baseline seed completed successfully")

  printLocalSummary({
    regionId: region.id,
    publishableToken,
    fixture,
    productResult,
    pricingAdded: pricing.added,
    brandsTotal: brandHandleToId.size,
    brandLinksUpdated: brandLinkSweep.updated,
    zonesCreated: fulfillment.zonesCreated,
    optionsCreated: fulfillment.optionsCreated,
    optionsSkipped: fulfillment.optionsSkipped,
  })
}
