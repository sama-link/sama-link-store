# Tasks — Sama Link Store

Actionable implementation backlog, grouped by phase and task ID.
Legend: `[ ]` = to do, `[~]` = in progress, `[x]` = done

For full task brief format see `AGENTS.md`.
For workflow see `docs/cursor-workflow.md`.

---

## Phase 1 — Storefront Skeleton

### Completed

- [x] Next.js 16 storefront scaffolded and running at `localhost:3000`
- [x] App Router with route group `(storefront)` established
- [x] `app/globals.css` — design tokens via Tailwind v4 `@theme`
- [x] `lib/cn.ts` — class-merging utility (`clsx` + `tailwind-merge`)
- [x] `lib/i18n.ts` — locale constants and helpers (placeholder, will be superseded by next-intl)
- [x] `components/layout/Container.tsx` — max-width wrapper with `as` prop
- [x] `components/layout/Header.tsx` — responsive server component
- [x] `components/layout/Footer.tsx` — responsive 4-column grid
- [x] `components/layout/MobileMenu.tsx` — client component with toggle
- [x] `components/ui/Button.tsx` — 5 variants, 3 sizes, loading, disabled, fullWidth
- [x] `components/ui/Input.tsx` — label, hint, error, aria, auto-id
- [x] `components/ui/Card.tsx` — Card + CardHeader + CardBody + CardFooter, 3 variants
- [x] `components/ui/Badge.tsx` — 7 variants, 2 sizes
- [x] `components/ui/index.ts` — barrel export
- [x] `messages/ar.json` + `messages/en.json` — translation stubs
- [x] `I18N-1`: Install next-intl — `next-intl ^4.9.0` installed in `apps/storefront/package.json`
- [x] `I18N-2`: Create i18n routing config — `apps/storefront/i18n/routing.ts`, `defineRouting`, locales `['ar','en']`, defaultLocale `'ar'`
- [x] `I18N-3`: Create i18n request config — `apps/storefront/i18n/request.ts`, `getRequestConfig`, v4 `requestLocale`, dynamic message import
- [x] `I18N-4`: Create middleware.ts — `apps/storefront/middleware.ts`, `createMiddleware(routing)`, locale prefix enforcement
- [x] `I18N-5`: Update next.config.ts — `createNextIntlPlugin('./i18n/request.ts')`, build passes
- [x] `I18N-6`: Create `app/[locale]/layout.tsx` — locale root layout, `NextIntlClientProvider`, `lang`/`dir`, `notFound()` guard
- [x] `I18N-7`: Migrate routes under `[locale]` — moved `(storefront)/` under `[locale]/`, deleted `app/layout.tsx`, `app/(storefront)/`, and `lib/i18n.ts`
- [x] `I18N-8`: Wire translations in Header, Footer, MobileMenu — `getTranslations` in Server Components, `useTranslations` in MobileMenu, all keys in both JSON files with real Arabic text

---

### Active — i18n Locale Routing (next-intl)

> **Note:** Live preview will return 404 during I18N-5 through I18N-8 while locale routes are being wired. This is accepted and expected. Do not treat preview breakage as a blocker unless the error is unrelated to locale routing.

---

#### ~~I18N-1: Install next-intl~~ ✅ Done

**Phase:** Phase 1 — Storefront Skeleton
**Depends on:** none (Phase 1 foundation complete)
**Estimated scope:** 1 file modified

**Goal:**
Add next-intl as a dependency of the storefront app.

**Context:**
ADR-008 mandates next-intl for locale routing and string translation. The package must be installed before any config files can be created. Confirmed decision — do not substitute another library.

**Scope — Files Allowed to Change:**
- `apps/storefront/package.json` — add next-intl dependency

**Files FORBIDDEN to Change:**
- Any file not listed above
- `ARCHITECTURE.md`, `DEVELOPMENT_RULES.md`, `DECISIONS.md`, `TASKS.md`, `AGENTS.md`, `CLAUDE.md`

**Implementation Steps:**
1. Run: `npm install next-intl --workspace=apps/storefront`
2. Verify `next-intl` appears in `apps/storefront/package.json` under `dependencies`

**Acceptance Criteria:**
- [ ] `next-intl` is listed in `apps/storefront/package.json` dependencies
- [ ] `npx tsc --noEmit` (in apps/storefront) passes with zero errors
- [ ] `npx next build` (in apps/storefront) passes

**Out of Scope:**
- Do not create any config files
- Do not modify next.config.ts
- Do not create middleware

