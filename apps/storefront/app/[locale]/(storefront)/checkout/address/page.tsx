import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { buildCanonical } from "@/lib/seo";
import AddressForm from "@/components/checkout/AddressForm";
import { getAuthToken } from "@/lib/auth-cookie";
import { CART_COOKIE_NAME } from "@/lib/cart-cookie";
import {
  getCurrentCustomer,
  listCustomerAddresses,
  sdk,
  type StoreCustomerAddress,
} from "@/lib/medusa-client";

interface AddressPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: AddressPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout.address" });
  const tMeta = await getTranslations({
    locale,
    namespace: "meta.checkout.address",
  });
  return {
    title: t("title"),
    description: tMeta("description"),
    alternates: { canonical: buildCanonical(locale, "/checkout/address") },
    robots: { index: false, follow: false },
  };
}

export default async function AddressPage({ params }: AddressPageProps) {
  const { locale } = await params;
  const token = await getAuthToken();

  let savedAddresses: StoreCustomerAddress[] = [];
  let customerEmail: string | undefined;
  if (token) {
    const [addressesResult, customerResult] = await Promise.allSettled([
      listCustomerAddresses(token),
      getCurrentCustomer(token),
    ]);

    if (addressesResult.status === "fulfilled") {
      savedAddresses = addressesResult.value.addresses ?? [];
    }

    if (customerResult.status === "fulfilled") {
      customerEmail = customerResult.value?.email ?? undefined;
    }
  }

  const cookieStore = await cookies();
  const cartId = cookieStore.get(CART_COOKIE_NAME)?.value;

  let regionCountryCodes: string[] = [];
  if (cartId) {
    try {
      const { cart } = await sdk.store.cart.retrieve(cartId, {
        fields: "id,email,region.countries.iso_2",
      });

      regionCountryCodes = (
        ((cart as { region?: { countries?: Array<{ iso_2?: string | null }> } })
          .region?.countries ?? [])
      )
        .map((country) => (country.iso_2 ?? "").toLowerCase())
        .filter(Boolean);

      if (!cart.email && customerEmail) {
        await sdk.store.cart.update(
          cart.id,
          { email: customerEmail },
          { fields: "id" },
        );
      }
    } catch {
      // Address form still renders using existing cart bootstrap in client.
    }
  }

  return (
    <AddressForm
      locale={locale}
      savedAddresses={savedAddresses}
      regionCountryCodes={regionCountryCodes}
    />
  );
}
