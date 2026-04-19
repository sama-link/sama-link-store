// Sidebar shortcut: surface Medusa's "Product Tags" page under the
// Products group instead of buried inside Settings. The page simply
// redirects to the native /settings/product-tags route on mount —
// Medusa renders its own CRUD UI there, we just give operators a
// shorter path to reach it.

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Navigate } from "react-router-dom"

const ProductTagsShortcut = () => (
  <Navigate to="/settings/product-tags" replace />
)

const TagIcon = () => (
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
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
)

export const config = defineRouteConfig({
  label: "Tags",
  icon: TagIcon,
  nested: "/products",
})

export default ProductTagsShortcut
