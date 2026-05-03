"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import type { ListProduct } from "@/hooks/useWishlist";
import { localizeTitle, localizeDescription } from "@/lib/product-i18n";
import AddToCartButton from "@/components/products/AddToCartButton";
import { cn } from "@/lib/cn";
import Price from "@/components/ui/Price";

const QUICK_VIEW_EXIT_MS = 250;

function stripDescription(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const wasOpenRef = useRef(false);
  const closingOnceRef = useRef(false);
  const exitFallbackTimerRef = useRef<number | null>(null);
  const navigateAfterRef = useRef<string | null>(null);
  const [exiting, setExiting] = useState(false);
  const [panelEnterKey, setPanelEnterKey] = useState(0);
  const titleId = useId();
  const variants = product.variants ?? [];
  const [selectedVariantId, setSelectedVariantId] = useState(
    variants[0]?.id ?? "",
  );
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    setSelectedVariantId(variants[0]?.id ?? "");
  }, [product.id, variants]);

  const selectedVariant =
    variants.find((v: any) => v.id === selectedVariantId) ?? variants[0];
  const calc = selectedVariant?.calculated_price;

  /* ADR-047 · Prefer metadata.translations.ar.{title,description} on ar locale. */
  const displayTitle = localizeTitle(product, locale);
  const displayDescription = localizeDescription(product, locale);
  const plainDesc = stripDescription(displayDescription ?? "");

  const finishClose = useCallback(() => {
    if (exitFallbackTimerRef.current != null) {
      window.clearTimeout(exitFallbackTimerRef.current);
      exitFallbackTimerRef.current = null;
    }
    if (closingOnceRef.current) return;
    closingOnceRef.current = true;
    const href = navigateAfterRef.current;
    navigateAfterRef.current = null;
    /* Close the native top layer first. If we clear `exiting` before this, backdrop
       classes snap back to full opacity for a frame and flicker behind the panel. */
    const el = dialogRef.current;
    if (el?.open) el.close();
    setExiting(false);
    onClose();
    if (href) router.push(href);
  }, [onClose, router]);

  const requestClose = useCallback((navigateTo?: string | null) => {
    if (exiting) return;
    if (navigateTo) navigateAfterRef.current = navigateTo;
    setExiting(true);
  }, [exiting]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      setExiting(false);
      closingOnceRef.current = false;
      if (!wasOpenRef.current) {
        setPanelEnterKey((k) => k + 1);
      }
      wasOpenRef.current = true;
      if (!el.open) el.showModal();
      const focusable = el.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus();
    } else if (el.open) {
      wasOpenRef.current = false;
      setExiting(false);
      el.close();
    } else {
      wasOpenRef.current = false;
      setExiting(false);
    }
    if (!open) {
      closingOnceRef.current = false;
    }
  }, [open]);

  /* Fallback if animationend does not fire (e.g. reduced motion / browser quirks). */
  useEffect(() => {
    if (!exiting) return;
    exitFallbackTimerRef.current = window.setTimeout(() => {
      exitFallbackTimerRef.current = null;
      finishClose();
    }, QUICK_VIEW_EXIT_MS + 120);
    return () => {
      if (exitFallbackTimerRef.current != null) {
        window.clearTimeout(exitFallbackTimerRef.current);
        exitFallbackTimerRef.current = null;
      }
    };
  }, [exiting, finishClose]);

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

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-modal="true"
      className={cn(
        /* Full-viewport layer; `grid` + centering only when `[open]` so we never
           override the UA `dialog:not([open]) { display: none }` (was causing the
           shell to stay visible when closed). */
        "fixed inset-0 z-[70] m-0 h-dvh w-full max-w-none border-0 bg-transparent p-4 sm:p-5 text-text-primary shadow-none outline-none",
        "open:grid open:place-items-center",
        /* Static backdrop — fading ::backdrop separately then calling close() caused a
           one-frame flash at the end; the panel exit animation carries the fade. */
        "[&::backdrop]:bg-text-primary/40",
        exiting && "pointer-events-none",
      )}
      onKeyDown={onDialogKeyDown}
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) requestClose();
      }}
    >
      <div
        key={panelEnterKey}
        className={cn(
          "flex w-[min(28rem,calc(100vw-2.5rem))] max-h-[min(90dvh,calc(100dvh-2.5rem))] flex-col overflow-y-auto rounded-xl border border-border bg-surface p-0 shadow-lg",
          exiting
            ? "animate-quick-view-dialog-exit"
            : "animate-quick-view-dialog-enter",
        )}
        onAnimationEnd={(e) => {
          if (e.target !== e.currentTarget) return;
          if (!exiting) return;
          if (!e.animationName.includes("quick-view-dialog-exit")) return;
          finishClose();
        }}
      >
        <div className="flex flex-col gap-4 p-4 sm:p-6 sm:pb-6">
          <div className="flex items-center justify-between gap-3 mb-1">
          <h2 id={titleId} className="text-[15px] font-bold text-text-primary">
            {t("title")}
          </h2>
          <button
            type="button"
            className="text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors"
            onClick={() => requestClose()}
          >
            {t("close")}
          </button>
          </div>

          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-surface-subtle">
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={displayTitle ?? ""}
              fill
              sizes="(min-width: 640px) 28rem, 100vw"
              className="object-contain p-4 mix-blend-multiply"
            />
          ) : null}
          </div>

          <div className="flex flex-col gap-2 mt-1">
          {displayTitle ? (
            <h3 className="text-[17px] font-bold leading-tight text-text-primary">
              {displayTitle}
            </h3>
          ) : null}

          {calc?.calculated_amount != null && calc?.currency_code ? (
            <Price
              amount={Number(calc.calculated_amount)}
              currencyCode={calc.currency_code}
              size="lg"
              className="text-brand font-bold mt-1"
            />
          ) : null}
          </div>

          {plainDesc ? (
          <div className="relative">
            <div
              className={cn(
                "text-[14px] leading-relaxed text-text-secondary transition-[max-height] duration-300 ease-in-out overflow-hidden",
                descExpanded ? "max-h-[1000px]" : "max-h-[66px]"
              )}
            >
              {plainDesc}
            </div>
            {!descExpanded && plainDesc.length > 130 && (
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-surface to-transparent" />
            )}
            {plainDesc.length > 130 && (
              <button
                type="button"
                onClick={() => setDescExpanded(!descExpanded)}
                className="mt-1 text-[13px] font-medium text-brand hover:underline"
              >
                {descExpanded ? tDetail("showLess") : tDetail("showMore")}
              </button>
            )}
          </div>
          ) : null}

          {variants.length > 1 ? (
          <div className="space-y-2 mt-1">
            <p className="text-[13px] font-medium text-text-primary">
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
                      "rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors",
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

          <div className="mt-2 flex flex-col gap-3">
          {selectedVariant?.id ? (
            <AddToCartButton
              variantId={selectedVariant.id}
              variant="primary"
              size="lg"
              fullWidth
              className="cta-glow"
            />
          ) : null}

          {product.handle ? (
            <Link
              href={`/${locale}/products/${product.handle}`}
              className="text-center text-[13px] font-medium text-text-secondary underline-offset-4 transition-colors hover:text-brand hover:underline"
              onClick={(e) => {
                e.preventDefault();
                requestClose(`/${locale}/products/${product.handle}`);
              }}
            >
              {t("viewDetails")}
            </Link>
          ) : null}
          </div>
        </div>
      </div>
    </dialog>
  );
}
