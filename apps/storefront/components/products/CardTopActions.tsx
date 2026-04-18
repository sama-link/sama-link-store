"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import type { ListProduct } from "@/hooks/useWishlist";
import { productToWishlistItem } from "@/hooks/useWishlist";
import Button from "@/components/ui/Button";
import WishlistButton from "@/components/products/WishlistButton";
import CompareButton from "@/components/products/CompareButton";
import QuickViewModal from "@/components/products/QuickViewModal";
import { cn } from "@/lib/cn";

export interface CardTopActionsProps {
  product: ListProduct;
}

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 5.25 12 5.25c4.638 0 8.573 2.26 9.963 6.096a1.012 1.012 0 0 1 0 .639c-1.39 3.836-5.325 6.096-9.963 6.096-4.638 0-8.573-2.26-9.963-6.096Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );
}

/**
 * Catalog-card overlay icons sitting over the product image.
 * Always visible on mobile; fade in on hover/focus on desktop.
 * Buttons are above the card's stretched <Link> via z-[25].
 */
export default function CardTopActions({ product }: CardTopActionsProps) {
  const t = useTranslations("products.card");
  const [quickOpen, setQuickOpen] = useState(false);

  const firstVariantId = product.variants?.[0]?.id ?? null;
  const wishCompareItem = productToWishlistItem(product, firstVariantId);

  const openQuick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickOpen(true);
  }, []);

  const wrapperReveal =
    "opacity-100 transition-opacity duration-150 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100";
  const rowGate =
    "pointer-events-auto sm:pointer-events-none sm:group-hover:pointer-events-auto sm:group-focus-within:pointer-events-auto";

  return (
    <>
      <div
        className={cn(
          "pointer-events-none absolute end-2 top-2 z-[25] flex flex-col gap-1.5",
          wrapperReveal,
        )}
      >
        <div className={cn("flex flex-col gap-1.5", rowGate)}>
          <WishlistButton item={wishCompareItem} />
          <CompareButton item={wishCompareItem} />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            fullWidth={false}
            onClick={openQuick}
            className="h-10 w-10 shrink-0 px-0"
            aria-label={t("quickView")}
            title={t("quickView")}
          >
            <EyeIcon />
          </Button>
        </div>
      </div>

      <QuickViewModal
        product={product}
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
      />
    </>
  );
}
