"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/* Top-of-page progress bar.

   Implementation notes:
   - We do NOT monkey-patch history.pushState / replaceState. Next 16 routes are
     driven through the router inside useInsertionEffect, which refuses to
     schedule updates from patched methods ("useInsertionEffect must not schedule
     updates"). Instead we listen only to user-intent signals (anchor clicks,
     popstate, submit).
   - setNavigating(true) is scheduled via queueMicrotask so it always lands
     outside of any React commit phase. */
export default function RouteProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [navigating, setNavigating] = useState(false);
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setNavigating(false);
    if (safetyRef.current) {
      clearTimeout(safetyRef.current);
      safetyRef.current = null;
    }
  }, [pathname, search]);

  useEffect(() => {
    function start() {
      queueMicrotask(() => setNavigating(true));
      if (safetyRef.current) clearTimeout(safetyRef.current);
      safetyRef.current = setTimeout(() => setNavigating(false), 8000);
    }

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href") ?? "";
      if (!href || href.startsWith("#")) return;
      if (href.startsWith("javascript:")) return;

      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search
        )
          return;
      } catch {
        return;
      }

      start();
    }

    function onSubmit(e: SubmitEvent) {
      const form = e.target as HTMLFormElement | null;
      if (!form) return;
      const action = form.getAttribute("action") ?? "";
      if (action.startsWith("http") && !action.startsWith(window.location.origin)) return;
      start();
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("popstate", start);

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("popstate", start);
      if (safetyRef.current) clearTimeout(safetyRef.current);
    };
  }, []);

  if (!navigating) return null;

  return <div className="route-progress" aria-hidden="true" />;
}
