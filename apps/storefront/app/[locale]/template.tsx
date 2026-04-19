/* Next.js App Router `template.tsx`.
   Unlike `layout.tsx` (which persists across route changes), `template.tsx`
   remounts on every navigation — fresh CSS enter animation each time.

   Layout mechanics: body is a flex column that fills the viewport. This
   wrapper needs to BOTH grow to fill the body's remaining height
   (`flex-1`) AND be a column flex itself so the storefront layout's
   `<main className="flex-1">` can push the footer to the very bottom
   even when the page content is short. */
export default function LocaleTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="page-enter flex min-h-full flex-1 flex-col">
      {children}
    </div>
  );
}
