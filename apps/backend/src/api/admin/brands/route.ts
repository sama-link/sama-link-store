// Sama Link · /admin/brands — list + create — ADR-047.

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BRAND_MODULE } from "../../../modules/brand"
import type BrandModuleService from "../../../modules/brand/service"

/** slugify "Sama Link" → "sama-link". Mirrors the conventions we use on
 *  Medusa product handles so brands feel native. */
function slugify(raw: string): string {
  return raw
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining diacritics
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-") // keep ASCII + Arabic letters
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

type CreateBody = {
  name?: unknown
  handle?: unknown
  description?: unknown
  image_url?: unknown
}

function parseCreateBody(body: CreateBody): {
  name: string
  handle: string
  description: string | null
  image_url: string | null
} | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Body must be a JSON object." }
  }
  const name = typeof body.name === "string" ? body.name.trim() : ""
  if (!name) return { error: '"name" is required.' }

  let handle =
    typeof body.handle === "string" && body.handle.trim()
      ? slugify(body.handle)
      : slugify(name)
  if (!handle) return { error: "Could not derive a valid handle from the name." }

  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim()
      : null
  const image_url =
    typeof body.image_url === "string" && body.image_url.trim()
      ? body.image_url.trim()
      : null

  return { name, handle, description, image_url }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<BrandModuleService>(BRAND_MODULE)
  const q = typeof req.query.q === "string" ? req.query.q.trim() : ""
  const limit = Math.min(
    Math.max(parseInt(String(req.query.limit ?? "50"), 10) || 50, 1),
    200
  )
  const offset = Math.max(
    parseInt(String(req.query.offset ?? "0"), 10) || 0,
    0
  )

  // MedusaService's list accepts a mikro-orm-style filter. We keep it
  // simple: optional case-insensitive name/handle match.
  const filter: Record<string, unknown> = {}
  if (q) {
    filter.$or = [
      { name: { $ilike: `%${q}%` } },
      { handle: { $ilike: `%${q}%` } },
    ]
  }

  const [brands, count] = await service.listAndCountBrands(filter, {
    skip: offset,
    take: limit,
    order: { name: "ASC" },
  })

  res.json({ brands, count, limit, offset })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<BrandModuleService>(BRAND_MODULE)
  const parsed = parseCreateBody(req.body as CreateBody)
  if ("error" in parsed) {
    res.status(400).json({ error: parsed.error })
    return
  }

  // Uniqueness check on handle — surfaces a cleaner error than the DB's
  // raw unique-constraint violation.
  const existing = await service.listBrands({ handle: parsed.handle })
  if (existing.length > 0) {
    res.status(409).json({
      error: `A brand with handle "${parsed.handle}" already exists.`,
    })
    return
  }

  const [brand] = await service.createBrands([parsed])
  res.status(201).json({ brand })
}
