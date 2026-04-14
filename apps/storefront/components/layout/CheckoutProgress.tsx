"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

const STEP_KEYS = ["address", "shipping", "review"] as const;

interface CheckoutProgressProps {
  locale: string;
}

export default function CheckoutProgress({ locale }: CheckoutProgressProps) {
  const pathname = usePathname();
  const t = useTranslations("checkout.steps");

  const activeIndex = STEP_KEYS.findIndex((key) =>
    pathname.includes(`/checkout/${key}`),
  );

  return (
    <nav aria-label={t("aria")} className="mb-8">
      <ol className="flex items-center">
        {STEP_KEYS.map((key, index) => {
          const isCompleted = index < activeIndex;
          const isActive = index === activeIndex;
          const href = `/${locale}/checkout/${key}`;

          return (
            <li
              key={key}
              className="flex flex-1 items-center gap-2 last:flex-none"
            >
              <div className="flex flex-col items-center gap-1.5">
                {isCompleted ? (
                  <Link
                    href={href}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                      "bg-brand text-text-inverse hover:bg-brand-hover",
                    )}
                    aria-label={t(key)}
                  >
                    ✓
                  </Link>
                ) : (
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                      isActive
                        ? "bg-brand text-text-inverse"
                        : "border border-border bg-surface text-text-secondary",
                    )}
                    aria-current={isActive ? "step" : undefined}
                  >
                    {index + 1}
                  </span>
                )}
                <span
                  className={cn(
                    "text-xs font-medium",
                    isActive ? "text-text-primary" : "text-text-secondary",
                  )}
                >
                  {t(key)}
                </span>
              </div>

              {index < STEP_KEYS.length - 1 ? (
                <div
                  className={cn(
                    "mb-5 h-px flex-1",
                    isCompleted ? "bg-brand" : "bg-border",
                  )}
                  aria-hidden="true"
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
