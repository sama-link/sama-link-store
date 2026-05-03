/* Locale route shell — plain wrapper (no opacity enter animation).

   A framer-motion fade on every navigation (including same pathname + new
   query, e.g. catalog `?page=2`) remounted the subtree and reset scroll to the
   top. Keeping a static wrapper preserves scroll while `router.push(..., {
   scroll: false })` + layout restore in `LoadMoreProducts` handle pagination. */
export default function LocaleTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
}
