/**
 * BRAND-2: Inspect PNG brand sources and export production WebP + manifest.
 * Usage:
 *   node scripts/brand-export.mjs --inspect-only   # inspection report only
 *   node scripts/brand-export.mjs                  # full export + manifest
 */

import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..");
const INPUT_DIR = path.join(REPO_ROOT, "sama-link_brand-assets_FULL");
const OUTPUT_DIR = path.join(
  REPO_ROOT,
  "apps",
  "storefront",
  "public",
  "brand",
  "logo"
);
const MANIFEST_PATH = path.join(
  REPO_ROOT,
  "apps",
  "storefront",
  "public",
  "brand",
  "manifest.json"
);

/** Source PNG → output WebP (exact names per BRAND-2 brief) */
const EXPORT_MAP = [
  {
    source: "sama-link_full-horizontal_primary.png",
    output: "sama-link_logo_horizontal_light.webp",
    variant: "horizontal",
    theme: "light",
  },
  {
    source: "sama-link_full-horizontal_no-tagline_primary.png",
    output: "sama-link_logo_horizontal-no-tagline_light.webp",
    variant: "horizontal-no-tagline",
    theme: "light",
  },
  {
    source: "sama-link_full-vertical_primary.png",
    output: "sama-link_logo_vertical_light.webp",
    variant: "vertical",
    theme: "light",
  },
  {
    source: "sama-link_full-vertical_no-tagline_primary.png",
    output: "sama-link_logo_vertical-no-tagline_light.webp",
    variant: "vertical-no-tagline",
    theme: "light",
  },
  {
    source: "sama-link_full-horizontal_on-dark.png",
    output: "sama-link_logo_horizontal_dark.webp",
    variant: "horizontal",
    theme: "dark",
  },
  {
    source: "sama-link_full-horizontal_no-tagline_on-dark.png",
    output: "sama-link_logo_horizontal-no-tagline_dark.webp",
    variant: "horizontal-no-tagline",
    theme: "dark",
  },
  {
    source: "sama-link_full-vertical_on-dark.png",
    output: "sama-link_logo_vertical_dark.webp",
    variant: "vertical",
    theme: "dark",
  },
  {
    source: "sama-link_full-vertical_no-tagline_on-dark.png",
    output: "sama-link_logo_vertical-no-tagline_dark.webp",
    variant: "vertical-no-tagline",
    theme: "dark",
  },
  {
    source: "sama-link_icon_variant_alt.png",
    output: "sama-link_logo_icon_light.webp",
    variant: "icon",
    theme: "light",
  },
  {
    source: "sama-link_icon_on-dark.png",
    output: "sama-link_logo_icon_dark.webp",
    variant: "icon",
    theme: "dark",
  },
];

const MAX_KB_LOCKUP = 80;
const MAX_KB_ICON = 30;
const MIN_QUALITY = 50;

function maxKbForOutput(filename) {
  return filename.includes("_icon_") ? MAX_KB_ICON : MAX_KB_LOCKUP;
}

function isWhiteCorner(hasAlpha, px) {
  const r = px[0];
  const g = px[1];
  const b = px[2];
  const a = hasAlpha ? px[3] : 255;
  return r >= 250 && g >= 250 && b >= 250 && a >= 250;
}

