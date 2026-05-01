// Sama Link · /store/customer-lists shared helpers — ACCT-6B.
//
// Pure helpers used by all four route handlers under
// `/store/customer-lists/...`. Kept in a sibling file (Medusa's file-system
// router ignores anything that is not `route.ts` with an HTTP-verb export).

import { MedusaError } from "@medusajs/utils"
import type { AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import {
  CUSTOMER_LIST_TYPES,
  CustomerListType,
  isCustomerListType,
} from "../../../modules/customer_list/caps"
import type {
  CustomerListItemRow,
  CustomerListRow,
} from "../../../modules/customer_list/service"

/**
 * Pull and validate `list_type` from the URL params. Throws an
 * INVALID_DATA MedusaError (→ HTTP 400 via the framework error handler)
 * when the segment is missing or not one of the allowed values.
 */
export function readListTypeParam(
  req: AuthenticatedMedusaRequest,
): CustomerListType {
  const raw = (req.params as Record<string, unknown>).list_type
  if (typeof raw !== "string" || !isCustomerListType(raw)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Invalid list_type "${String(raw)}". Expected one of: ${CUSTOMER_LIST_TYPES.join(
        ", ",
      )}.`,
    )
  }
  return raw
}

/**
 * Extracts the authenticated customer id from `req.auth_context`. The
 * `authenticate` middleware in `src/api/middlewares.ts` rejects
 * unauthenticated requests with 401 before they reach handlers, so this
 * helper only ever throws if the middleware is misconfigured.
 */
export function readCustomerId(req: AuthenticatedMedusaRequest): string {
  const id = req.auth_context?.actor_id
  if (!id) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Authenticated customer required.",
    )
  }
  return id
}

/**
 * Pulls a string field from a JSON body. Returns the trimmed value when
 * present, `undefined` when absent or not a string. Used by the POST
 * /items handler for the optional snapshot fields.
 */
export function readOptionalString(body: unknown, key: string): string | undefined {
  if (!body || typeof body !== "object") return undefined
  const v = (body as Record<string, unknown>)[key]
  if (typeof v !== "string") return undefined
  const trimmed = v.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

/**
 * Pulls a required string field from a JSON body. Throws INVALID_DATA
 * (→ HTTP 400) when missing / wrong type / empty after trim.
 */
export function readRequiredString(body: unknown, key: string): string {
  if (!body || typeof body !== "object") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Body must be a JSON object.",
    )
  }
  const v = (body as Record<string, unknown>)[key]
  if (typeof v !== "string" || v.trim().length === 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `"${key}" is required.`,
    )
  }
  return v.trim()
}

/**
 * Pulls a nullable string field — accepts the literal `null` as well as
 * the absence of the key, both meaning "no value". Used by the POST
 * /items handler for `variant_id`.
 */
export function readOptionalNullableString(
  body: unknown,
  key: string,
): string | null | undefined {
  if (!body || typeof body !== "object") return undefined
  const v = (body as Record<string, unknown>)[key]
  if (v === null) return null
  if (typeof v !== "string") return undefined
  const trimmed = v.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Shape returned by GET /store/customer-lists/:list_type — preserved here
 * so route handlers, tests, and the future storefront SDK helper share
 * one source of truth.
 */
export type GetCustomerListResponse = {
  list: {
    id: string | null
    customer_id: string
    list_type: CustomerListType
    items: CustomerListItemRow[]
  }
}

export function emptyListResponse(
  customer_id: string,
  list_type: CustomerListType,
): GetCustomerListResponse {
  return {
    list: { id: null, customer_id, list_type, items: [] },
  }
}

export function listResponse(
  list: CustomerListRow,
  list_type: CustomerListType,
  items: CustomerListItemRow[],
): GetCustomerListResponse {
  return {
    list: {
      id: list.id,
      customer_id: list.customer_id,
      list_type,
      items,
    },
  }
}
