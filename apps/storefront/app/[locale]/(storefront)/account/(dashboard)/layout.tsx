import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import AccountSidebar from "@/components/account/AccountSidebar";
import { getCurrentCustomerFromCookie } from "@/lib/customer-server";
import { logoutAction } from "../actions";

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
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
        <aside className="hidden rounded-lg border border-border bg-surface p-4 md:flex md:flex-col md:justify-between">
          <AccountSidebar variant="desktop" />
          <form action={logoutAction} className="mt-6 border-t border-border pt-4">
            <button
              type="submit"
              className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-text-inverse transition-opacity hover:bg-brand-hover"
            >
              {t("signOut")}
            </button>
          </form>
        </aside>

        <section className="space-y-5">
          <div className="md:hidden">
            <AccountSidebar variant="mobile" />
          </div>
          <div>{children}</div>
          <form action={logoutAction} className="md:hidden">
            <button
              type="submit"
              className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-text-inverse transition-opacity hover:bg-brand-hover"
            >
              {t("signOut")}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
