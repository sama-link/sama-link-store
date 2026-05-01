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
import type { WishlistItem } from "@/hooks/useWishlist";
import { COMPARE_MAX_ITEMS } from "@/lib/compare-cap";
import {
  addToCompareAction,
  clearCompareAction,
  removeFromCompareAction,
} from "@/app/[locale]/(storefront)/account/actions";

export type CompareItem = WishlistItem;

// Re-exported for back-compat — existing call sites import this name
// from `@/hooks/useCompare`. The single source of truth lives in
// `@/lib/compare-cap` (no React / no server-action dependency).
export { COMPARE_MAX_ITEMS };

const STORAGE_KEY = "sama:compare:v1";

type StoredPayload = {
  v: 1;
  items: CompareItem[];
};

function isCompareItem(x: unknown): x is CompareItem {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return typeof o.id === "string";
}

function parseStorage(raw: string | null): CompareItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return [];
    const p = parsed as Partial<StoredPayload>;
    if (p.v !== 1 || !Array.isArray(p.items)) return [];
    return p.items.filter(isCompareItem).slice(0, COMPARE_MAX_ITEMS);
  } catch {
    return [];
  }
}

function serialize(items: CompareItem[]): string {
  const payload: StoredPayload = { v: 1, items };
  return JSON.stringify(payload);
}

export interface CompareContextValue {
  items: CompareItem[];
  isHydrated: boolean;
  isFull: boolean;
  has: (productId: string) => boolean;
  toggle: (item: CompareItem) => { ok: true } | { ok: false; reason: "full" };
  remove: (productId: string) => void;
  clear: () => void;
}

const CompareContext = createContext<CompareContextValue | null>(null);

interface CompareProviderProps {
  children: ReactNode;
  /** When true, the provider operates in server-bound mode: mutations go
   *  through ACCT-6C server actions and localStorage is not used. The
   *  initialItems prop carries the server-side snapshot for first paint. */
  initialAuthed?: boolean;
  initialItems?: CompareItem[];
}

export function CompareProvider({
  children,
  initialAuthed = false,
  initialItems = [],
}: CompareProviderProps) {
  // Mode is captured once at mount; sign-in/out re-renders the layout
  // and re-mounts the provider with fresh props (matches ACCT-6D's
  // wishlist provider).
  const mode = initialAuthed ? "authed" : "guest";
  const [items, setItems] = useState<CompareItem[]>(
    mode === "authed" ? initialItems.slice(0, COMPARE_MAX_ITEMS) : [],
  );
  const [isHydrated, setIsHydrated] = useState(mode === "authed");
  const itemsRef = useRef<CompareItem[]>(items);
  const [, startTransition] = useTransition();

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Guest hydration: read localStorage on mount (existing behavior).
  useEffect(() => {
    if (mode !== "guest" || typeof window === "undefined") return;
    const loaded = parseStorage(window.localStorage.getItem(STORAGE_KEY));
    itemsRef.current = loaded;
    setItems(loaded);
    setIsHydrated(true);
  }, [mode]);

  const persistGuest = useCallback((next: CompareItem[]) => {
    const capped = next.slice(0, COMPARE_MAX_ITEMS);
    itemsRef.current = capped;
    setItems(capped);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, serialize(capped));
    }
  }, []);

  const has = useCallback(
    (productId: string) => items.some((i) => i.id === productId),
    [items],
  );

  const isFull = items.length >= COMPARE_MAX_ITEMS;

  const remove = useCallback(
    (productId: string) => {
      const prev = itemsRef.current;
      const target = prev.find((i) => i.id === productId);
      const next = prev.filter((i) => i.id !== productId);
      if (mode === "guest") {
        persistGuest(next);
        return;
      }
      itemsRef.current = next;
      setItems(next);
      const backendId = target?.backendItemId;
      if (backendId) {
        const formData = new FormData();
        formData.set("item_id", backendId);
        startTransition(() => {
          void removeFromCompareAction({}, formData);
        });
      }
    },
    [mode, persistGuest],
  );

  const toggle = useCallback(
    (item: CompareItem): { ok: true } | { ok: false; reason: "full" } => {
      const prev = itemsRef.current;
      const exists = prev.some((i) => i.id === item.id);
      if (exists) {
        if (mode === "guest") {
          persistGuest(prev.filter((i) => i.id !== item.id));
        } else {
          remove(item.id);
        }
        return { ok: true };
      }
      // Client-side cap check — UX-only short-circuit. Backend cap is
      // still authoritative; the server enforces it on POST.
      if (prev.length >= COMPARE_MAX_ITEMS) {
        return { ok: false, reason: "full" };
      }
      const next = [...prev, item];
      if (mode === "guest") {
        persistGuest(next);
        return { ok: true };
      }
      itemsRef.current = next;
      setItems(next);
      const formData = new FormData();
      formData.set("product_id", item.id);
      if (item.variantId) formData.set("variant_id", item.variantId);
      if (item.title) formData.set("title_snapshot", item.title);
      if (item.thumbnail) formData.set("thumbnail_snapshot", item.thumbnail);
      startTransition(() => {
        void addToCompareAction({}, formData);
      });
      return { ok: true };
    },
    [mode, persistGuest, remove],
  );

  const clear = useCallback(() => {
    if (mode === "guest") {
      persistGuest([]);
      return;
    }
    itemsRef.current = [];
    setItems([]);
    startTransition(() => {
      void clearCompareAction({}, new FormData());
    });
  }, [mode, persistGuest]);

  const value = useMemo<CompareContextValue>(
    () => ({
      items,
      isHydrated,
      isFull,
      has,
      toggle,
      remove,
      clear,
    }),
    [items, isHydrated, isFull, has, toggle, remove, clear],
  );

  return createElement(CompareContext.Provider, { value }, children);
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
