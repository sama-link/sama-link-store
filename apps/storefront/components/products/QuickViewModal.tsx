"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatCatalogPrice } from "@/lib/format-price";
import type { ListProduct } from "@/hooks/useWishlist";
import { localizeTitle, localizeDescription } from "@/lib/product-i18n";
import AddToCartButton from "@/components/products/AddToCartButton";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";

function stripDescription(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 320);
}

export interface QuickViewModalProps {
  product: ListProduct;
  open: boolean;
  onClose: () => void;
}

export default function QuickViewModal({
  product,
  open,
  onClose,
}: QuickViewModalProps) {
  const t = useTranslations("products.quickView");
  const tDetail = useTranslations("products.detail");
  const locale = useLocale();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const variants = product.variants ?? [];
  const [selectedVariantId, setSelectedVariantId] = useState(
    variants[0]?.id ?? "",
  );

  useEffect(() => {
    setSelectedVariantId(variants[0]?.id ?? "");
  }, [product.id, variants]);

  const selectedVariant =
    variants.find((v: any) => v.id === selectedVariantId) ?? variants[0];
  const calc = selectedVariant?.calculated_price;
  const priceLabel =
    formatCatalogPrice(
      calc?.calculated_amount != null
        ? Number(calc.calculated_amount)
        : null,
      calc?.currency_code,
      locale,
    ) || null;

  /* ADR-047 · Prefer metadata.translations.ar.{title,description} on ar locale. */
  const displayTitle = localizeTitle(product, locale);
  const displayDescription = localizeDescription(product, locale);
  const plainDesc = stripDescription(displayDescription ?? "");

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
      const focusable = el.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus();
    } else if (el.open) {
      el.close();
    }
  }, [open]);

  const onDialogKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDialogElement>) => {
      if (e.key !== "Tab" || !dialogRef.current) return;
      const root = dialogRef.current;
      const focusables = [
        ...root.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((n) => !n.hasAttribute("disabled") && n.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    },
    [],
  );

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-modal="true"
      className={cn(
        "fixed inset-0 z-[70] m-auto h-fit max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-lg border border-border bg-surface p-0 text-text-primary shadow-lg [&::backdrop]:bg-text-primary/40",
        "open:flex open:flex-col",
      )}
      onKeyDown={onDialogKeyDown}
      onClick={(e) => {
        if (e.target === dialogRef.current) handleClose();
      }}
      onClose={handleClose}
    >
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold text-text-primary">
            {t("title")}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={handleClose}
          >
            {t("close")}
          </Button>
        </div>

        <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-surface-subtle">
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={displayTitle}
              fill
              sizes="(min-width: 640px) 28rem, 100vw"
              className="object-cover"
            />
          ) : null}
        </div>

        {displayTitle ? (
          <p className="text-base font-semibold text-text-primary">
            {displayTitle}
          </p>
        ) : null}

        {priceLabel ? (
          <p className="text-lg font-bold text-brand">{priceLabel}</p>
        ) : null}

        {plainDesc ? (
          <p className="text-sm leading-relaxed text-text-secondary">
            {plainDesc}
          </p>
        ) : null}

        {variants.length > 1 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-primary">
              {t("chooseVariant")}
            </p>
            <div className="flex flex-wrap gap-2">
              {variants.map((v: any, idx: number) => {
                const id = v.id;
                if (!id) return null;
                const active = id === selectedVariantId;
                const variantTitle = (
                  v as { title?: string | null }
                ).title?.trim();
                const label =
                  variantTitle ||
                  `${tDetail("variantDefault")} ${idx + 1}`;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedVariantId(id)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "border-brand bg-brand text-text-inverse"
                        : "border-border bg-surface-subtle text-text-primary hover:border-brand",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {selectedVariant?.id ? (
          <AddToCartButton
            variantId={selectedVariant.id}
            variant="primary"
            size="md"
            fullWidth
          />
        ) : null}

        {product.handle ? (
          <Link
            href={`/${locale}/products/${product.handle}`}
            className="text-center text-sm font-medium text-brand underline-offset-4 hover:underline"
            onClick={handleClose}
          >
            {t("viewDetails")}
          </Link>
        ) : null}
      </div>
    </dialog>
  );
}
