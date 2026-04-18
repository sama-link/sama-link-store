import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { CART_COOKIE_NAME } from "@/lib/cart-cookie";
import { listCartShippingOptions } from "@/lib/medusa-client";
import { buildCanonical } from "@/lib/seo";
import ShippingMethodSelector, {
  type ShippingOption,
} from "@/components/checkout/ShippingMethodSelector";

interface ShippingPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: ShippingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout.shipping" });
  const tMeta = await getTranslations({
    locale,
    namespace: "meta.checkout.shipping",
  });
  return {
    title: t("title"),
    description: tMeta("description"),
    alternates: { canonical: buildCanonical(locale, "/checkout/shipping") },
    robots: { index: false, follow: false },
  };
}

export default async function ShippingPage({ params }: ShippingPageProps) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const cartId = cookieStore.get(CART_COOKIE_NAME)?.value ?? "";

  let options: ShippingOption[] = [];
  if (cartId) {
    try {
      const { shipping_options } = await listCartShippingOptions(cartId);
      options = shipping_options.map((o) => ({
        id: o.id,
        name: o.name,
        amount: o.amount,
      }));
    } catch {
      // Empty options — ShippingMethodSelector handles no-options state
    }
  }

  return <ShippingMethodSelector locale={locale} options={options} />;
}
