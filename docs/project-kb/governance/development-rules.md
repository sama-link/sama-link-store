# Development Rules — Sama Link Store

These rules apply to all development sessions, all contributors, and all future AI-assisted coding sessions.

---

## 1. General Principles

- **Clean architecture over shortcuts.** Structure first, then code.
- **Type safety everywhere.** TypeScript strict mode. No `any` without a justified comment.
- **Read before you write.** Always inspect existing code before modifying it.
- **Minimal surface area.** Don't add what isn't needed yet.
- **One concern per module.** Files should have a single, clear purpose.
- **Document your decisions.** Every non-obvious choice belongs in docs/project-kb/governance/decisions.md.

---

## 2. Code Quality Standards

- TypeScript strict mode (`"strict": true` in tsconfig)
- No `any` — use `unknown` and narrow, or define proper types
- No unused variables or imports (enforced by ESLint)
- No `console.log` in committed code (use a logger utility)
- Async/await preferred over promise chains
- Error handling must be explicit — never swallow errors silently
- Functions should be small and do one thing

---

## 3. Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `ProductCard.tsx` |
| Files (utilities/hooks) | camelCase | `useCart.ts`, `formatPrice.ts` |
| Files (pages/routes) | Next.js convention | `app/products/[slug]/page.tsx` |
| Components | PascalCase | `function ProductCard()` |
| Hooks | `use` prefix, camelCase | `useCart`, `useProduct` |
| Types/interfaces | PascalCase | `interface Product`, `type CartItem` |
| Enums | PascalCase | `enum OrderStatus` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_CART_ITEMS` |
| Variables/functions | camelCase | `cartTotal`, `fetchProducts()` |
| CSS classes | Tailwind utilities only | No custom CSS unless necessary |
| API route handlers | Next.js convention | `app/api/[route]/route.ts` |

---

## 4. Folder Conventions

```
apps/storefront/
  app/             # Routes only — layouts, pages, loading, error
  components/      # Reusable UI components
    [feature]/     # Feature-grouped (e.g. components/cart/)
  lib/             # Pure utilities, API clients, helpers
  hooks/           # React hooks
  context/         # React context providers
  styles/          # Global styles

packages/types/
  src/             # All type definitions, organized by domain

packages/ui/
  src/
    components/    # Primitive components
    hooks/         # UI-level hooks
```

- Do not put business logic in `components/`
- Do not put UI code in `lib/`
- API clients live in `lib/` and are isolated — one client per external service
- Shared types go in `packages/types`, not inside apps

---

## 5. Component Conventions

- Prefer Server Components in Next.js — use `"use client"` only when necessary
- Components receive data via props — no direct API calls inside components (fetch in page/layout)
- Keep components small — if it's > 150 lines, consider splitting
- Accessibility: all interactive elements must be keyboard-navigable and have accessible labels
- No inline styles — use Tailwind classes
- RTL support: use `dir` attribute and logical CSS properties (`start/end` vs `left/right`)

---

## 6. API Conventions

- All Medusa API calls go through the client in `lib/medusa-client.ts`
- All admin API calls go through `lib/admin-client.ts`
- Never call external APIs directly from components
- API response types must be defined in `packages/types`
- Use typed fetch wrappers — never raw `fetch` with `as any`
- Errors from API calls must be caught and handled gracefully (user-visible error states)

---

## 7. Security Rules

- **Never expose secrets to the client.** All API keys, JWT secrets, payment keys stay server-side.
- `NEXT_PUBLIC_*` env vars are public — treat them as public.
- Validate all user input server-side, even if client-side validation exists.
- Sanitize any user-generated content before rendering.
- Admin routes must be authenticated — never accessible without auth check.
- Stripe webhook signatures must be verified on every webhook.
- HTTP headers: set `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security` in production.
- Cookies: `httpOnly`, `secure`, `sameSite: strict` for session cookies.
- CORS: restrict to known origins in production.
- Dependencies: run `npm audit` before each release. Resolve critical/high vulnerabilities before launch.
- Principle of least privilege: API tokens should have minimum required scopes.

---

## 8. Documentation Rules

- Every new module/package must have a brief header comment explaining its purpose.
- Every non-obvious function must have a JSDoc comment.
- Every architectural decision goes in `docs/project-kb/governance/decisions.md`.
- When a phase milestone is reached, update `docs/project-kb/operations/roadmap.md` and `docs/project-kb/operations/tasks.md`.
- The `CLAUDE.md` should be reviewed at the start of every development session.

---

## 9. Git / Branching / Commit Guidance

### Branch naming

```
feature/<short-description>
fix/<short-description>
chore/<short-description>
docs/<short-description>
refactor/<short-description>
```

### Commit message format (Conventional Commits)

```
<type>(<scope>): <short description>

