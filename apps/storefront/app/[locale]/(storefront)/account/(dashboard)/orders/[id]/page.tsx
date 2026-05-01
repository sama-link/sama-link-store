import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import Badge from "@/components/ui/Badge";
import { getAuthToken } from "@/lib/auth-cookie";
import { formatPrice } from "@/lib/format-price";
import { getCustomerOrder, type StoreOrder } from "@/lib/medusa-client";
import {
  FULFILLMENT_STATUS_KEYS,
  PAYMENT_STATUS_KEYS,
  customerStatusLabel,
  displayOrderStatus,
  displayOrderStatusVariant,
  formatOrderDate,
  localizeStatus,
  statusVariant,
} from "../order-display";

interface OrderDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

type OrderItem = NonNullable<StoreOrder["items"]>[number];
type OrderAddress = NonNullable<StoreOrder["shipping_address"]>;

const ORDER_DETAIL_FIELDS =
  "id,display_id,created_at,currency_code,status,payment_status,fulfillment_status," +
  "subtotal,shipping_total,tax_total,discount_total,total," +
  "shipping_address.first_name,shipping_address.last_name,shipping_address.address_1," +
  "shipping_address.address_2,shipping_address.city,shipping_address.province," +
  "shipping_address.postal_code,shipping_address.country_code,shipping_address.phone," +
  "items.id,items.title,items.subtitle,items.thumbnail,items.quantity,items.unit_price,items.total";

function displayOrderId(order: StoreOrder): string {
  return typeof order.display_id === "number" ? String(order.display_id) : order.id;
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function itemTotal(item: OrderItem): number {
  const explicitTotal = (item as { total?: unknown }).total;
  if (typeof explicitTotal === "number" && Number.isFinite(explicitTotal)) {
    return explicitTotal;
  }
  return numberValue((item as { unit_price?: unknown }).unit_price) * (item.quantity ?? 1);
}

function AddressBlock({
  address,
  emptyLabel,
}: {
  address: OrderAddress | null | undefined;
  emptyLabel: string;
}) {
  if (!address) {
    return <p className="text-sm text-text-secondary">{emptyLabel}</p>;
  }

  const name = [address.first_name, address.last_name].filter(Boolean).join(" ");
  const locality = [address.city, address.province, address.postal_code]
    .filter(Boolean)
    .join(", ");

  return (
    <address className="not-italic text-sm text-text-secondary">
      {name ? <p className="font-medium text-text-primary">{name}</p> : null}
      {address.address_1 ? <p>{address.address_1}</p> : null}
      {address.address_2 ? <p>{address.address_2}</p> : null}
      {locality ? <p>{locality}</p> : null}
      {address.country_code ? <p className="uppercase">{address.country_code}</p> : null}
      {address.phone ? <p>{address.phone}</p> : null}
    </address>
  );
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  const token = await getAuthToken();

  if (!token) {
    notFound();
  }

  let order: StoreOrder;
  try {
    order = await getCustomerOrder(id, token, { fields: ORDER_DETAIL_FIELDS });
  } catch {
    notFound();
  }

  const currencyCode = order.currency_code || "EGP";
  const orderStatus = displayOrderStatus(
    order.status,
    order.payment_status ?? null,
    order.fulfillment_status ?? null,
    t,
  );
  const orderStatusBadgeVariant = displayOrderStatusVariant(
    order.status,
    order.payment_status ?? null,
    order.fulfillment_status ?? null,
  );
  const paymentStatus = localizeStatus(order.payment_status ?? null, t, PAYMENT_STATUS_KEYS);
  const fulfillmentStatus = localizeStatus(
    order.fulfillment_status ?? null,
    t,
    FULFILLMENT_STATUS_KEYS,
  );
  const customerStatus = customerStatusLabel(
    order.status,
    order.payment_status ?? null,
    order.fulfillment_status ?? null,
    t,
  );
  const items = order.items ?? [];

  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface p-5">
      <Link
        href={`/${locale}/account/orders`}
        className="text-sm font-medium text-brand hover:underline"
      >
        {t("orders.detail.backToOrders")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            {t("orders.detail.heading", { id: displayOrderId(order) })}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {formatOrderDate(locale, order.created_at)}
          </p>
        </div>
        <Badge variant={statusVariant(order.fulfillment_status ?? order.status)}>
          {customerStatus}
        </Badge>
      </div>

      <section className="rounded-md border border-border bg-surface-subtle p-4">
        <h2 className="text-base font-semibold text-text-primary">
          {t("orders.detail.statusHeading")}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {orderStatus ? (
            <Badge variant={orderStatusBadgeVariant}>{orderStatus}</Badge>
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
      </section>

      <section className="rounded-md border border-border bg-surface-subtle p-4">
        <h2 className="text-base font-semibold text-text-primary">
          {t("orders.detail.itemsHeading")}
        </h2>
        <ul className="mt-3 divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-3 text-sm">
              <div>
                <p className="font-medium text-text-primary">{item.title ?? "-"}</p>
                {item.subtitle ? (
                  <p className="text-text-secondary">{item.subtitle}</p>
                ) : null}
                <p className="text-text-secondary">
                  {t("orders.detail.quantity", { count: item.quantity ?? 1 })}
                </p>
              </div>
              <div className="text-end">
                <p className="text-text-primary">
                  {formatPrice(itemTotal(item), currencyCode, locale)}
                </p>
                <p className="text-text-secondary">
                  {formatPrice(
                    numberValue((item as { unit_price?: unknown }).unit_price),
                    currencyCode,
                    locale,
                  )}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-md border border-border bg-surface-subtle p-4">
          <h2 className="text-base font-semibold text-text-primary">
            {t("orders.detail.shippingAddressHeading")}
          </h2>
          <div className="mt-3">
            <AddressBlock
              address={order.shipping_address}
              emptyLabel={t("orders.detail.noShippingAddress")}
            />
          </div>
        </section>

        <section className="rounded-md border border-border bg-surface-subtle p-4">
          <h2 className="text-base font-semibold text-text-primary">
            {t("orders.detail.totalsHeading")}
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">{t("orders.detail.subtotal")}</dt>
              <dd className="text-text-primary">
                {formatPrice(numberValue(order.subtotal), currencyCode, locale)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">{t("orders.detail.shipping")}</dt>
              <dd className="text-text-primary">
                {formatPrice(numberValue(order.shipping_total), currencyCode, locale)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">{t("orders.detail.tax")}</dt>
              <dd className="text-text-primary">
                {formatPrice(numberValue(order.tax_total), currencyCode, locale)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">{t("orders.detail.discount")}</dt>
              <dd className="text-text-primary">
                {formatPrice(numberValue(order.discount_total), currencyCode, locale)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-border pt-2 font-semibold">
              <dt className="text-text-primary">{t("orders.detail.total")}</dt>
              <dd className="text-text-primary">
                {formatPrice(numberValue(order.total), currencyCode, locale)}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
