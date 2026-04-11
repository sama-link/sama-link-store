# API Guidelines — Sama Link Store

## Principles

- All external API calls are isolated in `lib/` — never called directly from components
- All API responses are typed using `packages/types`
- Errors are explicit and handled — never silently swallowed
- Server-side API calls happen in Server Components or Route Handlers
- Client-side API calls happen via hooks in `hooks/`

---

## Medusa Store API Client

Location: `apps/storefront/lib/medusa-client.ts`

Use the Medusa JS SDK (`@medusajs/js-sdk`) or typed fetch wrapper.

```typescript
// Example pattern
import Medusa from '@medusajs/js-sdk'

export const medusa = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL!,
  maxRetries: 3,
})

// Typed wrapper example
export async function getProduct(slug: string): Promise<Product> {
  const { product } = await medusa.store.product.retrieve(slug)
  return product as Product
}
```

Rules:
- One export per domain function (not raw SDK calls scattered through code)
- All functions are typed with return types from `packages/types`
- Re-export nothing from the SDK directly — wrap everything

---

## Medusa Admin API Client

Location: `apps/admin/lib/admin-client.ts`

Same pattern as store client but uses Admin API with JWT auth.

- Admin JWT stored in httpOnly cookie
- Client must attach auth header to every request
- Never store admin JWT in localStorage

---

## Next.js Route Handlers (API Routes)

Use `app/api/[route]/route.ts` for:
- Stripe webhook handling
- Server-side actions requiring secrets
- Proxying sensitive requests

Pattern:

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Verify Stripe signature
  // Process event
  // Return 200 OK
  return NextResponse.json({ received: true })
}
```

Rules:
- Always validate input with Zod or similar
- Return consistent error shapes: `{ error: string, code?: string }`
- Never expose internal error details to client in production
- Return appropriate HTTP status codes

---

## Error Handling

### Standard API error shape

```typescript
interface ApiError {
  error: string
  code?: string
  statusCode: number
}
```

### In Server Components

```typescript
try {
  const product = await getProduct(slug)
  // render
} catch (err) {
  // log error (server-side)
  // return notFound() or error UI
  notFound()
}
```

### In Client Components / Hooks

```typescript
const [error, setError] = useState<string | null>(null)

try {
  await addToCart(item)
} catch (err) {
  setError('Failed to add item to cart. Please try again.')
  // log to error monitoring
}
```

---

## Rate Limiting

- Auth endpoints: rate-limited at Medusa level (configure in Phase 8)
- Cart/checkout endpoints: rate-limited
- Admin endpoints: rate-limited by IP + user

---

## Versioning

- Medusa API version is locked to the installed Medusa version
- Do not mix v1 and v2 API calls
- When Medusa upgrades, update all API client code consistently
