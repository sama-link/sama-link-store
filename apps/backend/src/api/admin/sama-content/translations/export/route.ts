// Sama Link · export endpoint — ADR-047 (BACK-14).
//
// GET /admin/sama-content/translations/export?file=storefront&filter=missing_ar
//
// Streams a CSV download containing the requested rows. The default
// is every row where AR is missing — the common "give me what I need
// to translate" workflow. The UI wires a button that triggers the
// download by hitting this URL with `credentials: "include"`.
//
// Query params:
//   file   = "storefront" | "admin"          (default "storefront")
//   filter = "all" | "missing_ar" | "missing_en" | "missing_any"
//            (default "missing_ar")
//
// Response headers:
//   Content-Type: text/csv; charset=utf-8
//   Content-Disposition: attachment; filename="..."

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  FILE_MAP,
  loadCsvHandle,
  resolveTranslationsDir,
  serializeCsv,
} from "../../../../../lib/sama-translations-shared"

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

    const dir = await resolveTranslationsDir()
    if (!dir) {
      res.status(500).json({
        error: "Translations folder not resolvable.",
      })
      return
    }

    const h = await loadCsvHandle(dir, file)
    if (h.keyIdx < 0) {
      res.status(422).json({
        error: `${FILE_MAP[file]} header must include a "key" column.`,
      })
      return
    }

    const outRows: string[][] = [h.header]
    for (let i = 1; i < h.rows.length; i++) {
      const row = h.rows[i] ?? []
      if (row.every((c) => !c || !c.trim())) continue
      const key = (row[h.keyIdx] ?? "").trim()
      if (!key) continue
      const en = (h.enIdx >= 0 ? row[h.enIdx] ?? "" : "").trim()
      const ar = (h.arIdx >= 0 ? row[h.arIdx] ?? "" : "").trim()
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
      if (keep) outRows.push(row)
    }

    const csv = serializeCsv(outRows)
    const stamp = new Date().toISOString().slice(0, 10)
    const filename = `${file}-${filter.replace("_", "-")}-${stamp}.csv`
    // UTF-8 BOM so Excel opens Arabic cells correctly on Windows —
    // the operator almost certainly edits these in Excel/Numbers.
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
