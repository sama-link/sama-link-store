import type { getTranslations } from "next-intl/server";

type Translator = Awaited<ReturnType<typeof getTranslations>>;

export const ORDER_STATUS_KEYS: Record<string, string> = {
  pending: "status.pending",
  completed: "status.completed",
  canceled: "status.canceled",
  archived: "status.archived",
  requires_action: "status.requiresAction",
};

export const PAYMENT_STATUS_KEYS: Record<string, string> = {
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

export const FULFILLMENT_STATUS_KEYS: Record<string, string> = {
  not_fulfilled: "fulfillmentStatus.notFulfilled",
  partially_fulfilled: "fulfillmentStatus.partiallyFulfilled",
  fulfilled: "fulfillmentStatus.fulfilled",
  partially_shipped: "fulfillmentStatus.partiallyShipped",
  shipped: "fulfillmentStatus.shipped",
  partially_delivered: "fulfillmentStatus.partiallyDelivered",
  delivered: "fulfillmentStatus.delivered",
  canceled: "fulfillmentStatus.canceled",
};

export function fallbackStatusLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function localizeStatus(
  value: string | null | undefined,
  t: Translator,
  map: Record<string, string>,
): string | null {
  if (!value) return null;
  const key = map[value];
  if (!key) return fallbackStatusLabel(value);
  return t(`orders.${key}`);
}

export function statusVariant(value: string | null | undefined) {
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

export function customerStatusLabel(
  orderStatus: string | null | undefined,
  paymentStatus: string | null | undefined,
  fulfillmentStatus: string | null | undefined,
  t: Translator,
): string {
  if (orderStatus === "canceled" || paymentStatus === "canceled") {
    return t("orders.customerStatus.canceled");
  }
  if (fulfillmentStatus === "delivered") {
    return t("orders.customerStatus.delivered");
  }
  if (fulfillmentStatus === "shipped" || fulfillmentStatus === "partially_shipped") {
    return t("orders.customerStatus.shipped");
  }
  if (fulfillmentStatus === "fulfilled" || fulfillmentStatus === "partially_fulfilled") {
    return t("orders.customerStatus.processing");
  }
  if (paymentStatus === "captured" || paymentStatus === "authorized") {
    return t("orders.customerStatus.paid");
  }
  if (orderStatus === "requires_action" || paymentStatus === "requires_action") {
    return t("orders.customerStatus.actionRequired");
  }
  return t("orders.customerStatus.pending");
}

export function formatOrderDate(locale: string, value?: string | Date | null) {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "-";
  const intlLocale = locale === "ar" ? "ar-EG" : "en-US";
  return new Intl.DateTimeFormat(intlLocale, { dateStyle: "medium" }).format(date);
}
