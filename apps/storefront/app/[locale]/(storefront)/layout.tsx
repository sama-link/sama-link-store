import { CartProvider } from "@/hooks/useCart";
import { CompareProvider } from "@/hooks/useCompare";
import { WishlistProvider } from "@/hooks/useWishlist";
import { CustomerProvider } from "@/hooks/useCustomer";
import CartDrawer from "@/components/layout/CartDrawer";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getCurrentCustomerFromCookie } from "@/lib/customer-server";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const customer = await getCurrentCustomerFromCookie();

  return (
    <CustomerProvider initialCustomer={customer}>
      <CartProvider>
        <WishlistProvider>
          <CompareProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <CartDrawer />
          </CompareProvider>
        </WishlistProvider>
      </CartProvider>
    </CustomerProvider>
  );
}