**Notes:**
- Target: latest stable next-intl (v3+)

---

#### ~~I18N-2: Create i18n routing config~~ ✅ Done

**Phase:** Phase 1 — Storefront Skeleton
**Depends on:** I18N-1
**Estimated scope:** 1 file to create

**Goal:**
Create the next-intl routing configuration that defines the supported locales and default locale.

**Context:**
next-intl requires a central routing config object. This is the single source of truth for locale settings used by middleware, layouts, and navigation helpers. Arabic (`ar`) is the primary locale per ADR-008.

**Scope — Files Allowed to Change:**
- `apps/storefront/i18n/routing.ts` — CREATE this file

**Files FORBIDDEN to Change:**
- `apps/storefront/lib/i18n.ts` — this is the old placeholder; leave it, it will be removed later
- Any existing component or layout files
- `ARCHITECTURE.md`, `DEVELOPMENT_RULES.md`, `DECISIONS.md`, `TASKS.md`, `AGENTS.md`, `CLAUDE.md`

**Implementation Steps:**
1. Create directory `apps/storefront/i18n/` if it doesn't exist
2. Create `apps/storefront/i18n/routing.ts` with the following:

```typescript
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
});

export type Locale = (typeof routing.locales)[number];
```

**Acceptance Criteria:**
- [ ] `apps/storefront/i18n/routing.ts` exists and exports `routing` and `Locale`
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] The `Locale` type resolves to `'ar' | 'en'`

**Out of Scope:**
- Do not create request.ts yet
- Do not create middleware yet
- Do not modify existing files

---

#### ~~I18N-3: Create i18n request config~~ ✅ Done

**Phase:** Phase 1 — Storefront Skeleton
**Depends on:** I18N-2
**Estimated scope:** 1 file to create

**Goal:**
Create the next-intl server-side request configuration that loads the correct message file based on the active locale.

**Context:**
next-intl requires `getRequestConfig` to tell the server which messages to load per request. This function is called internally by next-intl on each server render. The message files already exist at `apps/storefront/messages/ar.json` and `apps/storefront/messages/en.json`.

**Scope — Files Allowed to Change:**
- `apps/storefront/i18n/request.ts` — CREATE this file

**Files FORBIDDEN to Change:**
- `apps/storefront/messages/ar.json`
- `apps/storefront/messages/en.json`
- Any component or layout file
- `ARCHITECTURE.md`, `DEVELOPMENT_RULES.md`, `DECISIONS.md`, `TASKS.md`, `AGENTS.md`, `CLAUDE.md`

**Implementation Steps:**
1. Create `apps/storefront/i18n/request.ts`:

```typescript
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Fallback to default locale if the incoming locale is not supported
  if (!locale || !routing.locales.includes(locale as 'ar' | 'en')) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

**Acceptance Criteria:**
- [ ] `apps/storefront/i18n/request.ts` exists
- [ ] It imports from `./routing` (not a duplicate definition)
- [ ] It handles an unsupported locale gracefully by falling back to `ar`
- [ ] `npx tsc --noEmit` passes with zero errors

**Out of Scope:**
- Do not create middleware yet
- Do not modify next.config.ts yet

---

#### ~~I18N-4: Create middleware.ts~~ ✅ Done

**Phase:** Phase 1 — Storefront Skeleton
**Depends on:** I18N-3
**Estimated scope:** 1 file to create

**Goal:**
Create the Next.js middleware that intercepts every request and ensures it has a locale prefix, redirecting `/` → `/ar` (default locale).

**Context:**
next-intl middleware handles locale detection and URL normalization. Without it, routes like `/` won't resolve — the middleware redirects them to the correct locale prefix. The matcher must exclude Next.js internals and static files.

**Scope — Files Allowed to Change:**
- `apps/storefront/middleware.ts` — CREATE this file (at the storefront root, same level as `app/`)

**Files FORBIDDEN to Change:**
- Any file inside `app/`
- Any component
- `ARCHITECTURE.md`, `DEVELOPMENT_RULES.md`, `DECISIONS.md`, `TASKS.md`, `AGENTS.md`, `CLAUDE.md`

**Implementation Steps:**
1. Create `apps/storefront/middleware.ts`:

```typescript
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all paths except Next.js internals and static files
  matcher: [
    '/((?!_next|_vercel|.*\\..*).*)',
  ],
};
```

**Acceptance Criteria:**
- [ ] `apps/storefront/middleware.ts` exists at the storefront root
- [ ] It imports routing from `./i18n/routing`
- [ ] The matcher pattern excludes `_next`, `_vercel`, and files with extensions
- [ ] `npx tsc --noEmit` passes with zero errors

**Out of Scope:**
- Do not modify `next.config.ts` yet (that is I18N-5)
- Do not restructure app routes yet

---

#### ~~I18N-5: Update next.config.ts with next-intl plugin~~ ✅ Done

**Phase:** Phase 1 — Storefront Skeleton
**Depends on:** I18N-4
**Estimated scope:** 1 file to modify

**Goal:**
Wrap the Next.js config with the next-intl plugin so that `i18n/request.ts` is picked up automatically.

**Context:**
next-intl requires its plugin to wrap the Next.js config. This is a one-line change but it's a prerequisite for server-side `getTranslations()` to work. The plugin reads `i18n/request.ts` automatically based on Next.js conventions.

**Scope — Files Allowed to Change:**
- `apps/storefront/next.config.ts` — wrap with next-intl plugin

**Files FORBIDDEN to Change:**
- Any file in `app/`, `components/`, `lib/`, `i18n/`, `messages/`
- `ARCHITECTURE.md`, `DEVELOPMENT_RULES.md`, `DECISIONS.md`, `TASKS.md`, `AGENTS.md`, `CLAUDE.md`

**Implementation Steps:**
1. Read the current `apps/storefront/next.config.ts`
2. Replace its contents with:

```typescript
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  /* Add other config options here as needed */
};

