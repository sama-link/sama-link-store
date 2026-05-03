"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCart } from "@/hooks/useCart";
import { initiatePaymentSession } from "@/lib/medusa-client";
import { cn } from "@/lib/cn";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, AlertCircle, Loader2, ChevronRight, CheckCircle2 } from "lucide-react";

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
  const isArabic = locale === "ar";

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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-subtle p-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface text-text-muted shadow-sm">
          <CreditCard className="h-8 w-8" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-text-primary">
          {t("title")}
        </h2>
        <p className="text-sm text-text-secondary max-w-sm">
          {t("noOptions")}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-muted text-brand">
          <CreditCard className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-text-primary">
          {t("title")}
        </h2>
      </div>

      <fieldset disabled={disabled} className="space-y-4 pt-2">
        <legend className="sr-only">{t("title")}</legend>
        <div className="grid grid-cols-1 gap-4">
          {enabledProviders.map((provider) => {
            const isSelected = selectedId === provider.id;
            return (
              <motion.label
                key={provider.id}
                whileHover={!disabled ? { scale: 1.01 } : {}}
                whileTap={!disabled ? { scale: 0.99 } : {}}
                className={cn(
                  "group relative flex cursor-pointer items-center justify-between overflow-hidden rounded-xl border p-4 transition-all sm:p-5",
                  isSelected
                    ? "border-brand bg-brand/5 shadow-sm ring-1 ring-brand"
                    : "border-border bg-surface hover:border-brand/50 hover:shadow-sm",
                  disabled && "cursor-not-allowed opacity-50",
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="radio"
                      name="payment_provider"
                      value={provider.id}
                      checked={isSelected}
                      onChange={() => setSelectedId(provider.id)}
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-full border-2 border-border transition-all checked:border-brand hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                    />
                    <motion.div
                      initial={false}
                      animate={{ scale: isSelected ? 1 : 0 }}
                      className="pointer-events-none absolute h-2.5 w-2.5 rounded-full bg-brand"
                    />
                  </div>
                  <span className={cn(
                    "text-sm font-medium transition-colors",
                    isSelected ? "text-brand font-semibold" : "text-text-primary group-hover:text-brand"
                  )}>
                    {getProviderLabel(provider.id)}
                  </span>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <CheckCircle2 className="h-5 w-5 text-brand" />
                  </motion.div>
                )}
              </motion.label>
            );
          })}
        </div>
      </fieldset>

      <AnimatePresence>
        {apiError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-error-muted p-4 text-sm text-error">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p role="alert">{apiError}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 flex items-center justify-end border-t border-border pt-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={disabled || !selectedId}
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-brand px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-hover hover:shadow-md disabled:opacity-70 disabled:hover:scale-100"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {t("saving")}
            </>
          ) : (
            <>
              {t("continue")}
              <ChevronRight className={cn("h-5 w-5", isArabic && "rotate-180")} />
            </>
          )}
        </motion.button>
      </div>
    </form>
  );
}
