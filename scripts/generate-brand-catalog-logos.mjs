// Sama Link · brand-catalog wordmark generator (demo placeholders).
//
// Generates tightly-trimmed transparent WebP wordmark logos at
// `apps/storefront/public/brand/catalog/<handle>.webp`. The render canvas is
// 512x512 but the final file is cropped to the wordmark's actual bounding box
// (plus a small uniform padding) so the storefront can layout each logo with
// `height: fixed` / `width: auto` and have it visually fill the slot — no
// asymmetric whitespace, no per-brand fudging.
//
// These are NOT the official brand marks — they are demo placeholders so
// the catalog filter, brand admin preview, and PDP brand surface have
// something visible until the operator drops a real logo file in.
//
// Run from repo root:
//   node scripts/generate-brand-catalog-logos.mjs
//
// Re-runs are idempotent — files are overwritten.

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..");
const OUT_DIR = resolve(
  REPO_ROOT,
  "apps/storefront/public/brand/catalog"
);

// Wide render canvas so even the longest wordmark fits without clipping.
// Final WebP is trimmed + height-normalised (see main()), so canvas size
// only bounds the *upstream* render, not the saved output.
const CANVAS_W = 2048;
const CANVAS_H = 384;
// Final, uniform output height in pixels. Width follows each wordmark's
// trimmed aspect ratio so every logo lands in the same vertical slot at
// the storefront's `h-14 sm:h-16 w-auto` brand-eyebrow regardless of the
// label's character count.
const TARGET_HEIGHT = 160;

// (handle, displayLabel, brandColor) — brandColor approximates the
// public-facing brand identity. When unsure, falls back to a neutral
// slate so the asset is safe and clearly a placeholder.
const BRANDS = [
  ["3com", "3COM", "#cc0000"],
  // "APC" alone keeps the logo within a sane aspect-ratio for the storefront's
  // brand-eyebrow column. It also matches how APC products are typically marked.
  ["apc-schneider", "APC", "#3dcd58"],
  ["asus", "ASUS", "#000000"],
  ["brother", "Brother", "#0033a0"],
  ["cisco", "Cisco", "#1ba0d7"],
  ["cts", "CTS", "#1f6feb"],
  ["d-link", "D-Link", "#003da6"],
  ["dell", "DELL", "#007db8"],
  ["grandstream", "Grandstream", "#f47b20"],
  ["hikvision", "Hikvision", "#cc092f"],
  ["hp-aruba", "HP Aruba", "#ff8300"],
  ["huawei", "Huawei", "#cf0a2c"],
  ["l-avvento", "L'AVVENTO", "#1f6feb"],
  ["legrand", "Legrand", "#000000"],
  ["lenovo", "Lenovo", "#e2231a"],
  ["linksys", "Linksys", "#0072ce"],
  ["mercusys", "MERCUSYS", "#005bbb"],
  ["msi", "MSI", "#cc0000"],
  ["netsys", "NETSYS", "#1f6feb"],
  ["panasonic", "Panasonic", "#0049ad"],
  ["planet", "PLANET", "#e30613"],
  ["premium-line", "Premium-Line", "#1a3668"],
  ["prolink", "ProLink", "#005baa"],
  ["sama-link", "Sama Link", "#0f2b4f"],
  ["tapo", "TAPO", "#00a99d"],
  ["tenda", "Tenda", "#0099d8"],
  ["tp-link", "TP-Link", "#4acbd6"],
  ["unv", "UNV", "#005bac"],
  // "WD" is the standard wordmark for Western Digital and avoids a 15-letter
  // logo that would dwarf every other brand at the same slot height.
  ["western-digital", "WD", "#3c3c3b"],
  ["zkteco", "ZKTeco", "#0093d0"],
];

// XML-escape so & < > ' " in brand names don't break SVG parsing.
function esc(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function svgFor(label, color) {
  // One uniform font-size for every wordmark — combined with the post-render
  // resize-to-fixed-height step, this is what guarantees a visually uniform
  // logo bar across the catalog. Letters are forced to uppercase so cap-height
  // (not x-height + descender) anchors the trimmed bounding box, eliminating
  // the "lowercase brand looks shorter than UPPERCASE brand at the same slot
  // height" issue.
  const size = 200;
  const text = esc(label.toUpperCase());
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}">
  <defs>
    <style>
      .wordmark {
        font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        font-weight: 800;
        letter-spacing: -4px;
        fill: ${color};
      }
    </style>
  </defs>
  <text class="wordmark"
        x="50%" y="50%"
        font-size="${size}"
        text-anchor="middle"
        dominant-baseline="central">${text}</text>
</svg>`;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  let written = 0;
  for (const [handle, label, color] of BRANDS) {
    const svg = svgFor(label, color);
    const outPath = resolve(OUT_DIR, `${handle}.webp`);

    // 1. Render SVG → PNG buffer. (Must flush to a buffer here — sharp's
    //    `.trim()` would otherwise be evaluated before any later resize in
    //    the same pipeline and trim against the *pre-rasterised* SVG.)
    // 2. Trim transparent padding so the bounding box equals the visible
    //    wordmark (no asymmetric whitespace).
    // 3. Resize to a uniform target height. With cap-height anchored by the
    //    forced-uppercase render, this produces a visually consistent logo
    //    height across every brand, regardless of label length.
    // 4. Re-extend with a tiny uniform breathing-room padding so adjacent
    //    glyph strokes never touch the slot edges in the storefront layout.
    const rendered = await sharp(Buffer.from(svg))
      .resize(CANVAS_W, CANVAS_H, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
    const trimmed = await sharp(rendered)
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 })
      .toBuffer();
    const normalised = await sharp(trimmed)
      .resize({ height: TARGET_HEIGHT, fit: "inside" })
      .png()
      .toBuffer();
    const meta = await sharp(normalised).metadata();
    const padY = Math.max(4, Math.round((meta.height ?? 0) * 0.08));
    const padX = Math.max(4, Math.round((meta.width ?? 0) * 0.02));
    await sharp(normalised)
      .extend({
        top: padY,
        bottom: padY,
        left: padX,
        right: padX,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 92, alphaQuality: 100 })
      .toFile(outPath);
    written++;
  }
  console.log(`Wrote ${written} brand logos to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
