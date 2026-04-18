import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildCanonical } from "@/lib/seo";
import Container from "@/components/layout/Container";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import CartPageContent from "@/components/layout/CartPageContent";

interface CartPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: CartPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cart" });
  const tMeta = await getTranslations({ locale, namespace: "meta.cart" });
  return {
    title: t("title"),
    description: tMeta("description"),
    alternates: { canonical: buildCanonical(locale, "/cart") },
    robots: { index: false, follow: false },
  };
}

export default async function CartPage({ params }: CartPageProps) {
  const { locale } = await params;
  const tb = await getTranslations({ locale, namespace: "breadcrumbs" });
  const t = await getTranslations({ locale, namespace: "cart" });

  return (
    <Container>
      <div className="space-y-8 py-12">
        <Breadcrumbs
          ariaLabel={tb("aria")}
          items={[
            { label: tb("home"), href: `/${locale}` },
            { label: tb("cart") },
          ]}
        />
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          {t("title")}
        </h1>
        <CartPageContent locale={locale} />
      </div>
    </Container>
  );
}
