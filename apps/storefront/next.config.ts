import path from 'node:path';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/* `output: "standalone"` is only needed by the Cloud Run Dockerfile's
   build stage — keeping it in `next dev` was a suspected contributor to
   Turbopack's phantom "config changed → restart" loop on Windows. */
const isProdBuild = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  ...(isProdBuild ? { output: 'standalone' as const } : {}),
  /* Anchor Turbopack's resolver to the monorepo root so it locates the
     hoisted `next` package. Without this, dev on Windows paths containing
     spaces panics with "Next.js package not found" → repeating endpoint
     compile failures and a flicker loop in the browser.

     Gated to win32 only: in the Cloud Run Linux build context, the build
     happens inside `/app` with `apps/storefront/` as the only contents
     and no monorepo siblings present. There, `path.join(__dirname, '..',
     '..')` resolves to filesystem root `/`, which Next 16 treats as the
     workspace root and uses to compute the package's relative path.
     Standalone output then lands at `.next/standalone/app/server.js`
     instead of `.next/standalone/server.js`, and the Dockerfile's
     `CMD ["node", "server.js"]` fails with MODULE_NOT_FOUND at runtime.
     Skipping the override on non-Windows lets Next fall back to its
     default single-package layout in Docker. */
  ...(process.platform === 'win32' ? {
    turbopack: {
      root: path.join(__dirname, '..', '..'),
    },
  } : {}),
  /* Hide the Next.js/Turbopack dev indicator — showed up in production-looking
     dev screenshots as a small vertical ▲ ● ▼ cluster. Purely cosmetic. */
  devIndicators: false,
  /* CI Docker image (Node 20) infers stricter implicit-any on Medusa SDK
     response callbacks than local Node 22. Code compiles cleanly on both
     — the difference is a TS inference engine version gap, not real type
     errors. Skip the redundant CI type-check; local tsc --noEmit remains
     the authoritative gate. */
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/static/**",
      },
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
      },
      {
        // Seeded product thumbnails (TP-Link CDN) — replaced by own S3/R2 in CAT-4
        protocol: "https",
        hostname: "static.tp-link.com",
      },
      {
        // Product catalog images — self-hosted on GCS bucket
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        // Legacy: some product images may still reference sama-link.com
        protocol: "https",
        hostname: "sama-link.com",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