async function inspectPng(filePath) {
  const meta = await sharp(filePath).metadata();
  const stats = fs.statSync(filePath);

  const raw = await sharp(filePath)
    .extract({ left: 0, top: 0, width: 1, height: 1 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const hasAlpha = meta.channels === 4;
  const px = raw.data;
  const topLeftPixel = hasAlpha
    ? `rgba(${px[0]},${px[1]},${px[2]},${px[3]})`
    : `rgb(${px[0]},${px[1]},${px[2]})`;

  return {
    width: meta.width,
    height: meta.height,
    channels: meta.channels,
    hasAlpha,
    topLeftPixel,
    sizeKb: Math.round(stats.size / 1024),
  };
}

function backgroundIssue(sourceName, inspection) {
  if (!sourceName.includes("_on-dark")) return false;
  if (inspection.hasAlpha) return false;
  const raw = inspection._rawPixel;
  if (!raw) return false;
  return isWhiteCorner(false, raw);
}

async function convertWithQualityLimit(srcPath, destPath, maxKb) {
  let quality = 90;
  let lastKb = 0;
  while (quality >= MIN_QUALITY) {
    await sharp(srcPath).webp({ quality }).toFile(destPath);
    lastKb = fs.statSync(destPath).size / 1024;
    if (lastKb <= maxKb) {
      return { quality, sizeKb: Math.round(lastKb * 100) / 100 };
    }
    quality -= 5;
  }
  return {
    quality: MIN_QUALITY,
    sizeKb: Math.round(lastKb * 100) / 100,
    overLimit: lastKb > maxKb,
  };
}

async function main() {
  const inspectOnly = process.argv.includes("--inspect-only");

  if (!fs.existsSync(INPUT_DIR)) {
    console.error("Missing input directory:", INPUT_DIR);
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const inspectionRows = [];

  for (const row of EXPORT_MAP) {
    const filePath = path.join(INPUT_DIR, row.source);
    if (!fs.existsSync(filePath)) {
      console.error("Missing source file:", row.source);
      process.exit(1);
    }

    const meta = await sharp(filePath).metadata();
    const stats = fs.statSync(filePath);
    const rawBuf = await sharp(filePath)
      .extract({ left: 0, top: 0, width: 1, height: 1 })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const hasAlpha = meta.channels === 4;
    const px = rawBuf.data;
    const topLeftPixel = hasAlpha
      ? `rgba(${px[0]},${px[1]},${px[2]},${px[3]})`
      : `rgb(${px[0]},${px[1]},${px[2]})`;

    const report = {
      file: row.source,
      width: meta.width,
      height: meta.height,
      channels: meta.channels,
      hasAlpha,
      topLeftPixel,
      sizeKb: Math.round(stats.size / 1024),
    };
    inspectionRows.push({ ...row, report, _rawPixel: Buffer.from(px) });
    console.log(JSON.stringify(report));
  }

  if (inspectOnly) {
    console.error("\n--inspect-only: no conversion performed.");
    return;
  }

  const manifestAssets = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const row of inspectionRows) {
    const srcPath = path.join(INPUT_DIR, row.source);
    const destPath = path.join(OUTPUT_DIR, row.output);
    const maxKb = maxKbForOutput(row.output);

    const inspection = {
      width: row.report.width,
      height: row.report.height,
      channels: row.report.channels,
      hasAlpha: row.report.hasAlpha,
      topLeftPixel: row.report.topLeftPixel,
      sizeKb: row.report.sizeKb,
      _rawPixel: row._rawPixel,
    };

    const conv = await convertWithQualityLimit(srcPath, destPath, maxKb);
    const stat = fs.statSync(destPath);
    const sizeKb = Math.round((stat.size / 1024) * 100) / 100;

    const bgIssue = backgroundIssue(row.source, inspection);
    let notes = "";
    if (bgIssue) {
      notes = `No alpha channel; top-left pixel ${row.report.topLeftPixel} indicates opaque white canvas (expected transparent for on-dark mark).`;
    }
    if (conv.overLimit) {
      notes = notes
        ? `${notes} Final WebP still ${sizeKb} KB (limit ${maxKb} KB) at quality ${conv.quality}.`
        : `Final WebP ${sizeKb} KB exceeds limit ${maxKb} KB at minimum quality ${MIN_QUALITY}.`;
    }

    manifestAssets.push({
      file: `logo/${row.output}`,
      context: "logo",
      variant: row.variant,
      theme: row.theme,
      dimensions: `${row.report.width}x${row.report.height}`,
      size_kb: sizeKb,
      quality: conv.quality,
      source: row.source,
      source_transparent: row.report.hasAlpha,
      background_issue: bgIssue,
      notes,
    });
  }

  const manifest = {
    version: "1.0.0",
    updated: today,
    svg_source_available: false,
    assets: manifestAssets,
  };

  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  console.error("\nWrote WebP files to", OUTPUT_DIR);
  console.error("Wrote manifest to", MANIFEST_PATH);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
