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
    ],
  },
};

export default withNextIntl(nextConfig);
