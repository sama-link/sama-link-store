import { getLocale, getTranslations } from "next-intl/server";
import PrimaryNavLinks from "./PrimaryNavLinks";

export default async function PrimaryNav({ segment }: { segment: "start" | "end" }) {
  const locale = await getLocale();
  const t = await getTranslations("nav");

  if (segment === "start") {
    const items = [
      { label: t("allProducts"), href: `/${locale}/products`, highlightCatalog: true },
    ];
    return <PrimaryNavLinks items={items} />;
  }

  if (segment === "end") {
    const items = [
      {
        label: t("hotDeals"),
        href: `/${locale}/products/special-offers`,
        isHotDeal: true,
      }
    ];

    return (
      <div className="flex h-full items-center gap-6">
        <PrimaryNavLinks items={items} />
      </div>
    );
  }

  return null;
}