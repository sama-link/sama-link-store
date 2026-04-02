import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const locale = await getLocale();
  const tCommon = await getTranslations('common');
  const tHome = await getTranslations('home');
  const tNav = await getTranslations('nav');

  return (
    <section
      aria-labelledby="not-found-title"
      className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center"
    >
      <div className="max-w-md space-y-3">
        <h1
          id="not-found-title"
          className="text-2xl font-semibold text-text-primary sm:text-3xl"
        >
          {tCommon('noResults')}
        </h1>
        <p className="text-sm leading-relaxed text-text-secondary sm:text-base">
          {tHome('subheadline')}
        </p>
      </div>
      <Link
        href={`/${locale}`}
        className="text-sm font-medium text-brand underline-offset-4 hover:underline"
        aria-label={tNav('logoHomeAria')}
      >
        {tCommon('storeName')}
      </Link>
    </section>
  );
}
