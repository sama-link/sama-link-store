"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { type StoreCartLineItem } from "@/hooks/useCart";
import { formatPrice } from "@/lib/format-price";
import { cn } from "@/lib/cn";
import {
  clampLineItemQty,
  MAX_LINE_ITEM_QTY,
} from "@/lib/line-item-quantity";

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
  const t = useTranslations("products.detail");
  const locale = useLocale();
  const serverQty = item.quantity ?? 1;
  const [qtyField, setQtyField] = useState(String(serverQty));

  useEffect(() => {
    setQtyField(String(item.quantity ?? 1));
  }, [item.id, item.quantity]);

  const resolvedQty = useMemo(() => {
    const raw = qtyField.trim();
    if (raw === "") return serverQty;
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) return serverQty;
    return clampLineItemQty(n);
  }, [qtyField, serverQty]);

  const variantTitle =
    item.variant &&
    typeof item.variant === "object" &&
    "title" in item.variant
      ? String((item.variant as { title?: string }).title ?? "")
      : "";
  const showVariantTitle =
    variantTitle.trim() !== "" &&
    variantTitle.trim() !== (item.title ?? "").trim();

  return (
    <li
      className={cn(
        "flex gap-3",
        variant === "page"
          ? "px-4 py-4"
          : "border-b border-border pb-4 last:border-b-0 last:pb-0",
      )}
    >
      <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-surface-subtle">
        {item.thumbnail ? (
          <Image
            src={item.thumbnail}
            alt={item.title ?? ""}
            width={56}
            height={56}
            unoptimized
            className="size-full object-cover"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <p className="font-medium text-text-primary">{item.title}</p>
          {showVariantTitle ? (
            <p className="text-sm text-text-secondary">{variantTitle}</p>
          ) : null}
          <p className="text-sm font-medium text-text-primary">
            {formatPrice(item.unit_price, currencyCode, locale)} ×{" "}
            {resolvedQty}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded text-text-primary transition-colors hover:bg-surface-subtle"
              aria-label={t("qtyDecrease")}
              onClick={() => {
                if (resolvedQty <= 1) {
                  void onRemove(item.id);
                } else {
                  void onUpdate(item.id, resolvedQty - 1);
                }
              }}
            >
              −
            </button>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={2}
              aria-label={t("qtyInput")}
              className="h-8 w-9 min-w-9 border-0 bg-transparent px-0.5 text-center text-sm tabular-nums text-text-primary outline-none focus:ring-0 focus-visible:outline-none"
              value={qtyField}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "").slice(0, 2);
                setQtyField(raw);
              }}
              onBlur={() => {
                if (qtyField.trim() === "") {
                  setQtyField("1");
                  if (serverQty !== 1) void onUpdate(item.id, 1);
                  return;
                }
                const n = parseInt(qtyField, 10);
                const next = clampLineItemQty(Number.isNaN(n) ? 1 : n);
                setQtyField(String(next));
                if (next !== serverQty) void onUpdate(item.id, next);
              }}
            />
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded text-text-primary transition-colors hover:bg-surface-subtle disabled:opacity-40"
              aria-label={t("qtyIncrease")}
              disabled={resolvedQty >= MAX_LINE_ITEM_QTY}
              onClick={() => void onUpdate(item.id, resolvedQty + 1)}
            >
              +
            </button>
          </div>
          <button
            type="button"
            className="text-sm font-medium text-text-secondary underline-offset-2 transition-colors hover:text-text-primary"
            onClick={() => void onRemove(item.id)}
          >
            {removeLabel}
          </button>
        </div>
      </div>
    </li>
  );
}
