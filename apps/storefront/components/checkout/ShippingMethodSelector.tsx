"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCart } from "@/hooks/useCart";
import { addShippingMethodToCart } from "@/lib/medusa-client";
import { formatPrice } from "@/lib/format-price";
import { cn } from "@/lib/cn";

export interface ShippingOption {
  id: string;
  name: string;
  amount: number;
}

interface ShippingMethodSelectorProps {
  locale: string;
  options: ShippingOption[];
}

export default function ShippingMethodSelector({
  locale,
  options,
}: ShippingMethodSelectorProps) {
  const t = useTranslations("checkout.shipping");
  const router = useRouter();
  const { cart, loading: cartLoading } = useCart();

  const currencyCode = cart?.currency_code ?? "USD";

  const existingOptionId =
    cart?.shipping_methods?.[0] != null
      ? options.length === 1
        ? (options[0]?.id ?? null)
        : null
      : null;

  const [selectedId, setSelectedId] = useState<string | null>(
    existingOptionId,
  );
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const disabled = cartLoading || submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !cart) return;

    setSubmitting(true);
    setApiError("");

    try {
      await addShippingMethodToCart(cart.id, selectedId);
      router.push(`/${locale}/checkout/payment`);
    } catch {
      setApiError(t("error"));
      setSubmitting(false);
    }
  }

  if (options.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          {t("title")}
        </h2>
        <p className="text-sm text-text-secondary">{t("noOptions")}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="rounded-lg border border-border bg-surface p-6"
    >
      <h2 className="mb-6 text-lg font-semibold text-text-primary">
        {t("title")}
      </h2>

      <fieldset disabled={disabled} className="space-y-3">
        <legend className="sr-only">{t("title")}</legend>
        {options.map((option) => {
          const isSelected = selectedId === option.id;
          return (
            <label
              key={option.id}
              className={cn(
                "flex cursor-pointer items-center justify-between rounded-md border p-4 transition-colors",
                isSelected
                  ? "border-brand bg-surface ring-1 ring-brand"
                  : "border-border bg-surface hover:border-brand/50",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="shipping_option"
                  value={option.id}
                  checked={isSelected}
                  onChange={() => setSelectedId(option.id)}
                  className="accent-brand"
                />
                <span className="text-sm font-medium text-text-primary">
                  {option.name}
                </span>
              </div>
              <span className="text-sm font-semibold text-text-primary">
                {formatPrice(option.amount, currencyCode, locale)}
              </span>
            </label>
          );
        })}
      </fieldset>

      {apiError ? (
        <p className="mt-4 text-sm text-error" role="alert">
          {apiError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={disabled || !selectedId}
        className="mt-6 w-full rounded-md bg-brand py-2.5 text-sm font-medium text-text-inverse transition-opacity hover:bg-brand-hover disabled:opacity-50"
      >
        {submitting ? t("saving") : t("continue")}
      </button>
    </form>
  );
}
