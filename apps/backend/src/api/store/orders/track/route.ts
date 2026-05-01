import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

type OrderGraphRow = {
  id: string
  display_id?: number | null
  status?: string | null
  payment_status?: string | null
  fulfillment_status?: string | null
  email?: string | null
  created_at?: string | null
  total?: number | null
  currency_code?: string | null
  items?: Array<{
    id?: string
    title?: string | null
    quantity?: number | null
    thumbnail?: string | null
  }> | null
}

function normalizeOrderRef(input: string): string {
  return input.replace(/^#/, "").trim()
}

function normalizeEmail(input: string): string {
  return input.trim().toLowerCase()
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const orderRefRaw = String(req.query.order_ref ?? "")
  const emailRaw = String(req.query.email ?? "")
  const orderRef = normalizeOrderRef(orderRefRaw)
  const email = normalizeEmail(emailRaw)

  if (!orderRef || !email) {
    return res.status(400).json({
      message: "Both `order_ref` and `email` are required.",
    })
  }

  const query = req.scope.resolve("query") as {
    graph: (args: {
      entity: string
      fields: string[]
      filters?: Record<string, unknown>
    }) => Promise<{ data?: unknown[] }>
  }

  const maybeDisplayId = Number.parseInt(orderRef, 10)
  const filters =
    Number.isFinite(maybeDisplayId) && String(maybeDisplayId) === orderRef
      ? { display_id: maybeDisplayId }
      : { id: orderRef }

  const { data } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "status",
      "payment_status",
      "fulfillment_status",
      "email",
      "created_at",
      "total",
      "currency_code",
      "items.id",
      "items.title",
      "items.quantity",
      "items.thumbnail",
    ],
    filters,
  })

  const order = ((data ?? [])[0] ?? null) as OrderGraphRow | null
  if (!order) {
    return res.status(404).json({ message: "Order not found." })
  }

  if (normalizeEmail(String(order.email ?? "")) !== email) {
    // Same response as "not found" to avoid leaking order existence.
    return res.status(404).json({ message: "Order not found." })
  }

  return res.json({
    order: {
      id: order.id,
      display_id: order.display_id ?? null,
      status: order.status ?? null,
      payment_status: order.payment_status ?? null,
      fulfillment_status: order.fulfillment_status ?? null,
      created_at: order.created_at ?? null,
      total: typeof order.total === "number" ? order.total : null,
      currency_code: order.currency_code ?? null,
      items: (order.items ?? []).map((item) => ({
        id: item.id ?? null,
        title: item.title ?? null,
        quantity: item.quantity ?? null,
        thumbnail: item.thumbnail ?? null,
      })),
    },
  })
}
