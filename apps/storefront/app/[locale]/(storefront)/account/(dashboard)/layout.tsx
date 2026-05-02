import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import AccountSidebar from "@/components/account/AccountSidebar";
import { getCurrentCustomerFromCookie } from "@/lib/customer-server";
import { logoutAction } from "../actions";
import { LogOut } from "lucide-react";

export const dynamic = "force-dynamic";

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  const customer = await getCurrentCustomerFromCookie();

  if (!customer) {
    redirect(`/${locale}/account/login`);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-0 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="grid grid-cols-1 gap-4 sm:gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="hidden rounded-2xl border border-border bg-surface p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(255,255,255,0.02)] lg:flex lg:flex-col lg:justify-between lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
          <div className="space-y-6">
            <div className="px-3">
              <h2 className="text-lg font-semibold text-text-primary">
                {customer.first_name ? `${t("greetingSignedOut")} ${customer.first_name}` : t("nav.desktopLabel")}
              </h2>
              <p className="text-sm text-text-secondary mt-1">{customer.email}</p>
            </div>
            <AccountSidebar variant="desktop" />
          </div>
          
          <form action={logoutAction} className="mt-6 border-t border-border pt-5">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-subtle px-4 py-2.5 text-sm font-medium text-error transition-colors hover:bg-error-muted hover:text-error"
            >
              <LogOut className="h-4 w-4" />
              {t("signOut")}
            </button>
          </form>
        </aside>

        <section className="flex flex-col sm:space-y-6 min-w-0">
          <div className="lg:hidden sticky top-0 z-30 bg-surface/90 backdrop-blur-xl border-b border-border pt-4 px-4 sm:px-0 mb-4 sm:mb-0 sm:border-b-0 sm:bg-transparent sm:backdrop-blur-none">
            <AccountSidebar variant="mobile" />
          </div>
          
          <div className="flex-1 min-w-0 sm:rounded-2xl sm:border border-border bg-surface sm:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:sm:shadow-[0_8px_30px_rgb(255,255,255,0.02)] px-4 sm:p-8 min-h-[calc(100vh-16rem)]">
            {children}
          </div>

          <form action={logoutAction} className="lg:hidden mt-8 px-4 sm:px-0 pb-8">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-error transition-colors hover:bg-error-muted hover:text-error"
            >
              <LogOut className="h-4 w-4" />
              {t("signOut")}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
