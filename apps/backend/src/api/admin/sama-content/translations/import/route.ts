// Sama Link · import endpoint — ADR-047 (BACK-14).
//
// POST /admin/sama-content/translations/import
//
// Body (JSON):
//   {
//     file: "storefront" | "admin",   // required
//     csv: string,                     // raw CSV text (header + rows)
//     mode?: "update_only" | "upsert"  // default "upsert"
//   }
//
// "upsert" (default) inserts unknown keys as new CSV rows. "update_only"
// refuses unknown keys and lists them under `skipped` so operators can
// spot typos / key drift.
//
// The CSV must have a header row that includes `key` plus at least one
// of `en`, `ar`, `notes`. Missing cells in a row are treated as "no
// change" for that column — only non-empty values overwrite. An empty
// cell does NOT wipe an existing value (avoids accidental deletion
// when an operator's edit left some rows blank).
//
// Each effective change mirrors into `messages/{en,ar}.json` and
// appends one audit line with `source: "import"`.
//
// Response:
//   {
//     file,
//     added:     { key, en, ar, notes }[],
//     updated:   { key, column, before, after }[],
//     unchanged: number,
//     skipped:   { key, reason }[],
//     messages_synced: boolean,
//     audit_lines: number
//   }

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  FILE_MAP,
  headerIndex,
  loadCsvHandle,
  mirrorStorefrontJson,
  parseCsv,
  resolveTranslationsDir,
  writeCsvHandle,
  appendAuditEntries,
  type AuditEntry,
  type FileKey,
  type Locale,
} from "../../../../../lib/sama-translations-shared"

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

    /* ── Load existing CSV state ────────────────────────────── */

    const dir = await resolveTranslationsDir()
    if (!dir) {
      res.status(500).json({ error: "Translations folder not resolvable." })
      return
    }
    const h = await loadCsvHandle(dir, file)
    if (h.keyIdx < 0) {
      res.status(422).json({
        error: `${FILE_MAP[file]} header must include a "key" column.`,
      })
      return
    }
    // key → row index in CSV
    const rowByKey = new Map<string, number>()
    for (let i = 1; i < h.rows.length; i++) {
      const k = (h.rows[i]?.[h.keyIdx] ?? "").trim()
      if (k) rowByKey.set(k, i)
    }

    /* ── Walk incoming rows, build change lists ─────────────── */

    const added: AddedRow[] = []
    const updated: UpdatedEntry[] = []
    const skipped: SkippedEntry[] = []
    let unchanged = 0
    const mirrorEn: Array<{ key: string; value: string }> = []
    const mirrorAr: Array<{ key: string; value: string }> = []
    const audit: AuditEntry[] = []

    const applyCellChange = (
      existingRow: string[],
      column: "en" | "ar" | "notes",
      colIdx: number,
      incomingRaw: string | undefined,
      key: string
    ) => {
      if (incomingRaw === undefined) return
      const incoming = incomingRaw.trim()
      // Missing / empty in the uploaded row → "no change" for this column.
      if (!incoming) return
      while (existingRow.length <= colIdx) existingRow.push("")
      const before = (existingRow[colIdx] ?? "").trim()
      if (before === incoming) {
        unchanged++
        return
      }
      existingRow[colIdx] = incoming
      updated.push({ key, column, before, after: incoming })
      audit.push({
        file: FILE_MAP[file],
        key,
        column,
        before,
        after: incoming,
        source: "import",
      })
      if (column === "en") mirrorEn.push({ key, value: incoming })
      if (column === "ar") mirrorAr.push({ key, value: incoming })
    }

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

      const incomingEn = inEnIdx >= 0 ? row[inEnIdx] : undefined
      const incomingAr = inArIdx >= 0 ? row[inArIdx] : undefined
      const incomingNotes = inNotesIdx >= 0 ? row[inNotesIdx] : undefined

      const existingIdx = rowByKey.get(key)

      if (existingIdx === undefined) {
        if (mode === "update_only") {
          skipped.push({
            key,
            reason:
              'Key not found in the target CSV and mode is "update_only".',
          })
          continue
        }
        // Upsert: append a new row with whatever columns the uploader
        // provided. Missing cells stay blank.
        const headerLen = h.header.length
        const newRow = new Array(headerLen).fill("")
        if (h.keyIdx >= 0) newRow[h.keyIdx] = key
        const en = incomingEn?.trim() ?? ""
        const ar = incomingAr?.trim() ?? ""
        const notes = incomingNotes?.trim() ?? ""
        if (h.enIdx >= 0) newRow[h.enIdx] = en
        if (h.arIdx >= 0) newRow[h.arIdx] = ar
        if (h.notesIdx >= 0) newRow[h.notesIdx] = notes
        h.rows.push(newRow)
        rowByKey.set(key, h.rows.length - 1)
        added.push({ key, en, ar, notes })
        if (en) mirrorEn.push({ key, value: en })
        if (ar) mirrorAr.push({ key, value: ar })
        audit.push({
          file: FILE_MAP[file],
          key,
          column: "en",
          before: "",
          after: en,
          source: "import-add",
        })
        continue
      }

      const existingRow = h.rows[existingIdx]!
      applyCellChange(existingRow, "en", h.enIdx, incomingEn, key)
      applyCellChange(existingRow, "ar", h.arIdx, incomingAr, key)
      applyCellChange(existingRow, "notes", h.notesIdx, incomingNotes, key)
    }

    /* ── Persist CSV if anything changed ────────────────────── */

    const cellsChanged = added.length + updated.length
    if (cellsChanged > 0) {
      await writeCsvHandle(h)
      await appendAuditEntries(dir, audit)
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
      // admin.csv has no runtime JSON yet.
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
      audit_lines: audit.length,
    })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[sama-content.import] failed:", e)
    res.status(500).json({
      error: e instanceof Error ? e.message : "Unknown error during import.",
    })
  }
}
