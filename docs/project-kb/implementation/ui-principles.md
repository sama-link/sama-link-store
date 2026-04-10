# UI Principles — Sama Link Store

## Design Philosophy

- **Customer-first:** Every UI decision should make the shopping experience clearer, faster, and more trustworthy.
- **Performance is UX:** Slow pages are broken pages. Optimize images, minimize JS, use skeleton loaders.
- **Accessible by default:** WCAG AA compliance is the baseline, not a stretch goal.
- **RTL-native:** Arabic is the primary language. RTL is not an afterthought — test it on every new component.
- **Consistent, not rigid:** Use the design system, but solve real problems rather than forcing patterns.

---

## Component Hierarchy

```
packages/ui/           ← Primitive components (Button, Input, Card, Badge...)
apps/storefront/
  components/
    layout/            ← Header, Footer, Navigation
    product/           ← ProductCard, ProductGallery, VariantSelector
    cart/              ← CartDrawer, CartItem, CartSummary
    checkout/          ← CheckoutStep, AddressForm, PaymentForm
    account/           ← OrderHistory, AddressBook
    shared/            ← Breadcrumbs, Pagination, EmptyState, LoadingSpinner
```

Rules:
- `packages/ui` components are generic — no business logic, no API calls
- `components/` in apps compose primitives + business context
- No inline styles — Tailwind only
- No component should exceed ~150 lines without a strong reason

---

## Tailwind Usage

- Use Tailwind utility classes directly — no custom CSS unless absolutely necessary
- Extract repeated patterns with `@apply` sparingly (prefer component abstraction instead)
- Use `cn()` helper (clsx + tailwind-merge) for conditional class composition
- Configure Tailwind `content` to include `packages/ui/src/**`

### RTL Support

Use **logical CSS properties** everywhere:

```tsx
// Instead of:         Use:
ml-4                → ms-4   (margin-start)
mr-4                → me-4   (margin-end)
pl-4                → ps-4   (padding-start)
text-left           → text-start
rounded-l-md        → rounded-s-md
```

This automatically flips for RTL when `dir="rtl"` is set on `<html>`.

---

## Accessibility (a11y)

- All interactive elements reachable by keyboard (`Tab`, `Enter`, `Space`, `Esc`)
- All images have descriptive `alt` text
- Color contrast: 4.5:1 minimum for text (WCAG AA)
- Form inputs have associated `<label>` elements
- Error messages are associated with their input (`aria-describedby`)
- Modals trap focus and restore focus on close
- Loading states communicated via `aria-live` regions
- Use semantic HTML: `<button>` for actions, `<a>` for navigation, `<nav>`, `<main>`, etc.

---

## Responsive Design

- Mobile-first: base styles for mobile, `md:` and `lg:` for larger screens
- Breakpoints: follow Tailwind defaults (sm: 640, md: 768, lg: 1024, xl: 1280)
- Product grid: 1 col mobile → 2 col tablet → 3–4 col desktop
- Navigation: hamburger menu on mobile, full nav on desktop
- Cart: drawer on desktop, full page on mobile

---

## Image Handling

- Always use `next/image` for product images
- Always specify `width` and `height` (or `fill` with a sized container) — prevents CLS
- Use `priority` on above-the-fold images (hero, first product in list)
- `alt` text: describe the product, not "image of product"
- Lazy load below-the-fold images (default for `next/image`)

---

## Loading States

- Use skeleton loaders (not spinners) for content-heavy areas (product grid, product detail)
- Use spinners for button actions (add to cart, submit form)
- Never show a blank page while loading — always show a skeleton
- Next.js `loading.tsx` for route-level skeletons

---

## Empty States

Every list or data view needs an empty state:
- Cart: "Your cart is empty" + CTA to shop
- Order history: "No orders yet" + CTA to shop
- Search results: "No results for X" + suggestions

---

## Localization in UI

- Never hard-code strings in components — always use the i18n translation function
- Arabic numbers vs Western numbers: use locale-aware `Intl.NumberFormat`
- Currency formatting: use `Intl.NumberFormat` with currency
- Date formatting: use `Intl.DateTimeFormat` with locale

```typescript
// Good
const price = new Intl.NumberFormat(locale, {
  style: 'currency',
  currency: 'SAR',
}).format(amount / 100)
```
