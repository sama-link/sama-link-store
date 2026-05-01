"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

type TrackOrderResponse = {
  order: {
    id: string;
    display_id: number | null;
    status: string | null;
    payment_status: string | null;
    fulfillment_status: string | null;
    created_at: string | null;
    total: number | null;
    currency_code: string | null;
    items: Array<{
      id: string | null;
      title: string | null;
      quantity: number | null;
      thumbnail: string | null;
    }>;
  } | null;
};

function normalizeOrderRef(input: string): string {
  return input.replace(/^#/, "").trim();
}

function humanizeStatus(value: string | null): string {
  if (!value) return "—";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function TrackOrderClient({ locale }: { locale: string }) {
  const t = useTranslations("trackOrder");
  const [orderRef, setOrderRef] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackOrderResponse["order"]>(null);

  const totalLabel = useMemo(() => {
    if (!result || typeof result.total !== "number") return "—";
    const currency = (result.currency_code || "EGP").toUpperCase();
    try {
      return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(result.total / 100);
    } catch {
      return `${result.total / 100} ${currency}`;
    }
  }, [result, locale]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch("/api/track-order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderRef: normalizeOrderRef(orderRef),
          email: email.trim().toLowerCase(),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; order?: TrackOrderResponse["order"] }
        | null;

      if (!response.ok) {
        throw new Error(payload?.message || t("errors.generic"));
      }
      if (!payload?.order) {
        throw new Error(t("errors.notFound"));
      }
      setResult(payload.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
          {t("kicker")}
        </p>
        <h2 className="mt-3 max-w-3xl text-2xl font-semibold tracking-[-0.02em] text-text-primary sm:text-3xl">
          {t("heading")}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary sm:text-base">
          {t("body")}
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={onSubmit}>
          <label className="space-y-2 text-sm">
            <span className="font-medium text-text-primary">{t("form.orderRefLabel")}</span>
            <input
              value={orderRef}
              onChange={(e) => setOrderRef(e.target.value)}
              placeholder={t("form.orderRefPlaceholder")}
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-brand"
              required
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium text-text-primary">{t("form.emailLabel")}</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("form.emailPlaceholder")}
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-brand"
              required
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="h-11 self-end rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? t("form.loading") : t("form.submit")}
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      </section>

      {result ? (
        <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-surface-subtle p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-text-muted">{t("result.orderNo")}</p>
              <p className="mt-1 text-sm font-semibold text-text-primary">
                #{result.display_id ?? result.id}
              </p>
            </div>
            <div className="rounded-lg bg-surface-subtle p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-text-muted">{t("result.orderStatus")}</p>
              <p className="mt-1 text-sm font-semibold text-text-primary">
                {humanizeStatus(result.status)}
              </p>
            </div>
            <div className="rounded-lg bg-surface-subtle p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-text-muted">
                {t("result.fulfillmentStatus")}
              </p>
              <p className="mt-1 text-sm font-semibold text-text-primary">
                {humanizeStatus(result.fulfillment_status)}
              </p>
            </div>
            <div className="rounded-lg bg-surface-subtle p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-text-muted">{t("result.total")}</p>
              <p className="mt-1 text-sm font-semibold text-text-primary">{totalLabel}</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <h3 className="text-base font-semibold text-text-primary">{t("result.itemsHeading")}</h3>
            {(result.items ?? []).length === 0 ? (
              <p className="text-sm text-text-secondary">{t("result.noItems")}</p>
            ) : (
              result.items.map((item) => (
                <article
                  key={item.id ?? `${item.title}-${item.quantity}`}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <div className="relative h-14 w-14 overflow-hidden rounded-md bg-surface-subtle">
                    {item.thumbnail ? (
                      <Image
                        src={item.thumbnail}
                        alt={item.title ?? "Item"}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {item.title || t("result.untitledItem")}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {t("result.quantity")}: {item.quantity ?? 0}
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
