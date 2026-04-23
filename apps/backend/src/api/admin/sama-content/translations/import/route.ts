// Sama Link · import endpoint — DB-backed (replaces CSV-on-disk model).
//
// POST /admin/sama-content/translations/import
//
// Body (JSON):
//   {
//     file: "storefront" | "admin",
//     csv: string,                     // raw CSV text (header + rows)
//     mode?: "update_only" | "upsert"  // default "upsert"
//   }
//
// "upsert" (default) inserts unknown keys as new DB rows. "update_only"
// refuses unknown keys and lists them under `skipped`.
//
// The CSV must have a header row that includes `key` plus at least one
// of `en`, `ar`, `notes`. Missing cells in a row are treated as "no
// change" for that column — only non-empty values overwrite.

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  FILE_MAP,
  headerIndex,
  mirrorStorefrontJson,
  parseCsv,
  type FileKey,
  type Locale,
} from "../../../../../lib/sama-translations-shared"
import { TRANSLATION_MODULE } from "../../../../../modules/translation"
import type TranslationModuleService from "../../../../../modules/translation/service"

type Body = {
  file?: unknown
  csv?: unknown
  mode?: unknown
}

type AddedRow = { key: string; en: string; ar: string; notes: string }
type UpdatedEntry = {
  key: string
  column: "en" | "ar" | "notes"
  before: string
  after: string
}
type SkippedEntry = { key: string; reason: string }

