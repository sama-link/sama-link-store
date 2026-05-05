"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
interface Props {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  categoryActive: boolean;
}

export default function CatalogLayout({ sidebar, children, categoryActive }: Props) {
  // If categoryActive is true, hide sidebar by default.
  // Otherwise show it by default.
  const [showSidebar, setShowSidebar] = useState(!categoryActive);

  // Sync when categoryActive changes (e.g. navigation)
  useEffect(() => {
    setShowSidebar(!categoryActive);
  }, [categoryActive]);

  // We provide a way to toggle it via a custom event or we can just render the toggle button inside the toolbar.
  // Actually, the easiest is to expose a context or just listen to a window event.
  useEffect(() => {
    const handleToggle = () => setShowSidebar(s => !s);
    window.addEventListener("toggle-desktop-filters", handleToggle);
    return () => window.removeEventListener("toggle-desktop-filters", handleToggle);
  }, []);

  return (
    <div className="flex flex-col gap-8 py-12 lg:flex-row lg:items-start">
      <aside
        className={cn(
          "w-full shrink-0 lg:w-64 transition-[margin,opacity] duration-300",
          /* In-flow sidebar is desktop-only; mobile uses MobileCatalogFab. */
          "hidden",
          showSidebar ? "lg:block" : "lg:hidden",
        )}
      >
        {sidebar}
      </aside>
      <div className="min-w-0 flex-1 space-y-6">
        {children}
      </div>
    </div>
  );
}