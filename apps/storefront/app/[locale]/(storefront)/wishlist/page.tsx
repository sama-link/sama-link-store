import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
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
  };
}

export default function WishlistPage() {
  return <WishlistClient />;
}
