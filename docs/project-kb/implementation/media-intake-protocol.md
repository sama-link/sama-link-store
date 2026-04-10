# Media Intake Protocol — Sama Link Store

Every media asset that enters the repository must pass through this protocol.
No exceptions. Raw source files, uncompressed exports, and uncatalogued assets are not permitted in the repo.

**Status:** Active (ADR-020, 2026-04-03)
**Enforced by:** Claude (review gate) and Cursor (implementation)

---

## 1. Allowed Formats

| Use case | Required format | Notes |
|---|---|---|
| Logos (full lockup, wordmark) | WebP | SVG preferred if source available; PNG only if lossless is critical |
| Icons (standalone mark, UI icons) | SVG | Flat/vector only; complex gradient icons use WebP |
| Product images | WebP | Converted from any source format |
| Hero / banner images | WebP | |
| Open Graph / social share | WebP | 1200×630, max 200 KB |
| Favicon | `.ico` + `favicon.svg` | Both sizes; SVG preferred for modern browsers |
| User-uploaded content (Phase 3+) | WebP (server-side conversion) | Handled by Medusa storage, not this protocol |

**Forbidden in repo:**
- `.png` source exports (unless SVG is unavailable AND lossless is truly required)
- `.jpg` / `.jpeg`
- `.psd`, `.ai`, `.afdesign`, `.sketch`, `.figma` exports
- Uncompressed TIFF, BMP, or raw camera formats
- Any file over 500 KB in `public/` without documented justification in the manifest

---

## 2. Conversion Rules

### PNG → WebP
- Tool: `cwebp`, Squoosh, or Sharp (Node.js)
- Quality: **85** for general use, **90** for hero/prominent branded assets
- Lossless: only for assets where pixel-perfect is required (e.g., diagrams with sharp text)
- Command: `cwebp -q 85 input.png -o output.webp`

### JPEG → WebP
- Tool: same as above
- Quality: **82** for product photography

### PNG with transparency → WebP
- Preserve alpha: `cwebp -q 85 -alpha_q 100 input.png -o output.webp`
- Verify alpha channel is intact after conversion

### Transparent background requirement
- Logo variants intended for use on dark backgrounds MUST have transparent backgrounds (not white canvas)
- If the source PNG has a white canvas, request a re-export from the designer before processing

---

## 3. Compression Rules

| Asset type | Max file size | Minimum dimensions |
|---|---|---|
| Logo — full lockup | 80 KB | 400px wide |
| Logo — icon/mark | 30 KB | 200px wide |
| Open Graph image | 200 KB | 1200×630 |
| Product image | 150 KB | 800px wide |
| Hero/banner | 250 KB | 1440px wide |
| Favicon SVG | 5 KB | — |

If a compressed asset exceeds the limit, reduce quality in 5-point steps until it fits. Document the final quality setting in the manifest.

---

## 4. Naming Convention

**Pattern:** `{project}_{context}_{variant}_{theme}.{ext}`

All lowercase. Hyphens as separators. No spaces, underscores outside of segment boundaries, or camelCase.

| Segment | Values | Examples |
|---|---|---|
| `{project}` | `sama-link` | `sama-link` |
| `{context}` | `logo`, `icon`, `og`, `favicon`, `hero`, `banner` | `logo`, `og` |
| `{variant}` | `horizontal`, `vertical`, `icon`, `wordmark`, `no-tagline` | `horizontal`, `icon` |
| `{theme}` | `light`, `dark`, `mono-light`, `mono-dark` | `light`, `dark` |

**Examples:**
```
sama-link_logo_horizontal_light.webp
sama-link_logo_horizontal_dark.webp
sama-link_logo_horizontal-no-tagline_light.webp
sama-link_logo_vertical_light.webp
sama-link_logo_icon_light.webp
sama-link_logo_icon_dark.webp
sama-link_og_default_light.webp
sama-link_favicon_icon_light.svg
```

**What is forbidden:**
- `logo1.png`, `logo-final-v3.webp`, `NEW_LOGO.PNG`
- Files with spaces: `sama link logo.webp`
- Duplicate names in different folders for the same logical asset

---

## 5. Folder Structure

