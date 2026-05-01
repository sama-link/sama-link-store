import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { getAuthToken } from "@/lib/auth-cookie";
import { formatPrice } from "@/lib/format-price";
import { listCustomerOrders, type ListCustomerOrdersResult } from "@/lib/medusa-client";
import { getOrderGrandTotal } from "@/lib/order-totals";
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

  if (!token) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5">
        <h1 className="text-2xl font-semibold text-text-primary">{t("orders.heading")}</h1>
        <div className="mt-4 rounded-md border border-border bg-surface-subtle p-4">
          <p className="text-sm text-error">{t("orders.errorHeading")}</p>
          <p className="mt-1 text-sm text-text-secondary">{t("orders.errorBody")}</p>
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
      <div className="space-y-4 rounded-lg border border-border bg-surface p-5">
        <h1 className="text-2xl font-semibold text-text-primary">{t("orders.heading")}</h1>
        <p className="text-sm text-text-secondary">{t("orders.subheading")}</p>

        {orders.length === 0 ? (
          <div className="rounded-md border border-border bg-surface-subtle p-4">
            <h2 className="text-base font-medium text-text-primary">{t("orders.empty.heading")}</h2>
            <p className="mt-1 text-sm text-text-secondary">{t("orders.empty.body")}</p>
            <Link
              href={`/${locale}/products`}
              className="mt-3 inline-block text-sm font-medium text-brand hover:underline"
            >
              {t("orders.empty.startCta")}
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
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
                <li
                  key={order.id}
                  className="rounded-md border border-border bg-surface-subtle p-4 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={`/${locale}/account/orders/${order.id}`}
                      className="font-medium text-text-primary hover:text-brand hover:underline"
                    >
                      #
                      {typeof order.display_id === "number" ? order.display_id : order.id}
                    </Link>
                    <p className="text-text-secondary">
                      {formatOrderDate(locale, order.created_at)}
                    </p>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-text-secondary">
                    <p>{formatPrice(getOrderGrandTotal(order), order.currency_code || "EGP", locale)}</p>
                    <span aria-hidden="true">·</span>
                    <p>{t("orders.itemsCount", { count: itemCount(order) })}</p>
                  </div>

                  {primaryStatus ? (
                    <div className="mt-3">
                      <Badge variant={primaryStatusVariant}>{primaryStatus}</Badge>
                    </div>
                  ) : null}

                  <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
                    {paymentStatus ? (
                      <div className="flex items-center gap-1">
                        <dt>{t("orders.paymentLabel")}:</dt>
                        <dd className="text-text-primary">{paymentStatus}</dd>
                      </div>
                    ) : null}
                    {fulfillmentStatus ? (
                      <div className="flex items-center gap-1">
                        <dt>{t("orders.deliveryLabel")}:</dt>
                        <dd className="text-text-primary">{fulfillmentStatus}</dd>
                      </div>
                    ) : null}
                  </dl>

                  <Link
                    href={`/${locale}/account/orders/${order.id}`}
                    className="mt-3 inline-block text-sm font-medium text-brand hover:underline"
                  >
                    {t("orders.viewDetails")}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {count > orders.length ? (
          <p className="text-sm text-text-secondary">
            {t("orders.showingHint", { shown: orders.length, total: count })}
          </p>
        ) : null}
      </div>
    );
  } catch {
    return (
      <div className="space-y-4 rounded-lg border border-border bg-surface p-5">
        <h1 className="text-2xl font-semibold text-text-primary">{t("orders.heading")}</h1>
        <div className="rounded-md border border-border bg-surface-subtle p-4">
          <p className="text-sm text-error">{t("orders.errorHeading")}</p>
          <p className="mt-1 text-sm text-text-secondary">{t("orders.errorBody")}</p>
        </div>
      </div>
    );
  }
}
