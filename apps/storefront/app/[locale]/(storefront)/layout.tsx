import { CartProvider } from "@/hooks/useCart";
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
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </CartProvider>
  );
}
