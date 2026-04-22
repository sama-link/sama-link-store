// Typed wrapper around react-router-dom's `Link`.
//
// Why this file exists:
//   react-router-dom is hoisted to the monorepo root and resolves its React
//   types against the root's `@types/react@19`, which added `bigint` to
//   `ReactNode`. The backend's own tsconfig resolves `@types/react@18`, which
//   does not. The two `ReactNode` shapes are structurally incompatible, so
//   TypeScript rejects `<Link>` with TS2786 ("cannot be used as a JSX
//   component"). Runtime behavior is unaffected.
//
// The cast below reattaches `Link` to the React 18 types the backend uses.
// We expose only the props actually consumed by our admin routes/widgets;
// add more here if new call sites need them.

import * as React from "react"
import { Link as RouterLink } from "react-router-dom"

type LinkProps = {
  to: string
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export const Link = RouterLink as unknown as React.FC<LinkProps>
