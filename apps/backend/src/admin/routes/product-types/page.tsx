// Sidebar shortcut: surface Medusa's "Product Types" page under the
// Products group. Redirects to /settings/product-types on mount.

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Navigate } from "react-router-dom"

const ProductTypesShortcut = () => (
  <Navigate to="/settings/product-types" replace />
)

const TypeIcon = () => (
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
    <path d="M4 7V5a2 2 0 0 1 2-2h2" />
    <path d="M20 7V5a2 2 0 0 0-2-2h-2" />
    <path d="M4 17v2a2 2 0 0 0 2 2h2" />
    <path d="M20 17v2a2 2 0 0 1-2 2h-2" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="12" y1="9" x2="12" y2="15" />
  </svg>
)

export const config = defineRouteConfig({
  label: "Types",
  icon: TypeIcon,
  nested: "/products",
})

export default ProductTypesShortcut
