"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import AddToCartButton from "@/components/products/AddToCartButton";
import Button from "@/components/ui/Button";
import CompareButton from "@/components/products/CompareButton";
import WishlistButton from "@/components/products/WishlistButton";
import Price from "@/components/ui/Price";
import { useCart } from "@/hooks/useCart";
import type { WishlistItem } from "@/hooks/useWishlist";
import type { CompareItem } from "@/hooks/useCompare";
import { cn } from "@/lib/cn";

export interface PanelOptionValue {
  value: string;
}
export interface PanelProductOption {
  id: string;
  title: string;
  values: PanelOptionValue[];
}
export interface PanelVariant {
  id: string;
  title: string | null;
  sku: string | null;
  /** Map of option title → value, e.g. { Color: "Red", Size: "M" } */
  options: Record<string, string>;
  amount: number | null;
  currencyCode: string | null;
  /** Optional compare-at price — renders as the strike-through "was" value. */
  originalAmount?: number | null;
}

interface PurchasePanelProps {
  productOptions: PanelProductOption[];
  variants: PanelVariant[];
  /** Slot id for IntersectionObserver to track CTA visibility (sticky bar). */
  ctaSentinelId?: string;
  /** Product title — rendered as H1 inside the panel. */
  title: string;
  /** Optional brand / manufacturer / type eyebrow — alt text when a logo is shown. */
  brand?: string | null;
  /** When set (e.g. `/brand/catalog/tenda.webp`), shown above the title instead of `brand` text. */
  brandLogoSrc?: string | null;
  /** Short description paragraph — first paragraph of product.description. */
  description?: string | null;
  /** Optional bullet highlights — extracted list rendered under the description. */
  highlights?: string[];
  /** WishlistItem for the heart icon next to Buy Now. */
  wishlistItem?: WishlistItem | null;
  /** CompareItem for the compare icon next to Buy Now. */
  compareItem?: CompareItem | null;
}

/**
 * PDP purchase panel — reshaped around the online-store reference.
 *
 * Order:
 *  1. Brand eyebrow  2. Title  3. SKU
 *  4. Divider        5. Price row (price · compare · save% · Incl. VAT)
 *  6. Divider        7. In-stock + shipping combined line
 *  8. Description    9. Highlights bullets  10. Variant selectors
 *  11. Qty stepper + Add-to-Cart + Wishlist heart
 *  12. Buy Now
 *  13. Trust grid (2×2)
 */
