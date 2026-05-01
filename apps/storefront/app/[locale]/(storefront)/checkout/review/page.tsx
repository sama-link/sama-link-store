import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CART_COOKIE_NAME } from "@/lib/cart-cookie";
import {
  getCartGrandTotal,
  getCartItemsSubtotal,
} from "@/lib/cart-totals";
import { retrieveCart } from "@/lib/medusa-client";
import { buildCanonical } from "@/lib/seo";
import OrderReview, {
  type ReviewLineItem,
  type ReviewAddress,
  type ReviewShippingMethod,
} from "@/components/checkout/OrderReview";

interface ReviewPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: ReviewPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout.review" });
  const tMeta = await getTranslations({
    locale,
    namespace: "meta.checkout.review",
  });
  return {
    title: t("title"),
    description: tMeta("description"),
    alternates: { canonical: buildCanonical(locale, "/checkout/review") },
    robots: { index: false, follow: false },
  };
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const cartId = cookieStore.get(CART_COOKIE_NAME)?.value ?? "";

  if (!cartId) {
    redirect(`/${locale}/cart`);
  }

  const { cart } = await retrieveCart(cartId);

  const addr = cart.shipping_address;
  if (!addr?.first_name) {
    redirect(`/${locale}/checkout/address`);
  }

  const shippingMethods = cart.shipping_methods ?? [];
  if (shippingMethods.length === 0) {
    redirect(`/${locale}/checkout/shipping`);
  }

  const items: ReviewLineItem[] = (cart.items ?? []).map((item: any) => {
    const variant =
      item.variant && typeof item.variant === "object" ? item.variant : null;
    const variantTitle =
      variant && "title" in variant ? String(variant.title ?? "") : "";
    return {
      id: item.id,
      title: item.title ?? "",
      thumbnail: item.thumbnail ?? null,
      unit_price: item.unit_price ?? 0,
      quantity: item.quantity ?? 1,
      variantTitle:
        variantTitle && variantTitle !== (item.title ?? "")
          ? variantTitle
          : "",
    };
  });

  const shippingAddress: ReviewAddress = {
    first_name: addr.first_name ?? "",
    last_name: addr.last_name ?? "",
    address_1: addr.address_1 ?? "",
    address_2: addr.address_2 ?? "",
    city: addr.city ?? "",
    country_code: addr.country_code ?? "",
    province: addr.province ?? "",
  };

  const firstMethod = shippingMethods[0]!;
  const shippingMethod: ReviewShippingMethod = {
    name: firstMethod.name ?? "",
    amount: Number(firstMethod.amount ?? 0),
  };

  return (
    <OrderReview
      locale={locale}
      cartId={cartId}
      currencyCode={cart.currency_code ?? "USD"}
      items={items}
      shippingAddress={shippingAddress}
      shippingMethod={shippingMethod}
      subtotal={getCartItemsSubtotal(cart)}
      total={getCartGrandTotal(cart)}
    />
  );
}
