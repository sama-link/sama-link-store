"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { formatCatalogPrice } from "@/lib/format-price";
import AddToCartButton from "@/components/products/AddToCartButton";
import Button from "@/components/ui/Button";
import ExpandingBadge from "@/components/products/ExpandingBadge";
import { useCart } from "@/hooks/useCart";
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
}

export interface PanelCategory {
  id: string;
  name: string;
  href?: string;
}

interface PurchasePanelProps {
  productOptions: PanelProductOption[];
  variants: PanelVariant[];
  /** Slot id for IntersectionObserver to track CTA visibility (sticky bar). */
  ctaSentinelId?: string;
  /** Product title — rendered as H1 inside the panel per ordering rules. */
  title: string;
  /** Subtitle from product (renders after price). */
  subtitle?: string | null;
  /** Primary category (renders FIRST). */
  category?: PanelCategory | null;
  /** Trust benefits — render above the CTA. */
  benefits: string[];
}

function StockIcon() {
  return (
    <span aria-hidden="true" className="h-2 w-2 rounded-full bg-success" />
  );
}

function TruckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H15M5.25 18.75H3a.75.75 0 0 1-.75-.75V6.75A.75.75 0 0 1 3 6h12a.75.75 0 0 1 .75.75v6.5m1.5 5.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m1.5 0V8.25h3a.75.75 0 0 1 .67.42l1.5 3.43c.05.11.08.23.08.35v5.81a.75.75 0 0 1-.75.75h-1.25"
      />
    </svg>
  );
}

/**
 * Owns selected variant state and renders the right-column purchase block in
 * this exact order (per product direction):
 *   1. Category   2. SKU   3. Title   4. Price   5. Subtitle
 *   6. Variant selectors   7. Benefits   8. CTA   9. Status badges
 */
export default function PurchasePanel({
  productOptions,
  variants,
  ctaSentinelId,
  title,
  subtitle,
  category,
  benefits,
}: PurchasePanelProps) {
  const t = useTranslations("products.detail");
  const locale = useLocale();
  const router = useRouter();
  const { addItem, cart, loading: cartLoading } = useCart();
  const [buyBusy, setBuyBusy] = useState(false);

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

  const priceLabel = displayedVariant
    ? formatCatalogPrice(
        displayedVariant.amount,
        displayedVariant.currencyCode,
        locale,
      ) || null
    : null;

  const isPreview =
    preview != null &&
    currentVariant?.id !== displayedVariant?.id;

  function pick(optionTitle: string, value: string) {
    setSelected((prev) => ({ ...prev, [optionTitle]: value }));
    setPreview(null);
  }

  const buyNow = useCallback(
    async () => {
      if (!currentVariant?.id || !cart || buyBusy || cartLoading) return;
      setBuyBusy(true);
      try {
        await addItem(currentVariant.id, 1);
        router.push(`/${locale}/checkout/address`);
      } catch {
        setBuyBusy(false);
      }
    },
    [addItem, buyBusy, cart, cartLoading, currentVariant?.id, locale, router],
  );

  return (
    <div className="space-y-5">
      {/* 1. Category */}
      {category ? (
        category.href ? (
          <Link
            href={category.href}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-subtle px-3 py-1 text-xs font-medium text-text-primary transition-colors hover:border-brand hover:text-brand"
          >
            {category.name}
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-subtle px-3 py-1 text-xs font-medium text-text-primary">
            {category.name}
          </span>
        )
      ) : null}

      {/* 2. SKU — variant-reactive */}
      {currentVariant?.sku ? (
        <p className="text-xs uppercase tracking-wide text-text-muted">
          {t("sku")}:{" "}
          <span className="font-medium text-text-secondary">
            {currentVariant.sku}
          </span>
        </p>
      ) : null}

      {/* 3. Product title (H1) */}
      <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
        {title}
      </h1>

      {/* 4. Price — smooth preview on variant hover */}
      {priceLabel ? (
        <p
          className={cn(
            "text-4xl font-bold text-brand transition-opacity duration-150",
            isPreview && "opacity-80",
          )}
          aria-live="polite"
        >
          {priceLabel}
        </p>
      ) : null}

      {/* 5. Subtitle */}
      {subtitle ? (
        <p className="text-base text-text-secondary">{subtitle}</p>
      ) : null}

      {/* 6. Variant selectors — compact, value-only, hover previews price */}
      {variants.length > 1 && productOptions.length > 0 ? (
        <div className="space-y-4">
          {productOptions.map((opt) => {
            const currentValue = selected[opt.title] ?? "";
            return (
              <div key={opt.id}>
                <div className="mb-2 flex items-baseline justify-between">
                  <p className="text-sm font-medium text-text-primary">
                    {opt.title}
                  </p>
                  {currentValue ? (
                    <p className="text-sm text-text-secondary">
                      {currentValue}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-stretch gap-1.5">
                  {opt.values.map((v) => {
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
                          "inline-flex min-w-[2.5rem] items-center justify-center rounded-md border px-2.5 py-1 text-sm font-medium transition-colors",
                          isActive
                            ? "border-brand bg-brand text-text-inverse"
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

      {/* 7. Trust benefits — ABOVE the CTA */}
      {benefits.length > 0 ? (
        <ul className="space-y-2 border-t border-border pt-5">
          {benefits.map((benefit) => (
            <li
              key={benefit}
              className="flex items-start gap-2.5 text-sm text-text-primary"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 5.29a.75.75 0 0 1 .006 1.06l-7.25 7.5a.75.75 0 0 1-1.08 0l-3.75-3.875a.75.75 0 1 1 1.08-1.04l3.21 3.318 6.71-6.957a.75.75 0 0 1 1.06-.006Z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {/* 8. CTA + 9. Status badges */}
      {currentVariant?.id ? (
        <div id={ctaSentinelId} className="space-y-3">
          <AddToCartButton
            variantId={currentVariant.id}
            size="lg"
            fullWidth
          />

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
            {t("buyNow")}
          </Button>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <ExpandingBadge
              icon={<StockIcon />}
              label={t("inStock")}
              tone="bg-success-muted text-success"
            />
            <ExpandingBadge
              icon={<TruckIcon />}
              label={t("freeShipping")}
              tone="bg-brand/10 text-brand"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
