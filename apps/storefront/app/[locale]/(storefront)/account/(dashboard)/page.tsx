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
import { Package, User, MapPin, ChevronRight, AlertCircle, Calendar } from "lucide-react";
import { cn } from "@/lib/cn";

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
  const isArabic = locale === "ar";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          {t("welcomeBack", { name: customerName })}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          {isArabic ? "من هنا تقدر تدير حسابك، تتابع طلباتك وتعدل بياناتك الشخصية." : "Manage your account, track orders, and update your personal information from here."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
        {/* Profile Summary Card */}
        <section className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-4 sm:p-6 transition-all hover:border-brand-muted sm:hover:shadow-md">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-muted text-brand">
                <User className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">
                {t("dashboard.profileSummary")}
              </h2>
            </div>
            <Link
              href={`/${locale}/account/profile`}
              className="flex items-center text-sm font-medium text-brand hover:text-brand-hover"
            >
              {t("dashboard.editProfile")}
            </Link>
          </div>
          
          <div className="space-y-3 rounded-xl bg-surface-subtle p-4 text-sm text-text-secondary">
            <div className="flex justify-between">
              <span className="font-medium text-text-primary">{isArabic ? "الاسم:" : "Name:"}</span>
              <span>{fullName || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-text-primary">{isArabic ? "البريد:" : "Email:"}</span>
              <span>{customer?.email || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-text-primary">{isArabic ? "الهاتف:" : "Phone:"}</span>
              <span dir="ltr">{customer?.phone || "—"}</span>
            </div>
          </div>
        </section>

        {/* Address Card */}
        <section className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-4 sm:p-6 transition-all hover:border-brand-muted sm:hover:shadow-md">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-muted text-brand">
                <MapPin className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">
                {t("dashboard.defaultAddress")}
              </h2>
            </div>
            <Link
              href={`/${locale}/account/addresses`}
              className="flex items-center text-sm font-medium text-brand hover:text-brand-hover"
            >
              {t("dashboard.editAddresses")}
            </Link>
          </div>

          <div className="rounded-xl bg-surface-subtle p-4 h-[calc(100%-4rem)]">
            {addressesError ? (
              <div className="flex items-center gap-2 text-sm text-error">
                <AlertCircle className="h-4 w-4" />
                {t("dashboard.errorAddresses")}
              </div>
            ) : defaultAddress ? (
              <div className="space-y-1 text-sm text-text-secondary">
                <p className="font-medium text-text-primary">
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
              <div className="flex h-full flex-col items-center justify-center space-y-2 text-center">
                <p className="text-sm text-text-secondary">{t("dashboard.noAddresses")}</p>
                <Link
                  href={`/${locale}/account/addresses`}
                  className="text-sm font-medium text-brand hover:underline"
                >
                  {isArabic ? "إضافة عنوان جديد" : "Add new address"}
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Orders Section */}
      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-muted text-brand">
              <Package className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">
              {t("dashboard.recentOrders")}
            </h2>
          </div>
          <Link
            href={`/${locale}/account/orders`}
            className="flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover"
          >
            <span className="hidden sm:inline">{t("dashboard.viewAllOrders")}</span>
            <span className="sm:hidden">{isArabic ? "الكل" : "All"}</span>
            <ChevronRight className={cn("h-4 w-4", isArabic && "rotate-180")} />
          </Link>
        </div>

        <div className="p-4 sm:p-6">
          {ordersError ? (
            <div className="flex items-center gap-2 text-sm text-error">
              <AlertCircle className="h-4 w-4" />
              {t("dashboard.errorOrders")}
            </div>
          ) : recentOrders && recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.slice(0, 3).map((order) => (
                <Link
                  key={order.id}
                  href={`/${locale}/account/orders/${order.id}`}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 transition-all hover:border-brand hover:shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-subtle">
                      <Package className="h-6 w-6 text-text-muted" />
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary group-hover:text-brand transition-colors">
                        #{order.display_id}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-text-secondary mt-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatOrderDate(locale, order.created_at)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1">
                    <span className="font-medium text-text-primary">
                      {formatPrice(order.total, order.currency_code || "EGP", locale)}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-brand-muted px-2.5 py-0.5 text-xs font-medium text-brand">
                      {order.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Package className="mb-4 h-12 w-12 text-text-muted" />
              <p className="mb-2 font-medium text-text-primary">{t("dashboard.noOrders")}</p>
              <Link
                href={`/${locale}/products`}
                className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
              >
                {t("dashboard.startShopping")}
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
