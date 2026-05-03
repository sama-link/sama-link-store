import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildCanonical } from "@/lib/seo";
import Container from "@/components/layout/Container";
import Link from "next/link";
import { ShoppingBag, PackageOpen } from "lucide-react";
import Confetti from "@/components/checkout/Confetti";
import OrderSuccessIcon from "@/components/checkout/OrderSuccessIcon";

interface ConfirmedPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ display_id?: string }>;
}

export async function generateMetadata({
  params,
}: ConfirmedPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout.confirmed" });
  const tMeta = await getTranslations({
    locale,
    namespace: "meta.checkout.confirmed",
  });
  return {
    title: t("title"),
    description: tMeta("description"),
    alternates: { canonical: buildCanonical(locale, "/order-confirmed") },
    robots: { index: false, follow: false },
  };
}

export default async function OrderConfirmedPage({
  params,
  searchParams,
}: ConfirmedPageProps) {
  const { locale } = await params;
  const { display_id } = await searchParams;
  const t = await getTranslations({ locale, namespace: "checkout.confirmed" });

  return (
    <div className="min-h-[calc(100vh-200px)] bg-surface-subtle py-12 sm:py-24 overflow-hidden relative">
      <Confetti />
      <Container>
        <div className="mx-auto max-w-2xl">
          <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(255,255,255,0.02)] relative">
            {/* Decorative background element */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-brand/5 dark:bg-brand/10 border-b border-border/50" />
            
            <div className="relative flex flex-col items-center px-6 pb-12 pt-16 text-center sm:px-12 sm:pb-16 sm:pt-20">
              <OrderSuccessIcon />
              
              <div className="space-y-3 max-w-lg">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
                  {t("heading")}
                </h1>
                {display_id ? (
                  <p className="text-lg font-medium text-brand">
                    {t("orderNumber", { number: display_id })}
                  </p>
                ) : null}
                <p className="text-base text-text-secondary mt-4">
                  {t("body")}
                </p>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <Link
                  href={`/${locale}/account/orders`}
                  className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-border bg-surface px-8 py-3.5 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-subtle hover:text-brand"
                >
                  <PackageOpen className="h-5 w-5" />
                  {locale === "ar" ? "تتبع الطلب" : "Track Order"}
                </Link>
                <Link
                  href={`/${locale}/products`}
                  className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-brand px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-hover hover:shadow-md"
                >
                  <ShoppingBag className="h-5 w-5" />
                  {t("continueShopping")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
