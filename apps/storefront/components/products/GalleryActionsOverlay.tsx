"use client";

import type { WishlistItem } from "@/hooks/useWishlist";
import WishlistButton from "@/components/products/WishlistButton";
import CompareButton from "@/components/products/CompareButton";

export interface GalleryActionsOverlayProps {
  item: WishlistItem;
}

/**
 * PDP gallery corner actions — wishlist + compare only (MVP-2a).
 * Positioned start-3 top-3 by parent; compact surface-backed controls.
 */
export default function GalleryActionsOverlay({ item }: GalleryActionsOverlayProps) {
  return (
    <div className="pointer-events-none absolute start-3 top-3 z-[30] flex flex-col gap-2">
      <div className="pointer-events-auto flex flex-col gap-2 rounded-lg border border-border bg-surface/90 p-1 shadow-sm backdrop-blur-sm">
        <WishlistButton
          item={item}
          className="[&_button]:h-9 [&_button]:w-9 [&_button]:min-w-0 [&_button]:px-0"
        />
        <CompareButton
          item={item}
          className="[&_button]:h-9 [&_button]:w-9 [&_button]:min-w-0 [&_button]:px-0"
        />
      </div>
    </div>
  );
}
