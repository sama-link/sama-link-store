// Sama Link · /admin/brands/:id — get + update + delete — ADR-047.

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BRAND_MODULE } from "../../../../modules/brand"
import type BrandModuleService from "../../../../modules/brand/service"

type UpdateBody = {
  name?: unknown
  handle?: unknown
  description?: unknown
  image_url?: unknown
}

type BrandPatch = {
  name?: string
  handle?: string
  description?: string | null
  image_url?: string | null
}

type ParseResult =
  | { ok: true; patch: BrandPatch }
  | { ok: false; error: string }

function parseUpdateBody(body: UpdateBody): ParseResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Body must be a JSON object." }
  }

  const patch: BrandPatch = {}

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return { ok: false, error: '"name" must be a non-empty string.' }
    }
    patch.name = body.name.trim()
  }

  if (body.handle !== undefined) {
    if (typeof body.handle !== "string" || !body.handle.trim()) {
      return { ok: false, error: '"handle" must be a non-empty string.' }
    }
    patch.handle = body.handle
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF-]+/g, "-")
      .replace(/^-+|-+$/g, "")
    if (!patch.handle) {
      return { ok: false, error: "Handle becomes empty after normalisation." }
    }
  }

  if (body.description !== undefined) {
    if (body.description === null) patch.description = null
    else if (typeof body.description === "string") {
      const t = body.description.trim()
      patch.description = t.length ? t : null
    } else {
      return { ok: false, error: '"description" must be a string or null.' }
    }
  }

  if (body.image_url !== undefined) {
    if (body.image_url === null) patch.image_url = null
    else if (typeof body.image_url === "string") {
      const t = body.image_url.trim()
      patch.image_url = t.length ? t : null
    } else {
      return { ok: false, error: '"image_url" must be a string or null.' }
    }
  }

  return { ok: true, patch }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<BrandModuleService>(BRAND_MODULE)
  const id = req.params.id
  try {
    const brand = await service.retrieveBrand(id)
    res.json({ brand })
  } catch {
    res.status(404).json({ error: `Brand ${id} not found.` })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<BrandModuleService>(BRAND_MODULE)
  const id = req.params.id

  // Make sure it exists first so we return a clean 404 instead of a
  // confusing "updated 0 rows" silent no-op.
  try {
    await service.retrieveBrand(id)
  } catch {
    res.status(404).json({ error: `Brand ${id} not found.` })
    return
  }

  const parsed = parseUpdateBody(req.body as UpdateBody)
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error })
    return
  }

  const patch = parsed.patch

  // If handle is changing, verify uniqueness (excluding this brand).
  if (patch.handle) {
    const conflicts = (await service.listBrands({
      handle: patch.handle,
    })) as Array<{ id: string }>
    if (conflicts.some((b) => b.id !== id)) {
      res.status(409).json({
        error: `Another brand already uses handle "${patch.handle}".`,
      })
      return
    }
  }

  const [brand] = await service.updateBrands([{ id, ...patch }])
  res.json({ brand })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<BrandModuleService>(BRAND_MODULE)
  const id = req.params.id
  try {
    await service.retrieveBrand(id)
  } catch {
    res.status(404).json({ error: `Brand ${id} not found.` })
    return
  }
  await service.deleteBrands([id])
  res.json({ id, deleted: true })
}