export default withNextIntl(nextConfig);
```

**Acceptance Criteria:**
- [ ] `next.config.ts` wraps the config with `withNextIntl`
- [ ] The plugin path points to `'./i18n/request.ts'`
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npx next build` passes (it will likely fail until I18N-6 restructures routes — note this in report)

**Out of Scope:**
- Do not add image domains or other config options
- Do not change the i18n config files

**Notes:**
- The build may fail after this step until I18N-6 restructures the `app/` directory. That is expected — note it in the Task Report and proceed.

---

#### ~~I18N-6: Create `app/[locale]/layout.tsx` — locale root layout~~ ✅ Done

**Phase:** Phase 1 — Storefront Skeleton
**Depends on:** I18N-5
**Estimated scope:** 1 file to create

**Goal:**
Create the locale-aware root layout that sets `lang`, `dir`, loads the font, and wraps children in `NextIntlClientProvider`.

**Context:**
In the next-intl App Router pattern, the `[locale]` segment layout becomes the root layout containing `<html>` and `<body>`. It reads the locale from params, sets the correct `lang` attribute and `dir` (rtl for `ar`, ltr for `en`), and provides translations to client components via `NextIntlClientProvider`. The existing `app/layout.tsx` will be deleted in I18N-7.

Current font import (`Inter`) lives in the old `app/layout.tsx` — move it here.
Global CSS import (`./globals.css`) must also move here (with updated path `../globals.css`).

**Scope — Files Allowed to Change:**
- `apps/storefront/app/[locale]/layout.tsx` — CREATE this file
- Create `apps/storefront/app/[locale]/` directory

**Files FORBIDDEN to Change:**
- `apps/storefront/app/layout.tsx` — do NOT touch yet (deleted in I18N-7)
- `apps/storefront/app/(storefront)/layout.tsx` — do NOT touch yet
- `apps/storefront/app/globals.css`
- `ARCHITECTURE.md`, `DEVELOPMENT_RULES.md`, `DECISIONS.md`, `TASKS.md`, `AGENTS.md`, `CLAUDE.md`

