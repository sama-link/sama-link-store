"use client";

import { useTransition } from "react";
import { useCompare } from "@/hooks/useCompare";
import { removeFromCompareAction } from "../../actions";

interface CompareItemActionsProps {
  backendItemId: string;
  removeLabel: string;
  removingLabel: string;
}

/**
 * Per-column remove button for the account compare table. Mirrors the
 * ACCT-6D wishlist actions pattern: optimistic local update through the
 * provider's `remove(productId)` plus the ACCT-6C server action keyed
 * by the backend item id.
 */
export default function CompareItemActions({
  backendItemId,
  removeLabel,
  removingLabel,
}: CompareItemActionsProps) {
  const { items, remove } = useCompare();
  const [removing, startTransition] = useTransition();

  function findProductId(): string {
    const match = items.find((i) => i.backendItemId === backendItemId);
    return match?.id ?? "";
  }

  function handleRemove() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("item_id", backendItemId);
      await removeFromCompareAction({}, formData);
      remove(findProductId());
    });
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={removing}
      className="rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-error hover:text-error disabled:cursor-not-allowed disabled:opacity-60"
    >
      {removing ? removingLabel : removeLabel}
    </button>
  );
}
