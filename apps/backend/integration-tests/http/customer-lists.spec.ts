// Sama Link · /store/customer-lists HTTP integration tests — ACCT-6B.
//
// Boots the full Medusa app via medusaIntegrationTestRunner (the project's
// existing pattern, mirrored from `health.spec.ts`). The protected routes
// are gated by `authenticate("customer", ["session", "bearer"])` declared
// in `apps/backend/src/api/middlewares.ts`, so unauthenticated requests
// short-circuit with 401 before ever reaching a handler — that is the
// happy path covered here.
//
// Authenticated coverage (200/400/404/409 paths) lives at the service
// layer in `apps/backend/src/modules/customer_list/__tests__/service.spec.ts`
// — the route handlers are thin wrappers over the service, and adding
// a customer-registration + JWT setup to every HTTP test would duplicate
// that infra without strengthening the contract. Once the project test-DB
// env is wired (see ACCT-6A PR body), an authenticated HTTP suite can be
// added in a follow-up.

import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

jest.setTimeout(60 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api }) => {
    describe("/store/customer-lists — auth gating", () => {
      it.each([
        ["GET", "/store/customer-lists/wishlist"],
        ["GET", "/store/customer-lists/compare"],
        ["POST", "/store/customer-lists/wishlist/items"],
        ["POST", "/store/customer-lists/compare/items"],
        ["DELETE", "/store/customer-lists/wishlist/items"],
        ["DELETE", "/store/customer-lists/wishlist/items/itm_does_not_matter"],
      ])("%s %s without auth → 401", async (method, url) => {
        try {
          if (method === "GET") {
            await api.get(url)
          } else if (method === "POST") {
            await api.post(url, { product_id: "prod_x" })
          } else {
            await api.delete(url)
          }
          throw new Error(
            "Expected request to fail with 401 but it succeeded.",
          )
        } catch (err: unknown) {
          // axios throws on non-2xx; we assert on response.status.
          const status = (err as { response?: { status?: number } }).response
            ?.status
          expect(status).toBe(401)
        }
      })
    })
  },
})
