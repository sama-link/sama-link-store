// Sama Link translations API — ADR-040 (narrowed by ADR-047).
//
// GET  /admin/sama-content/translations
//      Serves the contents of `translations/storefront.csv` + `translations/admin.csv`
//      to the Sama content library admin route.
//
// PATCH /admin/sama-content/translations
//      Writes a single cell back to the CSV. Body:
//        { file: "storefront" | "admin", key, column: "ar" | "en" | "notes", value }
//      ADR-047 opens the sama-content surface to write access. Because the
//      Medusa container has neither git installed nor the repo's .git/ mounted,
//      the "auto-commit" audit-trail requirement from ADR-047 is realised via a
//      sibling file — `translations/.edit-log.jsonl` — that records every
//      cell mutation (timestamp, file, key, column, before, after). The host
//      developer's next `git commit` picks up both the CSV and the audit log in
//      the same commit, preserving the review trail that the PR gate used to
//      provide.
//
//      BACK-12 · Live two-way sync: when the edited row belongs to
//      `storefront.csv` AND the column is `en` or `ar`, the handler also
//      mirrors the cell into the storefront's next-intl runtime JSON files
//      (`apps/storefront/messages/{en,ar}.json`, mounted into the container
//      at `SAMA_STOREFRONT_MESSAGES_DIR`). The dotted CSV key
//      (e.g. `cart.title`) maps to a nested JSON path (`cart.title` →
//      `{"cart": {"title": "…"}}`); intermediate objects are created as
//      needed. Next.js's dev-mode file watcher picks up the change and the
//      `/en` / `/ar` storefront pages re-render with the new copy on their
//      next request — no manual "regenerate messages" step.
//
//      The JSON sync is best-effort: a write failure DOES NOT roll back the
//      CSV. The response's `messagesSync` field reports whether the mirror
//      write succeeded so the UI can surface any drift. Notes-column edits
//      are skipped for the sync (notes are CSV-only metadata, not user-
//      facing copy).
//
// The folder path is resolved via SAMA_TRANSLATIONS_DIR (set in
// docker-compose.dev.yml) with a sensible fallback chain for non-Docker
// execution. If no file can be located, GET returns a 200 with empty arrays
// and a `present: false` flag so the admin route can render its empty state.

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { promises as fs } from "fs"
import path from "path"

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

type FileKey = "storefront" | "admin"
type ColumnKey = "ar" | "en" | "notes"

const FILE_MAP: Record<FileKey, string> = {
  storefront: "storefront.csv",
  admin: "admin.csv",
}
const ALLOWED_COLUMNS: ColumnKey[] = ["ar", "en", "notes"]
const AUDIT_LOG = ".edit-log.jsonl"
const MAX_VALUE_LENGTH = 8000 // guardrail — real UI copy is well under this

async function resolveTranslationsDir(): Promise<string | null> {
  const envDir = process.env["SAMA_TRANSLATIONS_DIR"]
  const candidates = [
    envDir,
    "/app/translations",
    path.resolve(process.cwd(), "translations"),
    path.resolve(process.cwd(), "../../translations"),
    path.resolve(process.cwd(), "../../../translations"),
  ].filter((p): p is string => typeof p === "string" && p.length > 0)

  for (const dir of candidates) {
    try {
      const stat = await fs.stat(dir)
      if (stat.isDirectory()) return dir
    } catch {
      /* ignore & try next */
    }
  }
  return null
}

/** Twin of `resolveTranslationsDir` — finds the storefront `messages/`
 *  folder so BACK-12 can mirror writes into the next-intl runtime JSON. */
async function resolveStorefrontMessagesDir(): Promise<string | null> {
  const envDir = process.env["SAMA_STOREFRONT_MESSAGES_DIR"]
  const candidates = [
    envDir,
    "/app/storefront-messages",
    path.resolve(process.cwd(), "apps/storefront/messages"),
    path.resolve(process.cwd(), "../../apps/storefront/messages"),
    path.resolve(process.cwd(), "../../../apps/storefront/messages"),
  ].filter((p): p is string => typeof p === "string" && p.length > 0)

  for (const dir of candidates) {
    try {
      const stat = await fs.stat(dir)
      if (stat.isDirectory()) return dir
    } catch {
      /* ignore & try next */
    }
  }
  return null
}

