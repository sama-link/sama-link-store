import { Suspense } from "react";
import { CartProvider } from "@/hooks/useCart";
import { CompareProvider, type CompareItem } from "@/hooks/useCompare";
import { WishlistProvider, type WishlistItem } from "@/hooks/useWishlist";
import { CustomerProvider } from "@/hooks/useCustomer";
import CartDrawer from "@/components/layout/CartDrawer";
import CartFab from "@/components/layout/CartFab";
import Header, { type HeaderCategory } from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RouteProgress from "@/components/layout/RouteProgress";
import { getAuthToken } from "@/lib/auth-cookie";
import { compareItemsFromBackendList } from "@/lib/compare-hydration";
import { getCurrentCustomerFromCookie } from "@/lib/customer-server";
import { getCustomerList, listProductCategories } from "@/lib/medusa-client";
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

// Pre-fetch product categories at the layout level so the (async) Header
// can render synchronously and ship in source order alongside <main>/<Footer>.
// Without this, Header awaiting the backend categories call inside its own
// body causes Next.js RSC to stream it out-of-order (after <footer>), which
// makes header actions render at the bottom of the page until the client
// $RS slot-replacement script runs.
async function getInitialHeaderCategories(): Promise<HeaderCategory[]> {
  try {
    const result = await listProductCategories();
    return (result.product_categories ?? []).map((c: { id: string; name?: string | null; handle?: string | null }) => ({
      id: c.id,
      name: c.name ?? c.handle ?? c.id,
    }));
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
  const [wishlistItems, compareItems, headerCategories] = await Promise.all([
    isAuthed ? getInitialWishlistItems(token!) : Promise.resolve<WishlistItem[]>([]),
    isAuthed ? getInitialCompareItems(token!) : Promise.resolve<CompareItem[]>([]),
    getInitialHeaderCategories(),
  ]);

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
            <Header categories={headerCategories} />
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
