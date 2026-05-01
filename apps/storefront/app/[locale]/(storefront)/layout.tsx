import { Suspense } from "react";
import { CartProvider } from "@/hooks/useCart";
import { CompareProvider } from "@/hooks/useCompare";
import { WishlistProvider, type WishlistItem } from "@/hooks/useWishlist";
import { CustomerProvider } from "@/hooks/useCustomer";
import CartDrawer from "@/components/layout/CartDrawer";
import CartFab from "@/components/layout/CartFab";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RouteProgress from "@/components/layout/RouteProgress";
import { getAuthToken } from "@/lib/auth-cookie";
import { getCurrentCustomerFromCookie } from "@/lib/customer-server";
import { getCustomerList } from "@/lib/medusa-client";
import { wishlistItemsFromBackendList } from "@/lib/wishlist-hydration";

// ACCT-6D: when a customer session cookie is present, hydrate the
// wishlist server-side from the ACCT-6B backend so the provider boots
// in "authed" mode with a real first-paint snapshot. Failures fall
// through to an empty list — the provider stays usable; the next
// mutation (or page load) re-tries the fetch.
async function getInitialWishlistItems(): Promise<{
  isAuthed: boolean;
  items: WishlistItem[];
}> {
  const token = await getAuthToken();
  if (!token) return { isAuthed: false, items: [] };
  try {
    const list = await getCustomerList(token, "wishlist");
    return {
      isAuthed: true,
      items: wishlistItemsFromBackendList(list.items),
    };
  } catch {
    return { isAuthed: true, items: [] };
  }
}

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const customer = await getCurrentCustomerFromCookie();
  const wishlist = await getInitialWishlistItems();

  return (
    <CustomerProvider initialCustomer={customer}>
      <CartProvider>
        <WishlistProvider
          initialAuthed={wishlist.isAuthed}
          initialItems={wishlist.items}
        >
          <CompareProvider>
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
