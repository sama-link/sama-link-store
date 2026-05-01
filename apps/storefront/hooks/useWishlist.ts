"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import type { listProducts } from "@/lib/medusa-client";
import {
  addToWishlistAction,
  clearWishlistAction,
  removeFromWishlistAction,
} from "@/app/[locale]/(storefront)/account/actions";

export type ListProduct = Awaited<
  ReturnType<typeof listProducts>
>["products"][number];

/** Lightweight catalog snapshot persisted in localStorage (guest mode) or
 *  reconstructed from server tombstones + live product data (authed mode). */
export interface WishlistItem {
  id: string;
  handle: string | null;
  title: string | null;
  thumbnail: string | null;
  subtitle: string | null;
  material: string | null;
  weight: number | null;
  originCountry: string | null;
  variantId: string | null;
  amount: number | null;
  currencyCode: string | null;
  /** Backend `customer_list_item.id` — present in authed mode, used for
   *  remove calls. Undefined for guest items. */
  backendItemId?: string | null;
}

const STORAGE_KEY = "sama:wishlist:v1";

type StoredPayload = {
  v: 1;
  items: WishlistItem[];
};

function readRecord(rec: unknown, key: string): string | null {
  if (!rec || typeof rec !== "object") return null;
  const v = (rec as Record<string, unknown>)[key];
  return typeof v === "string" ? v : null;
}

function readNumber(rec: unknown, key: string): number | null {
  if (!rec || typeof rec !== "object") return null;
  const v = (rec as Record<string, unknown>)[key];
  return typeof v === "number" && !Number.isNaN(v) ? v : null;
}

export function productToWishlistItem(
  product: ListProduct,
  variantId?: string | null,
): WishlistItem {
  const rec = product as unknown as Record<string, unknown>;
  const subtitle = readRecord(rec, "subtitle");
  const material = readRecord(rec, "material");
  const weight = readNumber(rec, "weight");
  const originCountry = readRecord(rec, "origin_country");

  const variants = product.variants ?? [];
  const variant =
    variantId != null && variantId !== ""
      ? variants.find((v) => v.id === variantId) ?? variants[0]
      : variants[0];
  const calc = variant?.calculated_price;

  return {
    id: product.id,
    handle: product.handle ?? null,
    title: product.title ?? null,
    thumbnail: product.thumbnail ?? null,
    subtitle,
    material,
    weight,
    originCountry,
    variantId: variant?.id ?? null,
    amount:
      calc?.calculated_amount != null
        ? Number(calc.calculated_amount)
        : null,
    currencyCode: calc?.currency_code ?? null,
  };
}

function isWishlistItem(x: unknown): x is WishlistItem {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return typeof o.id === "string";
}

function parseStorage(raw: string | null): WishlistItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return [];
    const p = parsed as Partial<StoredPayload>;
    if (p.v !== 1 || !Array.isArray(p.items)) return [];
    return p.items.filter(isWishlistItem);
  } catch {
    return [];
  }
}

function serialize(items: WishlistItem[]): string {
  const payload: StoredPayload = { v: 1, items };
  return JSON.stringify(payload);
}

export interface WishlistContextValue {
  items: WishlistItem[];
  isHydrated: boolean;
  has: (productId: string) => boolean;
  toggle: (item: WishlistItem) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

interface WishlistProviderProps {
  children: ReactNode;
  /** When true, the provider operates in server-bound mode: mutations go
   *  through ACCT-6C server actions and localStorage is not used. The
   *  initialItems prop carries the server-side snapshot for first paint. */
  initialAuthed?: boolean;
  initialItems?: WishlistItem[];
}

export function WishlistProvider({
  children,
  initialAuthed = false,
  initialItems = [],
}: WishlistProviderProps) {
  // Mode is captured once at mount. Sign-in / sign-out triggers a full
  // route refresh (the auth cookie is re-issued on the server, layout
  // re-renders, the provider re-mounts), so a session change inside the
  // lifetime of one provider instance is not a real scenario.
  const mode = initialAuthed ? "authed" : "guest";
  const [items, setItems] = useState<WishlistItem[]>(
    mode === "authed" ? initialItems : [],
  );
  const [isHydrated, setIsHydrated] = useState(mode === "authed");
  const itemsRef = useRef<WishlistItem[]>(items);
  const [, startTransition] = useTransition();

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Guest-mode hydration: read localStorage on the client. Authed mode
  // ships its initial state from the server-rendered layout, so the
  // provider is hydrated synchronously and skips this effect.
  useEffect(() => {
    if (mode !== "guest" || typeof window === "undefined") return;
    const loaded = parseStorage(window.localStorage.getItem(STORAGE_KEY));
    itemsRef.current = loaded;
    setItems(loaded);
    setIsHydrated(true);
  }, [mode]);

  const has = useCallback(
    (productId: string) => items.some((i) => i.id === productId),
    [items],
  );

  const persistGuest = useCallback((next: WishlistItem[]) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, serialize(next));
    }
  }, []);

  const remove = useCallback(
    (productId: string) => {
      const prev = itemsRef.current;
      const target = prev.find((i) => i.id === productId);
      const next = prev.filter((i) => i.id !== productId);
      itemsRef.current = next;
      setItems(next);
      if (mode === "guest") {
        persistGuest(next);
        return;
      }
      // Authed: send the remove server action by backend item id. If we
      // do not have the backend id (item added in this session before a
      // hydration cycle), the optimistic local update is enough — the
      // next page load will re-hydrate the canonical state.
      const backendId = target?.backendItemId;
      if (backendId) {
        const formData = new FormData();
        formData.set("item_id", backendId);
        startTransition(() => {
          void removeFromWishlistAction({}, formData);
        });
      }
    },
    [mode, persistGuest],
  );

  const toggle = useCallback(
    (item: WishlistItem) => {
      const prev = itemsRef.current;
      const exists = prev.some((i) => i.id === item.id);
      if (exists) {
        remove(item.id);
        return;
      }
      // Optimistic add — local state first, server in the background.
      const next = [...prev, item];
      itemsRef.current = next;
      setItems(next);
      if (mode === "guest") {
        persistGuest(next);
        return;
      }
      const formData = new FormData();
      formData.set("product_id", item.id);
      if (item.variantId) formData.set("variant_id", item.variantId);
      if (item.title) formData.set("title_snapshot", item.title);
      if (item.thumbnail) formData.set("thumbnail_snapshot", item.thumbnail);
      startTransition(() => {
        void addToWishlistAction({}, formData);
      });
    },
    [mode, persistGuest, remove],
  );

  const clear = useCallback(() => {
    itemsRef.current = [];
    setItems([]);
    if (mode === "guest") {
      persistGuest([]);
      return;
    }
    startTransition(() => {
      void clearWishlistAction({}, new FormData());
    });
  }, [mode, persistGuest]);

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      isHydrated,
      has,
      toggle,
      remove,
      clear,
    }),
    [items, isHydrated, has, toggle, remove, clear],
  );

  return createElement(WishlistContext.Provider, { value }, children);
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
