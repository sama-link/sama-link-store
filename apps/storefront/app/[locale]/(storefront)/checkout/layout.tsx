import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Container from "@/components/layout/Container";
import CheckoutProgress from "@/components/layout/CheckoutProgress";
import { CART_COOKIE_NAME } from "@/lib/cart-cookie";

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
