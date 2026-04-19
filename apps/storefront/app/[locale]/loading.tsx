import { getTranslations } from "next-intl/server";
import Logo from "@/components/ui/Logo";

/* Next.js App Router streaming loading state.
   Shown automatically between route segments while the server streams.
   Design is intentionally calm: centred logo with a soft pulse + a
   hairline brand progress bar underneath. Honours reduced-motion. */
export default async function Loading() {
  const tCommon = await getTranslations("common");
  const tNav = await getTranslations("nav");

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={tCommon("loading")}
      className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 py-20"
    >
      {/* Logo pulse */}
      <div className="page-loader-logo">
        <Logo
          variant="icon"
          alt={tCommon("storeName")}
          className="h-14 w-auto"
          priority
        />
      </div>

      {/* Hairline progress bar */}
      <div className="page-loader-rail" aria-hidden="true">
        <span className="page-loader-rail-fill" />
      </div>

      <span className="sr-only">{tNav("mobileNavigation")}</span>
    </div>
  );
}