**Implementation Steps:**
1. Create `apps/storefront/app/[locale]/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing, type Locale } from '@/i18n/routing';
import '../globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Sama Link Store',
    template: '%s | Sama Link Store',
  },
  description: 'Your destination for quality products.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  ),
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  // Reject unsupported locales — next-intl middleware should prevent this,
  // but this guard handles direct URL access or misconfiguration.
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className={`${inter.variable} h-full`}
    >
      <body className="flex min-h-full flex-col antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

**Acceptance Criteria:**
- [ ] `app/[locale]/layout.tsx` exists
- [ ] `lang` is set from `params.locale`
- [ ] `dir` is `'rtl'` when locale is `'ar'`, `'ltr'` otherwise
- [ ] `NextIntlClientProvider` wraps children
- [ ] Unsupported locales call `notFound()`
- [ ] `npx tsc --noEmit` passes with zero errors

**Out of Scope:**
- Do not delete `app/layout.tsx` yet (I18N-7)
- Do not move `(storefront)` yet (I18N-7)
- Do not add `generateStaticParams` yet

---

#### ~~I18N-7: Migrate routes under `[locale]` and clean up old layout~~ ✅ Done

**Phase:** Phase 1 — Storefront Skeleton
**Depends on:** I18N-6
**Estimated scope:** 4 files moved/deleted

**Goal:**
Complete the route structure migration: move the `(storefront)` route group under `[locale]`, delete the old root layout, and verify routing works end-to-end.

**Context:**
After I18N-6, there are two competing root layouts: `app/layout.tsx` (old) and `app/[locale]/layout.tsx` (new). The `(storefront)` group still lives at `app/(storefront)/` which is outside the `[locale]` segment. This task completes the migration by moving files and deleting the old layout.

**Scope — Files Allowed to Change:**
- `apps/storefront/app/layout.tsx` — DELETE this file
- `apps/storefront/app/(storefront)/layout.tsx` — MOVE to `app/[locale]/(storefront)/layout.tsx`
- `apps/storefront/app/(storefront)/page.tsx` — MOVE to `app/[locale]/(storefront)/page.tsx`

**Files FORBIDDEN to Change:**
- `apps/storefront/app/[locale]/layout.tsx` — already created in I18N-6, do not modify
- `apps/storefront/app/globals.css`
- `apps/storefront/components/` — no component changes
- `ARCHITECTURE.md`, `DEVELOPMENT_RULES.md`, `DECISIONS.md`, `TASKS.md`, `AGENTS.md`, `CLAUDE.md`

**Implementation Steps:**
1. Create directory `apps/storefront/app/[locale]/(storefront)/`
2. Copy `apps/storefront/app/(storefront)/layout.tsx` to `apps/storefront/app/[locale]/(storefront)/layout.tsx` — no content changes needed
3. Copy `apps/storefront/app/(storefront)/page.tsx` to `apps/storefront/app/[locale]/(storefront)/page.tsx` — no content changes needed
4. Delete `apps/storefront/app/(storefront)/layout.tsx`
5. Delete `apps/storefront/app/(storefront)/page.tsx`
6. Delete the now-empty `apps/storefront/app/(storefront)/` directory
7. Delete `apps/storefront/app/layout.tsx`

**Acceptance Criteria:**
- [ ] `app/layout.tsx` no longer exists
- [ ] `app/(storefront)/` directory no longer exists
- [ ] `app/[locale]/(storefront)/layout.tsx` exists
- [ ] `app/[locale]/(storefront)/page.tsx` exists
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npx next build` passes
- [ ] Navigating to `http://localhost:3000` redirects to `/ar` (or `/en`)
- [ ] `http://localhost:3000/ar` serves the home page with `<html lang="ar" dir="rtl">`
- [ ] `http://localhost:3000/en` serves the home page with `<html lang="en" dir="ltr">`

**Out of Scope:**
- Do not add `generateStaticParams` yet
- Do not change any component files
- Do not update Header/Footer strings yet (I18N-8)

---

#### ~~I18N-8: Wire `useTranslations` in Header and Footer~~ ✅ Done

**Phase:** Phase 1 — Storefront Skeleton
**Depends on:** I18N-7
**Estimated scope:** 2 files to modify

**Goal:**
Replace all hardcoded user-visible strings in Header and Footer with `useTranslations()` calls, using the translation keys already defined in `messages/ar.json` and `messages/en.json`.

**Context:**
All visible strings must go through the i18n system per DEVELOPMENT_RULES.md section 11. Header currently has hardcoded "Products", "Collections", "About", "AR / EN". Footer has hardcoded group names, link labels, and copyright text. Both components are Server Components, so they must use `getTranslations()` (async, server-side), not `useTranslations()` (client-side hook). MobileMenu is a Client Component and uses `useTranslations()`.

Read the current message files before starting to know exactly which keys exist.

**Scope — Files Allowed to Change:**
- `apps/storefront/components/layout/Header.tsx` — replace hardcoded strings
- `apps/storefront/components/layout/Footer.tsx` — replace hardcoded strings
- `apps/storefront/components/layout/MobileMenu.tsx` — replace hardcoded strings
- `apps/storefront/messages/ar.json` — add any missing keys
- `apps/storefront/messages/en.json` — add any missing keys

