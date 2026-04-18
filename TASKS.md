# TASKS.md — Active Task Surface

Current active and pending tasks only. Completed task history lives in Notion Session Log.
Legend: `[ ]` = to do, `[~]` = in progress, `[x]` = done

---

## ~~Phase 2 — Commerce Backend Integration~~ CLOSED ✅

All Phase 2 tasks complete. ADR-034 recorded. History in Notion Session Log.

---

## ~~Phase 3 — Product Catalog~~ CLOSED ✅

All Phase 3 tasks complete. History in Notion Session Log.
Deferred (non-blocking): CAT-4 (ADR-035) · SEO-1b · INFRA-1 · INFRA-2

---

## ~~Phase 4 — Cart & Checkout~~ CLOSED ✅

ADRs locked: ADR-036 (cookie, no middleware) · ADR-037 (custom drawer) · ADR-038 (multi-route checkout) · ADR-039 (Stripe deferred)

### Cart stream

- [x] **CART-1**: `CartProvider` + `useCart` hook + cart API methods + cookie helpers — done 2026-04-14
- [x] **CART-3**: "Add to Cart" button wired on product detail page — done 2026-04-14
- [x] **CART-5**: Header cart icon badge — live item count from `useCart` — done 2026-04-14
- [x] **CART-2**: Cart drawer — slide-in, RTL-aware, item list, qty controls, remove, empty state — done 2026-04-14
- [x] **CART-4**: Dedicated `/[locale]/cart` page — done 2026-04-14

### Checkout stream *(after CART-4)*

- [x] **CHK-1**: Route scaffold `/[locale]/checkout/[step]` + shared layout + step progress indicator — done 2026-04-14
- [x] **CHK-2**: Address form step — shipping address attached to Medusa cart — done 2026-04-14
- [x] **CHK-3**: Shipping method selection step — list options, select one — done 2026-04-14
- [x] **CHK-4**: Review/summary step — order summary display + place order CTA (no payment provider — ADR-039) — done 2026-04-14

---

## Phase 4 Exit Criteria (all required)

- [x] Customer can add product to cart from product detail page — verified 2026-04-16
- [x] Cart state persists via cookie across page refreshes — verified 2026-04-16
- [x] Cart drawer shows items, quantities, subtotal; qty and remove work — verified 2026-04-16
- [x] Dedicated cart page provides same controls as drawer — verified 2026-04-16
- [x] Customer can complete address → shipping → review checkout steps — verified 2026-04-16
- [x] Review step shows order summary — verified 2026-04-16
- [x] No Stripe packages in `package.json` — verified 2026-04-16

---

## Active: Phase 5 — Frontend Acceptance Baseline / Storefront Buildout

ADRs locked: ADR-041 (Radix NavigationMenu mega menu) · ADR-042 (Medusa CMS informational pages)
Implementation rule (all tasks): **No hardcoded user-facing strings.** All copy must be in storefront.csv + messages pipeline. Arabic values left blank in CSV for human translation.

### Workstream A — PDP & Product Content

- [x] **MVP-1**: PDP content upgrade — localize hardcoded strings (Variants/SKU), expand with Medusa product fields (subtitle, material, weight, origin_country), improve information hierarchy and purchase flow — done 2026-04-16

### Workstream B — Catalog Card Actions + Wishlist + Compare

- [x] **MVP-2**: Catalog card actions — Add to Cart, Buy Now, Quick View (prefer existing data, no unnecessary fetch), Wishlist (frontend/local state Stage A + /[locale]/wishlist page), Compare (frontend/local state Stage A + /[locale]/compare page) on ProductCard and PDP — done 2026-04-18
- [x] **MVP-2a**: Refinement pass — hydration fix (card nested-anchor), PDP gallery wishlist/compare overlay (top-start), Buy Now styling (PDP + sticky bar), selected-variant accent swap, dark-mode Add-to-Cart contrast, Wishlist/Compare in header + mobile menu — done 2026-04-18
- [x] **MVP-2b**: Catalog redesign + variant UX + branding + i18n audit — card Buy Now primary + Add-to-Cart icon, price bold/brand, sticky bar horizontal match; variant pills smaller/value-only/hover-preview; accent → brand sweep; i18n for ThemeToggle/PdpTabs/ProductGallery/RecommendationsCarousel aria-labels; full Arabic population (one-time ADR-040 exception) — done 2026-04-18

