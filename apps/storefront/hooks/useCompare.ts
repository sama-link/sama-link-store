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
  type ReactNode,
} from "react";
import type { WishlistItem } from "@/hooks/useWishlist";

export type CompareItem = WishlistItem;

export const COMPARE_MAX_ITEMS = 4;

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

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const itemsRef = useRef<CompareItem[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const loaded = parseStorage(window.localStorage.getItem(STORAGE_KEY));
    itemsRef.current = loaded;
    setItems(loaded);
    setIsHydrated(true);
  }, []);

  const persist = useCallback((next: CompareItem[]) => {
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
      persist(itemsRef.current.filter((i) => i.id !== productId));
    },
    [persist],
  );

  const toggle = useCallback(
    (item: CompareItem): { ok: true } | { ok: false; reason: "full" } => {
      const prev = itemsRef.current;
      const exists = prev.some((i) => i.id === item.id);
      if (exists) {
        persist(prev.filter((i) => i.id !== item.id));
        return { ok: true };
      }
      if (prev.length >= COMPARE_MAX_ITEMS) {
        return { ok: false, reason: "full" };
      }
      persist([...prev, item]);
      return { ok: true };
    },
    [persist],
  );

  const clear = useCallback(() => {
    persist([]);
  }, [persist]);

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
