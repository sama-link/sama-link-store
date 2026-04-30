import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAddressForm,
  getAuthTokenMock,
  listCustomerAddressesMock,
  getCurrentCustomerMock,
  retrieveCartMock,
  updateCartMock,
  cookiesMock,
} = vi.hoisted(() => ({
  mockAddressForm: vi.fn(),
  getAuthTokenMock: vi.fn(),
  listCustomerAddressesMock: vi.fn(),
  getCurrentCustomerMock: vi.fn(),
  retrieveCartMock: vi.fn(),
  updateCartMock: vi.fn(),
  cookiesMock: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => (key: string) => key),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/lib/seo", () => ({
  buildCanonical: vi.fn(),
}));

vi.mock("@/lib/cart-cookie", () => ({
  CART_COOKIE_NAME: "medusa_cart_id",
}));

vi.mock("@/lib/auth-cookie", () => ({
  getAuthToken: getAuthTokenMock,
}));

vi.mock("@/components/checkout/AddressForm", () => ({
  default: mockAddressForm,
}));

vi.mock("@/lib/medusa-client", () => ({
  listCustomerAddresses: listCustomerAddressesMock,
  getCurrentCustomer: getCurrentCustomerMock,
  sdk: {
    store: {
      cart: {
        retrieve: retrieveCartMock,
        update: updateCartMock,
      },
    },
  },
}));

import AddressPage from "./page";

describe("checkout address page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches saved addresses for logged-in customer", async () => {
    const savedAddresses = [
      {
        id: "addr_1",
        first_name: "Ali",
        last_name: "Saleh",
        address_1: "123 Street",
        city: "Cairo",
        country_code: "eg",
        is_default_shipping: true,
      },
    ];

    getAuthTokenMock.mockResolvedValue("jwt_1");
    listCustomerAddressesMock.mockResolvedValue({ addresses: savedAddresses });
    getCurrentCustomerMock.mockResolvedValue({ email: "ali@example.com" });
    cookiesMock.mockResolvedValue({
      get: vi.fn(() => ({ value: "cart_1" })),
    });
    retrieveCartMock.mockResolvedValue({
      cart: {
        id: "cart_1",
        email: null,
        region: { countries: [{ iso_2: "eg" }, { iso_2: "sa" }] },
      },
    });
    updateCartMock.mockResolvedValue({ cart: { id: "cart_1" } });

    const element = await AddressPage({ params: Promise.resolve({ locale: "en" }) });

    expect(listCustomerAddressesMock).toHaveBeenCalledWith("jwt_1");
    expect(getCurrentCustomerMock).toHaveBeenCalledWith("jwt_1");
    expect(updateCartMock).toHaveBeenCalledWith(
      "cart_1",
      { email: "ali@example.com" },
      { fields: "id" },
    );
    expect((element as { props: unknown }).props).toEqual({
      locale: "en",
      savedAddresses,
      regionCountryCodes: ["eg", "sa"],
    });
  });

  it("skips customer address fetch when user is a guest", async () => {
    getAuthTokenMock.mockResolvedValue(null);
    cookiesMock.mockResolvedValue({ get: vi.fn(() => undefined) });

    const element = await AddressPage({ params: Promise.resolve({ locale: "ar" }) });

    expect(listCustomerAddressesMock).not.toHaveBeenCalled();
    expect(getCurrentCustomerMock).not.toHaveBeenCalled();
    expect(retrieveCartMock).not.toHaveBeenCalled();
    expect(updateCartMock).not.toHaveBeenCalled();
    expect((element as { props: unknown }).props).toEqual({
      locale: "ar",
      savedAddresses: [],
      regionCountryCodes: [],
    });
  });
});
