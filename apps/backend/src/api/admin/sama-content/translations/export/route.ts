// Sama Link · export endpoint — DB-backed (replaces CSV-on-disk model).
//
// GET /admin/sama-content/translations/export?file=storefront&filter=missing_ar
//
// Streams a CSV download containing the requested rows from the database.
//
// Query params:
//   file   = "storefront" | "admin"          (default "storefront")
//   filter = "all" | "missing_ar" | "missing_en" | "missing_any"
//            (default "missing_ar")

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  FILE_MAP,
  serializeCsv,
} from "../../../../../lib/sama-translations-shared"
import { TRANSLATION_MODULE } from "../../../../../modules/translation"
import type TranslationModuleService from "../../../../../modules/translation/service"

type Filter = "all" | "missing_ar" | "missing_en" | "missing_any"

function parseFilter(raw: unknown): Filter {
  if (
    raw === "all" ||
    raw === "missing_ar" ||
    raw === "missing_en" ||
    raw === "missing_any"
  ) {
    return raw
  }
  return "missing_ar"
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const file: "storefront" | "admin" =
      req.query.file === "admin" ? "admin" : "storefront"
    const filter = parseFilter(req.query.filter)

    const service = req.scope.resolve<TranslationModuleService>(TRANSLATION_MODULE)

    const rows = await service.listTranslations(
      { catalog: file },
      { select: ["key", "en", "ar", "notes"], order: { key: "ASC" }, take: 20000 }
    ) as Array<{ key: string; en: string | null; ar: string | null; notes: string | null }>

    const header = ["key", "en", "ar", "notes"]
    const outRows: string[][] = [header]

    for (const r of rows) {
      const en = (r.en ?? "").trim()
      const ar = (r.ar ?? "").trim()
      let keep = false
      switch (filter) {
        case "all":
          keep = true
          break
        case "missing_ar":
          keep = !ar
          break
        case "missing_en":
          keep = !en
          break
        case "missing_any":
          keep = !ar || !en
          break
      }
      if (keep) {
        outRows.push([r.key, en, ar, (r.notes ?? "").trim()])
      }
    }

    const csv = serializeCsv(outRows)
    const stamp = new Date().toISOString().slice(0, 10)
    const filename = `${file}-${filter.replace("_", "-")}-${stamp}.csv`
    // UTF-8 BOM so Excel opens Arabic cells correctly on Windows.
    const BOM = "\uFEFF"
    res.setHeader("Content-Type", "text/csv; charset=utf-8")
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    )
    res.setHeader("Cache-Control", "no-store")
    res.send(BOM + csv)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[sama-content.export] failed:", e)
    res.status(500).json({
      error: e instanceof Error ? e.message : "Unknown error during export.",
    })
  }
}
