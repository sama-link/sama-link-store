"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

interface PdpTabsProps {
  description: ReactNode | null;
  specs: ReactNode | null;
  reviews: ReactNode | null;
}

type TabKey = "description" | "specs" | "reviews";

export default function PdpTabs({ description, specs, reviews }: PdpTabsProps) {
  const t = useTranslations("products.detail");
  const tabs: Array<{ key: TabKey; label: string; node: ReactNode | null }> = [
    { key: "description", label: t("descriptionHeading"), node: description },
    { key: "specs", label: t("specifications"), node: specs },
    { key: "reviews", label: t("reviews.title"), node: reviews },
  ].filter((tab) => tab.node != null) as Array<{
    key: TabKey;
    label: string;
    node: ReactNode | null;
  }>;

  const [active, setActive] = useState<TabKey>(tabs[0]?.key ?? "description");

  if (tabs.length === 0) return null;

  return (
    <section className="border-t border-border pt-12">
      <div
        role="tablist"
        aria-label={t("tabsAria")}
        className="flex gap-1 overflow-x-auto border-b border-border"
      >
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              role="tab"
              type="button"
              id={`tab-${tab.key}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.key}`}
              onClick={() => setActive(tab.key)}
              className={cn(
                "relative whitespace-nowrap px-5 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "text-brand"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              {tab.label}
              {isActive ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 -bottom-px h-0.5 bg-brand"
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.key}
          role="tabpanel"
          id={`panel-${tab.key}`}
          aria-labelledby={`tab-${tab.key}`}
          hidden={tab.key !== active}
          className="pt-8"
        >
          {tab.node}
        </div>
      ))}
    </section>
  );
}