export default function PurchasePanel({
  productOptions,
  variants,
  ctaSentinelId,
  title,
  brand,
  brandLogoSrc,
  description,
  highlights,
  wishlistItem,
  compareItem,
}: PurchasePanelProps) {
  const t = useTranslations("products.detail");
  const locale = useLocale();
  const router = useRouter();
  const { addItem, cart, loading: cartLoading } = useCart();
  const [buyBusy, setBuyBusy] = useState(false);
  const [qty, setQty] = useState(1);
  const [descExpanded, setDescExpanded] = useState(false);

  const initial = useMemo<Record<string, string>>(() => {
    const first = variants[0];
    return first ? { ...first.options } : {};
  }, [variants]);

  const [selected, setSelected] = useState<Record<string, string>>(initial);
  const [preview, setPreview] = useState<
    { title: string; value: string } | null
  >(null);

  const resolveVariant = useCallback(
    (choice: Record<string, string>): PanelVariant | null => {
      if (variants.length === 0) return null;
      if (variants.length === 1) return variants[0] ?? null;
      let best: { variant: PanelVariant; score: number } | null = null;
      for (const v of variants) {
        let score = 0;
        let exact = true;
        for (const opt of productOptions) {
          if (v.options[opt.title] === choice[opt.title]) {
            score += 1;
          } else {
            exact = false;
          }
        }
        if (exact) return v;
        if (!best || score > best.score) best = { variant: v, score };
      }
      return best?.variant ?? variants[0] ?? null;
    },
    [productOptions, variants],
  );

  const currentVariant = useMemo<PanelVariant | null>(
    () => resolveVariant(selected),
    [resolveVariant, selected],
  );

  const displayedVariant = useMemo<PanelVariant | null>(() => {
    if (!preview) return currentVariant;
    const hypothetical = { ...selected, [preview.title]: preview.value };
    return resolveVariant(hypothetical);
  }, [currentVariant, preview, resolveVariant, selected]);

  const hasCompare =
    displayedVariant?.originalAmount != null &&
    displayedVariant.amount != null &&
    displayedVariant.originalAmount > displayedVariant.amount;

  const savePercent = hasCompare
    ? Math.round(
        100 -
          (Number(displayedVariant!.amount) /
            Number(displayedVariant!.originalAmount)) *
            100,
      )
    : null;

  const isPreview =
    preview != null && currentVariant?.id !== displayedVariant?.id;

  function pick(optionTitle: string, value: string) {
    setSelected((prev) => ({ ...prev, [optionTitle]: value }));
    setPreview(null);
  }

  const buyNow = useCallback(async () => {
    if (!currentVariant?.id || !cart || buyBusy || cartLoading) return;
    setBuyBusy(true);
    try {
      await addItem(currentVariant.id, Math.max(1, qty));
      router.push(`/${locale}/checkout/address`);
    } catch {
      setBuyBusy(false);
    }
  }, [
    addItem,
    buyBusy,
    cart,
    cartLoading,
    currentVariant?.id,
    locale,
    qty,
    router,
  ]);

  return (
    <div className="space-y-6">
      {/* 1. Brand eyebrow — logo when available, else uppercase label.
          Logo files are pre-trimmed (see scripts/generate-brand-catalog-logos.mjs)
          so each one carries its own intrinsic aspect ratio. We lock the height
          and let the width follow the trimmed bounding box — no padding, no
          asymmetric whitespace, no per-brand sizing rules. */}
      {brandLogoSrc ? (
        <Image
          src={brandLogoSrc}
          alt={brand?.trim() || "Brand"}
          width={480}
          height={160}
          className="h-5 w-auto max-w-full object-contain object-left sm:h-6"
          sizes="(min-width: 640px) 120px, 100px"
          priority
        />
      ) : brand ? (
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          {brand}
        </div>
      ) : null}

      {/* 2. Title */}
      <h1 className="text-3xl font-bold tracking-[-0.02em] text-text-primary sm:text-[32px]">
        {title}
      </h1>

      {/* 3. SKU line (subtle) */}
      {currentVariant?.sku ? (
        <p className="text-xs text-text-muted">
          {t("sku")}:{" "}
          <span className="font-mono font-medium text-text-secondary">
            {currentVariant.sku}
          </span>
        </p>
      ) : null}

      {/* Divider */}
      <div className="border-t border-border" />

      {/* 5. Price row — price + compare + save% + "Incl. VAT" end-aligned */}
      {displayedVariant?.amount != null && displayedVariant.currencyCode ? (
        <div
          className={cn(
            "flex flex-wrap items-baseline gap-3 transition-opacity duration-150",
            isPreview && "opacity-80",
          )}
          aria-live="polite"
        >
          <Price
            amount={Number(displayedVariant.amount)}
            currencyCode={displayedVariant.currencyCode}
            size="2xl"
            className="text-brand"
          />
          {hasCompare ? (
            <Price
              amount={Number(displayedVariant.originalAmount)}
              currencyCode={displayedVariant.currencyCode}
              size="md"
              strike
            />
          ) : null}
          {savePercent != null ? (
            <span className="inline-flex items-center rounded-full bg-error-muted px-2.5 py-0.5 text-xs font-semibold text-error">
              {t("save", { percent: savePercent })}
            </span>
          ) : null}
          <span className="ms-auto text-xs text-text-muted">
            {t("inclVat")}
          </span>
        </div>
      ) : null}

      {/* Divider */}
      <div className="border-t border-border" />

      {/* 7. In-stock + shipping combined line */}
      <div className="flex items-center gap-2 text-sm font-medium text-success">
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-success" />
        <span>{t("inStockShipsIn")}</span>
      </div>

      {/* 8. Short description */}
      {description ? (
        <div className="relative">
          <div
            className={cn(
              "text-[15px] leading-relaxed text-text-secondary transition-[max-height] duration-300 ease-in-out overflow-hidden",
              descExpanded ? "max-h-[1000px]" : "max-h-[66px]"
            )}
          >
            {description}
          </div>
          {!descExpanded && description.length > 130 && (
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-surface to-transparent" />
          )}
          {description.length > 130 && (
            <button
              type="button"
              onClick={() => setDescExpanded(!descExpanded)}
              className="mt-1 text-[13px] font-medium text-brand hover:underline"
            >
              {descExpanded ? t("showLess") : t("showMore")}
            </button>
          )}
        </div>
      ) : null}

      {/* 9. Highlights bullets */}
      {highlights && highlights.length > 0 ? (
        <ul className="space-y-1.5">
          {highlights.map((h) => (
            <li
              key={h}
              className="flex items-start gap-2.5 text-sm text-text-primary"
            >
              <span
                aria-hidden="true"
                className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
              />
              <span>{h}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {/* 10. Variant selectors — helper aligned to end */}
      {variants.length > 1 && productOptions.length > 0 ? (
        <div className="space-y-4">
          {productOptions.map((opt: any) => {
            const currentValue = selected[opt.title] ?? "";
            return (
              <div key={opt.id}>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-text-primary">
                    {opt.title}
                  </p>
                  {currentValue ? (
                    <p className="text-sm text-text-secondary">
                      {currentValue}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-stretch gap-1.5">
                  {opt.values.map((v: any) => {
                    const isActive = currentValue === v.value;
                    return (
                      <button
                        key={v.value}
                        type="button"
                        onClick={() => pick(opt.title, v.value)}
                        onMouseEnter={() =>
                          setPreview({ title: opt.title, value: v.value })
                        }
                        onMouseLeave={() => setPreview(null)}
                        onFocus={() =>
                          setPreview({ title: opt.title, value: v.value })
                        }
                        onBlur={() => setPreview(null)}
                        aria-pressed={isActive}
                        className={cn(
                          "inline-flex min-w-[3.5rem] items-center justify-center rounded-lg border px-4 py-2.5 sm:px-3 sm:py-1.5 text-[15px] sm:text-sm font-medium transition-colors",
                          isActive
                            ? "border-brand bg-accent-muted text-brand"
                            : "border-border bg-surface text-text-primary hover:border-brand hover:text-brand",
                        )}
                      >
                        {v.value}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* 11. Qty stepper + Add to Cart + Wishlist heart */}
      {currentVariant?.id ? (
        <div id={ctaSentinelId} className="space-y-3">
          <div className="flex items-stretch gap-2">
            {/* Qty stepper */}
            <div className="inline-flex h-12 items-center overflow-hidden rounded-lg border border-border bg-surface">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, (Number(q) || 1) - 1))}
                disabled={Number(qty) <= 1}
                aria-label={t("qtyDecrease")}
                className="flex h-full w-10 shrink-0 items-center justify-center text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary disabled:opacity-40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
                  <path d="M5 12h14" />
                </svg>
              </button>
              <input
                type="number"
                min="1"
                max="99"
                value={qty}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    setQty("" as unknown as number);
                    return;
                  }
                  const num = parseInt(val, 10);
                  if (!isNaN(num)) {
                    setQty(Math.min(99, num));
                  }
                }}
                onBlur={() => {
                  if (!qty || Number.isNaN(Number(qty)) || Number(qty) < 1) {
                    setQty(1);
                  }
                }}
                className="w-12 min-w-0 bg-transparent text-center text-base font-semibold tabular-nums text-text-primary outline-none focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(99, (Number(q) || 1) + 1))}
                disabled={Number(qty) >= 99}
                aria-label={t("qtyIncrease")}
                className="flex h-full w-10 shrink-0 items-center justify-center text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary disabled:opacity-40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>

            {/* Add to Cart */}
            <AddToCartButton
              variantId={currentVariant.id}
              size="lg"
              fullWidth
            />
          </div>

          {/* 12. Buy Now */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            fullWidth
            loading={buyBusy}
            disabled={!cart || cartLoading || buyBusy}
            onClick={() => {
              void buyNow();
            }}
            className="cta-glow"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <path d="M13 2 3 14h9l-1 8 10-12h-9z" />
            </svg>
            <span>{t("buyNow")}</span>
          </Button>

          {/* 13. Trust grid */}
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-border bg-surface-subtle p-4">
            <TrustCell
              title={t("trustGrid.delivery.title")}
              body={t("trustGrid.delivery.body")}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                  <rect x="1" y="7" width="14" height="10" rx="1" />
                  <path d="M15 10h4l3 3v4h-7" />
                  <circle cx="6" cy="18" r="1.8" />
                  <circle cx="18" cy="18" r="1.8" />
                </svg>
              }
            />
            <TrustCell
              title={t("trustGrid.warranty.title")}
              body={t("trustGrid.warranty.body")}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                  <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              }
            />
            <TrustCell
              title={t("trustGrid.returns.title")}
              body={t("trustGrid.returns.body")}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                  <path d="M3 7h13a4 4 0 0 1 4 4v2" />
                  <polyline points="7 3 3 7 7 11" />
                  <path d="M21 17H8a4 4 0 0 1-4-4v-2" />
                  <polyline points="17 21 21 17 17 13" />
                </svg>
              }
            />
            <TrustCell
              title={t("trustGrid.cod.title")}
              body={t("trustGrid.cod.body")}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                  <rect x="3" y="6" width="18" height="12" rx="2" />
                  <path d="M3 10h18" />
                  <circle cx="17" cy="14" r="1.2" fill="currentColor" />
                </svg>
              }
            />
          </div>

          {/* 14. Wishlist + Compare — centered below trust grid */}
          {wishlistItem || compareItem ? (
            <div className="flex items-center justify-center gap-4 pt-2">
              {wishlistItem ? <WishlistButton item={wishlistItem} /> : null}
              {compareItem ? <CompareButton item={compareItem} /> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function TrustCell({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-brand">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-text-primary">{title}</div>
        <div className="text-[11px] leading-tight text-text-secondary">
          {body}
        </div>
      </div>
    </div>
  );
}
