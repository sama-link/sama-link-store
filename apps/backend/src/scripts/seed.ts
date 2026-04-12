import type {
  CreateProductDTO,
  ExecArgs,
  IProductModuleService,
  IRegionModuleService,
  IPricingModuleService,
  ProductCategoryDTO,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

type SeedProduct = Pick<CreateProductDTO, "title" | "handle" | "description"> & {
  variants: NonNullable<CreateProductDTO["variants"]>
}

const CATEGORY_HANDLE = "networking"
const CATEGORY_NAME = "Networking (تاكبش)"

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

  console.log("[seed] Starting BACK-3 product/category seed")

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

  const category = await ensureCategory(productModuleService)

  for (const product of PRODUCTS) {
    await ensureProduct(productModuleService, category.id, product)
  }

  console.log("[seed] BACK-3 seed completed successfully")
}