```
public/
├── brand/
│   ├── logo/           ← all logo variants (WebP)
│   ├── favicon/        ← favicon.ico, favicon.svg, apple-touch-icon.webp
│   ├── og/             ← Open Graph / social share images
│   └── manifest.json   ← asset catalogue (see §7)
├── media/              ← product/content images (Phase 3+, managed by backend)
└── fonts/              ← self-hosted fonts only (currently using next/font; this folder reserved)
```

Raw source files are **never** in any of these directories.
The `sama-link_brand-assets_FULL/` directory at repo root is in `.gitignore` and must never be committed.

---

## 6. Manifest Metadata

Every asset placed in `public/brand/` must have a corresponding entry in `public/brand/manifest.json`.

**Schema:**
```json
{
  "assets": [
    {
      "file": "logo/sama-link_logo_horizontal_light.webp",
      "context": "logo",
      "variant": "horizontal",
      "theme": "light",
      "dimensions": "1200x340",
      "size_kb": 42,
      "quality": 90,
      "source": "sama-link_full-horizontal_primary.png",
      "source_transparent": true,
      "notes": "Primary horizontal lockup with tagline. Used in header (light mode)."
    }
  ]
}
```

Required fields: `file`, `context`, `variant`, `theme`, `dimensions`, `size_kb`, `source`.
Optional: `quality`, `source_transparent`, `notes`.

`source_transparent` must be `true` if the asset has a transparent background. If `false` or absent, the asset must only be used on matching (white/light or dark) backgrounds.

---

## 7. Alt Text, ARIA, and Accessibility Rules

### Logo usage
- When the logo is a link to home: `<Image alt="Sama Link Store" />` — the alt IS the link text
- When the logo is purely decorative (next to visible site name text): `<Image alt="" aria-hidden="true" />`
- Never use `alt="logo"` — this is meaningless to screen readers

### Product images
- Alt text must describe the product, not the image: `alt="Blue linen shirt, size M"` not `alt="Product image"`
- Alt text must be available in both `ar` and `en` from the translation system
- All product images must have non-empty alt text (accessibility rule, also enforced by ADR-016)

### Decorative images
- Background patterns, abstract textures: `alt=""` + `aria-hidden="true"`
- Never omit the `alt` attribute entirely

### Open Graph / meta images
- Set via `generateMetadata` `openGraph.images` — do not use `<Image>` in JSX for these
- Dimensions must be 1200×630 exactly

---

## 8. SEO and Social Asset Rules

- Every page-level OG image lives in `public/brand/og/`
- Default OG image: `sama-link_og_default_light.webp` at 1200×630
- Product OG images: generated dynamically in Phase 3+ via `next/og` or Cloudinary
- Twitter/X card: use `summary_large_image` type; same image as OG
- Favicon: `favicon.ico` at repo root for legacy support; `favicon.svg` preferred; reference both in `<head>` via `app/[locale]/layout.tsx`
- Apple touch icon: `public/brand/favicon/apple-touch-icon.webp` at 180×180

---

## 9. Raw / Source File Rule

**Source files never enter the repository.**

This includes:
- Designer source files (AI, PSD, Sketch, Figma exports, XD)
- Unprocessed raw PNG exports from design tools
- Multi-layer exports, working files
- Any file in `sama-link_brand-assets_FULL/` or any similarly-named directory

These directories are in `.gitignore`. If you are unsure whether a file is a source file or a production-ready asset, apply this test: **if it requires conversion, optimization, or resizing before use in the browser, it is a source file.**

Store source files locally or in a shared drive. Reference the source file in `manifest.json` via the `source` field for traceability.

---

## 10. Review Gate

Before any media asset is committed to the repo, verify:

- [ ] Format is WebP (or SVG for vector) — no PNG/JPEG/raw formats
- [ ] File size is within limits for its category (see §3)
- [ ] Name follows the convention in §4
- [ ] Placed in the correct folder per §5
- [ ] manifest.json entry added or updated (§6)
- [ ] Alt text rules documented in the component using the asset (§7)
- [ ] Source file is NOT committed — only the optimized output
- [ ] `_on-dark` variants have transparent backgrounds (verified in an image editor)

If any check fails → do not commit. Fix the issue first.
