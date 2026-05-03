import Container from "@/components/layout/Container";

/** Shown while the catalog segment streams (e.g. brand chip navigation). */
export default function ProductsLoading() {
  return (
    <Container>
      <div
        className="space-y-6 py-12"
        aria-busy="true"
        aria-label="Loading products"
      >
        <div className="h-9 w-56 animate-pulse rounded-lg bg-surface-subtle" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-10 w-[5.5rem] shrink-0 animate-pulse rounded-full bg-surface-subtle"
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded-2xl bg-surface-subtle"
            />
          ))}
        </div>
      </div>
    </Container>
  );
}
