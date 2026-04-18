import { getTranslations } from "next-intl/server";

interface ProductReviewsProps {
  locale: string;
}

function StarIcon({ filled, className }: { filled?: boolean; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
      />
    </svg>
  );
}

export default async function ProductReviews({ locale }: ProductReviewsProps) {
  const t = await getTranslations({ locale, namespace: "products.detail.reviews" });

  return (
    <section
      aria-labelledby="reviews-heading"
      className="border-t border-border pt-12"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2
            id="reviews-heading"
            className="text-2xl font-bold tracking-tight text-text-primary"
          >
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">{t("subtitle")}</p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-border bg-surface-subtle p-8 text-center">
        <div className="inline-flex items-center gap-1 text-text-muted">
          {[0, 1, 2, 3, 4].map((i) => (
            <StarIcon key={i} className="h-6 w-6" />
          ))}
        </div>
        <p className="mt-3 text-sm font-medium text-text-primary">
          {t("noReviewsTitle")}
        </p>
        <p className="mt-1 text-xs text-text-secondary">
          {t("noReviewsBody")}
        </p>
      </div>
    </section>
  );
}
