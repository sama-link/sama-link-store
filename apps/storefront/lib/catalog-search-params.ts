/**
 * Catalog filter query helpers — multi-value facets are read from a single
 * comma-separated param (`?category=a,b`) and/or repeated keys. Writes use one
 * comma-separated value when there are 2+ entries so Next.js App Router
 * `searchParams` (which often keeps only the last repeated key) round-trips
 * correctly on the server.
 */

export function parseMultiStringParam(
  value: string | string[] | undefined,
): string[] {
  if (value === undefined) return [];
  const parts = Array.isArray(value) ? value : [value];
  const out: string[] = [];
  for (const p of parts) {
    if (typeof p !== "string" || p.trim() === "") continue;
    for (const seg of p.split(",")) {
      const t = seg.trim();
      if (t) out.push(t);
    }
  }
  return [...new Set(out)];
}

/** Client-side: read a multi-value facet from the current URL. */
export function readMultiParamFromUrl(
  params: URLSearchParams,
  key: string,
): string[] {
  const all = params.getAll(key);
  if (all.length > 0) {
    return [...new Set(all.flatMap((s) => parseMultiStringParam(s)))];
  }
  const single = params.get(key);
  return single ? parseMultiStringParam(single) : [];
}

export function writeMultiParamToUrl(
  params: URLSearchParams,
  key: string,
  values: string[],
): void {
  params.delete(key);
  const cleaned = [...new Set(values.map((v) => v.trim()).filter(Boolean))];
  if (cleaned.length === 0) return;
  if (cleaned.length === 1) {
    params.set(key, cleaned[0]);
    return;
  }
  params.set(key, cleaned.join(","));
}

export function sameStringSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}
