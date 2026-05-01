"use client";

import { useState, useTransition } from "react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { removeFromWishlistAction } from "../../actions";

interface WishlistItemActionsProps {
  backendItemId: string;
  variantId: string | null;
  moveLabel: string;
  removeLabel: string;
  movingLabel: string;
  removingLabel: string;
  moveErrorLabel: string;
}

/**
 * Two thin client buttons for one wishlist row. The page renders a list
 * of these next to each item; everything heavy stays server-side. The
 * "Move to cart" path uses the existing `useCart().addItem` hook, then
 * fires the ACCT-6C remove action — no cart logic is touched here.
 *
 * The `useWishlist().remove` call updates the provider's local state so
 * the header count and "is in wishlist" toggles on the rest of the page
 * tree update without a round-trip; the server action revalidates the
 * /account/wishlist path on the backend so a subsequent navigation
 * shows the canonical state.
 */
export default function WishlistItemActions({
  backendItemId,
  variantId,
  moveLabel,
  removeLabel,
  movingLabel,
  removingLabel,
  moveErrorLabel,
}: WishlistItemActionsProps) {
  const { addItem } = useCart();
  const { items: wishlistItems, remove } = useWishlist();
  const [moving, startMoveTransition] = useTransition();
  const [removing, startRemoveTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // The provider's `remove` keys on product_id. To find the product_id
  // without an extra prop, scan the hook's items array. The lookup is
  // cheap (single-digit lengths expected) and keeps this component's
  // prop surface narrow.
  function findProductId(): string {
    const match = wishlistItems.find((i) => i.backendItemId === backendItemId);
    return match?.id ?? "";
  }

  function handleMove() {
    if (!variantId) return;
    setError(null);
    startMoveTransition(async () => {
      try {
        await addItem(variantId, 1);
        const formData = new FormData();
        formData.set("item_id", backendItemId);
        await removeFromWishlistAction({}, formData);
        // Mirror the remove in the provider's local state so the header
        // count + ProductCard wishlist heart update immediately.
        remove(findProductId());
      } catch {
        setError(moveErrorLabel);
      }
    });
  }

  function handleRemove() {
    startRemoveTransition(async () => {
      const formData = new FormData();
      formData.set("item_id", backendItemId);
      await removeFromWishlistAction({}, formData);
      remove(findProductId());
    });
  }

  return (
    <div className="space-y-2">
      {variantId ? (
        <button
          type="button"
          onClick={handleMove}
          disabled={moving || removing}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
        >
          {moving ? movingLabel : moveLabel}
        </button>
      ) : null}
      <button
        type="button"
        onClick={handleRemove}
        disabled={removing || moving}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-error hover:text-error disabled:cursor-not-allowed disabled:opacity-60"
      >
        {removing ? removingLabel : removeLabel}
      </button>
      {error ? (
        <p role="alert" className="text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
