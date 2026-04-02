# SEO & AI-Readability Guidelines — Sama Link Store

## SEO Philosophy

SEO is a first-class concern, not an afterthought. Every page that can be indexed should be optimized from the moment it's built.

The storefront uses Next.js App Router, which provides `generateMetadata` for per-page SEO — use it on every public page.

---

## Metadata Strategy

### Every page must have:
- `title` — descriptive, keyword-aware, under 60 characters
- `description` — compelling summary, 120–160 characters
- `robots` — explicit (`index, follow` or `noindex` where needed)

### Product pages additionally need:
- Open Graph: `og:title`, `og:description`, `og:image`, `og:type: product`
- Twitter card: `twitter:card`, `twitter:title`, `twitter:image`

### Pattern for `generateMetadata`:

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug)
  return {
    title: `${product.title} | Sama Link Store`,
    description: product.description?.slice(0, 155),
    openGraph: {
      title: product.title,
      description: product.description,
      images: [{ url: product.thumbnail, width: 800, height: 600 }],
      type: 'website',
    },
  }
}
```

---

## Structured Data (JSON-LD)

Use JSON-LD `<script>` tags, not microdata. Include on:

| Page | Schema type |
|---|---|
| Product detail | `Product` (with `Offer`, `AggregateRating` if reviews) |
| Product listing / collection | `ItemList` |
| Home | `WebSite`, `Organization` |
| Breadcrumbs | `BreadcrumbList` |
| Order confirmation | `Order` (optional, for AI assistants) |

### Product JSON-LD example:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product Title",
  "description": "Product description...",
  "image": ["https://cdn.example.com/product.jpg"],
  "sku": "PROD-001",
  "brand": { "@type": "Brand", "name": "Sama Link Store" },
  "offers": {
    "@type": "Offer",
    "price": "99.00",
    "priceCurrency": "SAR",
    "availability": "https://schema.org/InStock"
  }
}
```

---

## URL Structure

Clean, semantic, keyword-rich URLs:

```
/[locale]/products/[slug]            ✅ good
/[locale]/collections/[handle]       ✅ good
/[locale]/products?id=123            ❌ avoid
/p/abc123                            ❌ avoid
```

- Use slugs derived from product/collection names
- Locale prefix in URL: `/ar/`, `/en/`
- Canonical URLs must be set, especially for paginated pages
- Avoid trailing slashes inconsistency — pick one and stick to it

---

## Sitemap

- Generate `sitemap.xml` dynamically using Next.js `sitemap.ts` route
- Include: all product pages, all collection pages, static pages
- Exclude: cart, checkout, account pages, 404
- Submit to Google Search Console after launch

---

## Performance as SEO

Google Core Web Vitals directly impact rankings:

- LCP < 2.5s: use ISR, `next/image`, CDN for media
- CLS < 0.1: always specify `width` and `height` on images; avoid layout shifts
- INP < 200ms: minimize client-side JS, avoid heavy third-party scripts

---

## AI Readability

Modern AI assistants (ChatGPT, Perplexity, Google AI Overviews) extract content from structured markup and schema.

To be AI-readable:

1. **Use semantic HTML** — `<article>`, `<section>`, `<nav>`, `<main>`, `<h1>` hierarchy
2. **JSON-LD is machine-readable** — keep it accurate and complete
3. **Product descriptions** should be clear, factual prose — not just a bullet list
4. **Alt text on images** — describe what the image shows
5. **Breadcrumbs** — use `BreadcrumbList` schema
6. **FAQ blocks** on product pages — use `FAQPage` schema when applicable
7. **Avoid content in JS only** — Server Components ensure content is in the HTML

---

## i18n and SEO

- Use `hreflang` tags to signal language alternatives to Google
- Each locale URL should return the correct `lang` attribute on `<html>`
- Arabic pages should have `<html lang="ar" dir="rtl">`
- English pages should have `<html lang="en" dir="ltr">`
- Do not use the same URL for both locales — each must have a unique, indexable URL

---

## Robots.txt

```
User-agent: *
Disallow: /ar/cart
Disallow: /en/cart
Disallow: /ar/checkout
Disallow: /en/checkout
Disallow: /ar/account
Disallow: /en/account
Allow: /

Sitemap: https://www.samalink.store/sitemap.xml
```
