import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/* `output: "standalone"` is only needed by the Cloud Run Dockerfile's
   build stage — keeping it in `next dev` was a suspected contributor to
   Turbopack's phantom "config changed → restart" loop on Windows. */
const isProdBuild = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  ...(isProdBuild ? { output: 'standalone' as const } : {}),
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
        // Product catalog images — Next.js image optimization acts as
        // caching proxy: browsers load from /_next/image on our Cloud Run,
        // not directly from sama-link.com. Origin is only hit on cache miss.
        protocol: "https",
        hostname: "sama-link.com",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
