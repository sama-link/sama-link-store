# Tasks — Sama Link Store

Actionable implementation backlog, grouped by phase and task ID.
Legend: `[ ]` = to do, `[~]` = in progress, `[x]` = done

For full task brief format see `docs/project-kb/governance/agents.md`.
For workflow see `docs/project-kb/operations/task-workflow.md`.

---

## Phase 1 — Storefront Skeleton

### Completed

- [x] Next.js 16 storefront scaffolded and running at `localhost:3000`
- [x] App Router with route group `(storefront)` established
- [x] `app/globals.css` — design tokens via Tailwind v4 `@theme`
- [x] `lib/cn.ts` — class-merging utility (`clsx` + `tailwind-merge`)
- [x] `lib/i18n.ts` — locale constants and helpers (placeholder — deleted in I18N-7, superseded by next-intl)
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
- [x] `LAYOUT-1`: Add `generateStaticParams` to `app/[locale]/layout.tsx` — `routing.locales.map((locale) => ({ locale }))`, build reports 5 prerendered pages
- [x] `LAYOUT-4`: Create `app/[locale]/not-found.tsx` — async Server Component, `getLocale()` + `getTranslations()`, locale-aware back link, no hardcoded strings

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
- `docs/project-kb/definition/architecture.md`, `docs/project-kb/governance/development-rules.md`, `docs/project-kb/governance/decisions.md`, `docs/project-kb/operations/tasks.md`, `docs/project-kb/governance/agents.md`, `CLAUDE.md`

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
- `docs/project-kb/definition/architecture.md`, `docs/project-kb/governance/development-rules.md`, `docs/project-kb/governance/decisions.md`, `docs/project-kb/operations/tasks.md`, `docs/project-kb/governance/agents.md`, `CLAUDE.md`

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
- `docs/project-kb/definition/architecture.md`, `docs/project-kb/governance/development-rules.md`, `docs/project-kb/governance/decisions.md`, `docs/project-kb/operations/tasks.md`, `docs/project-kb/governance/agents.md`, `CLAUDE.md`

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
- `docs/project-kb/definition/architecture.md`, `docs/project-kb/governance/development-rules.md`, `docs/project-kb/governance/decisions.md`, `docs/project-kb/operations/tasks.md`, `docs/project-kb/governance/agents.md`, `CLAUDE.md`

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
- `docs/project-kb/definition/architecture.md`, `docs/project-kb/governance/development-rules.md`, `docs/project-kb/governance/decisions.md`, `docs/project-kb/operations/tasks.md`, `docs/project-kb/governance/agents.md`, `CLAUDE.md`

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
- `docs/project-kb/definition/architecture.md`, `docs/project-kb/governance/development-rules.md`, `docs/project-kb/governance/decisions.md`, `docs/project-kb/operations/tasks.md`, `docs/project-kb/governance/agents.md`, `CLAUDE.md`

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
- `docs/project-kb/definition/architecture.md`, `docs/project-kb/governance/development-rules.md`, `docs/project-kb/governance/decisions.md`, `docs/project-kb/operations/tasks.md`, `docs/project-kb/governance/agents.md`, `CLAUDE.md`

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
All visible strings must go through the i18n system per docs/project-kb/governance/development-rules.md section 11. Header currently has hardcoded "Products", "Collections", "About", "AR / EN". Footer has hardcoded group names, link labels, and copyright text. Both components are Server Components, so they must use `getTranslations()` (async, server-side), not `useTranslations()` (client-side hook). MobileMenu is a Client Component and uses `useTranslations()`.

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
- `docs/project-kb/definition/architecture.md`, `docs/project-kb/governance/development-rules.md`, `docs/project-kb/governance/decisions.md`, `docs/project-kb/operations/tasks.md`, `docs/project-kb/governance/agents.md`, `CLAUDE.md`

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

## Phase 1 — Final Tasks ✅ Complete

- [x] `COPY-1`: Add dedicated 404 translation keys — `errors.notFoundTitle`, `errors.notFoundDescription`, `errors.goHome` to both JSON files; `not-found.tsx` updated to use `errors.*` namespace
- [x] `LAYOUT-2`: Implement working locale switcher — `LocaleSwitcher.tsx` created as `"use client"` component with `usePathname()`; Header remains async Server Component using `getTranslations()`
- [x] `LAYOUT-3`: Home page placeholder — hero with `home.headline` / `home.subheadline` / `home.ctaLabel`, body note `home.comingSoon`; Server Component, all strings translated

---

## Pre-Phase 2 — Governance, Branding & SEO Foundation

### Completed
- [x] `ADR-014`: Direct-to-main git workflow exception documented
- [x] `ADR-015`: Mobile-first UI is mandatory — documented
- [x] `ADR-016`: SEO first-class architectural concern — documented
- [x] `ADR-017`: Rendering strategy per route type — documented
- [x] `ADR-018`: Adopt > Extend > Rebuild — documented
- [x] Knowledge base alignment — docs/project-kb/governance/decisions.md, CLAUDE.md, docs/project-kb/operations/roadmap.md, docs/project-kb/operations/deployment.md, Notion fully synced (commit `7664e90`)

### Active
- [x] `GOV-2`: Backfill all existing Task Tracker rows with correct Feature links and Is Pre-Phase Blocker flags — enforcement system data completeness
- [x] `BRAND-1`: Define Arabic font (Cairo or Tajawal), update `@theme` in `globals.css`, add Latin font pairing
- [x] `SEO-1a`: Add `generateMetadata` to home page — canonical, hreflang, openGraph, ISR revalidate:3600
- [ ] `SEO-1b`: 404 page metadata — deferred pending confirmed Next.js support for generateMetadata in not-found.tsx
- [x] `SEO-2`: Create `robots.txt` and `sitemap.xml` stub
- [ ] `CHORE-1`: Remove `.gitkeep` files from empty directories — Phase 1 cleanup, now due

