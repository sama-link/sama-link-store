"use client";

import {
  createContext,
  createElement,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { StoreCustomer } from "@/lib/medusa-client";

export interface CustomerContextValue {
  customer: StoreCustomer | null;
  isAuthenticated: boolean;
}

const CustomerContext = createContext<CustomerContextValue | null>(null);

export function CustomerProvider({
  initialCustomer,
  children,
}: {
  initialCustomer: StoreCustomer | null;
  children: ReactNode;
}) {
  const value = useMemo<CustomerContextValue>(
    () => ({
      customer: initialCustomer,
      isAuthenticated: initialCustomer !== null,
    }),
    [initialCustomer],
  );

  return createElement(CustomerContext.Provider, { value }, children);
}

export function useCustomer(): CustomerContextValue {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomer must be used within CustomerProvider");
  return ctx;
}
