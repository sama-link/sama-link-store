// Sama Link · shared translation helpers — ADR-047.
//
// Extracted out of `src/api/admin/sama-content/translations/route.ts`
// so the sibling scan/export/import endpoints can share the CSV
// parser, the messages-JSON mirror, path resolution, and the audit
// log append. Living at `src/lib/` keeps it completely outside the
// file-based API router's scan path.

import { promises as fs } from "fs"
import path from "path"

/* ── Constants ──────────────────────────────────────────────────── */

export const FILE_MAP = {
  storefront: "storefront.csv",
  admin: "admin.csv",
} as const
export const AUDIT_LOG = ".edit-log.jsonl"

export type FileKey = keyof typeof FILE_MAP
export type Locale = "en" | "ar"
export type ColumnKey = Locale | "notes"

/* ── Path resolvers ─────────────────────────────────────────────── */

export async function resolveTranslationsDir(): Promise<string | null> {
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
    } catch { /* ignore */ }
  }
  return null
}

export async function resolveStorefrontMessagesDir(): Promise<string | null> {
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
    } catch { /* ignore */ }
  }
  return null
}

/** Find Medusa dashboard's built-in i18n translations folder. Ships as
 *  source JSON inside `@medusajs/dashboard/src/i18n/translations/` — one
 *  file per locale, flat nested object of dotted-key groups.
 *
 *  Used by the scan endpoint to populate `admin.csv` so operators can
 *  see Medusa's own coverage (EN is canonical, AR is partial — ~238
 *  keys missing) alongside any Sama-specific admin copy they add. */
export async function resolveAdminMessagesDir(): Promise<string | null> {
  const envDir = process.env["SAMA_ADMIN_MESSAGES_DIR"]
  const candidates = [
    envDir,
    "/app/node_modules/@medusajs/dashboard/src/i18n/translations",
    path.resolve(
      process.cwd(),
      "node_modules/@medusajs/dashboard/src/i18n/translations"
    ),
    path.resolve(
      process.cwd(),
      "../../node_modules/@medusajs/dashboard/src/i18n/translations"
    ),
    path.resolve(
      process.cwd(),
      "../../../node_modules/@medusajs/dashboard/src/i18n/translations"
    ),
  ].filter((p): p is string => typeof p === "string" && p.length > 0)
  for (const dir of candidates) {
    try {
      const stat = await fs.stat(dir)
      if (stat.isDirectory()) return dir
    } catch { /* ignore */ }
  }
  return null
}

/* ── CSV parse / serialize ──────────────────────────────────────── */

export function parseCsv(src: string): string[][] {
  const rows: string[][] = []
  let cur: string[] = []
  let field = ""
  let inQuotes = false
  let i = 0
  while (i < src.length) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i += 2; continue }
        inQuotes = false; i++; continue
      }
      field += ch; i++; continue
    }
    if (ch === '"') { inQuotes = true; i++; continue }
    if (ch === ",") { cur.push(field); field = ""; i++; continue }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++
      cur.push(field); rows.push(cur); cur = []; field = ""; i++; continue
    }
    field += ch; i++
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur) }
  return rows
}

export function serializeCsv(rows: string[][]): string {
  const esc = (v: string): string => {
    if (v == null) return ""
    if (/[",\r\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`
    return v
  }
  return rows.map((r) => r.map(esc).join(",")).join("\n") + "\n"
}

export function headerIndex(header: string[], name: string): number {
  return header.findIndex((h) => h.trim().toLowerCase() === name)
}

/* ── Dotted-path write on nested JSON ───────────────────────────── */

export function setDottedPath(
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
    if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
      node[seg] = {}
    }
    node = node[seg] as Record<string, unknown>
  }
  const leaf = parts[parts.length - 1]!
  if (node[leaf] === value) return false
  node[leaf] = value
  return true
}

/** Walks a nested object and emits `{ dottedKey, value }` for every
 *  leaf (string | number | boolean). Used by the scan endpoint to
 *  flatten `messages/*.json` into CSV-ready keys. */
