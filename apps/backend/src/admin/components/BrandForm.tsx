// Sama Link · shared brand form — ADR-047.
//
// Used by /app/brands/create (empty initial state) and /app/brands/:id
// (populated from the server). Keeps field layout, validation, and keyboard
// behaviour in one place so create/edit stay consistent.

import { useEffect, useMemo, useRef, useState } from "react"
import { BrandButton } from "./BrandButton"

export type BrandFormValues = {
  name: string
  handle: string
  description: string
  image_url: string
}

export const EMPTY_BRAND: BrandFormValues = {
  name: "",
  handle: "",
  description: "",
  image_url: "",
}

export function deriveHandle(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

type BrandFormProps = {
  mode: "create" | "edit"
  initial: BrandFormValues
  saving: boolean
  error?: string | null
  onSubmit: (values: BrandFormValues) => void
  onCancel?: () => void
  onDelete?: () => void
  deleting?: boolean
}

export const BrandForm = ({
  mode,
  initial,
  saving,
  error,
  onSubmit,
  onCancel,
  onDelete,
  deleting,
}: BrandFormProps) => {
  const [form, setForm] = useState<BrandFormValues>(initial)
  // Track whether the user has manually edited the handle — once they do,
  // we stop auto-deriving from name. Prevents the frustrating "I typed a
  // handle and it got overwritten" bug.
  const handleDirty = useRef(initial.handle !== "" && mode === "edit")

  useEffect(() => {
    setForm(initial)
    handleDirty.current = initial.handle !== "" && mode === "edit"
  }, [initial, mode])

  const dirty = useMemo(() => {
    return (
      form.name !== initial.name ||
      form.handle !== initial.handle ||
      form.description !== initial.description ||
      form.image_url !== initial.image_url
    )
  }, [form, initial])

  const nameError =
    form.name.trim().length === 0 ? "Name is required." : null
  const handleError = (() => {
    const h = form.handle.trim()
    if (!h) return "Handle is required."
    if (!/^[a-z0-9\u0600-\u06FF-]+$/.test(h))
      return "Handle can only contain letters, digits, and dashes."
    return null
  })()
  const imageError = (() => {
    const u = form.image_url.trim()
    if (!u) return null
    try {
      const parsed = new URL(u)
      if (!/^https?:$/.test(parsed.protocol))
        return "Image URL must start with http:// or https://."
    } catch {
      return "Image URL is not a valid URL."
    }
    return null
  })()

  const canSubmit =
    dirty && !nameError && !handleError && !imageError && !saving

  const handleNameChange = (v: string) => {
    setForm((f) => {
      const next: BrandFormValues = { ...f, name: v }
      if (!handleDirty.current) {
        next.handle = deriveHandle(v)
      }
      return next
    })
  }

  const handleHandleChange = (v: string) => {
    handleDirty.current = true
    setForm((f) => ({ ...f, handle: v }))
  }

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!canSubmit) return
    onSubmit({
      name: form.name.trim(),
      handle: form.handle.trim(),
      description: form.description.trim(),
      image_url: form.image_url.trim(),
    })
  }

  return (
    <form onSubmit={submit} className="sl-stack">
      {error ? (
        <div className="sl-note sl-note-error">
          <strong style={{ color: "var(--sl-error)" }}>Error:</strong> {error}
        </div>
      ) : null}

      <div className="sl-grid sl-grid-2">
        {/* ── Left column: text fields ─────────────── */}
        <div className="sl-stack">
          <FormField
            id="brand-name"
            label="Name"
            required
            hint="The name shown above product titles on the storefront."
            error={nameError && form.name !== initial.name ? nameError : null}
          >
            <input
              id="brand-name"
              type="text"
              className="sl-input"
              value={form.name}
              disabled={saving}
              placeholder="e.g. Sama Link"
              onChange={(e) => handleNameChange(e.target.value)}
              style={{ width: "100%", fontSize: 14, padding: "8px 10px" }}
              autoFocus={mode === "create"}
            />
          </FormField>

          <FormField
            id="brand-handle"
            label="Handle"
            required
            hint="The short name used in links. Generated from the brand name; edit to override."
            error={handleError && form.handle !== initial.handle ? handleError : null}
          >
            <input
              id="brand-handle"
              type="text"
              className="sl-input sl-mono"
              value={form.handle}
              disabled={saving}
              placeholder="sama-link"
              onChange={(e) => handleHandleChange(e.target.value)}
              style={{
                width: "100%",
                fontSize: 13,
                padding: "8px 10px",
              }}
              spellCheck={false}
            />
          </FormField>

          <FormField
            id="brand-description"
            label="Description"
            hint="Optional. Shown on the brand's own page and inside this admin."
          >
            <textarea
              id="brand-description"
              className="sl-input"
              rows={4}
              value={form.description}
              disabled={saving}
              placeholder="Short paragraph about the brand…"
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              style={{
                width: "100%",
                fontSize: 14,
                padding: "8px 10px",
                resize: "vertical",
                lineHeight: 1.5,
              }}
            />
          </FormField>
        </div>

        {/* ── Right column: image ──────────────────── */}
        <div className="sl-stack">
          <FormField
            id="brand-image-url"
            label="Logo URL"
            hint="Paste a public image URL (HTTPS preferred). File upload coming soon."
            error={imageError && form.image_url !== initial.image_url ? imageError : null}
          >
            <input
              id="brand-image-url"
              type="url"
              className="sl-input"
              value={form.image_url}
              disabled={saving}
              placeholder="https://cdn.example.com/logos/sama-link.svg"
              onChange={(e) =>
                setForm((f) => ({ ...f, image_url: e.target.value }))
              }
              style={{ width: "100%", fontSize: 13, padding: "8px 10px" }}
              spellCheck={false}
            />
          </FormField>

          <div className="sl-stack-sm">
            <span
              className="sl-eyebrow"
              style={{ fontSize: 11, letterSpacing: 0.4 }}
            >
              Preview
            </span>
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                background: "var(--sl-surface-soft, rgba(15,43,79,0.04))",
                border: "1px dashed var(--sl-border, #e2e8f0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 180,
              }}
            >
              <ImagePreview url={form.image_url.trim()} name={form.name} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────── */}
      <div
        className="sl-between"
        style={{ marginTop: 12, alignItems: "center" }}
      >
        <div>
          {mode === "edit" && onDelete ? (
            <BrandButton
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={saving || deleting}
              type="button"
              style={{ color: "var(--sl-error, #b91c1c)" }}
            >
              {deleting ? "Deleting…" : "Delete brand"}
            </BrandButton>
          ) : null}
        </div>
        <div className="sl-row" style={{ gap: 8 }}>
          {onCancel ? (
            <BrandButton
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={saving}
              type="button"
            >
              Cancel
            </BrandButton>
          ) : null}
          <BrandButton
            variant="primary"
            size="sm"
            type="submit"
            disabled={!canSubmit}
          >
            {saving
              ? mode === "create"
                ? "Creating…"
                : "Saving…"
              : mode === "create"
                ? "Create brand"
                : "Save changes"}
          </BrandButton>
        </div>
      </div>
    </form>
  )
}

