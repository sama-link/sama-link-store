// Sama Link · Edit brand — ADR-047.
// Route: /app/brands/:id

import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  BrandShell,
  PageHeader,
  BrandSection,
  BrandForm,
  EMPTY_BRAND,
} from "../../../components"
import type { BrandFormValues } from "../../../components"
import { adminFetch } from "../../../lib/admin-api"

type Brand = {
  id: string
  name: string
  handle: string
  description: string | null
  image_url: string | null
}

type DetailResponse = { brand: Brand }
type UpdateResponse = { brand: Brand }
type DeleteResponse = { id: string; deleted: true }

const BrandEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [initial, setInitial] = useState<BrandFormValues>(EMPTY_BRAND)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const ac = new AbortController()
    const load = async () => {
      setLoaded(false)
      setLoadError(null)
      try {
        const resp = await adminFetch<DetailResponse>(`/brands/${id}`, {
          signal: ac.signal,
        })
        setInitial({
          name: resp.brand.name,
          handle: resp.brand.handle,
          description: resp.brand.description ?? "",
          image_url: resp.brand.image_url ?? "",
        })
        setLoaded(true)
      } catch (e) {
        if (ac.signal.aborted) return
        setLoadError(e instanceof Error ? e.message : "Failed to load brand.")
      }
    }
    void load()
    return () => ac.abort()
  }, [id])

  const onSubmit = useCallback(
    async (values: BrandFormValues) => {
      if (!id) return
      setSaving(true)
      setFormError(null)
      try {
        const resp = await adminFetch<UpdateResponse>(`/brands/${id}`, {
          method: "POST",
          body: {
            name: values.name,
            handle: values.handle,
            description: values.description || null,
            image_url: values.image_url || null,
          },
        })
        // Reseed the form with the server snapshot so any normalisation
        // (e.g. handle slugifying) reflects immediately.
        setInitial({
          name: resp.brand.name,
          handle: resp.brand.handle,
          description: resp.brand.description ?? "",
          image_url: resp.brand.image_url ?? "",
        })
      } catch (e) {
        setFormError(e instanceof Error ? e.message : "Failed to save brand.")
      } finally {
        setSaving(false)
      }
    },
    [id]
  )

  const onDelete = useCallback(async () => {
    if (!id) return
    const ok = window.confirm(
      "Delete this brand? Products linked to it will lose the association (no cascade; product rows are untouched)."
    )
    if (!ok) return
    setDeleting(true)
    setFormError(null)
    try {
      await adminFetch<DeleteResponse>(`/brands/${id}`, { method: "DELETE" })
      navigate("/brands")
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to delete brand.")
    } finally {
      setDeleting(false)
    }
  }, [id, navigate])

  return (
    <BrandShell as="page">
      <PageHeader
        eyebrow="Sama Link · Catalog"
        title={loaded ? `Edit · ${initial.name}` : "Edit brand"}
        subtitle={
          loaded
            ? "Change how this brand appears on product cards, PDPs, and the upcoming brand page."
            : "Loading brand…"
        }
      />

      {loadError ? (
        <div className="sl-note sl-note-error" style={{ marginBottom: 16 }}>
          <strong style={{ color: "var(--sl-error)" }}>Failed:</strong>{" "}
          {loadError}
        </div>
      ) : null}

      <BrandSection title="Brand details">
        {loaded ? (
          <BrandForm
            mode="edit"
            initial={initial}
            saving={saving}
            deleting={deleting}
            error={formError}
            onSubmit={onSubmit}
            onCancel={() => navigate("/brands")}
            onDelete={onDelete}
          />
        ) : (
          <div className="sl-stack-sm">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="sl-skeleton"
                style={{ height: 36, borderRadius: 8 }}
              />
            ))}
          </div>
        )}
      </BrandSection>
    </BrandShell>
  )
}

export default BrandEditPage