/** Minimal RFC-4180-ish parser — enough for the Sama Link CSV shape.
 *  We do NOT pull a dependency for this: the file is small, stable, and
 *  avoiding an extra npm install keeps the backend image lean. */
function parseCsv(src: string): string[][] {
  const rows: string[][] = []
  let cur: string[] = []
  let field = ""
  let inQuotes = false
  let i = 0
  while (i < src.length) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += ch
      i++
      continue
    }
    if (ch === '"') {
      inQuotes = true
      i++
      continue
    }
    if (ch === ",") {
      cur.push(field)
      field = ""
      i++
      continue
    }
    if (ch === "\n" || ch === "\r") {
      // Normalise \r\n → single row terminator
      if (ch === "\r" && src[i + 1] === "\n") i++
      cur.push(field)
      rows.push(cur)
      cur = []
      field = ""
      i++
      continue
    }
    field += ch
    i++
  }
  // Flush last field/row if the file didn't end with a newline.
  if (field.length || cur.length) {
    cur.push(field)
    rows.push(cur)
  }
  return rows
}

/** Serialiser inverse to `parseCsv`. Quotes any field containing `,` `"` or a
 *  newline; escapes embedded quotes by doubling them. Always emits `\n`
 *  terminators (host git clients normalise to CRLF on Windows if needed). */
