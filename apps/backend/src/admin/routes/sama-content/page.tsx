// Sama Link content library — ADR-046 + ADR-040 (narrowed by ADR-047).
//
// Read + write view of the translation CSVs (storefront + admin). Operators
// edit AR / EN / notes cells inline; each save round-trips through
// PATCH /admin/sama-content/translations, which rewrites the CSV on disk and
// appends a row to `translations/.edit-log.jsonl` for the audit trail the
// PR gate used to provide (ADR-047 rationale).
//
// Data source: GET /admin/sama-content/translations (custom API route).
// Write path: PATCH /admin/sama-content/translations (same route, ADR-047).
// If the translations folder isn't mounted into the backend container,
// the endpoint returns present=false and this page renders an empty state
// with setup instructions.
//
// Rebuild required after any change:
//   docker compose -f docker-compose.dev.yml up -d --build backend

import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react"
import {
  BrandShell,
  PageHeader,
  BrandSection,
  MetricTile,
  StatusChip,
  EmptyState,
  BrandButton,
} from "../../components"
import { adminFetch } from "../../lib/admin-api"
import { formatInt } from "../../lib/format"

type Row = { key: string; en: string; ar: string; notes: string }
type FilePayload = {
  file: string
  present: boolean
  rowCount: number
  rows: Row[]
  summary: { missingAr: number; missingEn: number; total: number }
}
type ContentResponse = {
  translations_dir: string | null
  error?: string
  storefront: FilePayload
  admin: FilePayload
}

/* BACK-14 · Scan / Export / Import response shapes. */
type ScanResponse = {
  file: string
  added: Array<{ key: string; en: string; ar: string; notes: string }>
  already_present: number
  scanned: {
    en_keys: number
    ar_keys: number
    csv_keys_before: number
    csv_keys_after: number
  }
  audit_lines: number
}

type ImportResponse = {
  file: string
  added: Array<{ key: string; en: string; ar: string; notes: string }>
  updated: Array<{
    key: string
    column: "en" | "ar" | "notes"
    before: string
    after: string
  }>
  unchanged: number
  skipped: Array<{ key: string; reason: string }>
  messages_synced: boolean
  messages_sync_errors?: string[]
  audit_lines: number
}

type MessagesSync =
  | { synced: true; path?: string }
  | { synced: false; reason: string }
  | { synced: false; skipped: true; reason: string }

type PatchResponse = {
  unchanged: boolean
  file: string
  row: Row
  /** BACK-12 · Status of the next-intl messages JSON mirror write.
   *  Optional — older backend versions omit the field. */
  messagesSync?: MessagesSync
}

type Filter = "all" | "missing_ar" | "missing_en" | "has_ar"
type FileKey = "storefront" | "admin"
type EditableColumn = "ar" | "en" | "notes"

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  { value: "missing_ar", label: "AR missing" },
  { value: "missing_en", label: "EN missing" },
  { value: "has_ar", label: "AR present" },
]

type ToastKind = "success" | "error"
type Toast = { id: number; kind: ToastKind; message: string }

