import { cn } from "@/lib/cn";

type ContainerElement = "div" | "section" | "article" | "main" | "aside";

interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  /** Rendered HTML element. Defaults to div. */
  as?: ContainerElement;
}

/**
 * Max-width page wrapper with responsive horizontal padding.
 * Use `as` to emit a semantic element when needed.
 *
 * Breakpoints:
 *   mobile  (< 640px)  — px-4  (16px each side)
 *   sm      (≥ 640px)  — px-6  (24px each side)
 *   lg      (≥ 1024px) — px-8  (32px each side)
 *   max-width: 1280px (7xl)
 */
export default function Container({
  as: Tag = "div",
  className,
  children,
  ...props
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
