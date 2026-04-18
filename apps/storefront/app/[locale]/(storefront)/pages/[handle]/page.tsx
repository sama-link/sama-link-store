import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCmsPageByHandle } from "@/lib/medusa-client";
import { buildCanonical, buildLanguageAlternates } from "@/lib/seo";
import Container from "@/components/layout/Container";
import Breadcrumbs from "@/components/layout/Breadcrumbs";

export const revalidate = 3600; // ISR — ADR-017

// Handle → i18n key mapping (hyphens not valid in next-intl key paths)
const HANDLE_KEY_MAP: Record<string, string> = {
  about: "about",
  faq: "faq",
  contact: "contact",
  "shipping-returns": "shippingReturns",
  privacy: "privacy",
  terms: "terms",
};

interface PageProps {
  params: Promise<{ locale: string; handle: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, handle } = await params;
  const keyName = HANDLE_KEY_MAP[handle];
  if (!keyName) return {};

  const t = await getTranslations({ locale, namespace: "pages" });
  const tMeta = await getTranslations({ locale, namespace: "meta.pages" });
  const title = t(`${keyName}.title`);
  const description = tMeta(`${keyName}.description`);
  const canonical = buildCanonical(locale, `/pages/${handle}`);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: buildLanguageAlternates(`/pages/${handle}`),
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      locale: locale === "ar" ? "ar_SA" : "en_US",
    },
  };
}

export default async function CmsPage({ params }: PageProps) {
  const { locale, handle } = await params;

  const keyName = HANDLE_KEY_MAP[handle];
  if (!keyName) notFound();

  const t = await getTranslations({ locale, namespace: "pages" });
  const tb = await getTranslations({ locale, namespace: "breadcrumbs" });

  const title = t(`${keyName}.title`);
  const cmsPage = await getCmsPageByHandle(handle);

  return (
    <Container>
      <div className="space-y-8 py-12">
        <Breadcrumbs
          ariaLabel={tb("aria")}
          items={[
            { label: tb("home"), href: `/${locale}` },
            { label: title },
          ]}
        />
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          {title}
        </h1>
        <div className="prose prose-sm max-w-3xl text-text-secondary">
          {cmsPage?.body ? <p>{cmsPage.body}</p> : <p>{t("fallbackBody")}</p>}
        </div>
      </div>
    </Container>
  );
}