### Workstream C — Product Card Consistency

- [x] **MVP-3**: ProductCard layout — uniform card heights (flex-grow, h-full), image aspect ratio decision + normalization, title clamp-2, description clamp-2, price and action controls pinned to card bottom — done 2026-04-16

### Workstream D — Categories Filter

- [x] **MVP-4**: Categories filter — add `listProductCategories` helper to medusa-client.ts, add categories section to FilterSidebar, wire `category_id[]` param to `listProducts`, fix label confusion (collections labeled as "Categories") — done 2026-04-16

### Workstream E — CMS-Backed Informational Pages (ADR-042)

- [x] **MVP-5**: Medusa CMS pages — route layer first (known handles get fallback shell, unknown handles 404), then CMS integration; `getCmsPageByHandle`/`listCmsPages` in medusa-client.ts; if Medusa CMS API has gaps → gap report immediately, not silent stub; seed About, FAQ, Contact, Shipping & Returns, Privacy, Terms — done 2026-04-16 (GAP: Medusa CMS page API absent, stubs in place)

### Workstream F — Collections Listing Page

- [x] **MVP-6**: Collections listing page — `/[locale]/collections` listing all collections, linked from nav and footer — done 2026-04-16

### Workstream G — Nav Wiring & Dead Links

- [x] **MVP-7**: Nav + footer dead links — add Home to nav, wire all `#` hrefs in Header/MobileMenu/Footer to real routes; Track Order → dedicated placeholder page (not a broken link); New Arrivals/Sale → `/products` (marked as temporary); blocked only on MVP-5 route layer + MVP-6 (not CMS content completeness) — done 2026-04-16

### Workstream H — Mega Menu (ADR-041, blocked on MVP-6 + MVP-7)

- [x] **MVP-8**: Mega menu — install `@radix-ui/react-navigation-menu`, build desktop mega menu with categories + collections panels, wire to real routes — done 2026-04-18 (MVP-8b visual polish pass: chevrons, accent bar, hierarchy, pill CTA, icon empty state)

### Workstream I — Brand & Mobile Polish

- [x] **MVP-9**: Brand polish — header logo h-8→h-10, footer h-7→h-8; favicon already present at `app/favicon.ico`; LocaleSwitcher exposed in MobileMenu panel (mobile variant); mobile responsive audit passes on current breakpoints — done 2026-04-18

### Workstream J — SEO Foundational Pass

- [x] **MVP-10**: SEO — sitemap.xml (dynamic, all product + collection + page routes), robots.txt, JSON-LD structured data (Organization, Product, BreadcrumbList), page metadata audit, semantic heading structure check — done 2026-04-18 (sitemap 120 URLs, `lib/seo.ts` shared helpers, Organization + Product JSON-LD added, BreadcrumbList pre-existing in `Breadcrumbs.tsx`, 14 new `meta.*` CSV keys)

---

## Phase 5 Dependency Map

```
Parallel-safe (can start immediately):
  MVP-1  MVP-2  MVP-3  MVP-4  MVP-9
  MVP-5 (route layer) — known handles + fallback shell, no CMS content required

Requires MVP-5 route layer + MVP-6 complete:
  MVP-7 (all nav/footer routes must exist before wiring)

Requires MVP-6 + MVP-7 complete:
  MVP-8 (mega menu links must resolve)

Recommended last:
  MVP-10 (after route structure is stable)

NOTE: MVP-7 is NOT blocked on CMS content completeness — only on route existence.
```

## Phase 5 Frontend Acceptance Bar (all required)

