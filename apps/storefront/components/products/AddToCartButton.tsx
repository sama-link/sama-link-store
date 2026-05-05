"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCart } from "@/hooks/useCart";
import Button, { type ButtonProps } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { flyToCart } from "@/lib/fly-to-cart";

interface AddToCartButtonProps {
  variantId: string;
  /** Visual variant — default: primary. Use `outline` for secondary card actions. */
  variant?: ButtonProps["variant"];
  /** Size — default: md. Use `lg` for hero PDP CTA. */
  size?: ButtonProps["size"];
  /** Stretch to full container width. Default: true. */
  fullWidth?: boolean;
  /** Called once after a successful add (e.g. Buy Now navigation). */
  onAdded?: () => void;
  /** Icon-only layout for dense card toolbars; requires `iconAriaLabel`. */
  iconOnly?: boolean;
  /** Accessible name when `iconOnly` is true. */
  iconAriaLabel?: string;
  className?: string;
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      className="h-5 w-5 animate-pop-in"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function CartIcon() {
  /* Cleaner Lucide-style shopping-cart — matches the reference vocabulary */
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M3 4h2.5l2.1 10.5a1.8 1.8 0 0 0 1.8 1.4h8.4a1.8 1.8 0 0 0 1.8-1.4L21 7H6.2" />
    </svg>
  );
}

export default function AddToCartButton({
  variantId,
  variant = "primary",
  size = "md",
  fullWidth = true,
  onAdded,
  iconOnly = false,
  iconAriaLabel,
  className,
}: AddToCartButtonProps) {
  const t = useTranslations("products.detail");
  const { addItem, cart, loading: cartBootstrapping } = useCart();
  const [state, setState] = useState<"idle" | "loading" | "added">("idle");

  async function handleClick(e: React.MouseEvent<HTMLElement>) {
    // Save the event coordinates so we can use them after await
    const rect = e.currentTarget.getBoundingClientRect();
    
    if (state !== "idle" || !cart) return;
    setState("loading");
    try {
      await addItem(variantId, 1);
      setState("added");
      
      flyToCart(rect);
      
      onAdded?.();
      setTimeout(() => setState("idle"), 1800);
    } catch {
      setState("idle");
    }
  }

  const isAdded = state === "added";

  if (iconOnly) {
    return (
      <Button
        variant={isAdded ? "secondary" : variant}
        size="sm"
        fullWidth={false}
        loading={state === "loading"}
        disabled={cartBootstrapping || !cart || state !== "idle"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void handleClick(e);
        }}
        aria-label={iconAriaLabel ?? t("addToCart")}
        className={cn(
          "relative h-11 w-11 shrink-0 px-0",
          isAdded &&
            "!bg-success !text-text-inverse !border-success !opacity-100 shimmer-overlay",
          className
        )}
      >
        {state === "loading" ? null : isAdded ? <CheckIcon /> : <CartIcon />}
      </Button>
    );
  }

  return (
    <Button
      variant={isAdded ? "secondary" : variant}
      size={size}
      fullWidth={fullWidth}
      loading={state === "loading"}
      disabled={cartBootstrapping || !cart || state !== "idle"}
      onClick={handleClick}
      className={cn(
        "relative overflow-hidden cta-glow",
        isAdded &&
          "!bg-success !text-text-inverse !border-success !opacity-100 shimmer-overlay",
        className
      )}
    >
      {isAdded ? (
        <>
          <span>{t("added")}</span>
          <CheckIcon />
        </>
      ) : state === "loading" ? (
        t("adding")
      ) : (
        t("addToCart")
      )}
    </Button>
  );
}