[optional body]
[optional footer]
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`

Examples:
```
feat(storefront): add product detail page
fix(cart): handle empty cart state correctly
docs(architecture): update deployment diagram
chore(deps): update Medusa to v2.1.0
```

### Workflow

- `main` — production-ready code only
- `develop` — integration branch
- Feature branches cut from `develop`, merge back via PR
- No direct pushes to `main`

---

## 10. Refactoring Rules

- Refactor only what you're actively working with — do not "improve" unrelated code.
- If a refactor is larger than the original task, create a separate task/branch for it.
- Refactoring must not change behavior — cover with tests before refactoring.
- Leave code better than you found it — but scope it.

---

## 11. "Do Not" Rules

- Do NOT add dependencies without checking if the need can be met by existing deps.
- Do NOT commit `.env` files or any file containing real secrets.
- Do NOT use `any` in TypeScript without a `// eslint-disable` comment and justification.
- Do NOT add client-side state management (Redux, Zustand, etc.) before it's clearly needed.
- Do NOT build for hypothetical future requirements — only build what the current phase needs.
- Do NOT skip accessibility in UI work.
- Do NOT hard-code URLs, locale strings, or configuration values — use env vars or config.
- Do NOT put locale strings directly in components — use the i18n system.
- Do NOT merge incomplete features to `main` — use feature flags if necessary.
- Do NOT skip writing types for new data structures.

---

## 13. Design Modification Protocol (ADR-019)

All UI/visual changes must follow this protocol without exception.

### Three-Layer Boundary

**SAFE DESIGN LAYER — always allowed without approval**
- Colors (via `@theme` tokens only)
- Typography (via `@theme` tokens only)
- Spacing, padding, margin (via `@theme` tokens only)
- Borders, border-radius, shadows (via `@theme` tokens only)
- Visual hierarchy adjustments
- Responsive layout tweaks within an existing layout structure

**RESTRICTED LAYER — requires explicit approval before starting**
- Creating new components
- Removing existing components
- Significantly restructuring a page's section composition
- Changing the visual hierarchy in a way that alters content order

**FORBIDDEN LAYER — never touched in a design task, ever**
- Routing or navigation logic
- Data fetching, API calls, server actions
- Auth, cart, or checkout logic
- i18n structure (`i18n/routing.ts`, `i18n/request.ts`, message files)
- `generateMetadata`, SEO tags, canonical links, structured data
- `next.config.ts`, `middleware.ts`, `turbo.json`
- All governance docs (`docs/project-kb/governance/decisions.md`, `docs/project-kb/operations/tasks.md`, `docs/project-kb/operations/roadmap.md`, `CLAUDE.md`, etc.)

### Token Rule (mandatory — zero exceptions)

ALL styling must use `@theme` tokens from `globals.css`.

```
❌ text-[#333]           — hardcoded color
❌ px-[18px]             — hardcoded spacing
❌ font-['Cairo']        — hardcoded font name
❌ className="..."       — arbitrary Tailwind values

✅ text-text-primary     — token reference
✅ px-md                 — token reference
✅ font-arabic           — font token
```

If a required token does not exist → **stop, propose the token, get approval before writing any code**.

### Component Consumption Rule

Components **consume** tokens. They do **not** define styles.

- No color values inside component files
- No spacing values inside component files
- No font names inside component files
- All visual values must be traceable to a `@theme` token

### Pre-Declaration (mandatory before any design task)

Before writing a single line, Cursor must output:

```
DESIGN TASK PRE-DECLARATION
Mode: [SAFE MODE | EXPLORATION MODE]
Files to change: [explicit list]
Visual changes: [what the user will see differently]
Design-only confirmation: [YES — no logic, routing, i18n, or SEO touched]
Will NOT touch: [explicit list of what is out of scope]
```

If this block is missing → task is INVALID. Claude must reject it and request the pre-declaration.

### Design Modes

**SAFE MODE**
- Token changes only
- No layout restructuring
- No new or removed components
- Default mode for all design tasks

**EXPLORATION MODE**
- Layout improvements allowed (within existing page structure)
- Section reordering allowed
- Still no logic, routing, i18n, or SEO touching
- Must be explicitly declared and approved

### Critical UI Boundary — STRICT DESIGN MODE Only

These pages operate under permanent STRICT DESIGN MODE (identical to SAFE MODE — no structural changes, ever):
- Product detail page
- Cart (drawer + page)
- Checkout flow
- Auth pages (login, register, reset)

Rationale: these pages are tied to payment, auth, and order state. Layout changes can break flows invisibly.

### Review Gate (Claude runs after every design task)

Claude validates all of the following before marking a design task done:

- [ ] No forbidden files were modified
- [ ] No logic, routing, or API code was modified
- [ ] All values trace to `@theme` tokens — zero hardcoded values
- [ ] i18n files untouched (unless the task explicitly added new keys)
- [ ] `tsc --noEmit` passes
- [ ] `next build` passes
- [ ] RTL (`/ar`) and LTR (`/en`) both render correctly

If any check fails → task is rejected. A correction brief is issued. The task is not marked done.

---

## 12. Performance Targets (Storefront)

- Lighthouse score: 90+ on Performance, SEO, Accessibility (product listing + detail pages)
- LCP < 2.5s on mobile
- CLS < 0.1
- Use `next/image` for all product images
- Avoid large client-side bundles — keep `"use client"` components lean
- Use ISR (Incremental Static Regeneration) for product and collection pages