- [x] No dead links in header / footer / mobile nav — MVP-7 ✅ 2026-04-16
- [x] No temporary links resolve to missing pages — Track Order page exists, New Arrivals/Sale → /products marked temporary — MVP-7 ✅ 2026-04-16
- [x] Homepage exists and is linked from nav — MVP-7 ✅ 2026-04-16
- [x] All 6 informational page routes resolve — MVP-5 ✅ 2026-04-16 (fallback shell; CMS API absent — see ADR/Notion gap)
- [x] Compare page exists at /[locale]/compare and is usable — MVP-2 ✅ 2026-04-18
- [x] Wishlist page or view exists and is usable — MVP-2 ✅ 2026-04-18
- [x] Catalog supports Add to Cart, Buy Now, Quick View, Wishlist, Compare from product grid and PDP — MVP-2 / MVP-2b ✅ 2026-04-18
- [x] PDP materially improved: professional hierarchy, content richness, purchase flow — MVP-1 + 5 PDP redesign passes ✅ 2026-04-16 (ADR-043)
- [x] Categories filter works alongside collections filter — MVP-4 ✅ 2026-04-16
- [x] Product cards visually consistent across grid (height, image, clamping, price/action) — MVP-3 ✅ 2026-04-16
- [x] Mobile locale switcher visible and usable — MVP-9 ✅ 2026-04-18
- [x] Responsive behavior acceptable across mobile / tablet / desktop — MVP-9 ✅ 2026-04-18
- [x] Foundational SEO artifacts present (sitemap, robots.txt, JSON-LD, metadata, locale alternates) — MVP-10 ✅ 2026-04-18
- [x] No hardcoded user-facing strings in any touched frontend code path; all copy in storefront.csv + messages pipeline — verified across MVP-1/3/4/5/6/7 + PDP redesign
- [x] Arabic strings added in this phase are clean, readable, and ecommerce-appropriate — backfilled 2026-04-16
- [x] No Stripe packages in `package.json` ✅

---

## Phase 5 → Phase 6 Governance Closeout (mandatory before Phase 6 opens)

ADR-044 is time-boxed. The back-merge below restores ADR-014 and expires ADR-044. **Phase 6 planning does not open until `GIT-2` is `[x]`.**

- [x] **GIT-2**: Trunk reconciliation back-merge (ADR-044 exit criteria) — done 2026-04-18
  - [x] Merge active feature branch (`feature/front-10-seo-foundational`) into `develop` — merge commit `79cb5fd`
  - [x] Merge `develop` into `main` — merge commit landed on main 2026-04-18
  - [x] Verify `develop` now contains all Phase 2–5 product code — verified via `git log main..develop` diff
  - [x] Update `CLAUDE.md` § Project State → `Active branch: develop`
  - [ ] Archive ADR-044 in Notion Decision Log (Status → Expired, with exit-criteria checklist attached) — pending Notion sync at session end
  - [ ] First Phase 6 task branch demonstrably cut from `develop` — evidenced when first Phase 6 task is briefed

**Status:** Phase 6 planning may now open. Final Notion archival of ADR-044 and first Phase 6 branch evidence are tracked under Phase 6 kickoff.

---

## Active: Phase 6 — Customer Accounts

ADRs in force: ADR-003 (Medusa v2) · ADR-014 (branch from develop) · ADR-018 (native first) · ADR-036 (no auth middleware — same stance as cart) · ADR-040 (CSV-first translations; Arabic blank until human pass) · ADR-046 (Phase 6 scope + Medusa native auth — Accepted in Notion Decision Log).

Implementation rule (all Phase 6 tasks): **No hardcoded user-facing strings.** All copy in `translations/storefront.csv` + `messages/*.json`. Arabic column blank (ADR-040); `messages/ar.json` must carry new keys with empty-string values (next-intl has no fallback configured — missing keys throw, empty strings render blank).

### Active tasks

- [x] **AUTH-1**: Customer authentication server-side foundation — httpOnly JWT cookie, server-resolved customer, Medusa emailpass via SDK in `jwt` mode, login/register/logout routes, header affordance — branch `feature/auth-1-customer-foundation` (cut from `develop` 2026-04-18) — target Advanced Executor — done 2026-04-18 (ADR-046)

---

### AUTH-1 — canonical brief