/* ── Sub-components ─────────────────────────────────────────────── */

const FormField = ({
  id,
  label,
  hint,
  required,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  required?: boolean
  error?: string | null
  children: React.ReactNode
}) => {
  return (
    <div className="sl-stack-sm">
      <label
        htmlFor={id}
        className="sl-eyebrow"
        style={{ fontSize: 11, letterSpacing: 0.4 }}
      >
        {label}
        {required ? (
          <span style={{ color: "var(--sl-error)", marginLeft: 2 }}>*</span>
        ) : null}
      </label>
      {hint ? (
        <span className="sl-sub" style={{ fontSize: 11 }}>
          {hint}
        </span>
      ) : null}
      {children}
      {error ? (
        <span
          className="sl-sub"
          style={{ fontSize: 11, color: "var(--sl-error)" }}
        >
          {error}
        </span>
      ) : null}
    </div>
  )
}

const ImagePreview = ({ url, name }: { url: string; name: string }) => {
  const [errored, setErrored] = useState(false)
  useEffect(() => {
    setErrored(false)
  }, [url])
  if (!url) {
    return (
      <span className="sl-sub" style={{ fontSize: 12, textAlign: "center" }}>
        Paste a logo URL to preview.
      </span>
    )
  }
  if (errored) {
    return (
      <span className="sl-sub" style={{ fontSize: 12, color: "var(--sl-error)" }}>
        Image failed to load.
      </span>
    )
  }
  return (
    <img
      src={url}
      alt={name || "Brand logo"}
      onError={() => setErrored(true)}
      style={{
        maxWidth: "100%",
        maxHeight: 160,
        objectFit: "contain",
        borderRadius: 8,
      }}
    />
  )
}
