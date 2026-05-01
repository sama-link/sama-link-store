// Sama Link product translation widget — ADR-047 (PROD-TRANS).
//
// Architecture note (different from the other Sama widgets):
//
//   The widget REGISTERS on `product.details.before` — that zone is what
//   gives us React mount + the admin-SDK's `data` prop with the product.
//   But it renders NOTHING on the product details page itself. Instead,
//   it watches for Medusa's native "Edit Product" drawer to open and
//   portals an Arabic-translation section INTO that drawer, visually
//   inside the form column, so the operator edits EN (native fields) and
//   AR (our section) in the same modal — preserving Medusa's page layout
//   and avoiding a second "Sama Arabic translation" card floating above
//   the product details.
//
//   Why not use `product.details.side.after` or a custom route? Because
//   the user's mental model is: "I click Edit and translate everything
//   there." The portal approach delivers that.
//
// Portal targeting:
//
//   Medusa's Edit Product drawer is a Radix Dialog rendered in a body
//   portal. We locate the open drawer by:
//     [role="dialog"][data-state="open"]  →  drawer
//     that contains  <h1>Edit Product</h1> →  the Edit drawer specifically
//     (not variant/inventory/etc. drawers that reuse the same component).
//   Inside it we append a new block to the form's scrollable content
//   column — matching the `flex flex-col gap-y-8` wrapper Medusa uses
//   for its own field groups, so our section flows as just another
//   native-looking block below `Discountable`.
//
//   A MutationObserver keeps the portal target in sync with drawer
//   open/close. When the drawer closes we drop the mount point so React
//   unmounts our component.
//
// Persistence:
//
//   POST /admin/products/:id with a merged
//   `{ metadata: { ...existing, translations: { ...existing, ar } } }` body.
//   Native English fields are NOT touched by this widget — Medusa's own
//   form handles them. The operator's workflow: type AR, click our "Save
//   Arabic" button. Typing EN in the native fields + clicking Medusa's
//   "Save" is independent. Both can coexist; neither clobbers the other.
//
// Rebuild required after any change:
//   docker compose -f docker-compose.dev.yml up -d --build backend

import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type {
  DetailWidgetProps,
  AdminProduct,
} from "@medusajs/framework/types"
import { useCallback, useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { adminFetch } from "../lib/admin-api"

const MOUNT_ATTR = "data-sama-ar-mount"
const EDIT_DRAWER_TITLE = "Edit Product"

type TranslationBranch = {
  title?: string | null
  subtitle?: string | null
  description?: string | null
}

type TranslationsMap = {
  ar?: TranslationBranch | null
}

type AdminProductWithMetadata = AdminProduct & {
  subtitle?: string | null
  metadata?: Record<string, unknown> | null
}

type FormState = {
  title: string
  subtitle: string
  description: string
}

type PatchResponse = {
  product?: AdminProductWithMetadata
}

const EMPTY_FORM: FormState = {
  title: "",
  subtitle: "",
  description: "",
}

function readArBranch(p: AdminProductWithMetadata): TranslationBranch {
  const md = p.metadata ?? {}
  const translations = (md["translations"] as TranslationsMap | undefined) ?? {}
  return translations.ar ?? {}
}

function toForm(branch: TranslationBranch): FormState {
  return {
    title: typeof branch.title === "string" ? branch.title : "",
    subtitle: typeof branch.subtitle === "string" ? branch.subtitle : "",
    description:
      typeof branch.description === "string" ? branch.description : "",
  }
}

function isEqual(a: FormState, b: FormState): boolean {
  return (
    a.title === b.title &&
    a.subtitle === b.subtitle &&
    a.description === b.description
  )
}

/** Drop empty strings so a cleared field removes itself from metadata
 *  instead of persisting a literal "". Keeps the JSON lean and makes
 *  the storefront's non-empty-wins fallback predictable. */
function cleanBranch(form: FormState): TranslationBranch {
  const out: TranslationBranch = {}
  if (form.title.trim()) out.title = form.title
  if (form.subtitle.trim()) out.subtitle = form.subtitle
  if (form.description.trim()) out.description = form.description
  return out
}

/* ── Portal target detection ─────────────────────────────────────── */

function findEditProductDialog(): HTMLElement | null {
  const dialogs = document.querySelectorAll<HTMLElement>(
    '[role="dialog"][data-state="open"]'
  )
  for (const dlg of Array.from(dialogs)) {
    const title = dlg.querySelector<HTMLHeadingElement>("h1")
    if (title?.textContent?.trim() === EDIT_DRAWER_TITLE) {
      return dlg
    }
  }
  return null
}

function ensureMountInside(dialog: HTMLElement): HTMLElement | null {
  /* The form column Medusa lays out its own field groups in. We match
   * the selector loosely: the nearest descendant of <form> with the
   * `gap-y-8` spacing wrapper, falling back to the form's first scroll
   * container. Either gets our block into the same vertical rhythm as
   * the native fields. */
  const column =
    dialog.querySelector<HTMLElement>(
      "form > div > div.flex.flex-col.gap-y-8"
    ) ??
    dialog.querySelector<HTMLElement>(
      "form > div.overflow-y-auto > div"
    ) ??
    dialog.querySelector<HTMLElement>("form > div")
  if (!column) return null

  let mount = column.querySelector<HTMLElement>(`[${MOUNT_ATTR}]`)
  if (!mount) {
    mount = document.createElement("div")
    mount.setAttribute(MOUNT_ATTR, "")
    mount.className = "flex flex-col gap-y-4"
    column.appendChild(mount)
  }
  return mount
}

/* ── Widget ──────────────────────────────────────────────────────── */

const SamaProductTranslationWidget = ({
  data,
}: DetailWidgetProps<AdminProduct>) => {
  const product = data as AdminProductWithMetadata | undefined
  const productId = product?.id ?? null

  const [target, setTarget] = useState<HTMLElement | null>(null)

  // Observe the DOM for the Edit Product drawer opening / closing.
  useEffect(() => {
    if (typeof document === "undefined") return

    const sync = () => {
      const dlg = findEditProductDialog()
      if (!dlg) {
        setTarget(null)
        return
      }
      const mount = ensureMountInside(dlg)
      setTarget(mount ?? null)
    }

    sync()

    const observer = new MutationObserver(sync)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state"],
    })

    return () => {
      observer.disconnect()
      // Clean up any mount points we appended so a future re-open
      // starts fresh rather than rendering into a detached div.
      document
        .querySelectorAll(`[${MOUNT_ATTR}]`)
        .forEach((n) => n.remove())
    }
  }, [])

  if (!product || !target) return null

  return createPortal(
    <ArabicSection product={product} productId={productId} />,
    target
  )
}

