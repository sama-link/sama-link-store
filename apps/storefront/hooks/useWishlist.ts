"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { listProducts } from "@/lib/medusa-client";

export type ListProduct = Awaited<
  ReturnType<typeof listProducts>
>["products"][number];

/** Minimal catalog snapshot for wishlist / compare (Stage A localStorage). */
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

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setItems(parseStorage(window.localStorage.getItem(STORAGE_KEY)));
    setIsHydrated(true);
  }, []);

  const has = useCallback(
    (productId: string) => items.some((i) => i.id === productId),
    [items],
  );

  const remove = useCallback((productId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== productId);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, serialize(next));
      }
      return next;
    });
  }, []);

  const toggle = useCallback((item: WishlistItem) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      const next = exists
        ? prev.filter((i) => i.id !== item.id)
        : [...prev, item];
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, serialize(next));
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems(() => {
      const next: WishlistItem[] = [];
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, serialize(next));
      }
      return next;
    });
  }, []);

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
