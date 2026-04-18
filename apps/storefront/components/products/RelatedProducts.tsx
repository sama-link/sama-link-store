import ProductCard, { type Product } from "./ProductCard";

interface RelatedProductsProps {
  title: string;
  subtitle?: string;
  products: Product[];
}

export default function RelatedProducts({
  title,
  subtitle,
  products,
}: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="border-t border-border pt-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
        ) : null}
      </div>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
        {products.map((product) => (
          <li key={product.id} className="h-full">
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}
