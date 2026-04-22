"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import type { ListProduct } from "@/hooks/useWishlist";
import { productToWishlistItem } from "@/hooks/useWishlist";
import WishlistButton from "@/components/products/WishlistButton";
import CompareButton from "@/components/products/CompareButton";
import QuickViewModal from "@/components/products/QuickViewModal";
import { cn } from "@/lib/cn";

export interface CardTopActionsProps {
  product: ListProduct;
}

function EyeIcon() {
  /* Minimal open-eye glyph — thin stroke, larger pupil, reads as "preview". */
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
      aria-hidden="true"
    >
      <path d="M2 12c3-6 8-8 10-8s7 2 10 8c-3 6-8 8-10 8s-7-2-10-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/**
 * Catalog-card overlay icons sitting over the product image.
 * Mobile: Quick View only. Desktop: all three (fade in on hover/focus).
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
          "pointer-events-none absolute end-2 top-2 z-[25] flex flex-col gap-1",
          wrapperReveal,
        )}
      >
        <div className={cn("flex flex-col gap-1", rowGate)}>
          <span className="hidden sm:inline-flex">
            <WishlistButton item={wishCompareItem} size="sm" />
          </span>
          <span className="hidden sm:inline-flex">
            <CompareButton item={wishCompareItem} size="sm" />
          </span>
          <button
            type="button"
            onClick={openQuick}
            aria-label={t("quickView")}
            title={t("quickView")}
            className="group inline-flex h-8 w-8 shrink-0 items-center justify-center text-text-secondary transition-[color,transform] duration-200 hover:text-brand focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/20 active:scale-90"
          >
            <EyeIcon />
          </button>
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
