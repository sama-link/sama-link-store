"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCart } from "@/hooks/useCart";
import { initiatePaymentSession } from "@/lib/medusa-client";
import { cn } from "@/lib/cn";

export interface PaymentProvider {
  id: string;
  is_enabled: boolean;
}

interface PaymentMethodSelectorProps {
  locale: string;
  providers: PaymentProvider[];
}

export default function PaymentMethodSelector({
  locale,
  providers,
}: PaymentMethodSelectorProps) {
  const t = useTranslations("checkout.payment");
  const router = useRouter();
  const { cart, loading: cartLoading } = useCart();

  const enabledProviders = providers.filter((p) => p.is_enabled);

  const [selectedId, setSelectedId] = useState<string | null>(
    enabledProviders.length === 1 ? (enabledProviders[0]?.id ?? null) : null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const disabled = cartLoading || submitting;

  function getProviderLabel(id: string): string {
    const key = `providers.${id}` as const;
    try {
      return t(key as Parameters<typeof t>[0]);
    } catch {
      return id;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !cart) return;

    setSubmitting(true);
    setApiError("");

    try {
      await initiatePaymentSession(cart.id, selectedId);
      router.push(`/${locale}/checkout/review`);
    } catch {
      setApiError(t("error"));
      setSubmitting(false);
    }
  }

  if (enabledProviders.length === 0) {
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
        {enabledProviders.map((provider) => {
          const isSelected = selectedId === provider.id;
          return (
            <label
              key={provider.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-md border p-4 transition-colors",
                isSelected
                  ? "border-brand bg-surface ring-1 ring-brand"
                  : "border-border bg-surface hover:border-brand/50",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <input
                type="radio"
                name="payment_provider"
                value={provider.id}
                checked={isSelected}
                onChange={() => setSelectedId(provider.id)}
                className="accent-brand"
              />
              <span className="text-sm font-medium text-text-primary">
                {getProviderLabel(provider.id)}
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
