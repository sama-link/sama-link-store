"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import AddToCartButton from "@/components/products/AddToCartButton";
import Button from "@/components/ui/Button";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/cn";

interface StickyPurchaseBarProps {
  /** id of the in-page CTA group to observe; bar appears when CTA scrolls offscreen */
  observeId: string;
  productTitle: string;
  thumbnail: string | null;
  variantId: string | null;
  amount: number | null;
  currencyCode: string | null;
}

/**
 * Horizontal equivalent of the catalog card purchase pattern:
 *   [ Product name | ... | Buy now | Add-to-Cart icon ]
 * Appears when the in-page CTA scrolls out of view.
 */
export default function StickyPurchaseBar({
  observeId,
  productTitle,
  variantId,
}: StickyPurchaseBarProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("products.detail");
  const tCard = useTranslations("products.card");
  const { addItem, cart, loading: cartLoading } = useCart();
  const [visible, setVisible] = useState(false);
  const [buyBusy, setBuyBusy] = useState(false);

  useEffect(() => {
    const target = document.getElementById(observeId);
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        const rect = entry.boundingClientRect;
        const scrolledPast = rect.top < 0;
        setVisible(!entry.isIntersecting && scrolledPast);
      },
      { threshold: 0, rootMargin: "0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [observeId]);

  const buyNow = useCallback(async () => {
    if (!variantId || !cart || buyBusy || cartLoading) return;
    setBuyBusy(true);
    try {
      await addItem(variantId, 1);
      router.push(`/${locale}/checkout/address`);
    } catch {
      setBuyBusy(false);
    }
  }, [addItem, buyBusy, cart, cartLoading, locale, router, variantId]);

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 sm:bottom-auto sm:top-0 z-[60] border-t sm:border-t-0 sm:border-b border-border bg-surface/95 shadow-[0_-4px_14px_rgba(0,0,0,0.05)] sm:shadow-md backdrop-blur transition-transform duration-300",
        visible ? "translate-y-0" : "translate-y-full sm:-translate-y-full",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary sm:text-base">
          {productTitle}
        </p>

        {variantId ? (
          <div className="flex shrink-0 items-stretch gap-2">
            <Button
              type="button"
              variant="primary"
              size="md"
              fullWidth={false}
              loading={buyBusy}
              disabled={!cart || cartLoading || buyBusy}
              onClick={() => {
                void buyNow();
              }}
              className="cta-glow"
            >
              {t("buyNow")}
            </Button>
            <AddToCartButton
              variantId={variantId}
              variant="secondary"
              size="md"
              fullWidth={false}
              iconOnly
              iconAriaLabel={tCard("addToCartAria")}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
