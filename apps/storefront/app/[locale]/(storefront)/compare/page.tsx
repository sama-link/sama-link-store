import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
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
  };
}

export default function ComparePage() {
  return <CompareClient />;
}
