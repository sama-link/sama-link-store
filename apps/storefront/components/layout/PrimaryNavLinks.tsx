"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

interface NavItem {
  label: string;
  href: string;
  isHotDeal?: boolean;
}

interface PrimaryNavLinksProps {
  items: NavItem[];
}

function FireIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-[18px]"
      aria-hidden="true"
    >
      <path d="M12 2c1 3 2.5 3.5 3.5 4.5A5 5 0 0 1 17 10a5 5 0 1 1-10 0c0-.3 0-.6.1-.9a2 2 0 1 0 3.3-2C8 4.5 12 2 12 2Z" />
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07 1.5-2.51 2-2.51 3.5a2.5 2.5 0 0 0 2.01 2Z" />
    </svg>
  );
}

export default function PrimaryNavLinks({ items }: PrimaryNavLinksProps) {
  const pathname = usePathname();

  return (
    <ul className="flex h-11 items-center gap-6 text-[14px]">
      {items.map((item) => {
        // Simple active check. You might want to enhance it for nested routes
        // (e.g. pathname.startsWith(item.href) && item.href !== "/ar")
        const isActive = pathname === item.href;

        return (
          <li key={item.href + item.label} className="flex h-full items-center">
            <Link
              href={item.href}
              className={cn(
                "group relative flex h-full items-center gap-1.5 whitespace-nowrap font-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
                  item.isHotDeal
                  ? "text-error hover:opacity-80"
                  : isActive
                  ? "text-brand"
                  : "text-text-primary hover:text-brand"
              )}
            >
              <span>{item.label}</span>
              {item.isHotDeal && <FireIcon />}
              
              {/* Bottom underline indicator for active/hover state */}
              <span
                className={cn(
                  "absolute bottom-0 start-0 h-[3px] rounded-t-sm transition-all duration-300",
                  item.isHotDeal ? "bg-error" : "bg-brand",
                  isActive
                    ? "w-full"
                    : "w-0 group-hover:w-full"
                )}
                aria-hidden="true"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
