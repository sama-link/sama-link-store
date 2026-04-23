// Sama Link · scan endpoint — DB-backed (replaces CSV-on-disk model).
//
// POST /admin/sama-content/translations/scan
//   Body: { file: "storefront" | "admin" }
//
// Walks the runtime i18n sources for the requested catalog and inserts
// any keys missing from the database:
//
//   storefront → apps/storefront/messages/{en,ar}.json
//   admin      → @medusajs/dashboard/src/i18n/translations/{en,ar}.json

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { promises as fs } from "fs"
import path from "path"
import {
  FILE_MAP,
  flattenJsonLeaves,
  resolveAdminMessagesDir,
  resolveStorefrontMessagesDir,
  type FileKey,
} from "../../../../../lib/sama-translations-shared"
import { TRANSLATION_MODULE } from "../../../../../modules/translation"
import type TranslationModuleService from "../../../../../modules/translation/service"

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

    const service = req.scope.resolve<TranslationModuleService>(TRANSLATION_MODULE)

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
    enFlat.delete("$schema")
    arFlat.delete("$schema")

    /* ── Load existing keys from DB ────────────────────────── */

    const existingRows = await service.listTranslations(
      { catalog: file },
      { select: ["key"], take: 20000 }
    ) as Array<{ key: string }>

    const existing = new Set<string>()
    for (const r of existingRows) {
      if (r.key) existing.add(r.key)
    }
    const dbKeysBefore = existing.size

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

    /* ── Insert into DB if we found anything ────────────────── */

    if (added.length > 0) {
      const toCreate = added.map((r) => ({
        catalog: file,
        key: r.key,
        en: r.en || null,
        ar: r.ar || null,
        notes: null,
      }))
      // Batch in groups of 500.
      const BATCH = 500
      for (let i = 0; i < toCreate.length; i += BATCH) {
        await service.createTranslations(toCreate.slice(i, i + BATCH))
      }
    }

    const dbKeysAfter = dbKeysBefore + added.length

    res.json({
      file: FILE_MAP[file],
      added,
      already_present: existing.size,
      scanned: {
        en_keys: enFlat.size,
        ar_keys: arFlat.size,
        csv_keys_before: dbKeysBefore,
        csv_keys_after: dbKeysAfter,
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
