"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { motion } from "framer-motion";
import { MapPin, Truck, CreditCard, CheckSquare, Check } from "lucide-react";

const STEP_KEYS = ["address", "shipping", "payment", "review"] as const;

const STEP_ICONS = {
  address: MapPin,
  shipping: Truck,
  payment: CreditCard,
  review: CheckSquare,
};

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
    <nav aria-label={t("aria")} className="mb-12 px-2 sm:px-6">
      <ol className="flex items-center w-full">
        {STEP_KEYS.map((key, index) => {
          const isCompleted = index < activeIndex;
          const isActive = index === activeIndex;
          const href = `/${locale}/checkout/${key}`;
          const Icon = STEP_ICONS[key];

          return (
            <React.Fragment key={key}>
              <li className="relative group flex flex-col items-center">
                {isCompleted ? (
                  <Link
                    href={href}
                    className="relative z-10 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-brand text-white shadow-md shadow-brand/20 transition-transform hover:scale-105"
                    aria-label={t(key)}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                    >
                      <Check className="h-5 w-5 sm:h-6 sm:w-6" />
                    </motion.div>
                  </Link>
                ) : (
                  <div
                    className={cn(
                      "relative z-10 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2 transition-all duration-300",
                      isActive
                        ? "border-brand bg-brand text-white shadow-md shadow-brand/20 scale-110"
                        : "border-border bg-surface text-text-muted"
                    )}
                    aria-current={isActive ? "step" : undefined}
                  >
                    <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", isActive ? "animate-in zoom-in duration-300" : "")} />
                  </div>
                )}
                
                {/* Text Label */}
                <div className="absolute top-[calc(100%+0.75rem)] w-max text-center">
                  <span
                    className={cn(
                      "text-[10px] sm:text-xs font-semibold uppercase tracking-wider block",
                      isActive ? "text-brand" : isCompleted ? "text-text-primary" : "text-text-muted"
                    )}
                  >
                    {t(key)}
                  </span>
                </div>
              </li>

              {/* Progress Line */}
              {index < STEP_KEYS.length - 1 && (
                <li aria-hidden="true" className="flex-1 flex items-center px-2 sm:px-4">
                  <div className="h-[2px] w-full bg-border rounded-full overflow-hidden flex">
                    <motion.div
                      className="h-full bg-brand w-full"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: isCompleted ? 1 : 0 }}
                      style={{ originX: locale === "ar" ? 1 : 0 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                  </div>
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