const SamaContentPage = () => {
  const [payload, setPayload] = useState<ContentResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFile, setActiveFile] = useState<FileKey>("storefront")
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [refreshKey, setRefreshKey] = useState(0)

  /* Inline-edit state — only one cell can be active at a time to keep the
     UX + save semantics predictable. */
  const [editing, setEditing] = useState<{
    key: string
    column: EditableColumn
  } | null>(null)
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)

  /* BACK-14 · Scan / Export / Import state. At most one async operation
   * runs at a time — the bar disables all buttons while `busy` is set. */
  const [busy, setBusy] = useState<null | "scan" | "export" | "import">(null)
  const importInputRef = useRef<HTMLInputElement | null>(null)

  const pushToast = useCallback((kind: ToastKind, message: string) => {
    toastId.current += 1
    const id = toastId.current
    setToasts((prev) => [...prev, { id, kind, message }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3600)
  }, [])

  const load = useCallback(async (signal: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminFetch<ContentResponse>(
        "/sama-content/translations",
        { signal }
      )
      setPayload(data)
    } catch (e) {
      if (signal.aborted) return
      setError(e instanceof Error ? e.message : "Failed to load translations")
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const ac = new AbortController()
    void load(ac.signal)
    return () => ac.abort()
  }, [load, refreshKey])

  const currentFile: FilePayload | null = useMemo(() => {
    if (!payload) return null
    return activeFile === "storefront" ? payload.storefront : payload.admin
  }, [payload, activeFile])

  const filteredRows = useMemo(() => {
    if (!currentFile) return []
    const q = query.trim().toLowerCase()
    return currentFile.rows.filter((r) => {
      if (q) {
        const hay = `${r.key} ${r.en} ${r.ar} ${r.notes}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (filter === "missing_ar" && r.ar) return false
      if (filter === "missing_en" && r.en) return false
      if (filter === "has_ar" && !r.ar) return false
      return true
    })
  }, [currentFile, query, filter])

  /* Locally patch payload.state after a successful PATCH so the UI
     reflects the new value without a full refetch round-trip. */
  const applyLocalRowUpdate = useCallback(
    (file: FileKey, row: Row) => {
      setPayload((prev) => {
        if (!prev) return prev
        const target = file === "storefront" ? prev.storefront : prev.admin
        const nextRows = target.rows.map((r) => (r.key === row.key ? row : r))
        let missingAr = 0
        let missingEn = 0
        for (const r of nextRows) {
          if (!r.ar) missingAr++
          if (!r.en) missingEn++
        }
        const nextFile: FilePayload = {
          ...target,
          rows: nextRows,
          summary: { ...target.summary, missingAr, missingEn },
        }
        return {
          ...prev,
          [file]: nextFile,
        } as ContentResponse
      })
    },
    []
  )

  const saveCell = useCallback(
    async (row: Row, column: EditableColumn, nextValue: string) => {
      const previousValue = row[column]
      if (previousValue === nextValue) {
        setEditing(null)
        return
      }
      setPendingKey(row.key)
      try {
        const data = await adminFetch<PatchResponse>(
          "/sama-content/translations",
          {
            method: "PATCH",
            body: {
              file: activeFile,
              key: row.key,
              column,
              value: nextValue,
            },
          }
        )
        applyLocalRowUpdate(activeFile, data.row)
        setEditing(null)
        if (!data.unchanged) {
          // Surface JSON-mirror drift if it happened (rare — typically a
          // mount misconfiguration). When the mirror was correctly
          // skipped (notes edit, admin.csv), the UI stays quiet.
          const sync = data.messagesSync
          if (sync && !sync.synced && !("skipped" in sync)) {
            pushToast(
              "error",
              `Saved, but live storefront update failed: ${sync.reason}`
            )
          } else {
            const syncNote =
              sync && sync.synced ? " Storefront updated live." : ""
            pushToast(
              "success",
              `Saved ${column.toUpperCase()} for "${row.key}".${syncNote}`
            )
          }
        }
      } catch (e) {
        pushToast(
          "error",
          e instanceof Error ? e.message : "Failed to save translation."
        )
      } finally {
        setPendingKey(null)
      }
    },
    [activeFile, applyLocalRowUpdate, pushToast]
  )

  const loadedEmpty = payload && !payload.storefront.present && !payload.admin.present

  /* ── BACK-14 · Scan ────────────────────────────────────────────
   * Asks the backend to walk the runtime i18n source for the ACTIVE
   * tab and append any keys missing from the CSV. For `storefront`
   * that means apps/storefront/messages/*.json; for `admin` that
   * means Medusa dashboard's built-in @medusajs/dashboard/src/i18n/
   * translations (2130 EN keys, ~238 still missing from AR). New
   * rows land with EN + AR pre-filled from the runtime source where
   * available. */
  const runScan = useCallback(async () => {
    if (busy) return
    setBusy("scan")
    try {
      const resp = await adminFetch<ScanResponse>(
        "/sama-content/translations/scan",
        { method: "POST", body: { file: activeFile } }
      )
      if (resp.added.length === 0) {
        pushToast(
          "success",
          `Nothing new — every known string is already in the table.`
        )
      } else {
        pushToast(
          "success",
          `Added ${resp.added.length} missing string${resp.added.length === 1 ? "" : "s"} to the table.`
        )
        setRefreshKey((k) => k + 1)
      }
    } catch (e) {
      pushToast("error", e instanceof Error ? e.message : "Scan failed.")
    } finally {
      setBusy(null)
    }
  }, [activeFile, busy, pushToast])

  /* ── BACK-14 · Export ──────────────────────────────────────────
   * Triggers a CSV download. Uses a programmatic `<a download>` click
   * so the file lands in the browser's default downloads folder. */
  const runExport = useCallback(
    async (filter: "missing_ar" | "missing_en" | "missing_any" | "all") => {
      if (busy) return
      setBusy("export")
      try {
        const url = `/admin/sama-content/translations/export?file=${activeFile}&filter=${filter}`
        const resp = await fetch(url, { credentials: "include" })
        if (!resp.ok) {
          const text = await resp.text().catch(() => "")
          throw new Error(text || `Export failed (${resp.status})`)
        }
        const blob = await resp.blob()
        // Mirror the filename the backend chose in the Content-Disposition
        // header so the user sees a sensible name in their downloads.
        const disposition = resp.headers.get("content-disposition") ?? ""
        const match = /filename="?([^"]+)"?/.exec(disposition)
        const filename = match?.[1] ?? `${activeFile}-${filter}.csv`
        const href = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = href
        a.download = filename
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(href)
        pushToast("success", `Downloaded ${filename}.`)
      } catch (e) {
        pushToast("error", e instanceof Error ? e.message : "Export failed.")
      } finally {
        setBusy(null)
      }
    },
    [activeFile, busy, pushToast]
  )

  /* ── BACK-14 · Import ──────────────────────────────────────────
   * Opens a file picker, reads the chosen CSV as text, and POSTs
   * it to the import endpoint. Reloads the table after success. */
  const triggerImport = useCallback(() => {
    importInputRef.current?.click()
  }, [])

  const handleImportFile = useCallback(
    async (file: File) => {
      if (busy) return
      setBusy("import")
      try {
        const text = await file.text()
        const resp = await adminFetch<ImportResponse>(
          "/sama-content/translations/import",
          {
            method: "POST",
            body: { file: activeFile, csv: text, mode: "upsert" },
          }
        )
        const changed = resp.added.length + resp.updated.length
        const sync = resp.messages_synced ? " Storefront updated live." : ""
        if (changed === 0) {
          pushToast(
            "success",
            `Imported ${file.name} — every cell already matches.`
          )
        } else {
          pushToast(
            "success",
            `Imported ${file.name} — ${resp.added.length} added, ${resp.updated.length} updated.${sync}`
          )
        }
        if (resp.skipped.length > 0) {
          pushToast(
            "error",
            `${resp.skipped.length} row${resp.skipped.length === 1 ? " was" : "s were"} skipped. Check the "key" column in your file for typos.`
          )
        }
        setRefreshKey((k) => k + 1)
      } catch (e) {
        pushToast("error", e instanceof Error ? e.message : "Import failed.")
      } finally {
        setBusy(null)
        if (importInputRef.current) importInputRef.current.value = ""
      }
    },
    [activeFile, busy, pushToast]
  )

  return (
    <BrandShell as="page">
      <PageHeader
        eyebrow="Sama Link · Content library"
        title="Translation coverage"
        subtitle="Edit storefront and admin translations in one place. Changes go live on the store right away."
        actions={
          <>
            <BrandButton
              variant="outline"
              size="sm"
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={loading}
            >
              {loading ? "Refreshing…" : "Refresh"}
            </BrandButton>
          </>
        }
      />

      {error ? (
        <div className="sl-note sl-note-error" style={{ marginBottom: 16 }}>
          <strong style={{ color: "var(--sl-error)" }}>Failed:</strong> {error}
        </div>
      ) : null}

      {payload?.error ? (
        <div className="sl-note sl-note-warning" style={{ marginBottom: 16 }}>
          <strong style={{ color: "var(--sl-warning)" }}>Warning:</strong>{" "}
          {payload.error}
        </div>
      ) : null}

      {loadedEmpty ? (
        <EmptyState
          title="Translations are not available"
          description="The translation catalog is unreachable right now. Try refreshing, or contact your developer if the problem persists."
          action={
            <BrandButton
              variant="outline"
              size="sm"
              onClick={() => setRefreshKey((k) => k + 1)}
            >
              Try again
            </BrandButton>
          }
        />
      ) : (
        <>
          {/* ── Overall summary ─────────────────────────────── */}
          <BrandSection
            title="Coverage summary"
            subtitle="Missing Arabic rows ship the English fallback on the storefront until translated. Click any AR / EN / notes cell below to edit inline."
          >
            <div className="sl-grid sl-grid-4">
              <MetricTile
                label="Storefront keys"
                value={
                  loading ? "—" : formatInt(payload?.storefront.rowCount ?? 0)
                }
                foot="Strings shown on the public store"
              />
              <MetricTile
                label="Admin keys"
                value={loading ? "—" : formatInt(payload?.admin.rowCount ?? 0)}
                foot="Strings used inside this admin"
              />
              <MetricTile
                label="AR missing (storefront)"
                value={
                  loading
                    ? "—"
                    : formatInt(payload?.storefront.summary.missingAr ?? 0)
                }
                foot="Rows without an Arabic translation"
              />
              <MetricTile
                label="AR missing (admin)"
                value={
                  loading
                    ? "—"
                    : formatInt(payload?.admin.summary.missingAr ?? 0)
                }
                foot="Rows without an Arabic translation"
                muted
              />
            </div>
          </BrandSection>

          {/* ── Explorer ────────────────────────────────────── */}
          <BrandSection
            title="Explorer"
            subtitle="Search keys, English, Arabic, and notes. Click a key to copy it; click any editable cell to modify."
            actions={
              <div className="sl-tabs" role="tablist" aria-label="File">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeFile === "storefront"}
                  data-active={activeFile === "storefront"}
                  className="sl-tab"
                  onClick={() => {
                    setEditing(null)
                    setActiveFile("storefront")
                  }}
                >
                  Storefront
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeFile === "admin"}
                  data-active={activeFile === "admin"}
                  className="sl-tab"
                  onClick={() => {
                    setEditing(null)
                    setActiveFile("admin")
                  }}
                >
                  Admin
                </button>
              </div>
            }
          >
            <div className="sl-row" style={{ marginBottom: 12 }}>
              <input
                type="search"
                className="sl-input"
                style={{ flex: 1, minWidth: 200 }}
                placeholder="Search key, en, ar, notes…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="sl-tabs" role="tablist" aria-label="Filter">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    role="tab"
                    aria-selected={filter === f.value}
                    data-active={filter === f.value}
                    className="sl-tab"
                    onClick={() => setFilter(f.value)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Scan / Export / Import bar (BACK-14) ────────── */}
            <TranslationToolsBar
              file={activeFile}
              busy={busy}
              missingAr={currentFile?.summary.missingAr ?? 0}
              missingEn={currentFile?.summary.missingEn ?? 0}
              onScan={runScan}
              onExport={runExport}
              onImport={triggerImport}
            />
            <input
              ref={importInputRef}
              type="file"
              accept=".csv,text/csv"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleImportFile(f)
              }}
            />

            {loading ? (
              <div className="sl-stack-sm">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="sl-skeleton"
                    style={{ height: 36, borderRadius: 8 }}
                  />
                ))}
              </div>
            ) : filteredRows.length === 0 ? (
              <EmptyState
                title="No matching rows"
                description="Try clearing the search or picking a different filter."
              />
            ) : (
              <div className="sl-table-wrap">
                <table className="sl-table">
                  <thead>
                    <tr>
                      <th style={{ width: "22%" }}>Key</th>
                      <th style={{ width: "28%" }}>English</th>
                      <th style={{ width: "28%" }}>العربية</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r) => {
                      const rowPending = pendingKey === r.key
                      return (
                        <tr key={r.key}>
                          <td>
                            <KeyCell value={r.key} />
                          </td>
                          <td>
                            <EditableCell
                              value={r.en}
                              lang="en"
                              active={
                                editing?.key === r.key && editing?.column === "en"
                              }
                              pending={rowPending && editing?.column === "en"}
                              onActivate={() =>
                                setEditing({ key: r.key, column: "en" })
                              }
                              onSave={(next) => saveCell(r, "en", next)}
                              onCancel={() => setEditing(null)}
                              placeholder="missing"
                              placeholderTone="warning"
                            />
                          </td>
                          <td>
                            <EditableCell
                              value={r.ar}
                              lang="ar"
                              active={
                                editing?.key === r.key && editing?.column === "ar"
                              }
                              pending={rowPending && editing?.column === "ar"}
                              onActivate={() =>
                                setEditing({ key: r.key, column: "ar" })
                              }
                              onSave={(next) => saveCell(r, "ar", next)}
                              onCancel={() => setEditing(null)}
                              placeholder="missing"
                              placeholderTone="warning"
                            />
                          </td>
                          <td>
                            <EditableCell
                              value={r.notes}
                              lang="en"
                              muted
                              active={
                                editing?.key === r.key &&
                                editing?.column === "notes"
                              }
                              pending={rowPending && editing?.column === "notes"}
                              onActivate={() =>
                                setEditing({ key: r.key, column: "notes" })
                              }
                              onSave={(next) => saveCell(r, "notes", next)}
                              onCancel={() => setEditing(null)}
                              placeholder="—"
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="sl-note" style={{ marginTop: 12 }}>
              <strong>Tip:</strong> click any English, Arabic, or Notes cell
              to edit. <span className="sl-kbd">Enter</span> or click
              elsewhere to save; <span className="sl-kbd">Esc</span> to
              cancel; <span className="sl-kbd">Shift</span>+
              <span className="sl-kbd">Enter</span> for a new line.
            </div>
          </BrandSection>
        </>
      )}

      {/* ── Toast stack ─────────────────────────────────── */}
      {toasts.length > 0 ? (
        <div
          style={{
            position: "fixed",
            right: 20,
            bottom: 20,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            zIndex: 60,
          }}
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              className={`sl-note ${t.kind === "error" ? "sl-note-error" : ""}`}
              style={{
                padding: "10px 12px",
                minWidth: 240,
                maxWidth: 420,
                background: "var(--sl-surface)",
                borderColor:
                  t.kind === "error"
                    ? "var(--sl-error)"
                    : "var(--sl-success, #16a34a)",
              }}
            >
              <strong
                style={{
                  color:
                    t.kind === "error"
                      ? "var(--sl-error)"
                      : "var(--sl-success, #16a34a)",
                }}
              >
                {t.kind === "error" ? "Save failed:" : "Saved:"}
              </strong>{" "}
              <span style={{ fontSize: 12 }}>{t.message}</span>
            </div>
          ))}
        </div>
      ) : null}
    </BrandShell>
  )
}

/* ── Sub-components ─────────────────────────────────────────────── */

/* BACK-14 · The translation tools bar — sits between the filter row
 * and the table. Three actions:
 *
 *   Scan       → appends keys from messages/*.json into storefront.csv
 *                so newly-used strings surface as table rows.
 *   Export     → downloads a CSV of currently untranslated rows so the
 *                operator can fill them offline (Excel / Sheets).
 *   Import     → uploads a filled CSV to apply translations in bulk.
 *                Matches by key, mirrors into messages JSON.
 *
 * No LLM here — human translation only. Keeps ADR-040 honest for the
 * CSV pipeline: Sama Link's storefront copy ships through reviewed
 * human work, the admin just speeds up the plumbing around it. */
const TranslationToolsBar = ({
  file,
  busy,
  missingAr,
  missingEn,
  onScan,
  onExport,
  onImport,
}: {
  file: FileKey
  busy: null | "scan" | "export" | "import"
  missingAr: number
  missingEn: number
  onScan: () => void
  onExport: (
    filter: "missing_ar" | "missing_en" | "missing_any" | "all"
  ) => void
  onImport: () => void
}) => {
  const anyBusy = busy != null
  const untranslated = missingAr + missingEn
  return (
    <div
      className="sl-row"
      style={{
        gap: 10,
        alignItems: "center",
        marginBottom: 12,
        padding: "8px 10px",
        borderRadius: 8,
        background: "var(--sl-surface-soft, rgba(15,43,79,0.04))",
        border: "1px dashed var(--sl-border, #e2e8f0)",
        flexWrap: "wrap",
      }}
    >
      <span
        className="sl-eyebrow"
        style={{ fontSize: 11, letterSpacing: 0.4 }}
      >
        Translation tools
      </span>
      <span className="sl-sub" style={{ fontSize: 12, flex: 1, minWidth: 200 }}>
        {anyBusy
          ? busy === "scan"
            ? "Looking for new strings…"
            : busy === "export"
              ? "Preparing download…"
              : "Uploading your file…"
          : `${missingAr} missing Arabic, ${missingEn} missing English. Download to translate, then upload when you're done.`}
      </span>
      <div className="sl-row" style={{ gap: 6, marginInlineStart: "auto" }}>
        <BrandButton
          variant="outline"
          size="sm"
          disabled={anyBusy}
          onClick={onScan}
          title={`Find strings used by the ${file === "storefront" ? "store" : "admin"} that aren't in the table yet, and add them.`}
        >
          🔍 Find new strings
        </BrandButton>
        <BrandButton
          variant="outline"
          size="sm"
          disabled={anyBusy || untranslated === 0}
          onClick={() => onExport("missing_ar")}
          title={
            untranslated === 0
              ? "Every row is fully translated."
              : "Download the rows that still need Arabic."
          }
        >
          ⬇ Download missing Arabic ({missingAr})
        </BrandButton>
        <BrandButton
          variant="ghost"
          size="sm"
          disabled={anyBusy}
          onClick={() => onExport("all")}
          title="Download every row in this table."
        >
          ⬇ Download all
        </BrandButton>
        <BrandButton
          variant="primary"
          size="sm"
          disabled={anyBusy}
          onClick={onImport}
          title="Upload a file to apply translations in bulk."
        >
          ⬆ Upload translations
        </BrandButton>
      </div>
    </div>
  )
}

const KeyCell = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      /* ignore clipboard denial */
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? "Copied" : "Click to copy key"}
      className="sl-row"
      style={{
        gap: 6,
        alignItems: "center",
        padding: 0,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: "inherit",
        textAlign: "inherit",
      }}
    >
      <span
        className="sl-mono"
        style={{
          fontSize: 12,
          wordBreak: "break-all",
        }}
      >
        {value}
      </span>
      {copied ? (
        <span
          className="sl-sub"
          style={{ fontSize: 10, color: "var(--sl-brand)" }}
        >
          ✓
        </span>
      ) : null}
    </button>
  )
}

type EditableCellProps = {
  value: string
  lang: "en" | "ar"
  muted?: boolean
  active: boolean
  pending: boolean
  onActivate: () => void
  onSave: (next: string) => void
  onCancel: () => void
  placeholder: string
  placeholderTone?: "warning" | "muted"
}

const EditableCell = ({
  value,
  lang,
  muted,
  active,
  pending,
  onActivate,
  onSave,
  onCancel,
  placeholder,
  placeholderTone,
}: EditableCellProps) => {
  const [draft, setDraft] = useState(value)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Reset draft whenever we re-enter edit mode or the underlying value
  // changes from a refresh.
  useEffect(() => {
    setDraft(value)
  }, [value, active])

  useEffect(() => {
    if (active && textareaRef.current) {
      const el = textareaRef.current
      el.focus()
      // Place caret at end.
      const len = el.value.length
      el.setSelectionRange(len, len)
      autoGrow(el)
    }
  }, [active])

  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`
  }

  const isRtl = lang === "ar"

  const cellStyle = {
    fontSize: 12,
    fontFamily: isRtl
      ? '"IBM Plex Sans Arabic", system-ui, sans-serif'
      : undefined,
    color: muted ? "var(--sl-sub, #64748b)" : undefined,
    lineHeight: 1.5,
  } as const

  if (active) {
    const commit = () => onSave(draft)
    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Escape") {
        e.preventDefault()
        setDraft(value)
        onCancel()
        return
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        commit()
      }
    }
    return (
      <textarea
        ref={textareaRef}
        className="sl-input"
        dir={isRtl ? "rtl" : "ltr"}
        lang={lang}
        value={draft}
        disabled={pending}
        placeholder={placeholder}
        onChange={(e) => {
          setDraft(e.target.value)
          autoGrow(e.currentTarget)
        }}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        style={{
          width: "100%",
          minHeight: 36,
          resize: "vertical",
          padding: "6px 8px",
          ...cellStyle,
        }}
      />
    )
  }

  if (!value) {
    return (
      <button
        type="button"
        onClick={onActivate}
        className="sl-row"
        style={{
          alignItems: "center",
          padding: 0,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "inherit",
        }}
      >
        {placeholderTone === "warning" ? (
          <StatusChip tone="warning" flat>
            {placeholder}
          </StatusChip>
        ) : (
          <span className="sl-sub" style={{ fontSize: 11 }}>
            {placeholder}
          </span>
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onActivate}
      className="sl-editable-cell"
      dir={isRtl ? "rtl" : "ltr"}
      lang={lang}
      title="Click to edit"
      style={{
        display: "block",
        width: "100%",
        padding: "4px 6px",
        borderRadius: 6,
        border: "1px dashed transparent",
        background: "transparent",
        cursor: "text",
        textAlign: isRtl ? "right" : "left",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        color: "inherit",
        ...cellStyle,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--sl-border, #e2e8f0)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "transparent"
      }}
    >
      {value}
    </button>
  )
}

const ContentIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <line x1="8" y1="7" x2="16" y2="7" />
    <line x1="8" y1="11" x2="13" y2="11" />
  </svg>
)

export const config = defineRouteConfig({
  label: "Content Library",
  icon: ContentIcon,
})

export default SamaContentPage
