import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildCanonical } from "@/lib/seo";
import { getAuthToken } from "@/lib/auth-cookie";
import {
  getCustomerList,
  type CustomerListItem,
} from "@/lib/medusa-client";
import { wishlistItemFromBackendRow } from "@/lib/wishlist-hydration";
import type { WishlistItem } from "@/hooks/useWishlist";
import WishlistClient from "./WishlistClient";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "wishlist" });
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
    alternates: { canonical: buildCanonical(locale, "/wishlist") },
    robots: { index: false, follow: false },
  };
}

// ACCT-6E hotfix: when the customer is authenticated, the public
// /wishlist page must show the same backend-backed list as
// /account/wishlist. We fetch the list server-side here and pass it as
// `initialItems` to the client; the client renders out of that snapshot
// so we never display optimistic-only state that has not been
// persisted server-side. Guests still get the existing
// localStorage-backed flow.
async function getInitialAuthedItems(): Promise<WishlistItem[] | null> {
  const token = await getAuthToken();
  if (!token) return null;
  try {
    const list = await getCustomerList(token, "wishlist");
    return list.items.map((row: CustomerListItem) =>
      wishlistItemFromBackendRow(row),
    );
  } catch {
    return [];
  }
}

export default async function WishlistPage() {
  const initialAuthedItems = await getInitialAuthedItems();
  return <WishlistClient initialAuthedItems={initialAuthedItems} />;
}