### Deferred (optional, not blocking Phase 2)
- [ ] `INFRA-1`: Initialize `packages/config` with shared `tsconfig.base.json`
- [ ] `INFRA-2`: Initialize `packages/types` with domain type definitions

### Required before Phase 2 starts
- [x] `GIT-1`: Create `develop` branch — required before Phase 2 starts, per ADR-014

---

## Phase 2 — Commerce Backend Integration

### Phase 2 Pre-Work — Brand Identity & Media Foundation

**All tasks below must complete before BACK-1. See ADR-020.**

- [x] `MEDIA-1`: Define Media Intake Protocol — `docs/project-kb/implementation/media-intake-protocol.md` authored (Claude, 2026-04-03)
- [x] `BRAND-2`: Extract production-ready logo variants (WebP) into `public/brand/logo/` + `manifest.json` stub
- [x] `BRAND-3`: Replace color tokens — new `--color-brand` (#1c3d6b) and `--color-accent` (#4b8fc4) from logo identity
- [x] `BRAND-4`: Implement light/dark theme — `html.dark` class-based CSS variable overrides, ThemeProvider, toggle button
- [x] `BRAND-5`: Logo component + apply logo and brand tokens to Header, nav, footer, global surfaces

### Phase 2 Core — Commerce Backend

- [x] `BACK-1`: Initialize `apps/backend` with Medusa v2
  - _Security: All secrets (MEDUSA_ADMIN_EMAIL, MEDUSA_ADMIN_PASSWORD, JWT_SECRET, COOKIE_SECRET) must come from env — no hardcoding_
  - _Cleanup debt: `dev` script uses hardcoded path `../../node_modules/@medusajs/cli/cli.js` as a workaround for npm workspace ts-node hoisting. Track as `CHORE-2` — resolve before production._
- [x] `BACK-2`: Configure PostgreSQL and run migrations
  - _Security: DATABASE_URL must be env-only — never committed, never logged_
  - _Reviewed and closed 2026-04-11. Functional goal confirmed: PostgreSQL connected, migrations ran, `GET /health` → 200 (ENV-1). Security remediation: `.env.test` untracked and added to `.gitignore` (commit `b564c77`). Neon credentials rotated by human. `git grep "neon.tech"` → no tracked matches. All `DATABASE_URL` references are localhost placeholders or env reads. All acceptance criteria met._
- [x] `BACK-3`: Create seed script (1 category, 2–3 products)
  - _Reviewed and closed 2026-04-12. Seed script `apps/backend/src/scripts/seed.ts` authored and confirmed working. Docker exec run: category `networking` created (`pcat_01KNZP0P8...`), 3 products created (Gigabit Switch 8-Port, Dual-Band Wi-Fi Router AC1200, Cat6 Ethernet Cable 3m). Idempotent — re-running skips existing records. All acceptance criteria met._
- [x] `BACK-4`: Create `apps/storefront/lib/medusa-client.ts`
  - _Reviewed and closed 2026-04-12. `apps/storefront/lib/medusa-client.ts` created: singleton `sdk` (Medusa v2 JS SDK `^2.13.1`), `listProducts`, `getProductByHandle`. Param type derived via `NonNullable<Parameters<...>[0]>` — no `@medusajs/types` dependency needed. `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY` added to `.env.example`. `tsc --noEmit` exit 0. No scope violations (3 files: lib/medusa-client.ts, package.json, .env.example + expected lockfile). Publishable API key must be provisioned by human in Medusa Admin before BACK-5 can make live Store API calls._
- [x] `BACK-5`: Replace mock data with real API data
  - _Reviewed and closed 2026-04-12. Home page updated: `listProducts({ limit: 6 })` called in Server Component with try/catch resilience; `ProductCard` created in `components/products/` (Server Component, pure display — title + description + placeholder block, all `@theme` tokens verified). `products` i18n namespace added to both `en.json` and `ar.json`. `comingSoon` key orphaned in JSON (unused — cleanup tracked as future chore). `tsc --noEmit` exit 0. No scope violations. Requires publishable API key in `.env.local` for live product display._
- [ ] `BACK-6`: Configure CORS between storefront and backend
  - _Security: CORS must be strict and environment-based — wildcard `*` is forbidden in staging/production; allowed origins must come from env_

---

## Phase 2 — Operational & Cross-Cutting Tasks

These tasks do not block BACK-1 but must be completed early in Phase 2. Priority: High.

> **Branching:** Phase 2 follows the hybrid solo-dev policy (see CLAUDE.md). BACK-* tasks use feature branches. Docs, config, and minor changes commit directly to `develop`.

- [x] `ENV-1`: Verify and bring up local development environment — PostgreSQL verified at `localhost:5432`, `sama_link_db` created, Medusa backend dev server running at `localhost:9000` (`GET /health` → 200), storefront verified at `localhost:3000`. `apps/storefront/.env.local` created with `NEXT_PUBLIC_*` defaults. Non-blocking ts-node path startup warning tracked as `CHORE-2`. (2026-04-11)

- [x] `ENV-2`: Create local environment script baseline — per ADR-026. Scripts created: `env-check.sh`, `start-dev.sh`, `stop-dev.sh`, `health-check.sh`. **Superseded in practice by Docker Compose path (ENV-4 / ADR-033).** Native scripted backend bring-up was never fully resolved, but the Docker Compose runtime replaced it as the canonical local dev path. Scripts remain for reference. Formally closed 2026-04-12.

- [x] `ENV-3`: Fix backend startup stability under scripted bring-up — **Superseded in practice by Docker Compose path (ENV-4 / ADR-033).** Diagnostic improvements were applied but root causes (credential mismatch + ts-node resolution) were never resolved via the native path. Docker Compose runtime replaced this path entirely. Formally closed 2026-04-12.

- [x] `ENV-4`: Docker Compose local runtime baseline — implements ADR-033. All deliverables complete: `docker-compose.dev.yml`, `apps/backend/Dockerfile.dev`, `scripts/start-dev.sh`, `scripts/stop-dev.sh`, `.env.example` updated. SSL connectivity issue diagnosed and resolved by ENV-5 + ENV-7. Formally closed 2026-04-12.

---

#### TASK ENV-4: Docker Compose Local Runtime Baseline

**Version:** Brief V2
**Phase:** Phase 2 — Commerce Backend Integration
**Target Executor:** Backend Specialist
**Branch:** `feature/back-1-medusa-init`
**Depends on:** ENV-2 (scripts exist), ENV-3 (diagnostic work complete), ADR-033 (decision recorded)
**Estimated scope:** 2 files to create, 3 files to modify

---

#### REQUIRED READING
Read in order before writing any code. Do not begin implementation until all four layers below are read. Layer [5] marks the sequencing gate — proceed to Goal and Implementation Steps only then.

**[1] Project Context**
- `docs/project-kb/definition/architecture.md` — system boundary table (backend = `apps/backend/`, storefront = `apps/storefront/`); Backend Secrets boundary rule: secrets are server-side only, never in `NEXT_PUBLIC_*` vars — governs all `.env` handling in this task

**[2] Task State**
- `docs/project-kb/operations/tasks.md` — ENV-2 [~] and ENV-3 [~]: the four scripts they produced are the files you will modify; CHORE-2 [~]: the tsconfig-paths TypeError this task resolves by moving the backend runtime into a container
- `docs/project-kb/operations/roadmap.md` — Phase 2 active; backend `/health` returning 200 is a Phase 2 exit dependency

**[3] Role Contract**
- `docs/project-kb/governance/actors/backend-specialist-contract.md`

**[4] Governing Rules & ADRs**
- `docs/project-kb/governance/development-rules.md` — all sections; pay particular attention to secrets discipline
- ADR-026: Local Environment Ownership Model — defines agent authority scope over `scripts/`; establishes secrets boundaries; `.dev.pids` must remain in `.gitignore`; executors may not modify real `.env` values
- ADR-033: Docker Compose Runtime Model — the decision this task implements; read the Decision and Consequences sections before writing any file; in particular: DATABASE_URL hostname inside the container is the Docker service name `postgres`, not `localhost`

**[5] This Brief**
Proceed to Goal and Implementation Steps only after [1]–[4] are read.

---

#### INTERPRETATION MODE
Analytical-Literal. Scope is fixed by this brief. Implementation approach within the bounded scope may be reasoned through; document non-obvious choices in the Output Report. Every gap between this brief and observable reality is an escalation trigger — do not infer or extend scope.

---

#### Goal
Replace the backend's native Node.js startup with a Docker Compose runtime for Medusa backend + PostgreSQL, and update the `scripts/` baseline to manage backend lifecycle via Docker. After this task, `bash scripts/start-dev.sh` must exit 0 with all three services healthy.

#### Context
The native backend has been blocked by a tsconfig-paths TypeError (CHORE-2) in `@medusajs/cli` that has resisted three sequential fixes. The root cause is TypeScript toolchain resolution in the npm workspace monorepo context — this failure mode does not occur in a container because the container has a flat, isolated `node_modules`. Docker Compose eliminates the resolution context that causes the crash without touching any Medusa source code. ADR-033 records this decision. The storefront is healthy natively and must not be containerized.

---

#### Scope — Files Allowed to Change

| File | Action |
|---|---|
| `docker-compose.dev.yml` | CREATE at monorepo root |
| `apps/backend/Dockerfile.dev` | CREATE — development Dockerfile for the backend container image |
| `scripts/start-dev.sh` | MODIFY — replace native postgres check and backend nohup block with docker compose up |
| `scripts/stop-dev.sh` | MODIFY — add docker compose down for backend and postgres teardown |
| `.env.example` | MODIFY — add Docker Compose DATABASE_URL hostname note to the Database section |

#### Files FORBIDDEN to Change

Any file not in the Allowed list above is implicitly forbidden. The following are explicitly called out:
- `scripts/env-check.sh` — already validates the vars Docker Compose will use; no changes needed
- `scripts/health-check.sh` — endpoints are unchanged; no changes needed
- `apps/backend/medusa-config.ts`, `apps/backend/package.json`, any `apps/backend/src/` file — no Medusa source changes
- `apps/backend/.env` — human-provisioned; executor must NOT read or write this file
- `apps/storefront/` — no storefront changes of any kind
- `docs/project-kb/*`
- `CLAUDE.md`, `turbo.json`, root `package.json`

#### FORBIDDEN BEHAVIORS (regardless of files)
- Adding any npm dependency not listed in this brief
- Containerizing or modifying the storefront in any way
- Writing a production Dockerfile or multi-stage build
- Writing any credential or real secret value into any tracked file
- Closing, reclassifying, or editing ENV-2, ENV-3, or CHORE-2 in any document — that is Claude's action after review
- Silently resolving any ambiguity — escalate instead

---

#### Implementation Steps

Read all Allowed Files before writing any code. Then:

**Step 1 — Create `docker-compose.dev.yml`**

Create at monorepo root with this exact structure:

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: sama_link_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 10

  backend:
    build:
      context: apps/backend
      dockerfile: Dockerfile.dev
    restart: unless-stopped
    env_file:
      - apps/backend/.env
    ports:
      - "9000:9000"
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
```

**Step 2 — Create `apps/backend/Dockerfile.dev`**

A container has a flat, isolated `node_modules` — the tsconfig-paths crash does not occur here:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 9000

CMD ["npx", "medusa", "develop"]
```

**Step 3 — Modify `scripts/start-dev.sh`**

Read the current file first. Make the following targeted changes only:

- Remove the `if ! (echo >/dev/tcp/localhost/5432)` block — Docker Compose manages postgres; native connectivity check is no longer needed
- Remove the backend `nohup bash -lc "cd … && exec npm run dev"` block and the `echo "backend:${backend_pid}" >> "${PID_FILE}"` line that follows — Docker manages the backend process and PID
- In their place, insert: `docker compose -f docker-compose.dev.yml up -d --build`
- Leave the storefront `nohup` launch block unchanged
- Leave the backend health check loop (`curl` to `localhost:9000/health`) unchanged — Docker exposes port 9000 on the host
- Leave `.dev.pids` tracking unchanged — it will now record only the storefront PID

**Step 4 — Modify `scripts/stop-dev.sh`**

Read the current file first. Make the following targeted change only:

- Before the PID-file loop, insert: `docker compose -f docker-compose.dev.yml down`
- Leave the PID-file loop unchanged — it will find only the storefront entry and handle a missing backend entry gracefully (it already skips entries where the process is not running)

**Step 5 — Modify `.env.example`**

Read the current file first. In the `# --- Database (PostgreSQL) ---` section, replace the existing DATABASE_URL line and its comment with:

```
# --- Database (PostgreSQL) ---
# Docker Compose local dev (hostname = docker service name, not localhost):
#   DATABASE_URL=postgres://postgres:postgres@postgres:5432/sama_link_db
# Native PostgreSQL local dev:
DATABASE_URL=postgres://user:password@localhost:5432/sama_link_db
```

**Step 6 — Verify**

Run in order. Stop and report if any step fails before proceeding to the next.

1. Check `apps/backend/.env` — if `DATABASE_URL` still uses `localhost` as hostname, report this as a required human action and do not modify the file. Proceed with verification steps anyway; report the hostname mismatch in the Output Report.
2. `docker compose -f docker-compose.dev.yml up -d --build` — both services must start without error
3. `curl -s -o /dev/null -w "%{http_code}" http://localhost:9000/health` — must return `200`
4. `bash scripts/health-check.sh` — must exit 0
5. `bash scripts/stop-dev.sh` — must terminate cleanly
6. `bash scripts/start-dev.sh` — run end-to-end from a clean state; must exit 0

---

#### Acceptance Criteria

Each criterion must be verified by the executor before reporting done.

- [ ] `docker-compose.dev.yml` exists at monorepo root; contains `postgres` and `backend` services and `postgres_data` named volume
- [ ] `apps/backend/Dockerfile.dev` exists; `docker compose -f docker-compose.dev.yml build` completes without error
- [ ] `docker compose -f docker-compose.dev.yml up -d` starts both services
- [ ] `curl http://localhost:9000/health` returns HTTP 200 after compose up
- [ ] `bash scripts/health-check.sh` exits 0 (all three services reported UP)
- [ ] `bash scripts/stop-dev.sh` runs without error; containers are stopped after it completes
- [ ] `bash scripts/start-dev.sh` exits 0 after the full end-to-end sequence
- [ ] Storefront at `localhost:3000` is unaffected — still starts and serves natively
- [ ] No credential or secret value appears in `docker-compose.dev.yml`
- [ ] `.env.example` Docker hostname note is present in the Database section
- [ ] No file outside the Allowed list was modified

#### AMBIGUITY ESCALATION PROTOCOL

Stop and report to Claude before proceeding if any of the following arise:
- `apps/backend/.env` does not exist — executor cannot verify DATABASE_URL hostname
- The `docker compose up` command fails with an error not explained by DATABASE_URL hostname — report the full error output
- `apps/backend/package.json` does not have a `medusa` bin resolvable by `npx medusa develop` inside the container
- Any implementation step has two or more valid interpretations
- A file not on the Allowed list appears necessary to complete a step

Report format: `BLOCKED: [what is ambiguous or missing]. Awaiting clarification.`

#### Out of Scope
- Do not fix CHORE-2 in the native execution path — Docker Compose replaces that path
- Do not containerize the storefront
- Do not write a production Dockerfile or multi-stage build
- Do not modify `medusa-config.ts`, migrations, seed scripts, or any other backend source file
- Do not close or reclassify ENV-2, ENV-3, or CHORE-2 in any document

#### Notes / Constraints
- ADR-033: DATABASE_URL inside the backend container must use hostname `postgres` (the Docker service name), not `localhost`. The human must update `apps/backend/.env` before the backend container can connect to postgres. If it has not been updated, report this in the Output Report — do not block verification of the other deliverables.
- ADR-026: `.dev.pids` must remain in `.gitignore`. Do not commit it.
- The `postgres_data` named volume persists database state across `docker compose down/up` cycles. A `docker compose down --volumes` is required to reset it.

---

#### Output Report (required when task is complete)

**Files modified:** [list]
**Files created:** [list or "none"]
**Dependencies added:** [list or "none"]
**Acceptance criteria:** [pass/fail per criterion above]
**Build status:** tsc: N/A | next build: N/A
**DATABASE_URL hostname status:** [correct (postgres) / still localhost — human action required / could not verify]
**Scope violations:** [none / describe if any]
**Blockers encountered:** [none / describe]

---

- [x] `ENV-5`: Diagnose and fix Docker backend-to-postgres connectivity — DATABASE_URL override applied, KnexTimeoutError resolved. Migration schema initialisation tracked as ENV-6. Formally closed 2026-04-12.

---

#### TASK ENV-5: Diagnose and Fix Docker Backend-to-Postgres Connectivity

**Version:** Brief V2
**Phase:** Phase 2 — Commerce Backend Integration
**Target Executor:** Backend Specialist
**Branch:** `feature/back-1-medusa-init`
**Depends on:** ENV-4 [~] (all file deliverables complete; containers start; hostname is `postgres`)
**Estimated scope:** 0–1 files to modify (`docker-compose.dev.yml` if fix is required)

---

#### REQUIRED READING
Read in order before running any command. Layer [5] marks the sequencing gate.

**[1] Project Context**
- `docs/project-kb/definition/architecture.md` — Backend Secrets boundary rule: `apps/backend/.env` is human-provisioned; executor must not modify it

**[2] Task State**
- `docs/project-kb/operations/tasks.md` — ENV-4 [~]: file deliverables complete, containers start, hostname is `postgres`, KnexTimeoutError persists; CHORE-2 [~] and ENV-3 [~] remain open and are not in scope here
- `docs/project-kb/operations/roadmap.md` — Phase 2 active; backend `/health` → 200 is a Phase 2 exit dependency

**[3] Role Contract**
- `docs/project-kb/governance/actors/backend-specialist-contract.md`

**[4] Governing Rules & ADRs**
- `docs/project-kb/governance/development-rules.md` — secrets discipline: executor must not modify `apps/backend/.env` or embed real credentials in any tracked file
- ADR-026: Local Environment Ownership Model — executors may modify `scripts/` and `docker-compose.dev.yml`; may not modify real `.env` values
- ADR-033: Docker Compose Runtime Model — `docker-compose.dev.yml` is the canonical local runtime definition; modifications to it are within executor scope

**[5] This Brief**
Proceed to Goal and Implementation Steps only after [1]–[4] are read.

---

#### INTERPRETATION MODE
Analytical-Literal. Scope is fixed by this brief. The diagnostic sequence must be followed in order before any fix is applied. Document all diagnostic findings in the Output Report regardless of whether a fix was applied.

---

#### Goal
Identify the exact reason Knex cannot connect to the postgres container despite the DATABASE_URL hostname being `postgres`, apply the bounded fix, and confirm `bash scripts/health-check.sh` exits 0.

#### Context
ENV-4 deliverables are complete. `docker compose up` passes, both containers start, `stop-dev.sh` passes, storefront is healthy. The backend logs `KnexTimeoutError: SELECT 1` and `Pg connection failed to connect to the database. Retrying...` continuously. `curl /health` returns `(52) Empty reply from server` — Medusa is alive but cannot serve HTTP because no DB connection can be established. The DATABASE_URL hostname has been confirmed as `postgres` (not `localhost`). The most likely causes, in order of probability: (1) SSL/TLS parameters in DATABASE_URL from the prior Neon cloud setup — local Docker postgres does not have SSL enabled; (2) credential mismatch between DATABASE_URL password and the `POSTGRES_PASSWORD` the postgres container was initialised with; (3) database name mismatch. The diagnostic sequence below isolates the root cause before any fix is applied.

---

#### Scope — Files Allowed to Change

| File | Action |
|---|---|
| `docker-compose.dev.yml` | MODIFY if and only if the diagnostic confirms an SSL parameter issue — add a `DATABASE_URL` environment override for the backend service |

#### Files FORBIDDEN to Change
- `apps/backend/.env` — human-provisioned; executor must NOT read the value of any secret or modify this file
- `apps/backend/Dockerfile.dev` — no container image changes
- `scripts/*` — no script changes
- `apps/backend/src/*`, `apps/backend/medusa-config.ts`, `apps/backend/package.json`
- `docs/project-kb/*`, `CLAUDE.md`, `turbo.json`, root `package.json`

#### FORBIDDEN BEHAVIORS (regardless of files)
- Reading, printing, or logging the actual password from `apps/backend/.env` — mask it in all diagnostic output
- Embedding any real credential in `docker-compose.dev.yml`
- Modifying `docker-compose.dev.yml` before completing the diagnostic sequence
- Silently resolving any failure — report every diagnostic result verbatim

---

#### Implementation Steps

**Step 1 — Confirm containers are up and postgres is healthy**

```bash
docker compose -f docker-compose.dev.yml ps
```

Confirm: postgres service shows status `healthy`. Backend service shows status `running` or `restarting`. If postgres is NOT healthy, stop and report — the postgres container itself has a problem unrelated to DATABASE_URL.

**Step 2 — Reveal DATABASE_URL structure (password masked)**

```bash
docker compose -f docker-compose.dev.yml exec backend sh -c \
  "echo \$DATABASE_URL | sed 's|:[^:/@]*@|:***@|'"
```

This prints the DATABASE_URL the backend container is actually using, with the password replaced by `***`. Record the full output — protocol, username, hostname, port, database name, and any query parameters (e.g., `?sslmode=require`, `?ssl=true`, `?connection_limit=`). These parameters are the diagnostic target.

**Step 3 — Test TCP connectivity to postgres from inside the backend container**

```bash
docker compose -f docker-compose.dev.yml exec backend sh -c \
  "node -e \"require('net').connect({host:'postgres',port:5432}).on('connect',function(){console.log('TCP OK');process.exit(0)}).on('error',function(e){console.log('TCP FAIL:',e.message);process.exit(1)})\""
```

If `TCP FAIL`: Docker inter-container networking is broken. Stop and report — this is a Docker configuration issue outside the scope of this brief.

If `TCP OK`: proceed to Step 4.

**Step 4 — Test a direct postgres connection with known-good local credentials**

```bash
docker compose -f docker-compose.dev.yml exec backend sh -c \
  "node -e \"const {Pool}=require('pg');new Pool({host:'postgres',port:5432,user:'postgres',password:'postgres',database:'sama_link_db',ssl:false}).query('SELECT 1').then(()=>{console.log('CONNECT OK');process.exit(0)}).catch(e=>{console.log('CONNECT FAIL:',e.message);process.exit(1)})\""
```

This bypasses DATABASE_URL entirely and tests with the hardcoded Docker compose credentials (`postgres`/`postgres`) and `ssl:false`.

- If `CONNECT OK`: the problem is in DATABASE_URL — either wrong credentials (different password than `postgres`) or SSL parameters. Cross-reference with Step 2 output to determine which.
- If `CONNECT FAIL` with an auth error: credentials in DATABASE_URL do not match `postgres`/`postgres` — this is a human-only fix (update `apps/backend/.env`). Stop and report.
- If `CONNECT FAIL` with a non-auth error: report the full error message.

**Step 5 — Apply fix (only if Step 4 was `CONNECT OK` and Step 2 shows SSL parameters)**

If Step 4 passes and Step 2 output shows SSL parameters (e.g., `?sslmode=require`, `?ssl=true`, or similar) in DATABASE_URL, the fix is to override DATABASE_URL for the Docker context in `docker-compose.dev.yml`.

Read `docker-compose.dev.yml` first. In the `backend` service block, add an `environment` section after `env_file` that overrides DATABASE_URL with a clean local connection string:

```yaml
  backend:
    build:
      context: apps/backend
      dockerfile: Dockerfile.dev
    restart: unless-stopped
    env_file:
      - apps/backend/.env
    environment:
      DATABASE_URL: "postgres://postgres:postgres@postgres:5432/sama_link_db"
    ports:
      - "9000:9000"
    depends_on:
      postgres:
        condition: service_healthy
```

The `environment` block takes precedence over `env_file` for the same key. The credentials used (`postgres`/`postgres`) match `POSTGRES_USER` and `POSTGRES_PASSWORD` already declared in the compose file — no new secret is introduced.

**Step 6 — Verify after fix**

```bash
docker compose -f docker-compose.dev.yml down --volumes
docker compose -f docker-compose.dev.yml up -d --build
```

Wait up to 120 seconds for `curl -s -o /dev/null -w "%{http_code}" http://localhost:9000/health` to return `200`.

Then:
```bash
bash scripts/health-check.sh
```

Must exit 0.

---

#### Acceptance Criteria

- [ ] Step 1: postgres container is healthy
- [ ] Step 2: DATABASE_URL structure recorded in Output Report (password masked)
- [ ] Step 3: TCP connectivity to postgres confirmed OK from inside backend container
- [ ] Step 4: direct connection test result recorded (OK / FAIL with reason)
- [ ] If fix applied — `docker-compose.dev.yml` `environment.DATABASE_URL` override is present
- [ ] `curl http://localhost:9000/health` returns HTTP 200
- [ ] `bash scripts/health-check.sh` exits 0 (all three services UP)
- [ ] No file outside the Allowed list was modified
- [ ] No credential value appears in the Output Report (password always masked)

#### AMBIGUITY ESCALATION PROTOCOL

Stop and report to Claude before proceeding if any of the following arise:
- Step 1: postgres container is NOT healthy — report `docker compose ps` and `docker compose logs postgres --tail=30`
- Step 3: TCP FAIL — report the full error; this is a Docker networking issue outside this brief's scope
- Step 4: CONNECT FAIL with an auth error — the credential in DATABASE_URL does not match the Docker postgres; this is a human-only fix; report the exact error
- Step 4: CONNECT OK but Step 2 shows no SSL parameters and DATABASE_URL credentials appear to match — root cause is unknown; report all diagnostic output for Claude to assess
- Step 5: `docker-compose.dev.yml` already has an `environment` block — report existing content before modifying

Report format: `BLOCKED: [diagnostic step that failed, full output with passwords masked]. Awaiting clarification.`

#### Out of Scope
- Do not modify `apps/backend/.env`
- Do not fix CHORE-2 or ENV-2 or ENV-3
- Do not containerize the storefront
- Do not make any change to `Dockerfile.dev` or backend source files
- Do not close or reclassify ENV-4, CHORE-2, or ENV-3 — that is Claude's action after review

#### Notes / Constraints
- The `environment` override in Step 5 uses `postgres`/`postgres` credentials — these match `POSTGRES_USER` and `POSTGRES_PASSWORD` already visible in `docker-compose.dev.yml`. This is not a new secret.
- The `--volumes` flag in Step 6 resets the postgres data volume. This destroys local dev data. Correct for this verification context.
- ADR-033 Consequences: once ENV-5 passes, Claude will reclassify ENV-2, ENV-3, and CHORE-2 as Superseded. This is not the executor's action.

---

#### Output Report (required when task is complete)

**Files modified:** [list or "none"]
**Files created:** none
**Step 2 — DATABASE_URL structure (password masked):** [paste output]
**Step 3 — TCP connectivity:** [OK / FAIL: error message]
**Step 4 — Direct connection test:** [OK / FAIL: error message]
**Root cause identified:** [SSL parameters / credential mismatch / unknown — describe]
**Fix applied:** [yes — environment override added to docker-compose.dev.yml / no — escalated]
**curl /health after fix:** [HTTP 200 / other]
**scripts/health-check.sh exit code:** [0 / non-zero]
**Acceptance criteria:** [pass/fail per criterion above]
**Scope violations:** [none / describe]
**Blockers encountered:** [none / describe with full output, passwords masked]

---

- [x] `ENV-6`: Run Medusa DB migrations inside Docker runtime — `Dockerfile.dev` CMD updated to `npx medusa db:migrate && npx medusa develop`. SSL blocker (`The server does not support SSL connections`) resolved by ENV-7. All Medusa module migrations confirmed complete. Formally closed 2026-04-12.
- [x] `ENV-7`: Resolve SSL startup failure — three-layer fix applied on branch `fix/env-backend-ssl-startup` (merged to `feature/back-1-medusa-init`, commit `c32d45c`): (1) `PGSSLMODE: disable` added to docker-compose backend environment; (2) `?sslmode=disable` appended to DATABASE_URL in docker-compose; (3) `databaseDriverOptions: { connection: { ssl: false } }` added to `medusa-config.ts` for local env. Migrations run clean, `GET /health` → 200, seed completed. Formally closed 2026-04-12.

---

#### TASK ENV-6: Run Medusa DB Migrations in Docker Runtime

**Version:** Brief V2
**Phase:** Phase 2 — Commerce Backend Integration
**Target Executor:** Backend Specialist
**Branch:** `feature/back-1-medusa-init`
**Depends on:** ENV-5 [~] (Docker connectivity resolved; DATABASE_URL override in place)
**Estimated scope:** 1 file to modify

---

#### REQUIRED READING
Read in order before writing any code. Layer [5] marks the sequencing gate.

**[1] Project Context**
- `docs/project-kb/definition/architecture.md` — backend boundary is `apps/backend/`; no storefront changes

**[2] Task State**
- `docs/project-kb/operations/tasks.md` — ENV-5 [~]: connectivity fixed, migration blocker remains; this task resolves it

**[3] Role Contract**
- `docs/project-kb/governance/actors/backend-specialist-contract.md`

**[4] Governing Rules & ADRs**
- ADR-018: Adopt > Extend > Rebuild — use Medusa's built-in `db:migrate` command; do not write custom migration logic
- ADR-033: Docker Compose Runtime Model — `Dockerfile.dev` is within executor scope

**[5] This Brief**
Proceed to Goal and Implementation Steps only after [1]–[4] are read.

---

#### INTERPRETATION MODE
Analytical-Literal. One file changes. Every gap is an escalation trigger.

---

#### Goal
Ensure Medusa DB migrations run automatically before the backend server starts inside the Docker container, so the schema is always initialised on a fresh volume.

#### Context
After `docker compose down --volumes`, the postgres data volume is empty. Medusa requires its schema to exist before the server can start — tables like `tax_provider` and `payment_provider` are created by migrations. The current `Dockerfile.dev` CMD starts the server directly without running migrations first. The fix is to run `medusa db:migrate` before `medusa develop` in the container startup command.

---

#### Scope — Files Allowed to Change

| File | Action |
|---|---|
| `apps/backend/Dockerfile.dev` | MODIFY — update CMD to run migrations before server start |

#### Files FORBIDDEN to Change
- `docker-compose.dev.yml` — no changes; override already in place
- `apps/backend/src/*`, `apps/backend/medusa-config.ts`, `apps/backend/package.json`
- `scripts/*`, `docs/project-kb/*`, `CLAUDE.md`, `turbo.json`, root `package.json`

#### FORBIDDEN BEHAVIORS (regardless of files)
- Writing custom migration scripts or SQL
- Modifying any Medusa source file
- Silently resolving any failure — report verbatim

---

#### Implementation Steps

**Step 1 — Update `apps/backend/Dockerfile.dev`**

Read the current file. Replace the `CMD` line with a shell form that runs migrations then starts the server:

```dockerfile
CMD ["sh", "-c", "npx medusa db:migrate && npx medusa develop"]
```

The full file after the change:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 9000

CMD ["sh", "-c", "npx medusa db:migrate && npx medusa develop"]
```

**Step 2 — Rebuild and bring up the stack**

```bash
docker compose -f docker-compose.dev.yml down --volumes
docker compose -f docker-compose.dev.yml up -d --build
```

**Step 3 — Wait for backend health**

Poll `curl -s -o /dev/null -w "%{http_code}" http://localhost:9000/health` every 15 seconds for up to 180 seconds. Migrations run at startup and may take longer than a normal boot. Must return `200`.

If it does not return `200` within 180 seconds, run:
```bash
docker compose -f docker-compose.dev.yml logs backend --tail=50
```
Include the output in the Output Report and report as BLOCKED.

**Step 4 — Run health check**

```bash
bash scripts/health-check.sh
```

Must exit 0.

---

#### Acceptance Criteria

- [ ] `apps/backend/Dockerfile.dev` CMD runs `db:migrate && medusa develop`
- [ ] `docker compose -f docker-compose.dev.yml up -d --build` completes without error
- [ ] `curl http://localhost:9000/health` returns HTTP 200
- [ ] `bash scripts/health-check.sh` exits 0 (all three services UP)
- [ ] No file outside the Allowed list was modified

#### AMBIGUITY ESCALATION PROTOCOL

Stop and report to Claude before proceeding if:
- `db:migrate` exits non-zero — report the full migration error output
- Backend logs show a new error class after migrations complete (not the `relation does not exist` error)
- `npx medusa db:migrate` is not a recognised command in the container — report the error

Report format: `BLOCKED: [step, full output]. Awaiting clarification.`

#### Out of Scope
- Do not modify `docker-compose.dev.yml`
- Do not write SQL or custom migration files
- Do not touch native runtime files or CHORE-2
- Do not close or reclassify ENV-4, ENV-5, CHORE-2, ENV-2, or ENV-3 — that is Claude's action after review

#### Notes / Constraints
- The `--volumes` flag in Step 2 is intentional for a clean verification. After ENV-6 passes, normal workflow uses `down` without `--volumes` to preserve data between sessions.
- Migration runtime inside the container may be 30–90 seconds depending on the number of Medusa core migrations. The 180-second polling window accounts for this.

---

#### Output Report (required when task is complete)

**Files modified:** [list]
**Files created:** none
**db:migrate output (last 10 lines):** [paste]
**curl /health:** [HTTP 200 / other]
**scripts/health-check.sh exit code:** [0 / non-zero]
**Acceptance criteria:** [pass/fail per criterion above]
**Scope violations:** [none / describe]
**Blockers encountered:** [none / describe with full output]

---

- [ ] `OPS-1`: CI Pipeline Setup
  - Typecheck (`tsc --noEmit`), build (Next.js), lint (if configured)
  - Must run on every PR against `develop`
  - _Prerequisite for reliable Phase 2 backend merges_

- [ ] `OPS-2`: Environment Strategy
  - Define dev / staging / production environments
  - Document all required env variables for backend + storefront
  - Ensure `.env.example` is complete and accurate
  - _Prerequisite for safe BACK-1 through BACK-6 execution_

- [ ] `DOC-1`: README Update
  - _Depends on: BACK-1_
  - Reflect current architecture (storefront + upcoming backend)
  - Add local setup instructions (Node, PostgreSQL, env vars)
  - Document branching workflow (`develop` → feature branch → PR)

- [ ] `SEC-1`: Backend Security Baseline (Phase 2)
  - Secrets management review (env var audit, `.env.example` completeness)
  - CORS policy definition (environment-specific allowed origins)
  - Basic rate limiting plan (auth endpoints, cart endpoints)
  - Webhook signature verification design (Stripe-ready, verify on every call)
  - _This is a planning + documentation task — implementation follows in relevant BACK tasks_

- [ ] `SEO-3`: Structured Data — JSON-LD (Phase 3 candidate)
  - Product schema (`@type: Product`, Offer, price, availability)
  - Breadcrumb schema on collection + product pages
  - _Not started in Phase 2 — data foundation must be confirmed in BACK-5 first_

---

## Phase 3 — Product Catalog

### Completed

- [x] `CAT-1`: Product detail page + product card link wiring
  - _Reviewed and closed 2026-04-12. Created `apps/storefront/app/[locale]/(storefront)/products/[handle]/page.tsx`: async Server Component, `cache(getProductByHandle)`, `notFound()` on missing product, variant list with guarded `Intl.NumberFormat` price (no extra API calls), `generateMetadata`, `revalidate = 3600`, all `@theme` tokens. Updated `ProductCard` to `async`, `getLocale()` from next-intl/server, conditional `<Link>` wrapper with `group-hover:shadow-md`. `lib/medusa-client.ts` and home `page.tsx` untouched. `tsc --noEmit` exit 0. Known debt: "Variants" heading on detail page is hardcoded English — i18n key deferred to Phase 7._

### Active

- [ ] `CAT-2`: Product listing page (`/[locale]/products`) — pagination, basic filter, nav link wiring

## LATER — Phases 4–8

See `docs/project-kb/operations/roadmap.md` for scope. Tasks broken out when phase becomes active.

---

## Known Follow-ups

- **Operational note (I18N-7):** After route restructuring, `tsc --noEmit` may fail due to stale `.next/types` references. Fix: delete `apps/storefront/.next/` then run `next build`. Standard Next.js behavior — not a code defect.
- **Copy note (LAYOUT-4):** ✅ Resolved by `COPY-1` — `not-found.tsx` now uses `errors.notFoundTitle`, `errors.notFoundDescription`, `errors.goHome`.
- [ ] `FIX-1`: Fix middleware deprecation warning — Warning: `"The 'middleware' file convention is deprecated. Please use 'proxy' instead."` Persists after I18N-5 plugin wiring — confirmed not a next-intl issue. This is a Next.js 16 convention change. Fix: rename `apps/storefront/middleware.ts` → `apps/storefront/proxy.ts` (or follow Next.js 16 docs for the new convention). Build passes with warning. Low priority — address after I18N-8.

- [x] `ENV-DEBT-1`: Environment baseline debt — formally closed 2026-04-12. ENV-2, ENV-3, CHORE-2 reclassified as superseded above. `docker-compose.dev.yml` DATABASE_URL override with `?sslmode=disable` is now the canonical local config (not a workaround). Docker Compose path confirmed operational end-to-end.

- [x] `CHORE-2`: Resolve backend startup invocation defect — **superseded and formally closed 2026-04-12.** Docker Compose runtime (ADR-033) replaced the native TypeScript toolchain path entirely. The `tsconfig-paths` crash in the native path is no longer relevant. Original failure: `tsconfig-paths` crashes at startup with `TypeError: The "path" argument must be of type string. Received undefined` at `tsconfig-paths/src/config-loader.ts:52` → `tsconfig-paths/src/register.ts:53` → `@medusajs/cli/cli.js:5`. Three sequential fixes applied (dev script, ts-node hoisting, @medusajs/medusa hoisting) — each resolved a distinct error layer but exposed the next.
  - **Fix 1 (done):** `apps/backend/package.json` dev script changed from hardcoded `node … @medusajs/cli/cli.js develop` to `medusa develop`.
  - **Fix 2 (done):** `ts-node@^10.9.2` added to root `package.json` devDependencies + `npm install` at root. Resolved `Cannot find module 'apps/backend/medusa-config'`.
  - **Fix 3 (done):** `@medusajs/medusa@2.13.1` added to root `package.json` devDependencies + `npm install`. Resolved `Cannot find module '@medusajs/medusa/file-local'` — confirmed via `require.resolve` from framework context.
  - **Current blocker (unresolved):** `tsconfig-paths` crashes at startup with `TypeError: The "path" argument must be of type string. Received undefined` at `tsconfig-paths/src/config-loader.ts:52` → `tsconfig-paths/src/register.ts:53` → `@medusajs/cli/cli.js:5`. The warning `ts-node cannot be loaded and used` also appears before the crash. The `tsconfig-paths` package IS present in root `node_modules` (PRESENT confirmed). The crash is in the `register({})` call — `tsconfig-paths` receives empty options and cannot resolve the tsconfig path. Backend does not start. This is the active blocking defect.
  - **Backend health status:** NOT healthy. `/health` endpoint never reached.
  - _Human prerequisite still open: `apps/backend/.env` DATABASE_URL password mismatch with local PostgreSQL `postgres` user — human-only fix, not yet confirmed resolved._
  - _Target Executor: Codex (Advanced Executor)_

---

## Backlog / Ideas

- Product reviews and ratings
- Wishlist / save for later
- Recently viewed products
- WhatsApp contact integration
- Multi-currency
- Loyalty / rewards program
