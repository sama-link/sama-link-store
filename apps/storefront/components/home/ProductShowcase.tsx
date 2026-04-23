import { getTranslations } from "next-intl/server";
import Container from "@/components/layout/Container";
import ProductCard, {
  type Product,
} from "@/components/products/ProductCard";

interface Props {
  eyebrow: string;
  title: string;
  viewAllHref: string;
  products: Product[];
  /** 4-up on desktop (default) or 3-up */
  cols?: 3 | 4;
  /** Optional bg accent on the section */
  tone?: "default" | "subtle";
}

/* ADR-045 flat refresh — shared showcase for featured / trending / editorial grids. */
export default async function ProductShowcase({
  eyebrow,
  title,
  viewAllHref,
  products,
  cols = 4,
  tone = "default",
}: Props) {
  const t = await getTranslations("home");
  if (products.length === 0) return null;

  const bg = tone === "subtle" ? "bg-surface-subtle border-t border-border" : "bg-surface";
  const gridCols =
    cols === 4
      ? "grid-cols-2 lg:grid-cols-4"
      : "grid-cols-2 lg:grid-cols-3";

  return (
    <section className={bg}>
      <Container className="py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              {eyebrow}
            </div>
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-text-primary sm:text-3xl">
              {title}
            </h2>
          </div>
          <a
            href={viewAllHref}
            className="text-sm font-semibold text-brand transition-colors hover:text-brand-hover"
          >
            {t("viewAll")} <span aria-hidden="true" className="rtl:-scale-x-100">→</span>
          </a>
        </div>

        <div className={`grid gap-5 ${gridCols}`}>
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </section>
  );
}