export function flattenJsonLeaves(
  tree: unknown,
  prefix = "",
  out: Map<string, string> = new Map()
): Map<string, string> {
  if (tree == null) return out
  if (typeof tree === "string") {
    if (prefix) out.set(prefix, tree)
    return out
  }
  if (typeof tree === "number" || typeof tree === "boolean") {
    if (prefix) out.set(prefix, String(tree))
    return out
  }
  if (Array.isArray(tree)) {
    // Arrays flatten to `prefix.0`, `prefix.1`, ... — rare in
    // next-intl catalogs but handle for resilience.
    tree.forEach((v, i) => {
      const seg = prefix ? `${prefix}.${i}` : String(i)
      flattenJsonLeaves(v, seg, out)
    })
    return out
  }
  if (typeof tree === "object") {
    for (const [k, v] of Object.entries(tree as Record<string, unknown>)) {
      const seg = prefix ? `${prefix}.${k}` : k
      flattenJsonLeaves(v, seg, out)
    }
  }
  return out
}

/* ── Audit log ──────────────────────────────────────────────────── */

export type AuditEntry = {
  file: string
  key: string
  column: ColumnKey
  before: string
  after: string
  source?: string
}

export async function appendAuditEntries(
  dir: string,
  entries: AuditEntry[]
): Promise<void> {
  if (entries.length === 0) return
  const lines =
    entries
      .map((e) =>
        JSON.stringify({
          ts: new Date().toISOString(),
          ...e,
        })
      )
      .join("\n") + "\n"
  try {
    await fs.appendFile(path.join(dir, AUDIT_LOG), lines, "utf8")
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[sama-content] audit log append failed:", err)
  }
}

/* ── Messages JSON mirror for storefront (BACK-12 rule) ─────────── */

export async function mirrorStorefrontJson(
  locale: Locale,
  updates: Array<{ key: string; value: string }>
): Promise<{ synced: boolean; reason?: string; path?: string }> {
  if (updates.length === 0) return { synced: true }
  const dir = await resolveStorefrontMessagesDir()
  if (!dir) {
    return {
      synced: false,
      reason:
        "Storefront messages folder not resolvable. Check SAMA_STOREFRONT_MESSAGES_DIR or the docker-compose volume mount.",
    }
  }
  const full = path.join(dir, `${locale}.json`)
  let raw: string
  try {
    raw = await fs.readFile(full, "utf8")
  } catch (err) {
    return {
      synced: false,
      reason: `Could not read ${locale}.json: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
  let tree: Record<string, unknown>
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { synced: false, reason: `${locale}.json is not a JSON object at its root.` }
    }
    tree = parsed as Record<string, unknown>
  } catch (err) {
    return {
      synced: false,
      reason: `Failed to parse ${locale}.json: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
  let changed = false
  for (const { key, value } of updates) {
    if (setDottedPath(tree, key, value)) changed = true
  }
  if (!changed) return { synced: true, path: full }
  try {
    await fs.writeFile(full, JSON.stringify(tree, null, 2) + "\n", "utf8")
  } catch (err) {
    return {
      synced: false,
      reason: `Failed to write ${locale}.json: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
  return { synced: true, path: full }
}

/* ── CSV convenience ────────────────────────────────────────────── */

export type CsvHandle = {
  path: string
  rows: string[][]
  header: string[]
  keyIdx: number
  enIdx: number
  arIdx: number
  notesIdx: number
}

export async function loadCsvHandle(
  dir: string,
  file: FileKey
): Promise<CsvHandle> {
  const full = path.join(dir, FILE_MAP[file])
  const raw = await fs.readFile(full, "utf8")
  const rows = parseCsv(raw)
  if (rows.length === 0) {
    // Initialise with a header row so downstream writes don't need
    // to special-case empty files.
    rows.push(["key", "en", "ar", "notes"])
  }
  const header = rows[0]!
  return {
    path: full,
    rows,
    header,
    keyIdx: headerIndex(header, "key"),
    enIdx: headerIndex(header, "en"),
    arIdx: headerIndex(header, "ar"),
    notesIdx: headerIndex(header, "notes"),
  }
}

export async function writeCsvHandle(h: CsvHandle): Promise<void> {
  await fs.writeFile(h.path, serializeCsv(h.rows), "utf8")
}
