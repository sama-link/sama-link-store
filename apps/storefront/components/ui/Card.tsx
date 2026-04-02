import { cn } from "@/lib/cn";

/* ─── Card root ─── */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * flat    — white with a 1px border (default, good for lists)
   * raised  — white with a shadow (good for featured items)
   * ghost   — transparent, no border (good for grouped sections)
   */
  variant?: "flat" | "raised" | "ghost";
}

/**
 * Composable surface container.
 *
 * @example
 *   <Card>
 *     <CardHeader>Title</CardHeader>
 *     <CardBody>Content goes here.</CardBody>
 *     <CardFooter>
 *       <Button size="sm">Action</Button>
 *     </CardFooter>
 *   </Card>
 */
export function Card({ variant = "flat", className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-surface",
        variant === "flat" && "border border-border",
        variant === "raised" && "shadow-md",
        variant === "ghost" && "bg-transparent",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ─── Card Header ─── */

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-b border-border px-5 py-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ─── Card Body ─── */

export function CardBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-5 py-4", className)} {...props}>
      {children}
    </div>
  );
}

/* ─── Card Footer ─── */

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-t border-border px-5 py-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
