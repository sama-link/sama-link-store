"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/hooks/useCart";
import type { ListProduct } from "@/hooks/useWishlist";
import AddToCartButton from "@/components/products/AddToCartButton";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export interface CardPurchaseRowProps {
  product: ListProduct;
}

/**
 * Fixed conversion-oriented purchase row shown at the bottom of every catalog
 * card. Prominent `Buy now` (primary brand) paired with a compact icon-only
 * Add-to-Cart square. `relative z-[2]` lifts the row above the card's
 * stretched <Link> pseudo so button clicks win over the navigation surface.
 */
export default function CardPurchaseRow({ product }: CardPurchaseRowProps) {
  const t = useTranslations("products.card");
  const locale = useLocale();
  const router = useRouter();
  const { addItem, cart, loading: cartLoading } = useCart();
  const [buyBusy, setBuyBusy] = useState(false);
  const [cartAnnounce, setCartAnnounce] = useState("");

  const firstVariantId = product.variants?.[0]?.id ?? null;

  const buyNow = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!firstVariantId || !cart || buyBusy || cartLoading) return;
      setBuyBusy(true);
      try {
        await addItem(firstVariantId, 1);
        router.push(`/${locale}/checkout/address`);
      } catch {
        setBuyBusy(false);
      }
    },
    [addItem, buyBusy, cart, cartLoading, firstVariantId, locale, router],
  );

  const announceAdded = useCallback(() => {
    setCartAnnounce("");
    requestAnimationFrame(() => setCartAnnounce(t("addedToast")));
  }, [t]);

  if (!firstVariantId) return null;

  return (
    <div className={cn("relative z-[2] flex items-stretch gap-2")}>
      <span className="sr-only" aria-live="polite">
        {cartAnnounce}
      </span>
      <Button
        type="button"
        variant="primary"
        size="md"
        fullWidth
        loading={buyBusy}
        disabled={!cart || cartLoading || buyBusy}
        onClick={buyNow}
        className="cta-glow flex-1"
      >
        {t("buyNow")}
      </Button>
      <AddToCartButton
        variantId={firstVariantId}
        variant="secondary"
        size="md"
        fullWidth={false}
        iconOnly
        iconAriaLabel={t("addToCartAria")}
        onAdded={announceAdded}
      />
    </div>
  );
}
