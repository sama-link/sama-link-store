import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getAuthToken } from "@/lib/auth-cookie";
import {
  listCustomerAddresses,
  listCustomerOrders,
  type StoreCustomerAddress,
} from "@/lib/medusa-client";
import { formatPrice } from "@/lib/format-price";
import { getCurrentCustomerFromCookie } from "@/lib/customer-server";

interface AccountDashboardPageProps {
  params: Promise<{ locale: string }>;
}

function formatOrderDate(locale: string, value?: string | Date | null) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function pickDefaultAddress(addresses: StoreCustomerAddress[]) {
  if (!addresses.length) return null;
  const explicitDefault = addresses.find((a) => a.is_default_shipping);
  return explicitDefault ?? addresses[0] ?? null;
}

export default async function AccountDashboardPage({
  params,
}: AccountDashboardPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  const customer = await getCurrentCustomerFromCookie();
  const token = await getAuthToken();

  const customerName = customer?.first_name || customer?.email || t("greetingSignedOut");
  const fullName = [customer?.first_name, customer?.last_name]
    .filter(Boolean)
    .join(" ");

  let ordersError = false;
  let addressesError = false;
  let recentOrders:
    | Awaited<ReturnType<typeof listCustomerOrders>>["orders"]
    | null = null;
  let addresses: StoreCustomerAddress[] | null = null;

  if (token) {
    const [ordersResult, addressesResult] = await Promise.allSettled([
      listCustomerOrders(token, { limit: 3 }),
      listCustomerAddresses(token),
    ]);

    if (ordersResult.status === "fulfilled") {
      recentOrders = ordersResult.value.orders;
    } else {
      ordersError = true;
    }

    if (addressesResult.status === "fulfilled") {
      addresses = addressesResult.value.addresses;
    } else {
      addressesError = true;
    }
  } else {
    ordersError = true;
    addressesError = true;
  }

  const defaultAddress = addresses ? pickDefaultAddress(addresses) : null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-text-primary">
        {t("welcomeBack", { name: customerName })}
      </h1>

      <section className="space-y-4 rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-text-primary">
            {t("dashboard.profileSummary")}
          </h2>
          <Link
            href={`/${locale}/account/profile`}
            className="text-sm font-medium text-brand hover:underline"
          >
            {t("dashboard.editProfile")}
          </Link>
        </div>
        <div className="space-y-1 text-sm text-text-secondary">
          <p>{fullName || "—"}</p>
          <p>{customer?.email || "—"}</p>
          <p>{customer?.phone || "—"}</p>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-text-primary">
            {t("dashboard.recentOrders")}
          </h2>
          <Link
            href={`/${locale}/account/orders`}
            className="text-sm font-medium text-brand hover:underline"
          >
            {t("dashboard.viewAllOrders")}
          </Link>
        </div>
        {ordersError ? (
          <p className="text-sm text-error">{t("dashboard.errorOrders")}</p>
        ) : recentOrders && recentOrders.length > 0 ? (
          <ul className="space-y-2">
            {recentOrders.slice(0, 3).map((order) => (
              <li
                key={order.id}
                className="rounded-md border border-border bg-surface-subtle px-3 py-2 text-sm"
              >
                <p className="font-medium text-text-primary">#{order.display_id}</p>
                <p className="text-text-secondary">
                  {formatOrderDate(locale, order.created_at)} · {order.status}
                </p>
                <p className="text-text-secondary">
                  {formatPrice(order.total, order.currency_code || "EGP", locale)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-1 text-sm text-text-secondary">
            <p>{t("dashboard.noOrders")}</p>
            <Link href={`/${locale}/products`} className="font-medium text-brand hover:underline">
              {t("dashboard.startShopping")}
            </Link>
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-text-primary">
            {t("dashboard.defaultAddress")}
          </h2>
          <Link
            href={`/${locale}/account/addresses`}
            className="text-sm font-medium text-brand hover:underline"
          >
            {t("dashboard.editAddresses")}
          </Link>
        </div>
        {addressesError ? (
          <p className="text-sm text-error">{t("dashboard.errorAddresses")}</p>
        ) : defaultAddress ? (
          <div className="text-sm text-text-secondary">
            <p className="text-text-primary">
              {[defaultAddress.first_name, defaultAddress.last_name]
                .filter(Boolean)
                .join(" ") || "—"}
            </p>
            <p>{defaultAddress.address_1 || "—"}</p>
            <p>
              {[defaultAddress.city, defaultAddress.country_code]
                .filter(Boolean)
                .join(", ") || "—"}
            </p>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">{t("dashboard.noAddresses")}</p>
        )}
      </section>
    </div>
  );
}
