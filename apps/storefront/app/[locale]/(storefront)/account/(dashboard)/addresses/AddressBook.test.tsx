import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import AddressBook from "./AddressBook";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("../../actions", () => ({
  deleteAddressAction: vi.fn(async () => ({ success: true })),
  createAddressAction: vi.fn(async () => ({ success: true })),
  updateAddressAction: vi.fn(async () => ({ success: true })),
}));

describe("AddressBook", () => {
  it("renders empty state and expanded add form when there are no addresses", () => {
    const html = renderToString(<AddressBook addresses={[]} />);

    expect(html).toContain("addresses.empty.heading");
    expect(html).toContain("addresses.empty.body");
    expect(html).toContain("addresses.saveCta");
  });

  it("renders one card per address", () => {
    const html = renderToString(
      <AddressBook
        addresses={[
          {
            id: "addr_1",
            first_name: "Jane",
            last_name: "Doe",
            address_1: "Line 1",
            city: "Cairo",
            country_code: "eg",
          } as never,
        ]}
      />,
    );

    expect(html).toContain("Jane Doe");
    expect(html).toContain("addresses.editCta");
  });
});
