// Sama Link · CustomerList module service — ADR-053.
//
// `MedusaService({ CustomerList, CustomerListItem })` autogenerates CRUD
// methods named after the models — `listCustomerLists`,
// `createCustomerLists`, `retrieveCustomerList`, `deleteCustomerLists`,
// `listCustomerListItems`, `createCustomerListItems`,
// `listAndCountCustomerListItems`, `deleteCustomerListItems`, etc.
//
// On top of that this file adds three small helpers that encode the
// invariants the future ACCT-6B store routes need:
//   - getOrCreateList(customer_id, list_type)
//   - addItem(customer_id, list_type, payload)        // dedupe + cap
//   - removeItem(customer_id, list_type, item_id)     // ownership check
//
// Atomicity: dedupe and cap are checked in JS first (cheap, expected path)
// and ultimately enforced by the partial unique index in the migration —
// any race-window unique violation is caught and translated into a
// "return the existing row" response so callers never observe a 500.

import { MedusaError, MedusaService } from "@medusajs/utils"
import { CustomerList } from "./models/customer-list"
import { CustomerListItem } from "./models/customer-list-item"
import {
  CompareCapReachedError,
  CUSTOMER_LIST_TYPES,
  CustomerListType,
  isCustomerListType,
  maxItemsForListType,
  WishlistCapReachedError,
} from "./caps"

export type CustomerListRow = {
  id: string
  customer_id: string
  list_type: string
}

export type CustomerListItemRow = {
  id: string
  customer_list_id: string
  product_id: string
  variant_id: string | null
  title_snapshot: string | null
  thumbnail_snapshot: string | null
}

export type AddItemPayload = {
  product_id: string
  variant_id?: string | null
  title_snapshot?: string | null
  thumbnail_snapshot?: string | null
}

export type AddItemResult = {
  item: CustomerListItemRow
  created: boolean
}

function assertListType(listType: string): asserts listType is CustomerListType {
  if (!isCustomerListType(listType)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Unknown customer list type "${listType}". Expected one of: ${CUSTOMER_LIST_TYPES.join(
        ", ",
      )}.`,
    )
  }
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const e = error as Record<string, unknown>
  // Postgres unique-violation SQLSTATE 23505 — surfaced by MikroORM either
  // on `code` or on the wrapped driver error. We check both shapes.
  if (e.code === "23505") return true
  const inner = (e.previous ?? e.cause) as Record<string, unknown> | undefined
  if (inner && inner.code === "23505") return true
  // MikroORM also exposes a typed exception with a name we can match on,
  // independent of the Postgres SQLSTATE code, in case the driver shape
  // changes between versions.
  if (typeof e.name === "string" && e.name === "UniqueConstraintViolationException") {
    return true
  }
  return false
}

class CustomerListModuleService extends MedusaService({
  CustomerList,
  CustomerListItem,
}) {
  /**
   * Idempotent: returns the existing list for `(customer_id, list_type)`
   * if one exists, otherwise creates and returns a new row.
   */
  async getOrCreateList(
    customer_id: string,
    list_type: string,
  ): Promise<CustomerListRow> {
    assertListType(list_type)
    const existing = (await this.listCustomerLists({
      customer_id,
      list_type,
    })) as CustomerListRow[]
    if (existing.length > 0) {
      return existing[0]
    }
    const created = (await this.createCustomerLists([
      { customer_id, list_type },
    ])) as CustomerListRow[]
    return created[0]
  }

  /**
   * Adds a product (optionally pinned to a variant) to the customer's
   * list of the given type. Returns the existing row with `created: false`
   * if the same `(product_id, variant_id)` pair is already present (or
   * was inserted concurrently). Throws a typed cap-reached error when the
   * caller would exceed the per-list cap.
   */
  async addItem(
    customer_id: string,
    list_type: string,
    payload: AddItemPayload,
  ): Promise<AddItemResult> {
    assertListType(list_type)
    if (!payload.product_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "product_id is required.",
      )
    }

    const list = await this.getOrCreateList(customer_id, list_type)
    const variant_id = payload.variant_id ?? null

    // Dedupe: cheap pre-check, then DB-level safety net via the partial
    // unique index handles any concurrent race.
    const matches = (await this.listCustomerListItems({
      customer_list_id: list.id,
      product_id: payload.product_id,
      variant_id,
    })) as CustomerListItemRow[]
    if (matches.length > 0) {
      return { item: matches[0], created: false }
    }

    // Cap: count BEFORE insert so we never persist over the cap.
    const cap = maxItemsForListType(list_type)
    const [, count] = (await this.listAndCountCustomerListItems({
      customer_list_id: list.id,
    })) as [CustomerListItemRow[], number]
    if (count >= cap) {
      throw list_type === "compare"
        ? new CompareCapReachedError()
        : new WishlistCapReachedError()
    }

    try {
      const created = (await this.createCustomerListItems([
        {
          customer_list_id: list.id,
          product_id: payload.product_id,
          variant_id,
          title_snapshot: payload.title_snapshot ?? null,
          thumbnail_snapshot: payload.thumbnail_snapshot ?? null,
        },
      ])) as CustomerListItemRow[]
      return { item: created[0], created: true }
    } catch (error) {
      if (!isUniqueViolation(error)) throw error
      // Concurrent insert beat us — surface the existing row instead of a
      // 500. Re-fetch to return a consistent shape.
      const reread = (await this.listCustomerListItems({
        customer_list_id: list.id,
        product_id: payload.product_id,
        variant_id,
      })) as CustomerListItemRow[]
      if (reread.length === 0) {
        // Should not happen — unique violation implies the row exists.
        // Re-throw the original error rather than silently swallow.
        throw error
      }
      return { item: reread[0], created: false }
    }
  }

  /**
   * Verifies the item belongs to the caller's list of the given type
   * before deleting. Throws NOT_FOUND for foreign-customer ids so the
   * future route handler can return 404 cleanly.
   */
  async removeItem(
    customer_id: string,
    list_type: string,
    item_id: string,
  ): Promise<void> {
    assertListType(list_type)

    const lists = (await this.listCustomerLists({
      customer_id,
      list_type,
    })) as CustomerListRow[]
    if (lists.length === 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Customer list item ${item_id} not found.`,
      )
    }
    const matches = (await this.listCustomerListItems({
      id: item_id,
      customer_list_id: lists[0].id,
    })) as CustomerListItemRow[]
    if (matches.length === 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Customer list item ${item_id} not found.`,
      )
    }
    await this.deleteCustomerListItems([item_id])
  }
}

export default CustomerListModuleService
