import type { Metadata } from 'next';
import { Geist, IBM_Plex_Sans_Arabic } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import JsonLd from '@/components/layout/JsonLd';
import {
  buildCanonical,
  buildLanguageAlternates,
  buildOrganizationJsonLd,
  getBaseUrl,
} from '@/lib/seo';
import '../globals.css';

/* ADR-045 flat refresh: Geist (Latin) + IBM Plex Sans Arabic (RTL) */
const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
  display: 'swap',
});

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: '--font-plex-arabic',
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.root' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  const storeName = tCommon('storeName');
  const description = t('description');
  const canonical = buildCanonical(locale, '/');

  return {
    title: {
      default: storeName,
      template: `%s | ${storeName}`,
    },
    description,
    metadataBase: new URL(getBaseUrl()),
    alternates: {
      canonical,
      languages: buildLanguageAlternates('/'),
    },
    openGraph: {
      type: 'website',
      siteName: storeName,
      title: storeName,
      description,
      url: canonical,
      locale: locale === 'ar' ? 'ar_SA' : 'en_US',
      alternateLocale: locale === 'ar' ? ['en_US'] : ['ar_SA'],
    },
    twitter: {
      card: 'summary_large_image',
      title: storeName,
      description,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }
  const messages = await getMessages();
  const organizationJsonLd = buildOrganizationJsonLd();

  return (
    <html
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className={`${geist.variable} ${plexArabic.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col antialiased">
        <JsonLd data={organizationJsonLd} />
        <ThemeProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
