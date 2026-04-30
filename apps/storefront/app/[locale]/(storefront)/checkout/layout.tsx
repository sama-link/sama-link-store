import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Container from "@/components/layout/Container";
import CheckoutProgress from "@/components/layout/CheckoutProgress";
import { getAuthToken } from "@/lib/auth-cookie";
import { CART_COOKIE_NAME } from "@/lib/cart-cookie";
import { transferCartToCustomer } from "@/lib/medusa-client";

interface CheckoutLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function CheckoutLayout({
  children,
  params,
}: CheckoutLayoutProps) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const cartId = cookieStore.get(CART_COOKIE_NAME)?.value;

  if (!cartId) {
    redirect(`/${locale}/cart`);
  }

  // BETA-PAY-1: associate the cart with the signed-in customer at every
  // checkout step. Without this, customers who sign in then create a cart
  // place orders with customer_id=null. transferCart is idempotent server-
  // side; try/catch keeps a transient backend hiccup from blocking render.
  const authToken = await getAuthToken();
  if (authToken) {
    try {
      await transferCartToCustomer(cartId, authToken);
    } catch {
      // best-effort
    }
  }

  const t = await getTranslations({ locale, namespace: "checkout" });

  return (
    <Container>
      <div className="space-y-8 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          {t("title")}
        </h1>
        <CheckoutProgress locale={locale} />
        {children}
      </div>
    </Container>
  );
}
