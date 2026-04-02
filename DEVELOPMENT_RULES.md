# Development Rules — Sama Link Store

These rules apply to all development sessions, all contributors, and all future AI-assisted coding sessions.

---

## 1. General Principles

- **Clean architecture over shortcuts.** Structure first, then code.
- **Type safety everywhere.** TypeScript strict mode. No `any` without a justified comment.
- **Read before you write.** Always inspect existing code before modifying it.
- **Minimal surface area.** Don't add what isn't needed yet.
- **One concern per module.** Files should have a single, clear purpose.
- **Document your decisions.** Every non-obvious choice belongs in DECISIONS.md.

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
- Every architectural decision goes in `DECISIONS.md`.
- When a phase milestone is reached, update `ROADMAP.md` and `TASKS.md`.
- The `SESSION_GUIDE.md` should be reviewed at the start of every development session.

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

## 12. Performance Targets (Storefront)

- Lighthouse score: 90+ on Performance, SEO, Accessibility (product listing + detail pages)
- LCP < 2.5s on mobile
- CLS < 0.1
- Use `next/image` for all product images
- Avoid large client-side bundles — keep `"use client"` components lean
- Use ISR (Incremental Static Regeneration) for product and collection pages
