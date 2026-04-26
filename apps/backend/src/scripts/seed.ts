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
//     /admin/inventory-items via Admin API).
//   - fulfillment providers: registered at boot via medusa-config, not via
//     API. Verified present, not seeded.
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
  RegionDTO,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { Link } from "@medusajs/modules-sdk"
import type { RemoteQueryFunction } from "@medusajs/types"
import { promises as fs } from "fs"
import path from "path"

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
  options: FixtureProductOption[]
  variants: FixtureVariant[]
}
type FixtureSalesChannel = {
  name: string | null
  description: string | null
  is_disabled: boolean
}
type FixtureStockLocation = { name: string | null }
type FixtureShippingProfile = { name: string | null; type: string | null }
type Fixture = {
  $schema: string
  exported_at: string
  counts: Record<string, number>
  regions: FixtureRegion[]
  sales_channels: FixtureSalesChannel[]
  stock_locations: FixtureStockLocation[]
  shipping_profiles: FixtureShippingProfile[]
  fulfillment_providers: Array<{ id: string | null }>
  payment_providers: Array<{ id: string | null }>
  shipping_options: unknown[]
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
): Promise<void> {
  if (fixture.stock_locations.length === 0) return
  const existing = await stockLocationService.listStockLocations(
    {},
    { take: 100, select: ["id", "name"] }
  )
  const existingNames = new Set(existing.map((l) => l.name))
  let created = 0
  for (const loc of fixture.stock_locations) {
    if (!loc.name || existingNames.has(loc.name)) continue
    await stockLocationService.createStockLocations([{ name: loc.name }])
    created++
  }
  console.log(
    `[seed] stock locations: ${created} created, ${existing.length} pre-existing`
  )
}

// ─── Shipping profile (presence ensure; options themselves are skipped) ─────
async function ensureShippingProfiles(
  fulfillmentService: IFulfillmentModuleService,
  fixture: Fixture
): Promise<void> {
  if (fixture.shipping_profiles.length === 0) return
  const existing = await fulfillmentService.listShippingProfiles(
    {},
    { take: 100, select: ["id", "name"] }
  )
  const existingNames = new Set(existing.map((p) => p.name))
  let created = 0
  for (const profile of fixture.shipping_profiles) {
    if (!profile.name || existingNames.has(profile.name)) continue
    await fulfillmentService.createShippingProfiles([
      { name: profile.name, type: profile.type ?? "default" },
    ])
    created++
  }
  console.log(
    `[seed] shipping profiles: ${created} created, ${existing.length} pre-existing`
  )
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

// ─── Publishable key (kept from prior seed; only re-link on first creation) ─
async function ensureStorefrontPublishableKey(
  apiKeyModuleService: IApiKeyModuleService,
  defaultSalesChannelId: string,
  remoteLink: Link
): Promise<string> {
  const existing = await apiKeyModuleService.listApiKeys({
    title: STOREFRONT_KEY_TITLE,
    type: "publishable",
  })

  let key = existing[0]
  let keyWasCreated = false
  if (key) {
    console.log(
      `[seed] publishable key '${STOREFRONT_KEY_TITLE}' already exists -> ${key.token}`
    )
  } else {
    const created = await apiKeyModuleService.createApiKeys({
      title: STOREFRONT_KEY_TITLE,
      type: "publishable",
      created_by: "seed",
    })
    key = Array.isArray(created) ? created[0]! : created
    keyWasCreated = true
    console.log(
      `[seed] created publishable key '${STOREFRONT_KEY_TITLE}' -> ${key.token}`
    )
  }

  if (keyWasCreated) {
    await remoteLink.create({
      [Modules.API_KEY]: { publishable_key_id: key.id },
      [Modules.SALES_CHANNEL]: { sales_channel_id: defaultSalesChannelId },
    })
    console.log(
      `[seed] linked publishable key ${key.id} <-> sales channel ${defaultSalesChannelId}`
    )
  } else {
    console.log(
      `[seed] publishable key already linked to sales channel ${defaultSalesChannelId}`
    )
  }
  return key.token
}

// ─── Final summary (kept from prior seed; augmented with new counts) ────────
function printLocalSummary(args: {
  regionId: string
  publishableToken: string
  fixture: Fixture
  productResult: EnsureProductsResult
  pricingAdded: number
}): void {
  const adminEmail = process.env["MEDUSA_ADMIN_EMAIL"] ?? "admin@example.com"

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
    "Catalog (from live-store-setup.json):",
    `  Products created:          ${args.productResult.created}`,
    `  Products pre-existing:     ${args.productResult.preExisting}`,
    `  Products skipped:          ${args.productResult.skippedNoVariants} (no usable variants)`,
    `  Variants skipped (no SKU): ${args.productResult.skippedNoSku}`,
    `  Variant prices added:      ${args.pricingAdded}`,
    `  Categories in fixture:     ${args.fixture.product_categories.length}`,
    `  Tags in fixture:           ${args.fixture.product_tags.length}`,
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
  const remoteLink = container.resolve<Link>(ContainerRegistrationKeys.LINK)
  const query = container.resolve<RemoteQueryFunction>(
    ContainerRegistrationKeys.QUERY
  )

  await suppressDemoProducts(productModuleService)

  const region = await ensureDefaultRegion(regionModuleService)
  const defaultSalesChannelId = await resolveDefaultSalesChannelId(
    salesChannelModuleService
  )

  await ensureStockLocations(stockLocationService, fixture)
  await ensureShippingProfiles(fulfillmentService, fixture)

  // Skipped (with logged warning, per docs/development/local-seed.md):
  if (fixture.shipping_options.length > 0) {
    console.log(
      `[seed] shipping options: WARNING — fixture contains ${fixture.shipping_options.length} but the local seed skips them. Reason: live export does not capture service zones, which Medusa v2 requires to attach a shipping option safely. Catalog display is unaffected.`
    )
  }
  if (fixture.inventory_levels.length > 0) {
    console.log(
      `[seed] inventory levels: WARNING — fixture contains ${fixture.inventory_levels.length} but the local seed skips them (no stock_location ↔ inventory wiring in the export).`
    )
  }

  const categoryHandleToId = await ensureCategories(productModuleService, fixture)
  const tagValueToId = await ensureTags(productModuleService, fixture)

  const productResult = await ensureProducts(
    productModuleService,
    fixture,
    categoryHandleToId,
    tagValueToId,
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
  })
}
