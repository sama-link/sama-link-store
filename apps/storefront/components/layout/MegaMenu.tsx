"use client";

import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { useLocale, useTranslations } from "next-intl";

export interface MegaMenuCategory {
  id: string;
  name: string;
}

export interface MegaMenuCollection {
  id: string;
  title: string;
  handle: string;
}

const ChevronDown = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ChevronRight = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const TagIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

const navItemClassName =
  "group relative inline-flex h-9 items-center justify-center rounded-md border border-transparent bg-transparent px-0 text-sm font-medium text-text-secondary outline-none transition-colors hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface data-[state=open]:text-text-primary";

const navTriggerClassName = `${navItemClassName} gap-1.5`;

const panelLinkClassName =
  "block rounded-md px-3 py-2.5 text-sm font-medium text-text-primary outline-none transition-colors hover:bg-surface-subtle hover:text-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

const footerLinkClassName =
  "mt-2 inline-flex items-center gap-1 rounded-md bg-surface-subtle px-3 py-2 text-sm font-semibold text-brand outline-none transition-colors hover:bg-brand hover:text-text-inverse focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

interface MegaMenuProps {
  categories: MegaMenuCategory[];
  collections: MegaMenuCollection[];
}

export default function MegaMenu({ categories, collections }: MegaMenuProps) {
  const locale = useLocale();
  const t = useTranslations("nav");
  const tPromo = useTranslations("nav.megaMenu.promo");
  const dir = locale === "ar" ? "rtl" : "ltr";

  const productsHref = `/${locale}/products`;
  const collectionsIndexHref = `/${locale}/collections`;
  const aboutHref = `/${locale}/pages/about`;
  const promoHref = `/${locale}/collections`;

  const catCount = categories.length;
  /* Flat refresh: Products panel now has a 2-col layout when categories exist —
     categories list + promo card feature pane. */
  const catHasContent = catCount > 0;
  const catListClass =
    catCount >= 6 ? "grid grid-cols-2 gap-x-2 gap-y-1" : "flex flex-col gap-1";
  const productsPanelWidth = catHasContent
    ? "w-full sm:w-[44rem]"
    : "w-full sm:w-[22rem]";

  const colCount = collections.length;
  const colGridClass =
    colCount >= 6 ? "grid grid-cols-2 gap-x-2 gap-y-1" : "flex flex-col gap-1";
  const colPanelWidth = colCount >= 6 ? "w-full sm:w-[36rem]" : "w-full sm:w-[22rem]";
  const colMinHeight = colCount <= 2 ? "min-h-[8rem]" : "";

  return (
    <NavigationMenu.Root
      dir={dir}
      aria-label={t("mainNavigation")}
      className="relative flex max-w-max flex-1 items-center justify-center"
    >
      <NavigationMenu.List className="group flex flex-1 list-none items-center justify-center gap-6">
        <NavigationMenu.Item value="nav-home">
          <NavigationMenu.Link href={`/${locale}`} className={navItemClassName}>
            {t("home")}
          </NavigationMenu.Link>
        </NavigationMenu.Item>

        <NavigationMenu.Item value="nav-products">
          <NavigationMenu.Trigger className={navTriggerClassName}>
            {t("megaMenu.productsTrigger")}
            <ChevronDown className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            <span className="absolute inset-x-0 bottom-0 hidden h-[2px] bg-brand group-data-[state=open]:block" />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className="absolute start-0 top-0 w-full sm:w-auto">
            <div className={`p-4 ${productsPanelWidth}`}>
              {catHasContent ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_16rem]">
                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      {t("megaMenu.productsTrigger")}
                    </h3>
                    <ul
                      className={`${catListClass} max-h-[min(24rem,70vh)] overflow-y-auto`}
                    >
                      {categories.map((c) => (
                        <li key={c.id}>
                          <NavigationMenu.Link
                            href={`/${locale}/products?${new URLSearchParams({ category: c.id }).toString()}`}
                            className={panelLinkClassName}
                          >
                            {c.name}
                          </NavigationMenu.Link>
                        </li>
                      ))}
                    </ul>
                    <NavigationMenu.Link
                      href={productsHref}
                      className={footerLinkClassName}
                    >
                      {t("megaMenu.viewAllProducts")}
                      <ChevronRight className="size-3.5 rtl:rotate-180" />
                    </NavigationMenu.Link>
                  </div>

                  {/* Promo feature pane */}
                  <NavigationMenu.Link
                    href={promoHref}
                    className="group/promo relative flex h-full min-h-[14rem] flex-col justify-between overflow-hidden rounded-xl bg-brand p-5 text-text-inverse transition-colors hover:bg-brand-hover"
                  >
                    <span className="self-start rounded-full border border-text-inverse/25 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">
                      {tPromo("tag")}
                    </span>
                    <div className="mt-auto space-y-1.5">
                      <h4 className="text-lg font-semibold leading-snug">
                        {tPromo("title")}
                      </h4>
                      <p className="text-sm text-text-inverse/80">
                        {tPromo("body")}
                      </p>
                      <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-text-inverse underline decoration-text-inverse/40 decoration-1 underline-offset-4 transition-colors group-hover/promo:decoration-text-inverse">
                        {tPromo("cta")}
                        <ChevronRight className="size-3.5 rtl:rotate-180" />
                      </span>
                    </div>
                  </NavigationMenu.Link>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <TagIcon className="mb-2 size-5 text-text-secondary" />
                  <p className="text-sm text-text-secondary">
                    {t("megaMenu.emptyCategories")}
                  </p>
                  <NavigationMenu.Link
                    href={productsHref}
                    className={footerLinkClassName}
                  >
                    {t("megaMenu.viewAllProducts")}
                    <ChevronRight className="size-3.5 rtl:rotate-180" />
                  </NavigationMenu.Link>
                </div>
              )}
            </div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item value="nav-collections">
          <NavigationMenu.Trigger className={navTriggerClassName}>
            {t("megaMenu.collectionsTrigger")}
            <ChevronDown className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            <span className="absolute inset-x-0 bottom-0 hidden h-[2px] bg-brand group-data-[state=open]:block" />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className="absolute start-0 top-0 w-full sm:w-auto">
            <div className={`p-4 ${colPanelWidth} ${colMinHeight}`}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                {t("megaMenu.collectionsTrigger")}
              </h3>
              {colCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <TagIcon className="mb-2 size-5 text-text-secondary" />
                  <p className="text-sm text-text-secondary">
                    {t("megaMenu.emptyCollections")}
                  </p>
                </div>
              ) : (
                <ul
                  className={`${colGridClass} max-h-[min(24rem,70vh)] overflow-y-auto`}
                >
                  {collections.map((c) => (
                    <li key={c.id}>
                      <NavigationMenu.Link
                        href={`/${locale}/collections/${encodeURIComponent(c.handle)}`}
                        className={panelLinkClassName}
                      >
                        {c.title}
                      </NavigationMenu.Link>
                    </li>
                  ))}
                </ul>
              )}
              <NavigationMenu.Link
                href={collectionsIndexHref}
                className={footerLinkClassName}
              >
                {t("megaMenu.viewAllCollections")}
                <ChevronRight className="size-3.5 rtl:rotate-180" />
              </NavigationMenu.Link>
            </div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item value="nav-about">
          <NavigationMenu.Link href={aboutHref} className={navItemClassName}>
            {t("about")}
          </NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <div className="absolute left-1/2 top-full isolate z-50 flex -translate-x-1/2 justify-center pt-2">
        <NavigationMenu.Viewport className="relative h-[var(--radix-navigation-menu-viewport-height)] w-full origin-[top_center] overflow-hidden rounded-lg border border-border bg-surface transition-[width,height] duration-300 sm:w-[var(--radix-navigation-menu-viewport-width)]" />
      </div>
    </NavigationMenu.Root>
  );
}
