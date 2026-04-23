// Sama Link translations API — DB-backed (replaces CSV-on-disk model).
//
// GET  /admin/sama-content/translations
//      Serves the contents of the `translation` table, split by catalog
//      ("storefront" / "admin"), to the Sama content library admin route.
//
// PATCH /admin/sama-content/translations
//      Updates a single cell in the database. Body:
//        { file: "storefront" | "admin", key, column: "ar" | "en" | "notes", value }
//
//      BACK-12 · Live two-way sync: when the edited row belongs to the
//      storefront catalog AND the column is `en` or `ar`, the handler
//      mirrors the cell into the storefront's next-intl runtime JSON
//      files (`apps/storefront/messages/{en,ar}.json`). This is best-
//      effort and only applies when the messages directory is resolvable
//      (dev mode with docker-compose volume mounts).

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  FILE_MAP,
  mirrorStorefrontJson,
  type FileKey,
  type ColumnKey,
} from "../../../../lib/sama-translations-shared"
import { TRANSLATION_MODULE } from "../../../../modules/translation"
import type TranslationModuleService from "../../../../modules/translation/service"

type ParsedRow = {
  key: string
  en: string
  ar: string
  notes: string
}

type FilePayload = {
  file: string
  present: boolean
  rowCount: number
  rows: ParsedRow[]
  summary: {
    missingAr: number
    missingEn: number
    total: number
  }
}

const ALLOWED_COLUMNS: ColumnKey[] = ["ar", "en", "notes"]
const MAX_VALUE_LENGTH = 8000

/* ── GET handler ───────────────────────────────────────────────────── */

async function buildPayload(
  service: TranslationModuleService,
  catalog: FileKey
): Promise<FilePayload> {
  const rows = await service.listTranslations(
    { catalog },
    { select: ["key", "en", "ar", "notes"], order: { key: "ASC" }, take: 20000 }
  ) as Array<{ key: string; en: string | null; ar: string | null; notes: string | null }>

  const parsed: ParsedRow[] = rows.map((r) => ({
    key: r.key,
    en: r.en ?? "",
    ar: r.ar ?? "",
    notes: r.notes ?? "",
  }))

  let missingAr = 0
  let missingEn = 0
  for (const r of parsed) {
    if (!r.ar) missingAr++
    if (!r.en) missingEn++
  }

  return {
    file: FILE_MAP[catalog],
    present: parsed.length > 0,
    rowCount: parsed.length,
    rows: parsed,
    summary: { missingAr, missingEn, total: parsed.length },
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve<TranslationModuleService>(TRANSLATION_MODULE)
    const [storefront, admin] = await Promise.all([
      buildPayload(service, "storefront"),
      buildPayload(service, "admin"),
    ])
    res.json({
      translations_dir: "database",
      storefront,
      admin,
    })
  } catch (e) {
    // Never surface 500s to the admin UI — return a structured error so
    // the page can render its empty state with the reason.
    res.status(200).json({
      translations_dir: null,
      error: e instanceof Error ? e.message : "Unknown error",
      storefront: {
        file: FILE_MAP.storefront,
        present: false,
        rowCount: 0,
        rows: [],
        summary: { missingAr: 0, missingEn: 0, total: 0 },
      },
      admin: {
        file: FILE_MAP.admin,
        present: false,
        rowCount: 0,
        rows: [],
        summary: { missingAr: 0, missingEn: 0, total: 0 },
      },
    })
  }
}

/* ── PATCH handler ─────────────────────────────────────────────────── */

type PatchBody = {
  file?: unknown
  key?: unknown
  column?: unknown
  value?: unknown
}

type PatchError = { status: number; message: string }

function validateBody(body: PatchBody): PatchError | {
  file: FileKey
  key: string
  column: ColumnKey
  value: string
} {
  if (!body || typeof body !== "object") {
    return { status: 400, message: "Body must be a JSON object." }
  }
  const file = body.file
  if (file !== "storefront" && file !== "admin") {
    return {
      status: 400,
      message: `Invalid "file": expected "storefront" or "admin".`,
    }
  }
  const key = typeof body.key === "string" ? body.key.trim() : ""
  if (!key) {
    return { status: 400, message: `"key" is required.` }
  }
  const column = body.column
  if (!ALLOWED_COLUMNS.includes(column as ColumnKey)) {
    return {
      status: 400,
      message: `Invalid "column": expected one of ${ALLOWED_COLUMNS.join(", ")}.`,
    }
  }
  const rawValue = body.value
  if (typeof rawValue !== "string") {
    return { status: 400, message: `"value" must be a string (use "" to clear).` }
  }
  if (rawValue.length > MAX_VALUE_LENGTH) {
    return {
      status: 400,
      message: `"value" exceeds ${MAX_VALUE_LENGTH} chars — refusing to write.`,
    }
  }
  return {
    file: file as FileKey,
    key,
    column: column as ColumnKey,
    value: rawValue.replace(/\r\n?$/g, "").replace(/\n+$/g, ""),
  }
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve<TranslationModuleService>(TRANSLATION_MODULE)

    const parsed = validateBody(req.body as PatchBody)
    if ("status" in parsed) {
      res.status(parsed.status).json({ error: parsed.message })
      return
    }
    const { file, key, column, value } = parsed

    // Find the row by catalog + key.
    const existing = await service.listTranslations(
      { catalog: file, key },
      { select: ["id", "key", "en", "ar", "notes"], take: 1 }
    ) as Array<{ id: string; key: string; en: string | null; ar: string | null; notes: string | null }>

    if (existing.length === 0) {
      res
        .status(404)
        .json({ error: `Key "${key}" not found in ${FILE_MAP[file]}.` })
      return
    }

    const row = existing[0]!
    const before = row[column] ?? ""
    if (before === value) {
      res.json({
        unchanged: true,
        file: FILE_MAP[file],
        row: {
          key,
          en: row.en ?? "",
          ar: row.ar ?? "",
          notes: row.notes ?? "",
        },
      })
      return
    }

    // Update the single column.
    await service.updateTranslations([{ id: row.id, [column]: value }])

    // BACK-12 · Mirror into messages/{locale}.json when applicable.
    // Best-effort — a failure here does NOT roll back the DB write.
    let syncStatus: { synced: boolean; skipped?: boolean; reason?: string; path?: string }
    if (file !== "storefront") {
      syncStatus = {
        synced: false,
        skipped: true,
        reason: "admin catalog is not wired to a runtime next-intl bundle yet — no JSON mirror applied.",
      }
    } else if (column !== "en" && column !== "ar") {
      syncStatus = {
        synced: false,
        skipped: true,
        reason: "Notes are metadata — no JSON mirror required.",
      }
    } else {
      syncStatus = await mirrorStorefrontJson(column, [{ key, value }])
      if (!syncStatus.synced) {
        // eslint-disable-next-line no-console
        console.warn("[sama-content] messages JSON mirror failed:", syncStatus.reason)
      }
    }

    const updated: ParsedRow = {
      key,
      en: column === "en" ? value : (row.en ?? ""),
      ar: column === "ar" ? value : (row.ar ?? ""),
      notes: column === "notes" ? value : (row.notes ?? ""),
    }

    res.json({
      unchanged: false,
      file: FILE_MAP[file],
      row: updated,
      messagesSync: syncStatus,
    })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[sama-content] PATCH failed:", e)
    res.status(500).json({
      error: e instanceof Error ? e.message : "Unknown error while writing translation.",
    })
  }
}
