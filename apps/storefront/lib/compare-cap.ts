// Sama Link · Compare cap constant — ACCT-6E.
//
// Lives in its own file so non-React modules (server-side hydration
// helpers, tests, etc.) can import it without pulling the
// `useCompare` provider — which depends on the server actions, which
// depend on server-only modules — into a Node test environment.
//
// `useCompare` re-exports this so existing call sites that import
// COMPARE_MAX_ITEMS from `@/hooks/useCompare` keep working.

export const COMPARE_MAX_ITEMS = 4;
