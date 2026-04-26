import type {
  CreateProductDTO,
  ExecArgs,
  IApiKeyModuleService,
  IProductModuleService,
  IRegionModuleService,
  IPricingModuleService,
  ISalesChannelModuleService,
  ProductCategoryDTO,
  RegionDTO,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { Link } from "@medusajs/modules-sdk"
import type { RemoteQueryFunction } from "@medusajs/types"

type SeedProduct = Pick<CreateProductDTO, "title" | "handle" | "description"> & {
  variants: NonNullable<CreateProductDTO["variants"]>
}

const CATEGORY_HANDLE = "networking"
const CATEGORY_NAME = "Networking (تاكبش)"

const SEED_CURRENCY = "egp"
const SEED_PRICE_AMOUNT_MINOR = 15000

const DEMO_PRODUCT_HANDLES_TO_SUPPRESS = [
  "medusa-coffee-mug",
  "medusa-sweatpants",
  "test",
] as const

const PRODUCTS: SeedProduct[] = [
  {
    title: "Gigabit Switch 8-Port",
    handle: "gigabit-switch-8-port",
    description:
      "Compact unmanaged 8-port gigabit switch for stable home and office networking.",
    variants: [
      {
        title: "Standard",
        sku: "NET-SWITCH-8P-STANDARD",
      },
    ],
  },
  {
    title: "Dual-Band Wi-Fi Router AC1200",
    handle: "dual-band-wifi-router-ac1200",
    description:
      "Reliable dual-band wireless router for everyday streaming, browsing, and smart devices.",
    variants: [
      {
        title: "Standard",
        sku: "NET-ROUTER-AC1200-STANDARD",
      },
    ],
  },
  {
    title: "Cat6 Ethernet Cable 3m",
    handle: "cat6-ethernet-cable-3m",
    description:
      "High-speed Cat6 cable with durable jacket for low-latency wired connections.",
    variants: [
      {
        title: "Blue",
        sku: "NET-CAT6-3M-BLUE",
      },
    ],
  },
]

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

function placeholderImageUrl(handle: string): string {
  const text = encodeURIComponent(handle)
  return `https://placehold.co/800x600.webp?text=${text}`
}

async function ensureCategory(
  productModuleService: IProductModuleService
): Promise<ProductCategoryDTO> {
  const [existingCategory] = await productModuleService.listProductCategories(
    { handle: CATEGORY_HANDLE },
    { take: 1 }
  )

  if (existingCategory) {
    console.log(
      `[seed] Category already exists (handle=${CATEGORY_HANDLE}) -> ${existingCategory.id}`
    )
    return existingCategory
  }

  const [createdCategory] = await productModuleService.createProductCategories([
    {
      name: CATEGORY_NAME,
      handle: CATEGORY_HANDLE,
      is_active: true,
    },
  ])

  console.log(
    `[seed] Created category (handle=${CATEGORY_HANDLE}) -> ${createdCategory.id}`
  )

  return createdCategory
}

async function suppressDemoProducts(
  productModuleService: IProductModuleService
): Promise<void> {
  for (const handle of DEMO_PRODUCT_HANDLES_TO_SUPPRESS) {
    const [product] = await productModuleService.listProducts(
      { handle },
      { take: 1 }
    )

    if (!product) {
      console.log(
        `[seed] suppress: handle=${handle} not found — skip and continue`
      )
      continue
    }

    if (product.status === "draft") {
      console.log(
        `[seed] suppress: handle=${handle} already draft — skip and continue`
      )
      continue
    }

    if (product.status === "published") {
      await productModuleService.updateProducts(product.id, {
        status: "draft",
      })
      console.log(`[seed] suppress: handle=${handle} set to draft`)
    }
  }
}

async function ensureProduct(
  productModuleService: IProductModuleService,
  categoryId: string,
  product: SeedProduct
): Promise<void> {
  const [existingProduct] = await productModuleService.listProducts(
    { handle: product.handle },
    { take: 1 }
  )

  if (existingProduct) {
    console.log(
      `[seed] Product already exists (handle=${product.handle}) -> ${existingProduct.id}`
    )
    return
  }

  const createInput: CreateProductDTO = {
    title: product.title,
    handle: product.handle,
    description: product.description,
    status: "published",
    category_ids: [categoryId],
    variants: product.variants,
  }

  const [createdProduct] = await productModuleService.createProducts([createInput])

  console.log(
    `[seed] Created product (handle=${product.handle}) -> ${createdProduct.id}`
  )
}

/** Ensures an Egypt (EGP) region exists for Store `region_id` pricing context. Does not modify other regions. */
async function ensureDefaultRegion(
  regionModuleService: IRegionModuleService
): Promise<RegionDTO> {
  const [egyptRegion] = await regionModuleService.listRegions(
    { currency_code: "egp" },
    { take: 1 }
  )

  if (egyptRegion) {
    console.log(
      `[seed] Part A: Egypt region already exists -> ${egyptRegion.id} (${egyptRegion.name})`
    )
    return egyptRegion
  }

  const created = await regionModuleService.createRegions({
    name: "Egypt",
    currency_code: "egp",
    countries: ["eg"],
  })
  console.log(`[seed] Part A: created Egypt region -> ${created.id}`)

  return created
}

function variantHasLinkedSeedCurrencyPrice(
  row: VariantPriceGraphRow | undefined
): boolean {
  const prices = row?.price_set?.prices
  if (!prices?.length) {
    return false
  }
  return prices.some((p) => {
    const code = p.currency_code?.toLowerCase()
    if (code !== SEED_CURRENCY) {
      return false
    }
    return p.amount !== null && p.amount !== undefined && p.amount !== ""
  })
}

async function ensureVariantPricingForSku(
  productModuleService: IProductModuleService,
  pricingModuleService: IPricingModuleService,
  remoteLink: Link,
  query: RemoteQueryFunction,
  region: RegionDTO,
  sku: string
): Promise<void> {
  const [variant] = await productModuleService.listProductVariants(
    { sku },
    { take: 1 }
  )

  if (!variant) {
    console.log(`[seed] Part B: no variant found for sku=${sku} (skipping pricing)`)
    return
  }

  const { data: graphRows } = await query.graph({
    entity: "variant",
    fields: [
      "id",
      "sku",
      "price_set.id",
      "price_set.prices.currency_code",
      "price_set.prices.amount",
    ],
    filters: { sku },
    context: {
      currency_code: SEED_CURRENCY,
      region_id: region.id,
    },
  })

  const graphRow = (graphRows as VariantPriceGraphRow[] | undefined)?.[0]

  if (variantHasLinkedSeedCurrencyPrice(graphRow)) {
    console.log(
      `[seed] Part B: variant sku=${sku} already has linked EGP price -> ${graphRow?.price_set?.id}`
    )
    return
  }

  const existingPriceSetId = graphRow?.price_set?.id

  if (existingPriceSetId) {
    console.log(
      `[seed] Part B: price set ${existingPriceSetId} linked to sku=${sku} but missing EGP price; adding price`
    )
    await pricingModuleService.addPrices({
      priceSetId: existingPriceSetId,
      prices: [
        {
          amount: SEED_PRICE_AMOUNT_MINOR,
          currency_code: SEED_CURRENCY,
          rules: {},
        },
      ],
    })
    return
  }

  const priceSet = await pricingModuleService.createPriceSets({
    prices: [
      {
        amount: SEED_PRICE_AMOUNT_MINOR,
        currency_code: SEED_CURRENCY,
        rules: {},
      },
    ],
  })

  console.log(
    `[seed] Part B: created price set ${priceSet.id} for variant sku=${sku}`
  )

  await remoteLink.create([
    {
      [Modules.PRODUCT]: { variant_id: variant.id },
      [Modules.PRICING]: { price_set_id: priceSet.id },
    },
  ])

  console.log(`[seed] Part B: linked price set ${priceSet.id} to variant ${variant.id}`)
}

async function ensureProductThumbnail(
  productModuleService: IProductModuleService,
  handle: string
): Promise<void> {
  const [product] = await productModuleService.listProducts(
    { handle },
    { take: 1 }
  )

  if (!product) {
    console.log(
      `[seed] Part C: no product found for handle=${handle} (skipping images)`
    )
    return
  }

  if (product.thumbnail) {
    console.log(
      `[seed] Part C: product handle=${handle} already has thumbnail -> skip`
    )
    return
  }

  const imageUrl = placeholderImageUrl(handle)

  await productModuleService.updateProducts(product.id, {
    thumbnail: imageUrl,
    images: [{ url: imageUrl }],
  })

  console.log(`[seed] Part C: set thumbnail + images for handle=${handle}`)
}

export default async function seed({ container }: ExecArgs): Promise<void> {
  const productModuleService = container.resolve<IProductModuleService>(
    Modules.PRODUCT
  )
  const regionModuleService = container.resolve<IRegionModuleService>(
    Modules.REGION
  )
  const pricingModuleService = container.resolve<IPricingModuleService>(
    Modules.PRICING
  )
  const remoteLink = container.resolve<Link>(ContainerRegistrationKeys.LINK)
  const query = container.resolve<RemoteQueryFunction>(
    ContainerRegistrationKeys.QUERY
  )

  await suppressDemoProducts(productModuleService)

  console.log("[seed] Starting BACK-3 / BACK-3b product, pricing, and media seed")

  const [, regionCount] = await regionModuleService.listAndCountRegions(
    {},
    { take: 1 }
  )
  const [, priceSetCount] = await pricingModuleService.listAndCountPriceSets(
    {},
    { take: 1 }
  )
  console.log(
    `[seed] Context check -> regions=${regionCount}, existing_price_sets=${priceSetCount}`
  )

  const region = await ensureDefaultRegion(regionModuleService)
  console.log(`[seed] Part A: using region ${region.id} for pricing context`)

  const category = await ensureCategory(productModuleService)

  for (const product of PRODUCTS) {
    await ensureProduct(productModuleService, category.id, product)
  }

  for (const product of PRODUCTS) {
    const sku = product.variants[0]?.sku
    if (!sku) {
      console.log(`[seed] Part B: product handle=${product.handle} has no SKU; skip`)
      continue
    }
    await ensureVariantPricingForSku(
      productModuleService,
      pricingModuleService,
      remoteLink,
      query,
      region,
      sku
    )
  }

  for (const product of PRODUCTS) {
    await ensureProductThumbnail(productModuleService, product.handle)
  }

  const apiKeyModuleService = container.resolve<IApiKeyModuleService>(
    Modules.API_KEY
  )
  const salesChannelModuleService = container.resolve<ISalesChannelModuleService>(
    Modules.SALES_CHANNEL
  )
  const publishableToken = await ensureStorefrontPublishableKey(
    apiKeyModuleService,
    salesChannelModuleService,
    remoteLink
  )

  console.log("[seed] BACK-3 / BACK-3b seed completed successfully")

  printLocalSummary({
    regionId: region.id,
    publishableToken,
  })
}

function printLocalSummary({
  regionId,
  publishableToken,
}: {
  regionId: string
  publishableToken: string
}): void {
  // Read the admin email from the same env var the backend container is
  // configured with; fall back to the .env.example default. The admin
  // PASSWORD is NEVER printed — it lives only in the developer's local env.
  const adminEmail = process.env["MEDUSA_ADMIN_EMAIL"] ?? "admin@example.com"

  const lines = [
    "",
    "============================================================",
    "[seed] Local development summary",
    "============================================================",
    "Admin URL:               http://localhost:9000/app",
    `Admin email:             ${adminEmail}`,
    "Admin password:          (from MEDUSA_ADMIN_PASSWORD in apps/backend/.env)",
    `Region ID:               ${regionId}`,
    `Publishable API key:     ${publishableToken}`,
    "",
    "Paste these lines into apps/storefront/.env.local:",
    "------------------------------------------------------------",
    "NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000",
    "NEXT_PUBLIC_BASE_URL=http://localhost:3000",
    "NEXT_PUBLIC_DEFAULT_LOCALE=ar",
    `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY=${publishableToken}`,
    `NEXT_PUBLIC_MEDUSA_REGION_ID=${regionId}`,
    "============================================================",
    "",
  ]

  for (const line of lines) {
    console.log(line)
  }
}

const STOREFRONT_KEY_TITLE = "Storefront Default"

async function ensureStorefrontPublishableKey(
  apiKeyModuleService: IApiKeyModuleService,
  salesChannelModuleService: ISalesChannelModuleService,
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
      `[seed] Part D: publishable key '${STOREFRONT_KEY_TITLE}' already exists -> ${key.token}`
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
      `[seed] Part D: created publishable key '${STOREFRONT_KEY_TITLE}' -> ${key.token}`
    )
  }

  const channels = await salesChannelModuleService.listSalesChannels({}, { take: 1 })
  const channel = channels[0]
  if (!channel) {
    console.log(`[seed] Part D: no sales channel found; skipping link`)
    return key.token
  }

  // Only create the link when the key itself was just created. On re-runs the
  // link already exists; remoteLink.create() silently tolerates duplicates,
  // but skipping the call avoids a misleading "linked …" log line every run.
  if (keyWasCreated) {
    await remoteLink.create({
      [Modules.API_KEY]: { publishable_key_id: key.id },
      [Modules.SALES_CHANNEL]: { sales_channel_id: channel.id },
    })
    console.log(
      `[seed] Part D: linked publishable key ${key.id} <-> sales channel ${channel.id}`
    )
  } else {
    console.log(
      `[seed] Part D: publishable key already linked to sales channel ${channel.id}`
    )
  }

  return key.token
}
