import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

/*
  Inter is used as the Latin/fallback font.
  An Arabic-optimised font (Cairo or Tajawal) will be added
  during the i18n implementation pass (Phase 1 i18n tasks).
*/
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Sama Link Store",
    template: "%s | Sama Link Store",
  },
  description: "Your destination for quality products.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
  ),
};

/*
  lang and dir are hardcoded to "en" / "ltr" for now.
  When next-intl is wired up, these will be derived from the active locale:
    lang={locale}
    dir={locale === "ar" ? "rtl" : "ltr"}
*/
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">{children}</body>
    </html>
  );
}
