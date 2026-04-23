// Sama Link · seed-translations — one-time CSV-to-DB migration.
//
// Usage:  npx medusa exec src/scripts/seed-translations.ts
//
// Reads `translations/storefront.csv` and `translations/admin.csv` from the
// repo root (or the path set in SAMA_TRANSLATIONS_DIR), parses them, and
// bulk-inserts rows into the `translation` table. Idempotent — existing
// rows (matched by catalog + key) are skipped.

import type { ExecArgs } from "@medusajs/framework/types"
import { promises as fs } from "fs"
import path from "path"
import { parseCsv, headerIndex } from "../lib/sama-translations-shared"
import { TRANSLATION_MODULE } from "../modules/translation"
import type TranslationModuleService from "../modules/translation/service"

type Catalog = "storefront" | "admin"

const CSV_FILES: Record<Catalog, string> = {
  storefront: "storefront.csv",
  admin: "admin.csv",
}

async function findTranslationsDir(): Promise<string> {
  const candidates = [
    process.env["SAMA_TRANSLATIONS_DIR"],
    path.resolve(process.cwd(), "translations"),
    path.resolve(process.cwd(), "../../translations"),
    path.resolve(process.cwd(), "../../../translations"),
  ].filter((p): p is string => typeof p === "string" && p.length > 0)

  for (const dir of candidates) {
    try {
      const stat = await fs.stat(dir)
      if (stat.isDirectory()) return dir
    } catch {
      /* try next */
    }
  }
  throw new Error(
    "Could not find translations/ directory. Set SAMA_TRANSLATIONS_DIR or run from the repo root."
  )
}

export default async function seedTranslations({ container }: ExecArgs) {
  const service = container.resolve<TranslationModuleService>(TRANSLATION_MODULE)
  const dir = await findTranslationsDir()

  // eslint-disable-next-line no-console
  console.log(`[seed-translations] Reading CSVs from: ${dir}`)

  for (const catalog of ["storefront", "admin"] as const) {
    const csvPath = path.join(dir, CSV_FILES[catalog])
    let raw: string
    try {
      raw = await fs.readFile(csvPath, "utf8")
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        `[seed-translations] Skipping ${catalog}: ${err instanceof Error ? err.message : String(err)}`
      )
      continue
    }

    const rows = parseCsv(raw)
    if (rows.length === 0) {
      // eslint-disable-next-line no-console
      console.warn(`[seed-translations] ${catalog}.csv is empty, skipping.`)
      continue
    }

    const header = rows[0]!
    const keyIdx = headerIndex(header, "key")
    const enIdx = headerIndex(header, "en")
    const arIdx = headerIndex(header, "ar")
    const notesIdx = headerIndex(header, "notes")

    if (keyIdx < 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `[seed-translations] ${catalog}.csv has no "key" column, skipping.`
      )
      continue
    }

    // Parse CSV rows into records.
    const records: Array<{
      catalog: Catalog
      key: string
      en: string | null
      ar: string | null
      notes: string | null
    }> = []

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i] ?? []
      if (cols.every((c) => !c || !c.trim())) continue
      const key = (cols[keyIdx] ?? "").trim()
      if (!key) continue
      records.push({
        catalog,
        key,
        en: enIdx >= 0 ? (cols[enIdx] ?? "").trim() || null : null,
        ar: arIdx >= 0 ? (cols[arIdx] ?? "").trim() || null : null,
        notes: notesIdx >= 0 ? (cols[notesIdx] ?? "").trim() || null : null,
      })
    }

    // Check which keys already exist to make this idempotent.
    const existing = await service.listTranslations(
      { catalog },
      { select: ["key"], take: records.length + 1000 }
    )
    const existingKeys = new Set(
      (existing as Array<{ key: string }>).map((r) => r.key)
    )

    const toCreate = records.filter((r) => !existingKeys.has(r.key))

    if (toCreate.length === 0) {
      // eslint-disable-next-line no-console
      console.log(
        `[seed-translations] ${catalog}: all ${records.length} rows already in DB, nothing to insert.`
      )
      continue
    }

    // Bulk-create in batches of 500 to avoid overly large queries.
    const BATCH = 500
    for (let i = 0; i < toCreate.length; i += BATCH) {
      const batch = toCreate.slice(i, i + BATCH)
      await service.createTranslations(batch)
    }

    // eslint-disable-next-line no-console
    console.log(
      `[seed-translations] ${catalog}: inserted ${toCreate.length} rows (${existingKeys.size} already existed, ${records.length} total in CSV).`
    )
  }

  // eslint-disable-next-line no-console
  console.log("[seed-translations] Done.")
}
