// Thin wrappers around Medusa's `/admin/*` REST endpoints.
//
// The admin dashboard browser session is already authenticated via cookies —
// every fetch from inside a widget/route needs `credentials: "include"` so
// the session propagates. These helpers centralise that boilerplate plus
// error normalisation.
//
// Do NOT use these to mutate data silently. For the custom routes we keep
// mutations inside purpose-built handlers (e.g. product-bulk) so the intent
// is visible in the audit trail.

type FetchJsonOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  params?: Record<string, string | number | boolean | undefined | null>
  body?: unknown
  signal?: AbortSignal
}

function buildQuery(params?: FetchJsonOptions["params"]): string {
  if (!params) return ""
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue
    sp.set(k, String(v))
  }
  const s = sp.toString()
  return s ? `?${s}` : ""
}

export async function adminFetch<T>(
  path: string,
  opts: FetchJsonOptions = {}
): Promise<T> {
  const url = `/admin${path.startsWith("/") ? path : `/${path}`}${buildQuery(opts.params)}`
  const res = await fetch(url, {
    method: opts.method ?? "GET",
    credentials: "include",
    headers: {
      accept: "application/json",
      ...(opts.body ? { "content-type": "application/json" } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(text || `Admin request failed (${res.status})`)
  }
  return (await res.json()) as T
}

/* ── Typed helpers for the endpoints we actually consume ───────────── */

export type AdminOrderLite = {
  id: string
  display_id: number
  status: string
  payment_status?: string | null
  fulfillment_status?: string | null
  email?: string | null
  currency_code?: string | null
  total?: number | null
  created_at?: string | null
  customer?: { first_name?: string | null; last_name?: string | null } | null
  shipping_address?: {
    city?: string | null
    country_code?: string | null
    province?: string | null
  } | null
}

export type AdminProductLite = {
  id: string
  title: string
  handle?: string | null
  status?: string | null
  thumbnail?: string | null
  created_at?: string | null
  updated_at?: string | null
  variants?: Array<{
    id?: string
    inventory_quantity?: number | null
    manage_inventory?: boolean | null
  }> | null
}

export type AdminCustomerLite = {
  id: string
  email?: string | null
  first_name?: string | null
  last_name?: string | null
  created_at?: string | null
}

export async function listOrders(
  limit = 10,
  offset = 0,
  signal?: AbortSignal
): Promise<{ orders: AdminOrderLite[]; count: number }> {
  const data = await adminFetch<{ orders?: AdminOrderLite[]; count?: number }>(
    "/orders",
    {
      params: {
        limit,
        offset,
        order: "-created_at",
        fields:
          "id,display_id,status,payment_status,fulfillment_status,email,currency_code,total,created_at,+customer.first_name,+customer.last_name,+shipping_address.city,+shipping_address.country_code,+shipping_address.province",
      },
      signal,
    }
  )
  return {
    orders: data.orders ?? [],
    count: typeof data.count === "number" ? data.count : 0,
  }
}

export async function listProducts(
  limit = 10,
  offset = 0,
  signal?: AbortSignal
): Promise<{ products: AdminProductLite[]; count: number }> {
  const data = await adminFetch<{ products?: AdminProductLite[]; count?: number }>(
    "/products",
    {
      params: {
        limit,
        offset,
        fields:
          "id,title,handle,status,thumbnail,created_at,updated_at,variants.id,variants.inventory_quantity,variants.manage_inventory",
      },
      signal,
    }
  )
  return {
    products: data.products ?? [],
    count: typeof data.count === "number" ? data.count : 0,
  }
}

export async function listCustomers(
  limit = 10,
  offset = 0,
  signal?: AbortSignal
): Promise<{ customers: AdminCustomerLite[]; count: number }> {
  const data = await adminFetch<{ customers?: AdminCustomerLite[]; count?: number }>(
    "/customers",
    {
      params: {
        limit,
        offset,
        order: "-created_at",
        fields: "id,email,first_name,last_name,created_at",
      },
      signal,
    }
  )
  return {
    customers: data.customers ?? [],
    count: typeof data.count === "number" ? data.count : 0,
  }
}

/** Aggregate revenue from the most recent N orders. Best-effort; the
 *  storefront dashboard uses this as a rough indicator, not for finance. */
export function sumRevenue(orders: AdminOrderLite[]): {
  total: number
  currency: string | null
} {
  let total = 0
  let currency: string | null = null
  for (const o of orders) {
    if (typeof o.total === "number") total += o.total
    if (!currency && o.currency_code) currency = o.currency_code
  }
  return { total, currency }
}
