import Container from "./Container";

/*
  Responsive layout:

  Mobile  (< 640px)  — stacked: Brand / Shop / Support (each full-width)
  Tablet  (≥ 640px)  — 2-column grid
  Desktop (≥ 1024px) — 4-column grid: Brand + 3 link columns
  Bottom bar         — copyright left, legal links right
*/

const FOOTER_LINKS = {
  Shop: [
    { label: "All Products", href: "#" },
    { label: "Collections", href: "#" },
    { label: "New Arrivals", href: "#" },
    { label: "Sale", href: "#" },
  ],
  Support: [
    { label: "Contact Us", href: "#" },
    { label: "FAQ", href: "#" },
    { label: "Shipping & Returns", href: "#" },
    { label: "Track Order", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms & Conditions", href: "#" },
  ],
} as const;

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface-subtle">

      {/* ── Main grid ── */}
      <Container className="py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand column */}
          <div className="flex flex-col gap-4">
            <a
              href="/"
              className="text-base font-bold tracking-tight text-text-primary hover:text-brand transition-colors"
            >
              Sama Link Store
            </a>
            <p className="max-w-xs text-sm leading-relaxed text-text-muted">
              Quality products delivered to your door.
              {/* Tagline updated during copywriting phase */}
            </p>
          </div>

          {/* Link columns */}
          {(Object.entries(FOOTER_LINKS) as [string, readonly { label: string; href: string }[]][]).map(
            ([group, links]) => (
              <div key={group} className="flex flex-col gap-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                  {group}
                </h3>
                <ul className="flex flex-col gap-3">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <a
                        href={href}
                        className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}
        </div>
      </Container>

      {/* ── Bottom bar ── */}
      <div className="border-t border-border">
        <Container className="flex h-14 flex-col items-center justify-center gap-2 sm:flex-row sm:justify-between">
          <p className="text-xs text-text-muted">
            © {currentYear} Sama Link Store. All rights reserved.
          </p>
          <p className="text-xs text-text-muted">
            Built with care in the Arab world.
          </p>
        </Container>
      </div>

    </footer>
  );
}
