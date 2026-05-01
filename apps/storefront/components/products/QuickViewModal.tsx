"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatCatalogPrice } from "@/lib/format-price";
import type { ListProduct } from "@/hooks/useWishlist";
import { localizeTitle, localizeDescription } from "@/lib/product-i18n";
import { htmlToPlainText, buildDescriptionPreview } from "@/lib/product-description-preview";
import AddToCartButton from "@/components/products/AddToCartButton";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";

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
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  useEffect(() => {
    setSelectedVariantId(variants[0]?.id ?? "");
  }, [product.id, variants]);

  useEffect(() => {
    if (open) setDescriptionExpanded(false);
  }, [open, product.id]);

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
  const plainDescription = useMemo(
    () => htmlToPlainText(displayDescription ?? ""),
    [displayDescription],
  );
  const { preview, hasMore } = useMemo(
    () => buildDescriptionPreview(plainDescription),
    [plainDescription],
  );

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
        "fixed inset-0 z-[70] m-auto h-fit max-h-[min(92dvh,900px)] w-[min(100%,28rem)] max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-xl border border-border bg-surface p-0 text-text-primary shadow-lg sm:max-w-md [&::backdrop]:bg-text-primary/40",
        "open:flex open:flex-col",
      )}
      onKeyDown={onDialogKeyDown}
      onClick={(e) => {
        if (e.target === dialogRef.current) handleClose();
      }}
      onClose={handleClose}
    >
      <div className="flex flex-col gap-3 p-4 sm:gap-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
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

        <div className="relative mx-auto aspect-[4/3] w-full max-h-[200px] overflow-hidden rounded-xl border border-border bg-surface-subtle sm:aspect-square sm:max-h-none">
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={displayTitle}
              fill
              sizes="(min-width: 640px) 28rem, 100vw"
              className="object-contain p-2 sm:object-cover sm:p-0"
            />
          ) : null}
        </div>

        {displayTitle ? (
          <p className="text-base font-semibold leading-snug text-text-primary">
            {displayTitle}
          </p>
        ) : null}

        {priceLabel ? (
          <p className="text-lg font-bold text-brand">{priceLabel}</p>
        ) : null}

        {plainDescription ? (
          <div className="rounded-lg bg-surface-subtle px-3 py-2.5 sm:px-3.5 sm:py-3">
            <p className="text-sm leading-relaxed text-text-secondary break-words">
              {descriptionExpanded || !hasMore
                ? plainDescription
                : `${preview}…`}
            </p>
            {hasMore ? (
              <button
                type="button"
                className="mt-2 text-sm font-semibold text-brand underline-offset-2 hover:underline"
                aria-expanded={descriptionExpanded}
                onClick={() => setDescriptionExpanded((v) => !v)}
              >
                {descriptionExpanded ? t("seeLess") : t("seeMore")}
              </button>
            ) : null}
          </div>
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
