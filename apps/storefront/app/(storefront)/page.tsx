import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/Card";

/*
  Temporary component showcase page.
  Replace with real home page content in Phase 3 (Product Catalog).
*/
export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-16 px-4 py-16 sm:px-6 lg:px-8">

      {/* ── Heading ── */}
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
          Sama Link Store
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          UI system preview — components ready for Phase 3+
        </p>
      </section>

      {/* ── Buttons ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted">
          Button
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
        <Button fullWidth>Full width button</Button>
      </section>

      {/* ── Badges ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted">
          Badge
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="success">In Stock</Badge>
          <Badge variant="warning">Low Stock</Badge>
          <Badge variant="error">Out of Stock</Badge>
          <Badge variant="info">New</Badge>
          <Badge variant="brand">Brand</Badge>
          <Badge variant="accent">Sale</Badge>
        </div>
      </section>

      {/* ── Inputs ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted">
          Input
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Email address" type="email" placeholder="you@example.com" />
          <Input label="Password" type="password" placeholder="••••••••" />
          <Input
            label="Search"
            type="search"
            placeholder="Search products…"
            hint="Try a product name or collection"
          />
          <Input
            label="Promo code"
            placeholder="SUMMER24"
            error="This code has expired"
          />
          <Input label="Disabled field" placeholder="Not editable" disabled />
        </div>
      </section>

      {/* ── Cards ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted">
          Card
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card variant="flat">
            <CardHeader>
              <p className="text-sm font-semibold text-text-primary">Flat card</p>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-text-secondary">
                Used for product listings and data rows.
              </p>
            </CardBody>
            <CardFooter>
              <Button size="sm" variant="outline" fullWidth>
                View
              </Button>
            </CardFooter>
          </Card>

          <Card variant="raised">
            <CardHeader>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-text-primary">Raised card</p>
                <Badge variant="success" size="sm">Active</Badge>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-text-secondary">
                Used for featured products and promotions.
              </p>
            </CardBody>
            <CardFooter>
              <Button size="sm" fullWidth>Add to cart</Button>
            </CardFooter>
          </Card>

          <Card variant="ghost" className="border border-dashed border-border">
            <CardBody>
              <p className="text-sm font-semibold text-text-primary">Ghost card</p>
              <p className="mt-1 text-sm text-text-secondary">
                Transparent surface for grouped sections.
              </p>
            </CardBody>
          </Card>
        </div>
      </section>

    </div>
  );
}
