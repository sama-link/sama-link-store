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

/** Single customer-facing status for orders list + detail (not Medusa raw fields). */
export type PrimaryOrderStatusKey =
  | "cancelled"
  | "delivered"
  | "shipped"
  | "preparing"
  | "paymentPending"
  | "processing";

function isCancelled(
  orderStatus: string | null | undefined,
  paymentStatus: string | null | undefined,
  fulfillmentStatus: string | null | undefined,
): boolean {
  const o = orderStatus ?? "";
  const p = paymentStatus ?? "";
  const f = fulfillmentStatus ?? "";
  return (
    o === "canceled" ||
    o === "cancelled" ||
    p === "canceled" ||
    f === "canceled"
  );
}

function isPaymentPending(paymentStatus: string | null | undefined): boolean {
  const p = paymentStatus ?? "";
  return p === "not_paid" || p === "awaiting" || p === "requires_action";
}

function isPaymentReadyForPreparing(paymentStatus: string | null | undefined): boolean {
  const p = paymentStatus ?? "";
  return (
    p === "captured" ||
    p === "partially_captured" ||
    p === "authorized" ||
    p === "partially_authorized"
  );
}

function isShippedOrDelivered(fulfillmentStatus: string | null | undefined): boolean {
  const f = fulfillmentStatus ?? "";
  return (
    f === "shipped" ||
    f === "partially_shipped" ||
    f === "delivered" ||
    f === "partially_delivered"
  );
}

export function primaryOrderStatus(
  orderStatus: string | null | undefined,
  paymentStatus: string | null | undefined,
  fulfillmentStatus: string | null | undefined,
): PrimaryOrderStatusKey {
  if (isCancelled(orderStatus, paymentStatus, fulfillmentStatus)) {
    return "cancelled";
  }

  const f = fulfillmentStatus ?? "";
  if (f === "delivered" || f === "partially_delivered") {
    return "delivered";
  }
  if (f === "shipped" || f === "partially_shipped") {
    return "shipped";
  }

  if (isPaymentPending(paymentStatus)) {
    return "paymentPending";
  }

  if (isPaymentReadyForPreparing(paymentStatus) && !isShippedOrDelivered(fulfillmentStatus)) {
    return "preparing";
  }

  return "processing";
}

export function primaryOrderStatusLabel(t: Translator, key: PrimaryOrderStatusKey): string {
  return t(`orders.primaryStatus.${key}`);
}

export function primaryOrderStatusVariant(key: PrimaryOrderStatusKey) {
  switch (key) {
    case "cancelled":
      return "error" as const;
    case "delivered":
    case "shipped":
      return "success" as const;
    case "preparing":
    case "paymentPending":
      return "warning" as const;
    default:
      return "default" as const;
  }
}

export function formatOrderDate(locale: string, value?: string | Date | null) {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "-";
  const intlLocale = locale === "ar" ? "ar-EG" : "en-US";
  return new Intl.DateTimeFormat(intlLocale, { dateStyle: "medium" }).format(date);
}
