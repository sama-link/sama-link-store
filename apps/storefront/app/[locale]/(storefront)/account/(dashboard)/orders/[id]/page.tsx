import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import Badge from "@/components/ui/Badge";
import { getAuthToken } from "@/lib/auth-cookie";
import { formatPrice } from "@/lib/format-price";
import { getCustomerOrder, type StoreOrder } from "@/lib/medusa-client";
import { cn } from "@/lib/cn";
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  MapPin, 
  CreditCard, 
  Truck,
  Receipt,
  FileText
} from "lucide-react";
import {
  getOrderDiscountTotal,
  getOrderGrandTotal,
  getOrderItemsSubtotal,
  getOrderLineDisplayTotal,
  getOrderLineUnitPrice,
  getOrderShippingTotal,
  getOrderTaxTotal,
} from "@/lib/order-totals";
import {
  FULFILLMENT_STATUS_KEYS,
  PAYMENT_STATUS_KEYS,
  displayOrderStatus,
  displayOrderStatusVariant,
  formatOrderDate,
  localizeStatus,
} from "../order-display";

interface OrderDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

type OrderAddress = NonNullable<StoreOrder["shipping_address"]>;

const ORDER_DETAIL_FIELDS =
  "id,display_id,created_at,currency_code,status,payment_status,fulfillment_status," +
  "item_subtotal,subtotal,shipping_subtotal,shipping_total,tax_total,discount_total,total," +
  "shipping_address.first_name,shipping_address.last_name,shipping_address.address_1," +
  "shipping_address.address_2,shipping_address.city,shipping_address.province," +
  "shipping_address.postal_code,shipping_address.country_code,shipping_address.phone," +
  "items.id,items.title,items.subtitle,items.thumbnail,items.quantity,items.unit_price," +
  "items.subtotal,items.total";

