import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildCanonical } from "@/lib/seo";
import { getAuthToken } from "@/lib/auth-cookie";
import {
  getCustomerList,
  type CustomerListItem,
} from "@/lib/medusa-client";
import { compareItemFromBackendRow } from "@/lib/compare-hydration";
import { COMPARE_MAX_ITEMS } from "@/lib/compare-cap";
import type { CompareItem } from "@/hooks/useCompare";
import CompareClient from "./CompareClient";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "compare" });
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
    alternates: { canonical: buildCanonical(locale, "/compare") },
    robots: { index: false, follow: false },
  };
}

// ACCT-6E hotfix: when the customer is authenticated, the public
// /compare page must show the same backend-backed list as
// /account/compare. Mirrors the wishlist hotfix — server-fetch the
// backend list and pass it as `initialItems`. Guests fall through to
// the existing localStorage-backed flow.
async function getInitialAuthedItems(): Promise<CompareItem[] | null> {
  const token = await getAuthToken();
  if (!token) return null;
  try {
    const list = await getCustomerList(token, "compare");
    return list.items
      .slice(0, COMPARE_MAX_ITEMS)
      .map((row: CustomerListItem) => compareItemFromBackendRow(row));
  } catch {
    return [];
  }
}

export default async function ComparePage() {
  const initialAuthedItems = await getInitialAuthedItems();
  return <CompareClient initialAuthedItems={initialAuthedItems} />;
}
