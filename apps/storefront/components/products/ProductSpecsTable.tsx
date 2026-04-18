import Link from "next/link";
import { getTranslations } from "next-intl/server";

export interface SpecRow {
  /** Translation key (resolved via products.detail namespace) OR a raw label string. */
  label: string;
  /** Already-resolved label override (skips translation). */
  rawLabel?: string;
  /** Plain text value */
  value?: string | number | null;
  /** Or a list of pill links/badges */
  pills?: { label: string; href?: string }[];
}

interface ProductSpecsTableProps {
  locale: string;
  rows: SpecRow[];
}

export default async function ProductSpecsTable({
  locale,
  rows,
}: ProductSpecsTableProps) {
  const t = await getTranslations({ locale, namespace: "products.detail" });

  // Filter out rows with no value/pills
  const visible = rows.filter(
    (r) =>
      (r.value != null && r.value !== "") ||
      (r.pills && r.pills.length > 0),
  );

  if (visible.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <table className="w-full">
        <tbody className="divide-y divide-border">
          {visible.map((row, idx) => (
            <tr
              key={`${row.label}-${idx}`}
              className="transition-colors hover:bg-surface-subtle"
            >
              <th
                scope="row"
                className="w-1/3 bg-surface-subtle/40 px-4 py-3 text-start text-sm font-medium text-text-secondary sm:px-6 sm:py-4"
              >
                {row.rawLabel ?? t(row.label)}
              </th>
              <td className="px-4 py-3 text-sm text-text-primary sm:px-6 sm:py-4">
                {row.pills && row.pills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {row.pills.map((pill, pIdx) =>
                      pill.href ? (
                        <Link
                          key={`${pill.label}-${pIdx}`}
                          href={pill.href}
                          className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-primary transition-colors hover:border-brand hover:text-brand"
                        >
                          {pill.label}
                        </Link>
                      ) : (
                        <span
                          key={`${pill.label}-${pIdx}`}
                          className="inline-flex items-center rounded-full bg-surface-subtle px-3 py-1 text-xs font-medium text-text-secondary"
                        >
                          {pill.label}
                        </span>
                      ),
                    )}
                  </div>
                ) : (
                  <span>{row.value}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
