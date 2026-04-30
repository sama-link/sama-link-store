import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { getAuthToken } from "@/lib/auth-cookie";
import { formatPrice } from "@/lib/format-price";
import { listCustomerOrders, type ListCustomerOrdersResult } from "@/lib/medusa-client";

interface OrdersStubPageProps {
  params: Promise<{ locale: string }>;
}

type OrderListItem = ListCustomerOrdersResult["orders"][number];

const ORDER_STATUS_KEYS: Record<string, string> = {
  pending: "status.pending",
  completed: "status.completed",
  canceled: "status.canceled",
  archived: "status.archived",
  requires_action: "status.requiresAction",
};

const PAYMENT_STATUS_KEYS: Record<string, string> = {
  not_paid: "paymentStatus.notPaid",
  awaiting: "paymentStatus.awaiting",
  authorized: "paymentStatus.authorized",
  partially_authorized: "paymentStatus.partiallyAuthorized",
  captured: "paymentStatus.captured",
  partially_captured: "paymentStatus.partiallyCaptured",
  partially_refunded: "paymentStatus.partiallyRefunded",
  refunded: "paymentStatus.refunded",
  canceled: "paymentStatus.canceled",
  requires_action: "paymentStatus.requiresAction",
};

const FULFILLMENT_STATUS_KEYS: Record<string, string> = {
  not_fulfilled: "fulfillmentStatus.notFulfilled",
  partially_fulfilled: "fulfillmentStatus.partiallyFulfilled",
  fulfilled: "fulfillmentStatus.fulfilled",
  partially_shipped: "fulfillmentStatus.partiallyShipped",
  shipped: "fulfillmentStatus.shipped",
  partially_delivered: "fulfillmentStatus.partiallyDelivered",
  delivered: "fulfillmentStatus.delivered",
  canceled: "fulfillmentStatus.canceled",
};

function fallbackStatusLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function localizeStatus(
  value: string | null | undefined,
  t: Awaited<ReturnType<typeof getTranslations>>,
  map: Record<string, string>,
): string | null {
  if (!value) return null;
  const key = map[value];
  if (!key) return fallbackStatusLabel(value);
  return t(`orders.${key}`);
}

function statusVariant(value: string | null | undefined) {
  if (!value) return "default" as const;
  if (
    value === "completed" ||
    value === "captured" ||
    value === "fulfilled" ||
    value === "shipped" ||
    value === "delivered"
  ) {
    return "success" as const;
  }
  if (
    value === "canceled" ||
    value === "requires_action" ||
    value === "refunded" ||
    value === "partially_refunded"
  ) {
    return "error" as const;
  }
  return "warning" as const;
}

function formatOrderDate(locale: string, value?: string | Date | null) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "—";
  const intlLocale = locale === "ar" ? "ar-EG" : "en-US";
  return new Intl.DateTimeFormat(intlLocale, { dateStyle: "medium" }).format(date);
}

function itemCount(order: OrderListItem): number {
  return Array.isArray(order.items) ? order.items.length : 0;
}

export default async function OrdersStubPage({ params }: OrdersStubPageProps) {
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
              const orderStatus = localizeStatus(order.status, t, ORDER_STATUS_KEYS);
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
                    <p className="font-medium text-text-primary">
                      #
                      {typeof order.display_id === "number" ? order.display_id : order.id}
                    </p>
                    <p className="text-text-secondary">
                      {formatOrderDate(locale, order.created_at)}
                    </p>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-text-secondary">
                    <p>{formatPrice(order.total, order.currency_code || "EGP", locale)}</p>
                    <span aria-hidden="true">·</span>
                    <p>{t("orders.itemsCount", { count: itemCount(order) })}</p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {orderStatus ? (
                      <Badge variant={statusVariant(order.status)}>{orderStatus}</Badge>
                    ) : null}
                    {paymentStatus ? (
                      <Badge variant={statusVariant(order.payment_status ?? null)}>
                        {paymentStatus}
                      </Badge>
                    ) : null}
                    {fulfillmentStatus ? (
                      <Badge variant={statusVariant(order.fulfillment_status ?? null)}>
                        {fulfillmentStatus}
                      </Badge>
                    ) : null}
                  </div>
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
