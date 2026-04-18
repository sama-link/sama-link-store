"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCart } from "@/hooks/useCart";
import Button, { type ButtonProps } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

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
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218a1.125 1.125 0 0 0 1.088-.845l1.25-5A1.125 1.125 0 0 0 17.693 7H6.75m0 0v-.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V7m0 0h6.75"
      />
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
}: AddToCartButtonProps) {
  const t = useTranslations("products.detail");
  const { addItem, cart, loading: cartBootstrapping } = useCart();
  const [state, setState] = useState<"idle" | "loading" | "added">("idle");

  async function handleClick() {
    if (state !== "idle" || !cart) return;
    setState("loading");
    try {
      await addItem(variantId, 1);
      setState("added");
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
          void handleClick();
        }}
        aria-label={iconAriaLabel ?? t("addToCart")}
        className={cn(
          "relative h-10 w-10 shrink-0 px-0",
          isAdded &&
            "!bg-success !text-text-inverse !border-success !opacity-100 shimmer-overlay",
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