function stripBom(s: string): string {
  return s.length && s.charCodeAt(0) === 0xfeff ? s.slice(1) : s
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = (req.body ?? {}) as Body
    const file: FileKey =
      body.file === "admin" ? "admin" : body.file === "storefront" ? "storefront" : ("" as FileKey)
    if (file !== "storefront" && file !== "admin") {
      res.status(400).json({ error: '"file" must be "storefront" or "admin".' })
      return
    }
    const csvText = typeof body.csv === "string" ? stripBom(body.csv) : ""
    if (!csvText.trim()) {
      res.status(400).json({ error: '"csv" must be a non-empty CSV text.' })
      return
    }
    const mode: "update_only" | "upsert" =
      body.mode === "update_only" ? "update_only" : "upsert"

    const service = req.scope.resolve<TranslationModuleService>(TRANSLATION_MODULE)

    /* ── Parse the uploaded CSV ─────────────────────────────── */

    const incoming = parseCsv(csvText)
    if (incoming.length === 0) {
      res.status(400).json({ error: "Uploaded CSV is empty." })
      return
    }
    const inHeader = incoming[0]!
    const inKeyIdx = headerIndex(inHeader, "key")
    const inEnIdx = headerIndex(inHeader, "en")
    const inArIdx = headerIndex(inHeader, "ar")
    const inNotesIdx = headerIndex(inHeader, "notes")
    if (inKeyIdx < 0) {
      res.status(400).json({
        error: 'Uploaded CSV header must include a "key" column.',
      })
      return
    }
    if (inEnIdx < 0 && inArIdx < 0 && inNotesIdx < 0) {
      res.status(400).json({
        error:
          'Uploaded CSV must include at least one of the translation columns: "en", "ar", or "notes".',
      })
      return
    }

    /* ── Load existing DB rows for this catalog ────────────── */

    const existingRows = await service.listTranslations(
      { catalog: file },
      { select: ["id", "key", "en", "ar", "notes"], take: 20000 }
    ) as Array<{ id: string; key: string; en: string | null; ar: string | null; notes: string | null }>

    const rowByKey = new Map<string, typeof existingRows[number]>()
    for (const r of existingRows) {
      rowByKey.set(r.key, r)
    }

    /* ── Walk incoming rows, build change lists ─────────────── */

    const added: AddedRow[] = []
    const updated: UpdatedEntry[] = []
    const skipped: SkippedEntry[] = []
    let unchanged = 0
    const mirrorEn: Array<{ key: string; value: string }> = []
    const mirrorAr: Array<{ key: string; value: string }> = []
    const toCreate: Array<{ catalog: FileKey; key: string; en: string | null; ar: string | null; notes: string | null }> = []
    const toUpdate: Array<{ id: string; en?: string | null; ar?: string | null; notes?: string | null }> = []

    for (let i = 1; i < incoming.length; i++) {
      const row = incoming[i] ?? []
      if (row.every((c) => !c || !c.trim())) continue
      const key = (row[inKeyIdx] ?? "").trim()
      if (!key) {
        skipped.push({
          key: "(blank)",
          reason: `Row ${i + 1} has no "key" value.`,
        })
        continue
      }

      const incomingEn = inEnIdx >= 0 ? (row[inEnIdx] ?? "").trim() : ""
      const incomingAr = inArIdx >= 0 ? (row[inArIdx] ?? "").trim() : ""
      const incomingNotes = inNotesIdx >= 0 ? (row[inNotesIdx] ?? "").trim() : ""

      const existingRow = rowByKey.get(key)

      if (!existingRow) {
        if (mode === "update_only") {
          skipped.push({
            key,
            reason: 'Key not found in the database and mode is "update_only".',
          })
          continue
        }
        // Upsert: create new row.
        const en = incomingEn || null
        const ar = incomingAr || null
        const notes = incomingNotes || null
        toCreate.push({ catalog: file, key, en, ar, notes })
        added.push({ key, en: en ?? "", ar: ar ?? "", notes: notes ?? "" })
        if (en) mirrorEn.push({ key, value: en })
        if (ar) mirrorAr.push({ key, value: ar })
        continue
      }

      // Existing row — check each column for changes.
      const changes: Record<string, string | null> = {}
      let rowChanged = false

      const checkColumn = (
        column: "en" | "ar" | "notes",
        incomingVal: string
      ) => {
        if (!incomingVal) return // empty = no change
        const before = (existingRow[column] ?? "").trim()
        if (before === incomingVal) {
          unchanged++
          return
        }
        changes[column] = incomingVal
        updated.push({ key, column, before, after: incomingVal })
        rowChanged = true
        if (column === "en") mirrorEn.push({ key, value: incomingVal })
        if (column === "ar") mirrorAr.push({ key, value: incomingVal })
      }

      checkColumn("en", incomingEn)
      checkColumn("ar", incomingAr)
      checkColumn("notes", incomingNotes)

      if (rowChanged) {
        toUpdate.push({ id: existingRow.id, ...changes })
      }
    }

    /* ── Persist DB changes ────────────────────────────────── */

    if (toCreate.length > 0) {
      const BATCH = 500
      for (let i = 0; i < toCreate.length; i += BATCH) {
        await service.createTranslations(toCreate.slice(i, i + BATCH))
      }
    }

    if (toUpdate.length > 0) {
      await service.updateTranslations(toUpdate)
    }

    /* ── Mirror into messages JSON (storefront only) ────────── */

    let messagesSynced = true
    const mirrorErrors: string[] = []
    if (file === "storefront") {
      if (mirrorEn.length > 0) {
        const enResult = await mirrorStorefrontJson("en" as Locale, mirrorEn)
        if (!enResult.synced) {
          messagesSynced = false
          mirrorErrors.push(`en.json: ${enResult.reason ?? "unknown error"}`)
        }
      }
      if (mirrorAr.length > 0) {
        const arResult = await mirrorStorefrontJson("ar" as Locale, mirrorAr)
        if (!arResult.synced) {
          messagesSynced = false
          mirrorErrors.push(`ar.json: ${arResult.reason ?? "unknown error"}`)
        }
      }
    } else {
      messagesSynced = false
    }

    res.json({
      file: FILE_MAP[file],
      added,
      updated,
      unchanged,
      skipped,
      messages_synced: messagesSynced,
      messages_sync_errors: mirrorErrors.length ? mirrorErrors : undefined,
      audit_lines: added.length + updated.length,
    })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[sama-content.import] failed:", e)
    res.status(500).json({
      error: e instanceof Error ? e.message : "Unknown error during import.",
    })
  }
}