function serializeCsv(rows: string[][]): string {
  const esc = (v: string): string => {
    if (v == null) return ""
    if (/[",\r\n]/.test(v)) {
      return `"${v.replace(/"/g, '""')}"`
    }
    return v
  }
  return rows.map((r) => r.map(esc).join(",")).join("\n") + "\n"
}

function readHeaderIndex(header: string[], name: string): number {
  return header.findIndex((h) => h.trim().toLowerCase() === name)
}

async function loadFile(
  dir: string | null,
  name: string
): Promise<FilePayload> {
  const file = name
  const empty: FilePayload = {
    file,
    present: false,
    rowCount: 0,
    rows: [],
    summary: { missingAr: 0, missingEn: 0, total: 0 },
  }
  if (!dir) return empty

  const full = path.join(dir, file)
  let contents: string
  try {
    contents = await fs.readFile(full, "utf8")
  } catch {
    return empty
  }

  const raw = parseCsv(contents)
  if (raw.length === 0) return { ...empty, present: true }
  const header = raw[0] ?? []
  const keyIdx = readHeaderIndex(header, "key")
  const enIdx = readHeaderIndex(header, "en")
  const arIdx = readHeaderIndex(header, "ar")
  const notesIdx = readHeaderIndex(header, "notes")

  const parsed: ParsedRow[] = []
  for (let i = 1; i < raw.length; i++) {
    const cols = raw[i] ?? []
    // Skip blank trailing rows
    if (cols.every((c) => !c || !c.trim())) continue
    const key = keyIdx >= 0 ? (cols[keyIdx] ?? "").trim() : ""
    if (!key) continue
    parsed.push({
      key,
      en: enIdx >= 0 ? (cols[enIdx] ?? "").trim() : "",
      ar: arIdx >= 0 ? (cols[arIdx] ?? "").trim() : "",
      notes: notesIdx >= 0 ? (cols[notesIdx] ?? "").trim() : "",
    })
  }

  let missingAr = 0
  let missingEn = 0
  for (const r of parsed) {
    if (!r.ar) missingAr++
    if (!r.en) missingEn++
  }

  return {
    file,
    present: true,
    rowCount: parsed.length,
    rows: parsed,
    summary: { missingAr, missingEn, total: parsed.length },
  }
}

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  try {
    const dir = await resolveTranslationsDir()
    const [storefront, admin] = await Promise.all([
      loadFile(dir, FILE_MAP.storefront),
      loadFile(dir, FILE_MAP.admin),
    ])
    res.json({
      translations_dir: dir ?? null,
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

/* ── PATCH handler (ADR-047) ─────────────────────────────────────────── */

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
    // Normalise whitespace lightly — trim trailing newlines only. Leading/
    // trailing single spaces are preserved so operators can express nuance.
    value: rawValue.replace(/\r\n?$/g, "").replace(/\n+$/g, ""),
  }
}

async function appendAuditLog(
  dir: string,
  entry: {
    file: string
    key: string
    column: ColumnKey
    before: string
    after: string
  }
): Promise<void> {
  const line =
    JSON.stringify({
      ts: new Date().toISOString(),
      ...entry,
    }) + "\n"
  try {
    await fs.appendFile(path.join(dir, AUDIT_LOG), line, "utf8")
  } catch (err) {
    // Audit-log failure should not block the write — the CSV diff still
    // surfaces the change on the host's next `git commit`.
    // eslint-disable-next-line no-console
    console.warn("[sama-content] audit log append failed:", err)
  }
}

/* ── BACK-12 · messages JSON mirror ─────────────────────────────── */

type Locale = "en" | "ar"
type MessagesSyncStatus =
  | { synced: true; path: string }
  | { synced: false; reason: string }
  | { synced: false; skipped: true; reason: string }

/** Set a value at a dotted path inside a plain-object tree. Creates
 *  intermediate objects on the way down. If an intermediate segment exists
 *  but is NOT a plain object (e.g. a string was accidentally saved where a
 *  namespace was expected), we overwrite it with an object so the new
 *  branch can land — next-intl would have thrown on the malformed node
 *  anyway, so no regression. Returns whether the tree actually changed. */
function setDottedPath(
  tree: Record<string, unknown>,
  dottedKey: string,
  value: string
): boolean {
  const parts = dottedKey.split(".").filter((p) => p.length > 0)
  if (parts.length === 0) return false
  let node: Record<string, unknown> = tree
  for (let i = 0; i < parts.length - 1; i++) {
    const seg = parts[i]!
    const existing = node[seg]
    if (
      !existing ||
      typeof existing !== "object" ||
      Array.isArray(existing)
    ) {
      node[seg] = {}
    }
    node = node[seg] as Record<string, unknown>
  }
  const leaf = parts[parts.length - 1]!
  if (node[leaf] === value) return false
  node[leaf] = value
  return true
}

/** Rewrite one locale's JSON with a single-field change. Keeps the existing
 *  file's key order for the top-level namespaces the best JSON.stringify can
 *  (insertion order for objects) — since we mutate in place and don't
 *  reshape the tree, operators should see minimal diffs per edit. */
async function writeLocaleJson(
  messagesDir: string,
  locale: Locale,
  dottedKey: string,
  value: string
): Promise<MessagesSyncStatus> {
  const filename = `${locale}.json`
  const full = path.join(messagesDir, filename)
  let raw: string
  try {
    raw = await fs.readFile(full, "utf8")
  } catch (err) {
    return {
      synced: false,
      reason: `Could not read ${filename}: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
  let tree: Record<string, unknown>
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { synced: false, reason: `${filename} is not a JSON object at its root.` }
    }
    tree = parsed as Record<string, unknown>
  } catch (err) {
    return {
      synced: false,
      reason: `Failed to parse ${filename}: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
  const changed = setDottedPath(tree, dottedKey, value)
  if (!changed) {
    return { synced: true, path: full }
  }
  try {
    // 2-space indent + trailing newline matches the repo's existing
    // `messages/*.json` style (Prettier default). Minimises diff noise.
    await fs.writeFile(full, JSON.stringify(tree, null, 2) + "\n", "utf8")
  } catch (err) {
    return {
      synced: false,
      reason: `Failed to write ${filename}: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
  return { synced: true, path: full }
}

/** Called from the PATCH handler. Gates on the conditions where a JSON
 *  mirror makes sense; returns a sync status payload for the response. */
async function syncMessagesJson(args: {
  file: FileKey
  column: ColumnKey
  key: string
  value: string
}): Promise<MessagesSyncStatus> {
  const { file, column, key, value } = args
  if (file !== "storefront") {
    return {
      synced: false,
      skipped: true,
      reason:
        "admin.csv is not wired to a runtime next-intl bundle yet — no JSON mirror applied.",
    }
  }
  if (column !== "en" && column !== "ar") {
    return {
      synced: false,
      skipped: true,
      reason: "Notes are CSV-only metadata — no JSON mirror required.",
    }
  }
  const dir = await resolveStorefrontMessagesDir()
  if (!dir) {
    return {
      synced: false,
      reason:
        "Storefront messages folder not resolvable. Check SAMA_STOREFRONT_MESSAGES_DIR or the docker-compose volume mount.",
    }
  }
  return writeLocaleJson(dir, column, key, value)
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  try {
    const dir = await resolveTranslationsDir()
    if (!dir) {
      res.status(500).json({
        error:
          "Translations folder not resolvable. Check SAMA_TRANSLATIONS_DIR or the docker-compose volume mount.",
      })
      return
    }

    const parsed = validateBody(req.body as PatchBody)
    if ("status" in parsed) {
      res.status(parsed.status).json({ error: parsed.message })
      return
    }
    const { file, key, column, value } = parsed

    const csvName = FILE_MAP[file]
    const csvPath = path.join(dir, csvName)

    let raw: string
    try {
      raw = await fs.readFile(csvPath, "utf8")
    } catch (err) {
      res.status(404).json({
        error: `Could not read ${csvName}: ${err instanceof Error ? err.message : String(err)}`,
      })
      return
    }

    const rows = parseCsv(raw)
    if (rows.length === 0) {
      res.status(422).json({ error: `${csvName} is empty — no header row to resolve columns against.` })
      return
    }
    const header = rows[0]!
    const keyIdx = readHeaderIndex(header, "key")
    const colIdx = readHeaderIndex(header, column)
    if (keyIdx < 0) {
      res.status(422).json({ error: `${csvName} has no "key" column in its header.` })
      return
    }
    if (colIdx < 0) {
      res
        .status(422)
        .json({ error: `${csvName} has no "${column}" column in its header.` })
      return
    }

    let rowIdx = -1
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] ?? []
      if ((row[keyIdx] ?? "").trim() === key) {
        rowIdx = i
        break
      }
    }
    if (rowIdx < 0) {
      res
        .status(404)
        .json({ error: `Key "${key}" not found in ${csvName}.` })
      return
    }

    const target = rows[rowIdx]!
    // Pad short rows so colIdx is addressable.
    while (target.length <= colIdx) target.push("")
    const before = target[colIdx] ?? ""
    if (before === value) {
      // No-op — still respond with the current row so the UI can reconcile.
      const current: ParsedRow = {
        key,
        en: header[readHeaderIndex(header, "en")] !== undefined ? (target[readHeaderIndex(header, "en")] ?? "") : "",
        ar: header[readHeaderIndex(header, "ar")] !== undefined ? (target[readHeaderIndex(header, "ar")] ?? "") : "",
        notes: header[readHeaderIndex(header, "notes")] !== undefined ? (target[readHeaderIndex(header, "notes")] ?? "") : "",
      }
      res.json({ unchanged: true, file: csvName, row: current })
      return
    }
    target[colIdx] = value

    const next = serializeCsv(rows)
    await fs.writeFile(csvPath, next, "utf8")

    await appendAuditLog(dir, {
      file: csvName,
      key,
      column,
      before,
      after: value,
    })

    // BACK-12 · Mirror into messages/{locale}.json when applicable. Best-
    // effort — a failure here does NOT roll back the CSV write because the
    // CSV is the canonical source per ADR-040.
    const messagesSync = await syncMessagesJson({ file, column, key, value })
    if (!messagesSync.synced && !("skipped" in messagesSync)) {
      // eslint-disable-next-line no-console
      console.warn(
        "[sama-content] messages JSON mirror failed:",
        messagesSync.reason
      )
    }

    const enIdx = readHeaderIndex(header, "en")
    const arIdx = readHeaderIndex(header, "ar")
    const notesIdx = readHeaderIndex(header, "notes")
    const updated: ParsedRow = {
      key,
      en: enIdx >= 0 ? (target[enIdx] ?? "") : "",
      ar: arIdx >= 0 ? (target[arIdx] ?? "") : "",
      notes: notesIdx >= 0 ? (target[notesIdx] ?? "") : "",
    }

    res.json({
      unchanged: false,
      file: csvName,
      row: updated,
      messagesSync,
    })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[sama-content] PATCH failed:", e)
    res.status(500).json({
      error: e instanceof Error ? e.message : "Unknown error while writing translation.",
    })
  }
}
