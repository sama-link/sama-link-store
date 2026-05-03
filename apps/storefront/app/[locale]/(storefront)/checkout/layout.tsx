import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Container from "@/components/layout/Container";
import CheckoutProgress from "@/components/layout/CheckoutProgress";
import { CART_COOKIE_NAME } from "@/lib/cart-cookie";
import { ShoppingBag } from "lucide-react";

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
    <div className="min-h-screen bg-surface-subtle pb-12 pt-8">
      <Container>
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="flex items-center justify-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/20">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">
              {t("title")}
            </h1>
          </div>
          
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(255,255,255,0.02)] sm:p-8">
            <CheckoutProgress locale={locale} />
            <div className="mt-8">
              {children}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
