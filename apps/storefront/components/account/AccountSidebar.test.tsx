import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import AccountSidebar from "./AccountSidebar";

vi.mock("next/link", () => ({
  default: (props: { href: string; className?: string; children: React.ReactNode }) => (
    <a href={props.href} className={props.className}>
      {props.children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/en/account"),
}));

vi.mock("next-intl", () => ({
  useLocale: vi.fn(() => "en"),
  useTranslations: vi.fn(() => (key: string) => key),
}));

describe("AccountSidebar", () => {
  it("renders all account nav links", () => {
    const html = renderToString(<AccountSidebar variant="desktop" />);

    expect(html).toContain("account.nav.dashboard");
    expect(html).toContain("account.nav.profile");
    expect(html).toContain("account.nav.addresses");
    expect(html).toContain("account.nav.orders");
  });

  it("marks active route with active classes", () => {
    const html = renderToString(<AccountSidebar variant="desktop" />);
    expect(html).toContain("border-brand");
    expect(html).toContain("bg-brand-muted");
  });

  it("renders mobile horizontal-scroll tab strip", () => {
    const html = renderToString(<AccountSidebar variant="mobile" />);
    expect(html).toContain("overflow-x-auto");
    expect(html).toContain("rounded-full");
  });
});
