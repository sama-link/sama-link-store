import Image from "next/image";
import { cn } from "@/lib/cn";

export type LogoVariant = "horizontal-no-tagline" | "icon";

export interface LogoProps {
  variant: LogoVariant;
  alt: string;
  className?: string;
  priority?: boolean;
}

/**
 * Theme-aware logo: light WebP by default, dark WebP when `html.dark` (ADR-020).
 * Display size via `className` (e.g. `h-8 w-auto`); width/height are intrinsic.
 */
export default function Logo({
  variant,
  alt,
  className,
  priority = false,
}: LogoProps) {
  if (variant === "horizontal-no-tagline") {
    return (
      <>
        <Image
          src="/brand/logo/sama-link_logo_horizontal-no-tagline_light.webp"
          alt={alt}
          width={1842}
          height={522}
          className={cn("dark:hidden", className)}
          priority={priority}
        />
        <Image
          src="/brand/logo/sama-link_logo_horizontal-no-tagline_dark.webp"
          alt=""
          width={1847}
          height={530}
          className={cn("hidden dark:block", className)}
          priority={priority}
        />
      </>
    );
  }

  return (
    <>
      <Image
        src="/brand/logo/sama-link_logo_icon_light.webp"
        alt={alt}
        width={1440}
        height={1063}
        className={cn("dark:hidden", className)}
        priority={priority}
      />
      <Image
        src="/brand/logo/sama-link_logo_icon_dark.webp"
        alt=""
        width={1441}
        height={1063}
        className={cn("hidden dark:block", className)}
        priority={priority}
      />
    </>
  );
}
