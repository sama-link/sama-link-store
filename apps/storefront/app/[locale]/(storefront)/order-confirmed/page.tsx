import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Container from "@/components/layout/Container";

interface ConfirmedPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ display_id?: string }>;
}

export async function generateMetadata({
  params,
}: ConfirmedPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout.confirmed" });
  return { title: t("title") };
}

export default async function OrderConfirmedPage({
  params,
  searchParams,
}: ConfirmedPageProps) {
  const { locale } = await params;
  const { display_id } = await searchParams;
  const t = await getTranslations({ locale, namespace: "checkout.confirmed" });

  return (
    <Container>
      <div className="flex flex-col items-center gap-6 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-3xl text-text-inverse">
          ✓
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-text-primary">{t("heading")}</h1>
          {display_id ? (
            <p className="text-text-secondary">
              {t("orderNumber", { number: display_id })}
            </p>
          ) : null}
          <p className="text-sm text-text-secondary">{t("body")}</p>
        </div>
        <a
          href={`/${locale}/products`}
          className="rounded-md bg-brand px-6 py-2.5 text-sm font-medium text-text-inverse hover:bg-brand-hover"
        >
          {t("continueShopping")}
        </a>
      </div>
    </Container>
  );
}
