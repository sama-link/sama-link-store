// Nested admin route — requires image rebuild after any change:
// docker compose -f docker-compose.dev.yml up -d --build backend
// Route URL: /product-bulk  (sidebar placement: Products, via nested: "/products")

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useCallback, useEffect, useMemo, useState } from "react"

type ProductRow = {
  id: string
  title: string
  handle: string
  status: string
}

type ProductsListResponse = {
  products?: ProductRow[]
  count?: number
}

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const

/** Sidebar / route icon — matches Trash from @medusajs/icons shape for menu sizing */
const Trash = () => (
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
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
)

export const config = defineRouteConfig({
  label: "Bulk Manage",
  icon: Trash,
  nested: "/products",
})

async function requestProductPage(
  pageSize: number,
  offset: number
): Promise<{ products: ProductRow[]; count: number }> {
  const params = new URLSearchParams({
    limit: String(pageSize),
    offset: String(offset),
    fields: "id,title,handle,status",
  })
  const res = await fetch(`/admin/products?${params.toString()}`, {
    method: "GET",
    credentials: "include",
    headers: { accept: "application/json" },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(text || `Request failed (${res.status})`)
  }
  const data = (await res.json()) as ProductsListResponse
  return {
    products: Array.isArray(data.products) ? data.products : [],
    count: typeof data.count === "number" ? data.count : 0,
  }
}

const BulkProductsPage = () => {
  const [pageSize, setPageSize] = useState(25)
  const [page, setPage] = useState(1)
  const [products, setProducts] = useState<ProductRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const visibleIds = useMemo(
    () => products.map((p) => p.id),
    [products]
  )

  const selectedOnPageCount = useMemo(
    () => visibleIds.filter((id) => selectedIds.has(id)).length,
    [visibleIds, selectedIds]
  )

  const headerCheckboxState = useMemo(() => {
    if (visibleIds.length === 0) {
      return false
    }
    if (selectedOnPageCount === 0) {
      return false
    }
    if (selectedOnPageCount === visibleIds.length) {
      return true
    }
    return "indeterminate" as const
  }, [visibleIds.length, selectedOnPageCount])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1)
  const isLastPage = page >= totalPages || totalCount === 0

  const loadPage = useCallback(async (targetPage: number, targetPageSize: number) => {
    setListLoading(true)
    setListError(null)
    const off = (targetPage - 1) * targetPageSize
    try {
      const { products: rows, count } = await requestProductPage(
        targetPageSize,
        off
      )
      setProducts(rows)
      setTotalCount(count)
    } catch (e) {
      console.error(e)
      setListError(e instanceof Error ? e.message : "Failed to load products")
      setProducts([])
      setTotalCount(0)
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPage(page, pageSize)
  }, [page, pageSize, loadPage])

  const toggleSelectAllOnPage = () => {
    if (visibleIds.length === 0) {
      return
    }
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const allSelected = selectedOnPageCount === visibleIds.length
      if (allSelected) {
        for (const id of visibleIds) {
          next.delete(id)
        }
      } else {
        for (const id of visibleIds) {
          next.add(id)
        }
      }
      return next
    })
  }

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const onPageSizeChange = (value: string) => {
    const n = Number.parseInt(value, 10)
    if (!Number.isFinite(n)) {
      return
    }
    setPageSize(n)
    setPage(1)
  }

  const selectedCount = selectedIds.size

  const runDeleteSelected = async () => {
    const ids = Array.from(selectedIds)
    setDeleteLoading(true)
    try {
      for (const id of ids) {
        try {
          const res = await fetch(`/admin/products/${id}`, {
            method: "DELETE",
            credentials: "include",
            headers: { accept: "application/json" },
          })
          if (!res.ok) {
            const text = await res.text().catch(() => "")
            console.error(
              `DELETE /admin/products/${id} failed:`,
              res.status,
              text
            )
          }
        } catch (e) {
          console.error(`DELETE /admin/products/${id} error:`, e)
        }
      }
    } finally {
      setDeleteLoading(false)
      setConfirmOpen(false)
      setSelectedIds(new Set())
      const stayOnFirstPage = page === 1
      setPage(1)
      if (stayOnFirstPage) {
        await loadPage(1, pageSize)
      }
    }
  }

  return (
    <div className="flex flex-col">
      <div className="border-ui-border-base flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-ui-fg-base text-xl font-semibold">
          Bulk product management
        </h1>
      </div>

      <div className="flex flex-col gap-4 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="text-ui-fg-subtle flex items-center gap-2 text-sm">
            <span>Page size</span>
            <select
              className="border-ui-border-base bg-ui-bg-field text-ui-fg-base rounded-md border px-2 py-1 text-sm"
              value={pageSize}
              onChange={(e) => onPageSizeChange(e.target.value)}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="border-ui-border-base bg-ui-bg-subtle text-ui-fg-base hover:bg-ui-bg-subtle-hover rounded-md border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page <= 1 || listLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="border-ui-border-base bg-ui-bg-subtle text-ui-fg-base hover:bg-ui-bg-subtle-hover rounded-md border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              disabled={isLastPage || listLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>

        {listError ? (
          <p className="text-ui-fg-error text-sm">{listError}</p>
        ) : null}

        {selectedCount > 0 ? (
          <div className="bg-ui-bg-subtle border-ui-border-base flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
            <p className="text-ui-fg-base text-sm font-medium">
              {selectedCount} selected
            </p>
            <button
              type="button"
              className="bg-ui-button-danger text-ui-fg-on-inverted hover:bg-ui-button-danger-hover rounded-md px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
              disabled={selectedCount === 0}
              onClick={() => setConfirmOpen(true)}
            >
              Delete selected
            </button>
          </div>
        ) : (
          <div className="bg-ui-bg-subtle border-ui-border-base flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 opacity-60">
            <p className="text-ui-fg-muted text-sm font-medium">0 selected</p>
            <button
              type="button"
              className="bg-ui-button-danger text-ui-fg-on-inverted rounded-md px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
              disabled
            >
              Delete selected
            </button>
          </div>
        )}

        {confirmOpen ? (
          <div
            className="border-ui-border-strong bg-ui-bg-base shadow-elevation-card-fixed rounded-lg border p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-delete-confirm-title"
          >
            <h2
              id="bulk-delete-confirm-title"
              className="text-ui-fg-base mb-2 text-lg font-semibold"
            >
              Delete {selectedCount} product{selectedCount === 1 ? "" : "s"}?
            </h2>
            <p className="text-ui-fg-subtle mb-4 text-sm">
              This cannot be undone.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="border-ui-border-base bg-ui-bg-subtle text-ui-fg-base hover:bg-ui-bg-subtle-hover rounded-md border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                disabled={deleteLoading}
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bg-ui-button-danger text-ui-fg-on-inverted hover:bg-ui-button-danger-hover inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                disabled={deleteLoading}
                onClick={() => void runDeleteSelected()}
              >
                {deleteLoading ? "Deleting…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-lg border border-ui-border-base">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-ui-border-base bg-ui-bg-subtle border-b">
              <tr>
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    className="cursor-pointer"
                    checked={headerCheckboxState === true}
                    ref={(el) => {
                      if (el) {
                        el.indeterminate = headerCheckboxState === "indeterminate"
                      }
                    }}
                    onChange={toggleSelectAllOnPage}
                    disabled={listLoading || visibleIds.length === 0}
                    aria-label="Select all on this page"
                  />
                </th>
                <th className="text-ui-fg-subtle px-3 py-2 font-medium">Title</th>
                <th className="text-ui-fg-subtle px-3 py-2 font-medium">Status</th>
                <th className="text-ui-fg-subtle px-3 py-2 font-medium">Handle</th>
              </tr>
            </thead>
            <tbody>
              {listLoading && products.length === 0 ? (
                <tr>
                  <td className="text-ui-fg-muted px-3 py-6" colSpan={4}>
                    Loading…
                  </td>
                </tr>
              ) : null}
              {!listLoading && products.length === 0 ? (
                <tr>
                  <td className="text-ui-fg-muted px-3 py-6" colSpan={4}>
                    No products
                  </td>
                </tr>
              ) : null}
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="border-ui-border-base hover:bg-ui-bg-subtle-hover border-b last:border-b-0"
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      className="cursor-pointer"
                      checked={selectedIds.has(p.id)}
                      onChange={() => toggleRow(p.id)}
                      aria-label={`Select ${p.title || p.handle}`}
                    />
                  </td>
                  <td className="text-ui-fg-base px-3 py-2">{p.title ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span className="border-ui-border-base bg-ui-bg-subtle text-ui-fg-subtle inline-flex rounded-md border px-2 py-0.5 text-xs font-medium">
                      {p.status ?? "—"}
                    </span>
                  </td>
                  <td className="text-ui-fg-muted px-3 py-2 font-mono text-xs">
                    {p.handle ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default BulkProductsPage
