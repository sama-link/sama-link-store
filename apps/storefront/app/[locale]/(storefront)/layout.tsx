import { CartProvider } from "@/hooks/useCart";
import { CompareProvider } from "@/hooks/useCompare";
import { WishlistProvider } from "@/hooks/useWishlist";
import CartDrawer from "@/components/layout/CartDrawer";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
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
  );
}