**Files FORBIDDEN to Change:**
- `apps/storefront/app/[locale]/layout.tsx`
- `apps/storefront/app/[locale]/(storefront)/page.tsx`
- `apps/storefront/components/ui/` — no UI component changes
- `apps/storefront/lib/`
- `ARCHITECTURE.md`, `DEVELOPMENT_RULES.md`, `DECISIONS.md`, `TASKS.md`, `AGENTS.md`, `CLAUDE.md`

**Implementation Steps:**

1. Read `messages/ar.json` and `messages/en.json` to see existing keys
2. Add any missing keys to both files (nav links, footer groups, copyright)
3. Update `Header.tsx`:
   - Import `getTranslations` from `'next-intl/server'`
   - Make the component `async`
   - Replace each hardcoded nav label with `t('nav.key')`
4. Update `MobileMenu.tsx`:
   - Import `useTranslations` from `'next-intl'`
   - Replace hardcoded labels with `t('nav.key')`
5. Update `Footer.tsx`:
   - Import `getTranslations` from `'next-intl/server'`
   - Make the component `async`
   - Replace hardcoded labels and copyright with translation calls

**Acceptance Criteria:**
- [ ] No hardcoded user-visible strings remain in Header, Footer, or MobileMenu
- [ ] All keys used in components exist in both `ar.json` and `en.json`
- [ ] `ar.json` contains Arabic text for all keys
- [ ] `en.json` contains English text for all keys
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npx next build` passes
- [ ] `/ar` route shows Arabic nav labels
- [ ] `/en` route shows English nav labels

**Out of Scope:**
- Do not add locale switcher logic
- Do not wire the locale switcher button (still placeholder)
- Do not translate page content or meta descriptions yet

---

## RELEASE — Repository & Preview Deployment

> Preview deployment track per ADR-013. Separate from Phase 8 production deployment.

- [x] `RELEASE-1`: Initialize git repository — `git init -b main` in monorepo root
- [x] `RELEASE-2`: Create first commit — 64 files, commit `2a760a1`
- [x] `RELEASE-3`: Create GitHub repository — `sama-link/sama-link-store` (private)
- [x] `RELEASE-4`: Push main branch — branch tracking `origin/main`, working tree clean
- [x] `RELEASE-5`: Deploy storefront preview on Vercel — connect repo, configure root dir, deploy
- [x] `RELEASE-6`: Verify live deployment and update deployment docs — https://sama-link-store-storefront.vercel.app/

---

## NEXT — Phase 1 Remaining (after i18n complete)

- [ ] `LAYOUT-1`: Add `generateStaticParams` to `app/[locale]/layout.tsx` for static locale generation
- [ ] `LAYOUT-2`: Implement working locale switcher in Header (links to `/ar` / `/en` equivalents)
- [ ] `LAYOUT-3`: Home page — replace component showcase with real placeholder page structure
- [ ] `LAYOUT-4`: 404 page at `app/[locale]/not-found.tsx`
- [ ] `INFRA-1`: Initialize `packages/config` with shared `tsconfig.base.json`
- [ ] `INFRA-2`: Initialize `packages/types` with domain type definitions

---

## NEXT — Phase 2: Commerce Backend Integration

- [ ] Initialize `apps/backend` with Medusa v2
- [ ] Configure PostgreSQL and run migrations
- [ ] Create seed script
- [ ] Create `apps/storefront/lib/medusa-client.ts`
- [ ] Replace mock data with real API data
- [ ] Configure CORS

---

## LATER — Phases 3–8

See `ROADMAP.md` for scope. Tasks broken out when phase becomes active.

---

## Known Follow-ups

- **Operational note (I18N-7):** After route restructuring, `tsc --noEmit` may fail due to stale `.next/types` references. Fix: delete `apps/storefront/.next/` then run `next build`. Standard Next.js behavior — not a code defect.
- [ ] `FIX-1`: Fix middleware deprecation warning — Warning: `"The 'middleware' file convention is deprecated. Please use 'proxy' instead."` Persists after I18N-5 plugin wiring — confirmed not a next-intl issue. This is a Next.js 16 convention change. Fix: rename `apps/storefront/middleware.ts` → `apps/storefront/proxy.ts` (or follow Next.js 16 docs for the new convention). Build passes with warning. Low priority — address after I18N-8.

---

## Backlog / Ideas

- Product reviews and ratings
- Wishlist / save for later
- Recently viewed products
- WhatsApp contact integration
- Multi-currency
- Loyalty / rewards program