/* ── Arabic-translation section (rendered inside the drawer) ────── */

type ArabicSectionProps = {
  product: AdminProductWithMetadata
  productId: string | null
}

const ArabicSection = ({ product, productId }: ArabicSectionProps) => {
  const initialBranch = useMemo<TranslationBranch>(
    () => readArBranch(product),
    [product]
  )

  const [serverForm, setServerForm] = useState<FormState>(() =>
    toForm(initialBranch)
  )
  const [form, setForm] = useState<FormState>(() => toForm(initialBranch))
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "success" }
    | { kind: "error"; message: string }
  >({ kind: "idle" })

  // Reconcile if the drawer is re-opened with fresh product data.
  useEffect(() => {
    const next = toForm(initialBranch)
    setServerForm(next)
    setForm(next)
    setStatus({ kind: "idle" })
  }, [initialBranch])

  const dirty = !isEqual(form, serverForm)
  const hasAnyAr =
    !!form.title.trim() ||
    !!form.subtitle.trim() ||
    !!form.description.trim()

  const save = useCallback(async () => {
    if (!productId || saving || !dirty) return
    setSaving(true)
    setStatus({ kind: "idle" })
    try {
      const existingMetadata =
        (product.metadata as Record<string, unknown> | null | undefined) ?? {}
      const existingTranslations =
        (existingMetadata["translations"] as TranslationsMap | undefined) ?? {}
      const nextMetadata = {
        ...existingMetadata,
        translations: {
          ...existingTranslations,
          ar: cleanBranch(form),
        },
      }

      const data = await adminFetch<PatchResponse>(
        `/products/${productId}`,
        {
          method: "POST",
          body: { metadata: nextMetadata },
        }
      )

      if (data.product) {
        const branch = readArBranch(data.product)
        const next = toForm(branch)
        setServerForm(next)
        setForm(next)
      } else {
        setServerForm(form)
      }
      setStatus({ kind: "success" })
    } catch (err) {
      setStatus({
        kind: "error",
        message:
          err instanceof Error ? err.message : "Failed to save translation.",
      })
    } finally {
      setSaving(false)
    }
  }, [dirty, form, product, productId, saving])

  const reset = () => {
    setForm(serverForm)
    setStatus({ kind: "idle" })
  }

  const arFont = '"IBM Plex Sans Arabic", system-ui, sans-serif'
  const inputClass =
    "caret-ui-fg-base bg-ui-bg-field hover:bg-ui-bg-field-hover " +
    "shadow-borders-base placeholder-ui-fg-muted text-ui-fg-base " +
    "transition-fg relative w-full appearance-none rounded-md outline-none " +
    "focus-visible:shadow-borders-interactive-with-active " +
    "disabled:text-ui-fg-disabled disabled:!bg-ui-bg-disabled " +
    "disabled:placeholder-ui-fg-disabled disabled:cursor-not-allowed " +
    "txt-compact-small h-8 px-2 py-1.5"
  const textareaClass =
    "caret-ui-fg-base bg-ui-bg-field hover:bg-ui-bg-field-hover " +
    "shadow-borders-base placeholder-ui-fg-muted text-ui-fg-base " +
    "transition-fg relative appearance-none rounded-md outline-none " +
    "focus-visible:shadow-borders-interactive-with-active " +
    "txt-small min-h-[160px] w-full px-2 py-1.5 font-mono"

  return (
    <div className="flex flex-col gap-y-3 border-t border-ui-border-base pt-6 mt-2">
      {/* Section heading — styled like the native drawer's section groups */}
      <div className="flex items-center justify-between gap-x-2">
        <div className="flex flex-col gap-y-0.5">
          <span
            className="txt-compact-xsmall-plus text-ui-fg-muted"
            style={{ letterSpacing: 0.3, textTransform: "uppercase" }}
          >
            Arabic translation
          </span>
          <h2
            className="font-sans txt-compact-small font-medium"
            style={{ fontFamily: arFont }}
          >
            الترجمة العربية
          </h2>
        </div>
        <span
          className={`txt-compact-xsmall-plus px-2 py-0.5 rounded-md ${
            hasAnyAr
              ? "bg-ui-tag-green-bg text-ui-tag-green-text"
              : "bg-ui-tag-orange-bg text-ui-tag-orange-text"
          }`}
        >
          {hasAnyAr ? "AR present" : "AR missing"}
        </span>
      </div>

      {/* Title */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-x-1">
          <label
            className="font-sans txt-compact-small font-medium"
            htmlFor="sama-ar-title"
          >
            Title
          </label>
          <p className="font-normal font-sans txt-compact-small text-ui-fg-muted">
            (العربية)
          </p>
        </div>
        <input
          id="sama-ar-title"
          type="text"
          className={inputClass}
          dir="rtl"
          lang="ar"
          value={form.title}
          disabled={saving}
          placeholder="اكتب عنوان المنتج بالعربي…"
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          style={{ fontFamily: arFont }}
        />
      </div>

      {/* Subtitle */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-x-1">
          <label
            className="font-sans txt-compact-small font-medium"
            htmlFor="sama-ar-subtitle"
          >
            Subtitle
          </label>
          <p className="font-normal font-sans txt-compact-small text-ui-fg-muted">
            (اختياري)
          </p>
        </div>
        <input
          id="sama-ar-subtitle"
          type="text"
          className={inputClass}
          dir="rtl"
          lang="ar"
          value={form.subtitle}
          disabled={saving}
          placeholder="العنوان الفرعي…"
          onChange={(e) =>
            setForm((f) => ({ ...f, subtitle: e.target.value }))
          }
          style={{ fontFamily: arFont }}
        />
      </div>

      {/* Description */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-x-1">
          <label
            className="font-sans txt-compact-small font-medium"
            htmlFor="sama-ar-description"
          >
            Description (HTML)
          </label>
          <p className="font-normal font-sans txt-compact-small text-ui-fg-muted">
            (اختياري)
          </p>
        </div>
        <p className="txt-compact-xsmall text-ui-fg-muted">
          Supports HTML tags (for example: &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;).
        </p>
        <textarea
          id="sama-ar-description"
          className={textareaClass}
          dir="rtl"
          lang="ar"
          rows={10}
          value={form.description}
          disabled={saving}
          placeholder="اكتب وصف المنتج بالعربي بصيغة HTML…"
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          style={{ fontFamily: arFont, lineHeight: 1.7 }}
        />
      </div>

      {/* Footer — styled to look like in-section mini-actions, NOT like
          the drawer's own bottom bar (we don't want to shadow Medusa's
          Cancel/Save which lives in the <form>'s border-t footer) */}
      <div className="flex items-center justify-between gap-x-2 pt-1">
        <span
          className={`txt-compact-xsmall ${
            status.kind === "error"
              ? "text-ui-fg-error"
              : status.kind === "success" && !dirty
                ? "text-ui-fg-interactive"
                : "text-ui-fg-subtle"
          }`}
        >
          {status.kind === "error"
            ? status.message
            : status.kind === "success" && !dirty
              ? "Saved. Storefront picks it up on the next render."
              : dirty
                ? "Unsaved Arabic changes."
                : ""}
        </span>
        <div className="flex items-center gap-x-2">
          <button
            type="button"
            onClick={reset}
            disabled={saving || !dirty}
            className={
              "transition-fg relative inline-flex w-fit items-center justify-center " +
              "overflow-hidden rounded-md outline-none " +
              "disabled:bg-ui-bg-disabled disabled:text-ui-fg-disabled " +
              "shadow-buttons-neutral text-ui-fg-base bg-ui-button-neutral " +
              "hover:bg-ui-button-neutral-hover active:bg-ui-button-neutral-pressed " +
              "focus-visible:shadow-buttons-neutral-focus " +
              "txt-compact-small-plus gap-x-1.5 px-2 py-1"
            }
          >
            Discard
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className={
              "transition-fg relative inline-flex w-fit items-center justify-center " +
              "overflow-hidden rounded-md outline-none " +
              "disabled:bg-ui-bg-disabled disabled:text-ui-fg-disabled " +
              "shadow-buttons-inverted text-ui-contrast-fg-primary bg-ui-button-inverted " +
              "hover:bg-ui-button-inverted-hover active:bg-ui-button-inverted-pressed " +
              "focus-visible:!shadow-buttons-inverted-focus " +
              "txt-compact-small-plus gap-x-1.5 px-2 py-1"
            }
          >
            {saving ? "Saving…" : "Save Arabic"}
          </button>
        </div>
      </div>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.before",
})

export default SamaProductTranslationWidget
