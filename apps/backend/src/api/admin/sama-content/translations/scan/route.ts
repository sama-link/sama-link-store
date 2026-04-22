// Sama Link · scan endpoint — ADR-047 (BACK-14).
//
// POST /admin/sama-content/translations/scan
//   Body: { file: "storefront" | "admin" }
//
// Walks the runtime i18n sources for the requested file and appends any
// keys missing from the CSV:
//
//   storefront → apps/storefront/messages/{en,ar}.json
//                (mounted at SAMA_STOREFRONT_MESSAGES_DIR)
//   admin      → @medusajs/dashboard/src/i18n/translations/{en,ar}.json
//                (ships with the Medusa package — 2130 EN keys, ~238
//                still missing from AR out of the box)
//
// New rows land in the CSV pre-filled with the runtime values: the EN
// column gets Medusa's / the storefront's English, the AR column gets
// whatever AR translation Medusa ships (often empty for admin). The
// operator then fills the gaps via the inline table editor, the
// export/import round trip, or a manual CSV edit on disk.

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { promises as fs } from "fs"
import path from "path"
import {
  FILE_MAP,
  flattenJsonLeaves,
  loadCsvHandle,
  resolveAdminMessagesDir,
  resolveStorefrontMessagesDir,
  resolveTranslationsDir,
  writeCsvHandle,
  appendAuditEntries,
  type FileKey,
} from "../../../../../lib/sama-translations-shared"

type Body = {
  file?: unknown
}

async function resolveMessagesDirFor(file: FileKey): Promise<string | null> {
  return file === "admin"
    ? resolveAdminMessagesDir()
    : resolveStorefrontMessagesDir()
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = (req.body ?? {}) as Body
    const file: FileKey =
      body.file === "admin" ? "admin" : "storefront"

    const dir = await resolveTranslationsDir()
    if (!dir) {
      res.status(500).json({
        error: "Translations folder not resolvable.",
      })
      return
    }
    const messagesDir = await resolveMessagesDirFor(file)
    if (!messagesDir) {
      const envVar =
        file === "admin"
          ? "SAMA_ADMIN_MESSAGES_DIR"
          : "SAMA_STOREFRONT_MESSAGES_DIR"
      res.status(500).json({
        error: `Messages folder for ${file} not resolvable. Check ${envVar}.`,
      })
      return
    }

    /* ── Load + flatten messages JSON ───────────────────────── */

    const enPath = path.join(messagesDir, "en.json")
    const arPath = path.join(messagesDir, "ar.json")
    const [enRaw, arRaw] = await Promise.all([
      fs.readFile(enPath, "utf8").catch(() => "{}"),
      fs.readFile(arPath, "utf8").catch(() => "{}"),
    ])
    const enTree = JSON.parse(enRaw || "{}")
    const arTree = JSON.parse(arRaw || "{}")
    const enFlat = flattenJsonLeaves(enTree)
    const arFlat = flattenJsonLeaves(arTree)
    // Medusa's JSON has a `$schema` sentinel at the root — strip it so
    // it doesn't land in the CSV as a bogus row.
    enFlat.delete("$schema")
    arFlat.delete("$schema")

    /* ── Load CSV + existing-key lookup ─────────────────────── */

    const h = await loadCsvHandle(dir, file)
    if (h.keyIdx < 0) {
      res.status(422).json({
        error: `${FILE_MAP[file]} header must include a "key" column.`,
      })
      return
    }

    const existing = new Set<string>()
    for (let i = 1; i < h.rows.length; i++) {
      const k = (h.rows[i]?.[h.keyIdx] ?? "").trim()
      if (k) existing.add(k)
    }
    const csvKeysBefore = existing.size

    /* ── Union of message JSON keys ─────────────────────────── */

    const jsonKeys = new Set<string>()
    for (const k of enFlat.keys()) jsonKeys.add(k)
    for (const k of arFlat.keys()) jsonKeys.add(k)

    /* ── Build "to add" list ─────────────────────────────────── */

    const added: Array<{ key: string; en: string; ar: string; notes: string }> = []
    for (const k of Array.from(jsonKeys).sort()) {
      if (existing.has(k)) continue
      added.push({
        key: k,
        en: enFlat.get(k) ?? "",
        ar: arFlat.get(k) ?? "",
        notes: "",
      })
    }

    /* ── Append to CSV if we found anything ─────────────────── */

    if (added.length > 0) {
      // Ensure rows follow the existing header column order.
      const headerLen = h.header.length
      for (const row of added) {
        const csvRow = new Array(headerLen).fill("")
        if (h.keyIdx >= 0) csvRow[h.keyIdx] = row.key
        if (h.enIdx >= 0) csvRow[h.enIdx] = row.en
        if (h.arIdx >= 0) csvRow[h.arIdx] = row.ar
        if (h.notesIdx >= 0) csvRow[h.notesIdx] = row.notes
        h.rows.push(csvRow)
      }
      await writeCsvHandle(h)
      await appendAuditEntries(
        dir,
        added.map((r) => ({
          file: FILE_MAP[file],
          key: r.key,
          column: "en", // scan surfaces the key; we record the EN backfill
          before: "",
          after: r.en,
          source: "scan",
        }))
      )
    }

    const csvKeysAfter = csvKeysBefore + added.length

    res.json({
      file: FILE_MAP[file],
      added,
      already_present: existing.size,
      scanned: {
        en_keys: enFlat.size,
        ar_keys: arFlat.size,
        csv_keys_before: csvKeysBefore,
        csv_keys_after: csvKeysAfter,
      },
      audit_lines: added.length,
    })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[sama-content.scan] failed:", e)
    res.status(500).json({
      error: e instanceof Error ? e.message : "Unknown error during scan.",
    })
  }
}
