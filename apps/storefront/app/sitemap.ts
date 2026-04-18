import type { MetadataRoute } from "next";
import {
  buildCanonical,
  buildLanguageAlternates,
  getBaseUrl,
  SUPPORTED_LOCALES,
} from "@/lib/seo";
import {
  listCollections,
  listProducts,
  type ListProductsParams,
} from "@/lib/medusa-client";

// Keep the sitemap tied to ISR so it refreshes as catalog changes land
// without forcing a full rebuild. Matches the catalog's 3600s cadence
// (ADR-017 — per-route rendering).
export const revalidate = 3600;

const PRODUCTS_PAGE_SIZE = 100;
const COLLECTIONS_PAGE_SIZE = 100;
// Hard cap on the number of paginated pulls per resource — prevents
// runaway loops if the backend reports an unusually large `count` or is
// misconfigured. 50 * 100 = 5000 URLs per resource which is well above
// the near-term catalog size.
const MAX_PAGES_PER_RESOURCE = 50;

// Info-page handles that MVP-5 exposes under /[locale]/pages/<handle>.
// Source of truth is the HANDLE_KEY_MAP in the CMS page route — keep in sync.
const INFO_PAGE_HANDLES = [
  "about",
  "faq",
  "contact",
  "shipping-returns",
  "privacy",
  "terms",
] as const;

type SitemapEntry = MetadataRoute.Sitemap[number];

function entryForEveryLocale(
  pathWithoutLocale: string,
  opts: {
    lastModified?: Date;
    changeFrequency: SitemapEntry["changeFrequency"];
    priority: number;
  },
): SitemapEntry[] {
  const languages = buildLanguageAlternates(pathWithoutLocale);
  return SUPPORTED_LOCALES.map((locale) => ({
    url: buildCanonical(locale, pathWithoutLocale),
    lastModified: opts.lastModified ?? new Date(),
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: { languages },
  }));
}

function baselineEntries(): SitemapEntry[] {
  const now = new Date();
  return [
    ...entryForEveryLocale("/", {
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    }),
    ...entryForEveryLocale("/products", {
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    }),
    ...entryForEveryLocale("/collections", {
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }),
    ...INFO_PAGE_HANDLES.flatMap((handle) =>
      entryForEveryLocale(`/pages/${handle}`, {
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.4,
      }),
    ),
  ];
}

interface ProductRow {
  handle?: string | null;
  updated_at?: string | Date | null;
  created_at?: string | Date | null;
}

async function fetchAllProductRows(): Promise<ProductRow[]> {
  const rows: ProductRow[] = [];
  const params: ListProductsParams = {
    limit: PRODUCTS_PAGE_SIZE,
    fields: "handle,updated_at,created_at",
  };
  let offset = 0;
  for (let pageIndex = 0; pageIndex < MAX_PAGES_PER_RESOURCE; pageIndex += 1) {
    const result = await listProducts({ ...params, offset });
    const batch = (result.products ?? []) as ProductRow[];
    rows.push(...batch);
    const count =
      "count" in result && typeof result.count === "number"
        ? result.count
        : undefined;
    if (batch.length < PRODUCTS_PAGE_SIZE) break;
    if (count != null && rows.length >= count) break;
    offset += PRODUCTS_PAGE_SIZE;
  }
  return rows;
}

interface CollectionRow {
  handle?: string | null;
  updated_at?: string | Date | null;
  created_at?: string | Date | null;
}

async function fetchAllCollectionRows(): Promise<CollectionRow[]> {
  // The shared `listCollections()` wrapper doesn't expose pagination
  // params today, so we pull once and rely on the Medusa default page
  // size. If pagination params get added later the caller can extend
  // this to loop; kept intentionally simple until then.
  void COLLECTIONS_PAGE_SIZE;
  const result = await listCollections();
  return (result.collections ?? []) as CollectionRow[];
}

function parseLastModified(
  row: { updated_at?: string | Date | null; created_at?: string | Date | null },
): Date | undefined {
  const raw = row.updated_at ?? row.created_at;
  if (!raw) return undefined;
  const d = raw instanceof Date ? raw : new Date(raw);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Always include baseline entries — these must not depend on Medusa
  // reachability so sitemap.xml still renders during backend outages.
  const entries: SitemapEntry[] = [...baselineEntries()];

  try {
    const products = await fetchAllProductRows();
    for (const p of products) {
      if (!p.handle) continue;
      entries.push(
        ...entryForEveryLocale(`/products/${p.handle}`, {
          lastModified: parseLastModified(p),
          changeFrequency: "weekly",
          priority: 0.7,
        }),
      );
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      "[sitemap] listProducts failed — falling back to baseline without product URLs",
      err,
    );
  }

  try {
    const collections = await fetchAllCollectionRows();
    for (const c of collections) {
      if (!c.handle) continue;
      entries.push(
        ...entryForEveryLocale(`/collections/${c.handle}`, {
          lastModified: parseLastModified(c),
          changeFrequency: "weekly",
          priority: 0.6,
        }),
      );
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      "[sitemap] listCollections failed — falling back to baseline without collection URLs",
      err,
    );
  }

  return entries;
}

// Re-export so unit tests / tooling can introspect the logo path pulled
// from the shared seo library — reserved for future INFRA tasks.
export { getBaseUrl };
