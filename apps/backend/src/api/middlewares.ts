// Sama Link · API middleware registry — added in ACCT-6B.
//
// Today this file declares only the customer-list routes (ACCT-6B) as
// requiring an authenticated customer (session or bearer JWT). It is
// intentionally additive — the wildcard matcher is scoped under
// `/store/customer-lists/*` so no existing route changes behavior.
//
// `authenticate` populates `req.auth_context.actor_id` (the Medusa
// customer id) for handlers downstream. Unauthenticated requests are
// short-circuited with 401 by the middleware itself — handlers do not
// need a manual guard.

import { authenticate, defineMiddlewares } from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    {
      methods: ["GET", "POST", "DELETE"],
      matcher: "/store/customer-lists/*",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
  ],
})
