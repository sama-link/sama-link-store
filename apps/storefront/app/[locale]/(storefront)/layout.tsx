import { Suspense } from "react";
import { CartProvider } from "@/hooks/useCart";
import { CompareProvider, type CompareItem } from "@/hooks/useCompare";
import { WishlistProvider, type WishlistItem } from "@/hooks/useWishlist";
import { CustomerProvider } from "@/hooks/useCustomer";
import CartDrawer from "@/components/layout/CartDrawer";
import CartFab from "@/components/layout/CartFab";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RouteProgress from "@/components/layout/RouteProgress";
import { getAuthToken } from "@/lib/auth-cookie";
import { compareItemsFromBackendList } from "@/lib/compare-hydration";
import { getCurrentCustomerFromCookie } from "@/lib/customer-server";
import { getCustomerList } from "@/lib/medusa-client";
import { wishlistItemsFromBackendList } from "@/lib/wishlist-hydration";

// ACCT-6D / ACCT-6E: when a customer session cookie is present, hydrate
// the wishlist + compare server-side from the ACCT-6B backend so each
// provider boots in "authed" mode with a real first-paint snapshot.
// Failures fall through to an empty list — providers stay usable; the
// next mutation (or page load) re-tries the fetch. Both lists are
// fetched in parallel to keep the layout TTFB unchanged.
async function getInitialWishlistItems(token: string): Promise<WishlistItem[]> {
  try {
    const list = await getCustomerList(token, "wishlist");
    return wishlistItemsFromBackendList(list.items);
  } catch {
    return [];
  }
}

async function getInitialCompareItems(token: string): Promise<CompareItem[]> {
  try {
    const list = await getCustomerList(token, "compare");
    return compareItemsFromBackendList(list.items);
  } catch {
    return [];
  }
}

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const customer = await getCurrentCustomerFromCookie();
  const token = await getAuthToken();
  const isAuthed = Boolean(token);
  const [wishlistItems, compareItems] = isAuthed
    ? await Promise.all([
        getInitialWishlistItems(token!),
        getInitialCompareItems(token!),
      ])
    : [[], []];

  return (
    <CustomerProvider initialCustomer={customer}>
      <CartProvider>
        <WishlistProvider
          initialAuthed={isAuthed}
          initialItems={wishlistItems}
        >
          <CompareProvider
            initialAuthed={isAuthed}
            initialItems={compareItems}
          >
            <Suspense fallback={null}>
              <RouteProgress />
            </Suspense>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <CartDrawer />
            <CartFab />
          </CompareProvider>
        </WishlistProvider>
      </CartProvider>
    </CustomerProvider>
  );
}
