import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { getAuthToken } from "@/lib/auth-cookie";
import { formatPrice } from "@/lib/format-price";
import { listCustomerOrders, type ListCustomerOrdersResult } from "@/lib/medusa-client";
import { getOrderGrandTotal } from "@/lib/order-totals";
import { Package, Calendar, ChevronRight, AlertCircle, SearchX } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  FULFILLMENT_STATUS_KEYS,
  PAYMENT_STATUS_KEYS,
  displayOrderStatus,
  displayOrderStatusVariant,
  formatOrderDate,
  localizeStatus,
} from "./order-display";

interface OrdersPageProps {
  params: Promise<{ locale: string }>;
}

type OrderListItem = ListCustomerOrdersResult["orders"][number];

function itemCount(order: OrderListItem): number {
  return Array.isArray(order.items) ? order.items.length : 0;
}

export default async function OrdersPage({ params }: OrdersPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  const token = await getAuthToken();

  const isArabic = locale === "ar";

  if (!token) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-muted text-brand">
              <Package className="h-5 w-5" />
            </div>
            {t("orders.heading")}
          </h1>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3 rounded-xl bg-error-muted p-4 text-error">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-semibold">{t("orders.errorHeading")}</p>
              <p className="mt-1 text-sm">{t("orders.errorBody")}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  try {
    const { orders, count } = await listCustomerOrders(token, {
      limit: 50,
      order: "-created_at",
      fields:
        "id,display_id,created_at,total,currency_code,status,payment_status,fulfillment_status,*items",
    });

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-muted text-brand">
              <Package className="h-5 w-5" />
            </div>
            {t("orders.heading")}
          </h1>
          <p className="mt-2 text-sm text-text-secondary">{t("orders.subheading")}</p>
        </div>

        <div className="sm:rounded-2xl sm:border border-border bg-surface py-4 sm:p-6 sm:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:sm:shadow-[0_8px_30px_rgb(255,255,255,0.02)]">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-subtle p-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface text-text-muted shadow-sm">
                <SearchX className="h-8 w-8" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-text-primary">{t("orders.empty.heading")}</h2>
              <p className="mb-6 max-w-sm text-sm text-text-secondary">{t("orders.empty.body")}</p>
              <Link
                href={`/${locale}/products`}
                className="inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-hover hover:shadow"
              >
                {t("orders.empty.startCta")}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <ul className="space-y-4">
                {orders.map((order) => {
                  const primaryStatus = displayOrderStatus(
                    order.status,
                    order.payment_status ?? null,
                    order.fulfillment_status ?? null,
                    t,
                  );
                  const primaryStatusVariant = displayOrderStatusVariant(
                    order.status,
                    order.payment_status ?? null,
                    order.fulfillment_status ?? null,
                  );
                  const paymentStatus = localizeStatus(
                    order.payment_status ?? null,
                    t,
                    PAYMENT_STATUS_KEYS,
                  );
                  const fulfillmentStatus = localizeStatus(
                    order.fulfillment_status ?? null,
                    t,
                    FULFILLMENT_STATUS_KEYS,
                  );

                  return (
                    <li key={order.id}>
                      <Link
                        href={`/${locale}/account/orders/${order.id}`}
                        className="group block overflow-hidden rounded-xl border border-border bg-surface transition-all hover:border-brand-muted hover:shadow-md"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border bg-surface-subtle p-4 sm:px-6">
                          <div className="flex items-center gap-3 mb-2 sm:mb-0">
                            <span className="font-semibold text-text-primary group-hover:text-brand transition-colors">
                              #{typeof order.display_id === "number" ? order.display_id : order.id}
                            </span>
                            {primaryStatus && (
                              <Badge variant={primaryStatusVariant} className="shadow-none">{primaryStatus}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-text-secondary">
                            <Calendar className="h-4 w-4" />
                            {formatOrderDate(locale, order.created_at)}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 gap-4">
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex flex-col">
                              <span className="text-xs text-text-muted mb-1">{t("orders.paymentLabel")}</span>
                              <span className="text-sm font-medium text-text-primary">{paymentStatus || "—"}</span>
                            </div>
                            <div className="h-8 w-[1px] bg-border hidden sm:block"></div>
                            <div className="flex flex-col">
                              <span className="text-xs text-text-muted mb-1">{t("orders.deliveryLabel")}</span>
                              <span className="text-sm font-medium text-text-primary">{fulfillmentStatus || "—"}</span>
                            </div>
                            <div className="h-8 w-[1px] bg-border hidden sm:block"></div>
                            <div className="flex flex-col">
                              <span className="text-xs text-text-muted mb-1">{isArabic ? "الكمية" : "Items"}</span>
                              <span className="text-sm font-medium text-text-primary">
                                {t("orders.itemsCount", { count: itemCount(order) })}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-border pt-4 sm:border-0 sm:pt-0">
                            <div className="flex flex-col items-start sm:items-end">
                              <span className="text-xs text-text-muted mb-1">{isArabic ? "الإجمالي" : "Total"}</span>
                              <span className="text-lg font-bold text-text-primary">
                                {formatPrice(getOrderGrandTotal(order), order.currency_code || "EGP", locale)}
                              </span>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-subtle text-text-secondary group-hover:bg-brand group-hover:text-white transition-colors">
                              <span className="sr-only">{t("orders.viewDetails")}</span>
                              <ChevronRight className={cn("h-5 w-5", isArabic && "rotate-180")} aria-hidden="true" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {count > orders.length && (
                <div className="pt-4 text-center">
                  <p className="text-sm font-medium text-text-secondary">
                    {t("orders.showingHint", { shown: orders.length, total: count })}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  } catch {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-muted text-brand">
              <Package className="h-5 w-5" />
            </div>
            {t("orders.heading")}
          </h1>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3 rounded-xl bg-error-muted p-4 text-error">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-semibold">{t("orders.errorHeading")}</p>
              <p className="mt-1 text-sm">{t("orders.errorBody")}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
