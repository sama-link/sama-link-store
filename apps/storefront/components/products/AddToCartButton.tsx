"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCart } from "@/hooks/useCart";

interface AddToCartButtonProps {
  variantId: string;
}

export default function AddToCartButton({ variantId }: AddToCartButtonProps) {
  const t = useTranslations("products.detail");
  const { addItem, cart, loading: cartBootstrapping } = useCart();
  const [state, setState] = useState<"idle" | "loading" | "added">("idle");

  async function handleClick() {
    if (state !== "idle" || !cart) return;
    setState("loading");
    try {
      await addItem(variantId, 1);
      setState("added");
      setTimeout(() => setState("idle"), 1500);
    } catch {
      setState("idle");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state !== "idle" || cartBootstrapping || !cart}
      className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-text-inverse transition-opacity hover:bg-brand-hover disabled:opacity-60"
    >
      {state === "loading"
        ? t("adding")
        : state === "added"
          ? t("added")
          : t("addToCart")}
    </button>
  );
}
