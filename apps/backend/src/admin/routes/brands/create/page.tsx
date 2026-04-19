// Sama Link · Create brand — ADR-047.
// Route: /app/brands/create

import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  BrandShell,
  PageHeader,
  BrandSection,
  BrandForm,
  EMPTY_BRAND,
} from "../../../components"
import type { BrandFormValues } from "../../../components"
import { adminFetch } from "../../../lib/admin-api"

type CreateResponse = {
  brand: { id: string }
}

const BrandsCreatePage = () => {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = useCallback(
    async (values: BrandFormValues) => {
      setSaving(true)
      setError(null)
      try {
        const resp = await adminFetch<CreateResponse>("/brands", {
          method: "POST",
          body: {
            name: values.name,
            handle: values.handle,
            description: values.description || null,
            image_url: values.image_url || null,
          },
        })
        navigate(`/brands/${resp.brand.id}`)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create brand.")
      } finally {
        setSaving(false)
      }
    },
    [navigate]
  )

  return (
    <BrandShell as="page">
      <PageHeader
        eyebrow="Sama Link · Catalog"
        title="Create brand"
        subtitle="Add a new brand to the catalog. Products can link to it from the product details picker."
      />
      <BrandSection title="Brand details">
        <BrandForm
          mode="create"
          initial={EMPTY_BRAND}
          saving={saving}
          error={error}
          onSubmit={onSubmit}
          onCancel={() => navigate("/brands")}
        />
      </BrandSection>
    </BrandShell>
  )
}

export default BrandsCreatePage
