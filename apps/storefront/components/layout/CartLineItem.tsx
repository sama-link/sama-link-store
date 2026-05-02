"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { type StoreCartLineItem } from "@/hooks/useCart";
import { formatPrice } from "@/lib/format-price";
import { cn } from "@/lib/cn";
import { motion } from "framer-motion";
import { Minus, Plus, Trash2, Package } from "lucide-react";

export interface CartLineItemProps {
  item: StoreCartLineItem;
  currencyCode: string;
  onUpdate: (lineItemId: string, quantity: number) => Promise<void>;
  onRemove: (lineItemId: string) => Promise<void>;
  removeLabel: string;
  /** "drawer" = spaced list with bottom borders; "page" = padded row for divide-y parent ul */
  variant?: "drawer" | "page";
}

export default function CartLineItem({
  item,
  currencyCode,
  onUpdate,
  onRemove,
  removeLabel,
  variant = "drawer",
}: CartLineItemProps) {
  const locale = useLocale();
  const [localQty, setLocalQty] = useState<number | string>(item.quantity ?? 1);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setLocalQty(item.quantity ?? 1);
  }, [item.quantity]);

  const handleUpdate = async (val: number) => {
    if (val < 1) val = 1;
    if (val > 99) val = 99;
    setLocalQty(val);
    setIsUpdating(true);
    await onUpdate(item.id, val);
    setIsUpdating(false);
  };

  const handleRemove = async () => {
    setIsUpdating(true);
    await onRemove(item.id);
  };

  const qty = item.quantity ?? 1;
  const variantTitle =
    item.variant &&
    typeof item.variant === "object" &&
    "title" in item.variant
      ? String((item.variant as { title?: string }).title ?? "")
      : "";
  const showVariantTitle =
    variantTitle.trim() !== "" &&
    variantTitle.trim() !== (item.title ?? "").trim();

  const isPage = variant === "page";

  return (
    <li
      className={cn(
        "group flex flex-col sm:flex-row sm:items-center gap-4 transition-colors",
        isPage
          ? "p-4 sm:p-5 hover:bg-surface-subtle/50"
          : "border-b border-border py-4 last:border-b-0"
      )}
    >
      <div className="flex gap-4 w-full">
        <div
          className={cn(
            "relative shrink-0 overflow-hidden rounded-xl border border-border bg-surface-subtle transition-transform group-hover:scale-[1.02]",
            isPage ? "h-24 w-24 sm:h-28 sm:w-28" : "h-20 w-20"
          )}
        >
          {item.thumbnail ? (
            <Image
              src={item.thumbnail}
              alt={item.title ?? ""}
              fill
              sizes="(min-width: 640px) 112px, 96px"
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-text-muted">
              <Package className="h-8 w-8 opacity-20" />
            </div>
          )}
        </div>
        
        <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
          <div>
            <div className="flex justify-between items-start gap-4">
              <p className={cn(
                "font-semibold text-text-primary line-clamp-2",
                isPage ? "text-base sm:text-lg" : "text-sm"
              )}>
                {item.title}
              </p>
              {!isPage && (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={isUpdating}
                  className="text-text-muted hover:text-error transition-colors p-1 disabled:opacity-50"
                  aria-label={removeLabel}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            {showVariantTitle && (
              <p className="mt-1 text-sm text-text-secondary line-clamp-1">{variantTitle}</p>
            )}
          </div>
          
          <div className={cn(
            "mt-4 flex flex-wrap items-center justify-between gap-4",
            !isPage && "mt-2"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex items-center rounded-lg border border-border bg-surface p-1 shadow-sm",
                isUpdating && "opacity-60 pointer-events-none"
              )}>
                <button
                  type="button"
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary active:scale-95 disabled:opacity-40 disabled:hover:bg-transparent",
                    isPage ? "h-10 w-10" : "h-9 w-9"
                  )}
                  disabled={qty <= 1}
                  onClick={() => handleUpdate(qty - 1)}
                >
                  <Minus className={isPage ? "h-4 w-4" : "h-3.5 w-3.5"} />
                </button>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={localQty}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setLocalQty("");
                      return;
                    }
                    const num = parseInt(val, 10);
                    if (!isNaN(num)) {
                      handleUpdate(Math.min(99, num));
                    }
                  }}
                  onBlur={() => {
                    if (!localQty || Number.isNaN(Number(localQty)) || Number(localQty) < 1) {
                      handleUpdate(1);
                    }
                  }}
                  className={cn(
                    "min-w-0 bg-transparent text-center font-bold tabular-nums text-text-primary outline-none focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]",
                    isPage ? "w-12 text-sm" : "w-10 text-xs"
                  )}
                />
                <button
                  type="button"
                  disabled={qty >= 99}
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary active:scale-95 disabled:opacity-40 disabled:hover:bg-transparent",
                    isPage ? "h-10 w-10" : "h-9 w-9"
                  )}
                  onClick={() => handleUpdate(Math.min(99, qty + 1))}
                >
                  <Plus className={isPage ? "h-4 w-4" : "h-3.5 w-3.5"} />
                </button>
              </div>
              
              {isPage && (
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-error disabled:opacity-50"
                  onClick={handleRemove}
                  disabled={isUpdating}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">{removeLabel}</span>
                </button>
              )}
            </div>

            <div className="flex flex-col items-end">
              <span className={cn(
                "font-bold text-text-primary",
                isPage ? "text-lg" : "text-sm"
              )}>
                {formatPrice(item.unit_price * qty, currencyCode, locale)}
              </span>
              {qty > 1 && (
                <span className="text-xs text-text-muted mt-0.5">
                  {formatPrice(item.unit_price, currencyCode, locale)} / ea
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