```
================================================================
Task ID:           AUTH-1
Phase:             Phase 6 — Customer Accounts
Target Executor:   Advanced Executor
Branch:            feature/auth-1-customer-foundation   (cut from develop 2026-04-18)
Depends on:        none (Phase 5 closed, GIT-2 back-merge complete, ADR-046 Accepted)
Governs:           ADR-046 (Accepted — Phase 6 scope + Medusa native auth, JWT mode)
================================================================

REQUIRED READING (ADR-033 — blocking; all five layers must be read)
  [1] Project Context
      - Notion Project Definition
      - Notion Implementation Canon — § Customer model, § Medusa auth surface
  [2] Task State
      - TASKS.md (repo) — this section, confirm no other active AUTH-*
      - Notion Hub active-phase callout — confirm "Phase 6 active"
  [3] Role Contract
      - .agents/20-contracts.mdc — Advanced Executor section
  [4] Governing Rules & ADRs
      - .agents/00-core.mdc (whole file — §2 boundaries + §3 security are
        load-bearing)
      - .agents/10-skills.mdc — Skill 1 (brief fields) + Skill 2 (review gate)
      - Notion ADR-003, ADR-014, ADR-018, ADR-036, ADR-040, ADR-046
  [5] This Brief

Self-alignment check: If any of [1]–[4] is unavailable, STOP and report.
Do not proceed to Goal/Scope until all five are confirmed read.

----------------------------------------------------------------
Goal
  Establish customer authentication as a server-side foundation so that a
  signed-in customer can be identified on any Server Component or Server
  Action, without exposing auth tokens to client JavaScript.

Context
  Phase 6 opens with Customer Accounts (ADR-046). Medusa v2 exposes
  emailpass auth under /auth/customer/emailpass. ADR-018 requires we adopt
  the native surface before extending. ADR-036 set a cart-cookie precedent
  that is deliberately client-readable; auth is the opposite — the session
  token is a secret and MUST be httpOnly. This brief builds the primitive.
  Everything it enables (password reset, order history, addresses, wishlist
  persistence, cart-merge) is a separate future task and must NOT be
  attempted here.

  Medusa SDK auth mode: JWT (bearer-token). The SDK will be reconfigured
  with auth: { type: 'jwt' } so sdk.auth.login/register return the token
  as a string and subsequent authenticated calls forward it as
  Authorization: Bearer <token>. We store that token in our own
  httpOnly cookie on the storefront domain (NOT the Medusa session cookie).

----------------------------------------------------------------
Files Allowed (explicit — no wildcards)

  Storefront — new
    apps/storefront/lib/auth-cookie.ts
      (server-only; next/headers cookies() API)
    apps/storefront/lib/customer-server.ts
      (server-only; import 'server-only')
    apps/storefront/hooks/useCustomer.ts
      (`"use client"`; Context + Provider + hook colocated — EXACT mirror
       of hooks/useCart.ts, hooks/useWishlist.ts, hooks/useCompare.ts;
       use createElement, not JSX, for Provider return — match precedent)
    apps/storefront/components/layout/AccountHeaderLink.tsx
      (`"use client"`; sits alongside WishlistHeaderButton / CompareHeaderButton
       / CartButton; reads useCustomer(); renders Account ↔ Sign-in link)
    apps/storefront/app/[locale]/(storefront)/account/layout.tsx
    apps/storefront/app/[locale]/(storefront)/account/page.tsx
    apps/storefront/app/[locale]/(storefront)/account/login/page.tsx
    apps/storefront/app/[locale]/(storefront)/account/login/LoginForm.tsx
    apps/storefront/app/[locale]/(storefront)/account/register/page.tsx
    apps/storefront/app/[locale]/(storefront)/account/register/RegisterForm.tsx
    apps/storefront/app/[locale]/(storefront)/account/actions.ts
      (Server Actions file — loginAction, registerAction, logoutAction)

  Storefront — modify
    apps/storefront/lib/medusa-client.ts
      (1) Add auth: { type: 'jwt' } to the existing `new Medusa({...})`
          instantiation. This changes default call behavior for the SDK
          instance — but in jwt mode with no token set, unauthenticated
          calls behave identically to today. Verify no regression on
          cart / PDP / catalog flows (see acceptance criteria).
      (2) Add auth methods. Each accepts optional `token` and forwards
          it as Authorization: Bearer <token> when provided:
          emailpassLogin(email, password)        → { token: string }
          emailpassRegister(email, password)     → { token: string }
          createCustomer(payload, token)         → Customer
          getCurrentCustomer(token)              → Customer | null
          logoutSession(token)                   → void
          Use sdk.auth.login('customer','emailpass',{email,password}) which
          returns the JWT as a string; wrap into { token } at the helper
          boundary for call-site consistency. Same for sdk.auth.register.
          For /store/customers and /store/customers/me, use sdk.store.customer
          with the { Authorization: `Bearer ${token}` } request header option
          (Medusa SDK's per-call headers argument). Normalize the { customer }
          response envelope to `Customer | null` at the helper boundary.
          If the emailpass provider is unavailable on the backend, throw a
          typed `AuthProviderUnavailableError`. Do NOT silently stub —
          gap-report to Claude immediately.
    apps/storefront/app/[locale]/(storefront)/layout.tsx
      (wrap the existing Cart/Wishlist/Compare provider stack with
       <CustomerProvider initialCustomer={...}> — resolve initialCustomer
       server-side via getCurrentCustomerFromCookie(). This layout is a
       Server Component; making the call here keeps the server fetch scoped
       to the (storefront) group, exactly as CartProvider / WishlistProvider /
       CompareProvider are scoped today.)
    apps/storefront/components/layout/Header.tsx
      (add <AccountHeaderLink /> to the actions row, alongside the existing
       Wishlist / Compare / Cart buttons; no business logic in the component)
    apps/storefront/components/layout/MobileMenu.tsx
      (parallel to Header — show Account / Sign-in per auth state;
       read useCustomer() in the mobile panel)

  Translations — modify
    translations/storefront.csv
      (add keys listed under "CSV keys" below. Arabic column BLANK —
       ADR-040; human translator fills later.)
    apps/storefront/messages/en.json
      (mirror the new keys with the English values)
    apps/storefront/messages/ar.json
      (mirror the new keys with empty-string values — next-intl has no
       fallback configured; missing keys throw, empty strings render blank;
       ADR-040 compliance)

  Env
    apps/storefront/.env.example
      (NEXT_PUBLIC_MEDUSA_BACKEND_URL is already present — verify only;
       add NO secrets. Auth token is per-session, not an env var.)

Files Forbidden (always — even if they seem related)
  - CLAUDE.md
  - TASKS.md
  - .agents/   (entire directory)
  - docs/      (entire directory)
  - Root .gitignore, turbo.json, root package.json
  - apps/backend/ (entire directory — backend changes are a separate brief)
  - apps/storefront/middleware.ts
    (current contents = next-intl routing middleware ONLY; do NOT add
     auth gating. Precedent ADR-036: no middleware for cart; same stance
     here. Auth resolution is per-request in Server Components and Server
     Actions.)
  - apps/storefront/app/[locale]/layout.tsx
    (the locale root layout stays metadata + theme + next-intl only;
     CustomerProvider wraps at the (storefront) group layout, matching
     the Cart/Wishlist/Compare precedent.)
  - apps/storefront/lib/cart-cookie.ts
    (cart cookie is client-readable by design — auth MUST NOT piggyback;
     use the new lib/auth-cookie.ts)
  - apps/storefront/components/common/
    (this directory does not exist and must not be created — this task's
     components live in components/layout/ and hooks/ per precedent)
  - Any component that currently reads the cart cookie — auth and cart
    are separate concerns.

----------------------------------------------------------------
CSV keys to add (translations/storefront.csv — en column populated;
ar column blank per ADR-040; mirror keys into both messages/en.json
(English values) and messages/ar.json (empty strings)):

  account.title                     Account
  account.signIn                    Sign in
  account.signUp                    Create account
  account.signOut                   Sign out
  account.emailLabel                Email
  account.passwordLabel             Password
  account.firstNameLabel            First name
  account.lastNameLabel             Last name
  account.loginCta                  Sign in
  account.registerCta               Create account
  account.loginHeading              Welcome back
  account.registerHeading           Create your account
  account.noAccountPrompt           Don't have an account?
  account.hasAccountPrompt          Already have an account?
  account.genericError              We couldn't sign you in. Check your details and try again.
  account.registerError             We couldn't create your account. Try again.
  account.welcomeBack               Welcome back, {name}
  account.placeholderDashboard      Your account area — more features coming soon.
  account.greetingSignedOut         Hello, guest

----------------------------------------------------------------
Implementation Steps (deterministic — do not skip or reorder)

1.  `apps/storefront/lib/auth-cookie.ts` (server-only helpers)
    - No 'use client'; intended for Server Components / Server Actions only.
    - Constants:
        AUTH_COOKIE_NAME    = 'sama_customer_session'
        AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30   // 30 days
    - Exports:
        setAuthCookie(token: string): Promise<void>
          → (await cookies()).set(AUTH_COOKIE_NAME, token, {
              httpOnly: true, secure: true, sameSite: 'strict',
              path: '/', maxAge: AUTH_COOKIE_MAX_AGE,
            })
        getAuthToken(): Promise<string | null>
          → ((await cookies()).get(AUTH_COOKIE_NAME)?.value) ?? null
        clearAuthCookie(): Promise<void>
          → (await cookies()).set(AUTH_COOKIE_NAME, '', { maxAge: 0, path: '/' })
    - NO client-side reads. NO document.cookie. Ever.
      (Next 16 + React 19: `cookies()` is async — await it.)

2.  `apps/storefront/lib/medusa-client.ts` — extend, do not refactor
    - Reconfigure the existing `sdk`:
        export const sdk = new Medusa({
          baseUrl,
          publishableKey,
          auth: { type: 'jwt' },
        });
      In jwt mode with no token stored, unauthenticated calls (cart,
      product list, collection list, etc.) are unchanged.
    - Add the five helper functions listed under "Storefront — modify"
      above. Use the SDK surface where available:
        sdk.auth.login('customer','emailpass', { email, password })
        sdk.auth.register('customer','emailpass', { email, password })
        sdk.store.customer.create(payload, {}, { Authorization:`Bearer ${token}` })
        sdk.store.customer.retrieve({}, { Authorization:`Bearer ${token}` })
        sdk.auth.logout() or POST /auth/session with bearer — whichever
        Medusa v2.13.x exposes; if neither, implement via typed fetch.
    - Each helper: typed inputs, typed response. No `as any`. No silent
      stubbing. If the emailpass provider isn't installed on the backend,
      throw `AuthProviderUnavailableError` (export the class from this
      file) and stop — executor: gap-report to Claude immediately.
    - Return shape normalization:
        emailpassLogin    → { token }
        emailpassRegister → { token }  (registration token; pass it to
                                        createCustomer and then to
                                        setAuthCookie — it IS the session
                                        token once the customer row exists)
        getCurrentCustomer → customer ?? null   (unwrap { customer })

3.  `apps/storefront/lib/customer-server.ts`
    - Top of file: `import 'server-only';`
    - Export:
        getCurrentCustomerFromCookie(): Promise<Customer | null>
          — read token via getAuthToken(); if null, return null
          — call getCurrentCustomer(token)
          — on 401 / unauthorized error: await clearAuthCookie() and return null
          — any other error: rethrow (do not swallow)
    - Customer type: import from `@medusajs/js-sdk` response type, or
      derive from getCurrentCustomer's return shape. No new type in
      packages/types for this task.

4.  `apps/storefront/app/[locale]/(storefront)/account/actions.ts`
    - 'use server'
    - Server Actions — typed inputs, hand-written validation narrowing
      raw FormData into a typed object. No `any`, no raw FormData reads
      without narrowing. No external validation library.
        loginAction(prevState, formData): Promise<{ error?: string }>
          → read email, password from FormData
          → call emailpassLogin → await setAuthCookie(token)
          → redirect(`/${locale}/account`)  (locale via getLocale() from
            'next-intl/server')
        registerAction(prevState, formData): Promise<{ error?: string }>
          → read email, password, first_name, last_name
          → emailpassRegister → createCustomer(token) → await setAuthCookie(token)
          → redirect(`/${locale}/account`)
        logoutAction()
          → token = await getAuthToken(); if token: logoutSession(token)
          → await clearAuthCookie()
          → redirect(`/${locale}`)
    - On failure: return { error: <translated account.genericError or
      account.registerError> }. Translate server-side via
      getTranslations({ locale, namespace: 'account' }).
    - Never leak Medusa error bodies to the client. Never `throw` across
      the action boundary for expected failures — only for programmer
      errors (e.g., AuthProviderUnavailableError).

5.  `apps/storefront/hooks/useCustomer.ts`
    - Pattern: EXACT mirror of hooks/useCart.ts / hooks/useWishlist.ts /
      hooks/useCompare.ts. Single file. `"use client"` at the top.
    - Imports from react: createContext, createElement, useContext,
      useMemo, type ReactNode.
    - Export `CustomerProvider({ initialCustomer, children })` — takes
      the server-resolved customer, exposes context, returns via
      createElement (NOT JSX — matches precedent).
    - Export `useCustomer(): { customer: Customer | null; isAuthenticated: boolean }`.
    - `isAuthenticated` is derived: `customer !== null`.
    - NO fetch calls in this file. The client never hits Medusa directly
      for the customer — it trusts the server-resolved value passed
      through the provider on each render.
    - Do NOT put loginAction / registerAction / logoutAction on the
      context. Components call the Server Actions directly via
      <form action={...}> or useActionState.

6.  `apps/storefront/app/[locale]/(storefront)/layout.tsx` — modify
    - At the top of the component body:
        const customer = await getCurrentCustomerFromCookie();
      (The customer object is plain JSON as returned by the Medusa SDK —
       safe to pass across the server→client boundary. Do not mutate it,
       do not wrap in a class instance.)
    - Wrap the existing stack:
        <CustomerProvider initialCustomer={customer}>
          <CartProvider>
            <WishlistProvider>
              <CompareProvider>
                <Header />
                ...
              </CompareProvider>
            </WishlistProvider>
          </CartProvider>
        </CustomerProvider>
    - Do not reorder the existing providers. Do not touch the Cart, Wishlist,
      or Compare provider composition.

7.  `/account/login` and `/account/register`
    - `page.tsx`: Server Component. Resolve translations via
      getTranslations({ locale, namespace: 'account' }), pass the
      translated heading / labels / CTA / prompt / error-fallback strings
      down to the form as props.
    - `LoginForm.tsx` / `RegisterForm.tsx`: 'use client' components using
      React 19 `useActionState` (package.json pins react 19.2.4 — API is
      available; do NOT upgrade React).
    - Bind the action from step 4 via useActionState; render errors inline
      from action state. Never `throw` across the action boundary for
      expected failures.
    - Below the form, render a Link to the opposite route (login → register
      via account.noAccountPrompt; register → login via account.hasAccountPrompt).

8.  `/account/layout.tsx` and `/account/page.tsx`
    - `layout.tsx`: Server Component. Call getCurrentCustomerFromCookie().
      If null, redirect(`/${locale}/account/login`). This is the gate —
      it prevents unauthenticated access to /account/* without needing
      middleware (ADR-036 precedent).
    - `page.tsx`: Server Component. Resolve the customer again (or pass
      it down from layout via route param; simplest is to call
      getCurrentCustomerFromCookie() here too — the RSC cache will
      dedupe within a single request). Render:
        - h1 with account.welcomeBack substituted with the customer's
          name (use customer.first_name || customer.email as fallback)
        - paragraph with account.placeholderDashboard copy
        - <form action={logoutAction}><button>Sign out</button></form>
          using account.signOut for the label.
    - NO dashboard content beyond the placeholder. Addresses / orders /
      profile form are ACC-1 / ACC-2 / ACC-3 — out of scope.

9.  `AccountHeaderLink.tsx`
    - 'use client'
    - Reads useCustomer().
    - Authenticated → Link to `/${locale}/account` with t('account.title')
      as aria-label + title; render a user-silhouette icon (svg inline,
      match WishlistHeaderButton's icon pattern — currentColor stroke,
      h-5 w-5).
    - Unauthenticated → Link to `/${locale}/account/login` with
      t('account.signIn'); same visual treatment as above.
    - No badge / count. No business logic.
    - Import and render from BOTH Header.tsx AND MobileMenu.tsx — no
      duplication of auth-state logic in the header files.

10. Translations
    - Add the 19 CSV keys listed above to translations/storefront.csv
      — en column populated, ar column blank (ADR-040).
    - Add the same keys to messages/en.json with the English values.
    - Add the same keys to messages/ar.json with empty-string values.
      Empty strings render as blank in the Arabic UI until the human
      translator populates them — this is the ADR-040 compliant shape.
    - Nest under an "account" namespace to match existing patterns
      (`"account": { "title": "Account", ... }`).

11. Verification / tests
    - Manual in dev (docker compose, backend at :9000, storefront at :3000):
        (a) Visit /en/account → redirected to /en/account/login.
        (b) Register (valid email, password >= 8 chars, first/last name) →
            cookie set → land on /en/account → welcome line shows the name.
        (c) Logout → cookie cleared → land on /en → header shows Sign-in.
        (d) Login with the same credentials → land on /en/account.
        (e) Login with bad credentials → inline error, no uncaught throw,
            no Medusa error body in the UI.
        (f) DevTools → Application → Cookies → `sama_customer_session`:
            HttpOnly ✓, Secure ✓, SameSite = Strict.
        (g) Verify cart / PDP / catalog / collections all still work
            (no regression from the SDK auth mode change).
        (h) Repeat (a)–(c) on /ar/* to verify locale-aware redirects.
    - `tsc --noEmit` passes (run from repo root via turbo or from
      apps/storefront).
    - `next build` succeeds (apps/storefront).
    - grep verification (run before declaring done, include counts in
      task report):
        - `rg "document\.cookie" apps/storefront/components apps/storefront/hooks`
          expected: zero matches referencing sama_customer_session
        - `rg "sama_customer_session" apps/storefront`
          expected: only in lib/auth-cookie.ts
        - `rg "NEXT_PUBLIC_.*(TOKEN|SECRET|AUTH)" apps/storefront`
          expected: zero matches
        - `rg "components/common" apps/storefront`
          expected: zero matches

----------------------------------------------------------------
Acceptance Criteria (all must be verifiable)

  [ ]  1. Unauthenticated visit to /[locale]/account redirects to
          /[locale]/account/login (verified for both en and ar).
  [ ]  2. Register form creates a customer, sets httpOnly cookie, lands
          on /[locale]/account with welcome line showing the new customer's
          name (first_name fallback to email).
  [ ]  3. Login form with valid credentials lands on /[locale]/account;
          invalid credentials render an inline error — no uncaught throw,
          no Medusa error body surfaced.
  [ ]  4. Logout button on /account clears the cookie and lands on
          /[locale] with the header in signed-out state.
  [ ]  5. Cookie inspected in browser DevTools shows: name =
          `sama_customer_session`, HttpOnly=true, Secure=true,
          SameSite=Strict, Path=/.
  [ ]  6. No component under apps/storefront/components or
          apps/storefront/hooks reads document.cookie for the auth
          cookie (grep = 0 matches — include grep output in report).
  [ ]  7. Header and MobileMenu both show the correct account affordance
          per auth state in en and ar (visually verified in both locales).
  [ ]  8. No hardcoded user-facing strings introduced in any touched file
          — all copy flows through storefront.csv + messages pipeline
          (ADR-040 compliance).
  [ ]  9. Arabic column blank for new CSV keys; messages/ar.json contains
          all 19 keys with empty string values; /ar/account/* routes
          render without next-intl MISSING_MESSAGE errors.
  [ ] 10. Existing cart / PDP / catalog / collection flows still work
          end-to-end after the SDK auth mode change (no regression).
  [ ] 11. `tsc --noEmit` passes.
  [ ] 12. `next build` succeeds.
  [ ] 13. No new `any` introduced without a justification comment.
  [ ] 14. No files outside the Files Allowed list are modified (include
          full `git status` output in the report).
  [ ] 15. apps/storefront/middleware.ts is UNTOUCHED (diff is empty).
  [ ] 16. apps/storefront/app/[locale]/layout.tsx is UNTOUCHED
          (the CustomerProvider wraps at the (storefront) group layout).
  [ ] 17. components/common/ directory does NOT exist (grep = 0 matches).

----------------------------------------------------------------
Out of Scope (executor MUST NOT do any of these)

  - Password reset / forgot password flow             → AUTH-2
  - Email verification flow                           → AUTH-3
  - Saved addresses CRUD or UI                        → ACC-2
  - Order history list or detail                      → ACC-3 / ACC-4
  - Guest cart merge on login                         → CART-MERGE
  - Wishlist / compare persistence across devices     → WISH-B / CMP-B
  - OAuth / social login
  - Middleware-based auth gating (ADR-036 precedent)
  - Configuring the Medusa SDK for session-cookie auth
    (the design chooses jwt-bearer + our own httpOnly cookie —
     do NOT flip auth: { type: 'session' })
  - Touching cart-cookie.ts in any way
  - Touching apps/backend/ in any way
  - Creating apps/storefront/components/common/ (directory
    convention does not exist in this repo)
  - Putting CustomerProvider in its own component file —
    it colocates with the hook, matching CartProvider precedent
  - Wrapping CustomerProvider at [locale]/layout.tsx (wrong layer;
    wrap at (storefront)/layout.tsx)
  - Modifying ProductCard, PDP, checkout, or existing cart flows
  - Any "nice-to-have" refactor of medusa-client.ts beyond adding
    the listed auth functions and the jwt auth-mode flag —
    Advanced Executor must resist the temptation

----------------------------------------------------------------
Completion Report
  Overwrite `task report.txt` at repo root per Shared Rules
  (.agents/20-contracts.mdc). Do not append. Include all 17 acceptance
  criteria with met/unmet status, the build results (`tsc --noEmit` +
  `next build`), the grep outputs from Step 11, and a full `git status`
  showing only Files Allowed were modified.
```