function displayOrderId(order: StoreOrder): string {
  return typeof order.display_id === "number" ? String(order.display_id) : order.id;
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
    <address className="not-italic text-sm text-text-secondary space-y-1">
      {name ? <p className="font-semibold text-text-primary">{name}</p> : null}
      {address.address_1 ? <p>{address.address_1}</p> : null}
      {address.address_2 ? <p>{address.address_2}</p> : null}
      {locality ? <p>{locality}</p> : null}
      {address.country_code ? <p className="uppercase">{address.country_code}</p> : null}
      {address.phone ? <p dir="ltr" className="text-right sm:text-left pt-2 font-medium">{address.phone}</p> : null}
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
  const paymentStatus = localizeStatus(order.payment_status ?? null, t, PAYMENT_STATUS_KEYS);
  const fulfillmentStatus = localizeStatus(
    order.fulfillment_status ?? null,
    t,
    FULFILLMENT_STATUS_KEYS,
  );
  const items = order.items ?? [];
  const isArabic = locale === "ar";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${locale}/account/orders`}
          className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-brand transition-colors mb-4"
        >
          <ArrowLeft className={cn("h-4 w-4", isArabic && "rotate-180")} />
          {t("orders.detail.backToOrders")}
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-muted text-brand">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                {t("orders.detail.heading", { id: displayOrderId(order) })}
              </h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-text-secondary">
                <Calendar className="h-4 w-4" />
                {formatOrderDate(locale, order.created_at)}
              </div>
            </div>
          </div>
          {primaryStatus && (
            <Badge variant={primaryStatusVariant} className="text-sm px-3 py-1.5 shadow-sm">
              {primaryStatus}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="overflow-hidden rounded-xl sm:rounded-2xl sm:border border-border bg-surface sm:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:sm:shadow-[0_8px_30px_rgb(255,255,255,0.02)]">
            <div className="border-b border-border bg-surface-subtle p-5 sm:p-6 flex items-center gap-2">
              <Package className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-semibold text-text-primary">
                {t("orders.detail.itemsHeading")}
              </h2>
            </div>
            <ul className="divide-y divide-border">
              {items.map((item) => {
                const title = (item.title ?? "").trim();
                const subtitleRaw = (item.subtitle ?? "").trim();
                const showSubtitle =
                  subtitleRaw.length > 0 &&
                  subtitleRaw.toLowerCase() !== title.toLowerCase();
                const quantity = item.quantity ?? 1;
                const lineTotal = getOrderLineDisplayTotal(item);
                const unitPrice = getOrderLineUnitPrice(item);
                const showUnitBreakdown = quantity > 1 && unitPrice > 0;

                return (
                  <li key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 transition-colors hover:bg-surface-subtle/50">
                    <div className="flex gap-4">
                      {item.thumbnail ? (
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
                          <img 
                            src={item.thumbnail} 
                            alt={title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-subtle text-text-muted">
                          <Package className="h-8 w-8" />
                        </div>
                      )}
                      <div className="flex flex-col justify-center">
                        <p className="font-semibold text-text-primary line-clamp-2">
                          {title || "-"}
                        </p>
                        {showSubtitle && (
                          <p className="text-sm text-text-secondary mt-1">{subtitleRaw}</p>
                        )}
                        <p className="inline-flex items-center rounded-md bg-surface-subtle px-2 py-1 text-xs font-medium text-text-secondary mt-2 w-max">
                          {t("orders.detail.quantity", { count: quantity })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t border-border sm:border-0 pt-4 sm:pt-0">
                      <p className="text-base font-bold text-text-primary">
                        {formatPrice(lineTotal, currencyCode, locale)}
                      </p>
                      {showUnitBreakdown && (
                        <p className="text-sm text-text-secondary mt-1">
                          {`${formatPrice(unitPrice, currencyCode, locale)} × ${quantity}`}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-xl sm:rounded-2xl sm:border border-border bg-surface sm:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:sm:shadow-[0_8px_30px_rgb(255,255,255,0.02)]">
            <div className="border-b border-border bg-surface-subtle p-5 flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-semibold text-text-primary">
                {t("orders.detail.statusHeading")}
              </h2>
            </div>
            <div className="p-5 space-y-4">
              {primaryStatus && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">{t("orders.detail.orderStatusLabel")}</p>
                    <p className="text-sm font-semibold text-text-primary">{primaryStatus}</p>
                  </div>
                </div>
              )}
              {paymentStatus && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">{t("orders.detail.paymentStatusLabel")}</p>
                    <p className="text-sm font-semibold text-text-primary">{paymentStatus}</p>
                  </div>
                </div>
              )}
              {fulfillmentStatus && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">{t("orders.detail.deliveryStatusLabel")}</p>
                    <p className="text-sm font-semibold text-text-primary">{fulfillmentStatus}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl sm:rounded-2xl sm:border border-border bg-surface sm:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:sm:shadow-[0_8px_30px_rgb(255,255,255,0.02)]">
            <div className="border-b border-border bg-surface-subtle p-5 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-semibold text-text-primary">
                {t("orders.detail.shippingAddressHeading")}
              </h2>
            </div>
            <div className="p-5">
              <AddressBlock
                address={order.shipping_address}
                emptyLabel={t("orders.detail.noShippingAddress")}
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-xl sm:rounded-2xl sm:border border-border bg-surface sm:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:sm:shadow-[0_8px_30px_rgb(255,255,255,0.02)]">
            <div className="border-b border-border bg-surface-subtle p-5 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-semibold text-text-primary">
                {t("orders.detail.totalsHeading")}
              </h2>
            </div>
            <div className="p-5">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-text-secondary">{t("orders.detail.subtotal")}</dt>
                  <dd className="font-medium text-text-primary">
                    {formatPrice(getOrderItemsSubtotal(order), currencyCode, locale)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-secondary">{t("orders.detail.shipping")}</dt>
                  <dd className="font-medium text-text-primary">
                    {formatPrice(getOrderShippingTotal(order), currencyCode, locale)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-secondary">{t("orders.detail.tax")}</dt>
                  <dd className="font-medium text-text-primary">
                    {formatPrice(getOrderTaxTotal(order), currencyCode, locale)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-secondary">{t("orders.detail.discount")}</dt>
                  <dd className="font-medium text-text-primary">
                    {formatPrice(getOrderDiscountTotal(order), currencyCode, locale)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-border pt-4 mt-2">
                  <dt className="text-base font-bold text-text-primary">{t("orders.detail.total")}</dt>
                  <dd className="text-lg font-bold text-brand">
                    {formatPrice(getOrderGrandTotal(order), currencyCode, locale)}
                  </dd>
                </div>
              </dl>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
