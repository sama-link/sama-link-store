import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = vi.hoisted(() => {
  const jar = new Map<string, string>();
  return {
    jar,
    get: vi.fn((name: string) =>
      jar.has(name) ? { name, value: jar.get(name)! } : undefined,
    ),
    set: vi.fn((name: string, value: string) => {
      if (value === "") {
        jar.delete(name);
      } else {
        jar.set(name, value);
      }
    }),
  };
});

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: cookieStore.get,
    set: cookieStore.set,
  })),
}));

const updateTagMock = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({
  updateTag: updateTagMock,
}));

import { sdk } from "../medusa-client";
import { getOrSetCart } from "./cart";

describe("getOrSetCart (CHECKOUT-RESET-1)", () => {
  beforeEach(() => {
    cookieStore.jar.clear();
    cookieStore.get.mockClear();
    cookieStore.set.mockClear();
    updateTagMock.mockClear();
    vi.restoreAllMocks();
  });

  it("creates a new cart with auth headers when token cookie is present and no cart cookie", async () => {
    cookieStore.jar.set("sama_customer_session", "tok_123");

    const create = vi
      .spyOn(sdk.store.cart, "create")
      .mockResolvedValue({ cart: { id: "cart_new", items: [] } } as never);

    const out = await getOrSetCart();

    expect(create).toHaveBeenCalledTimes(1);
    const [, , headers] = create.mock.calls[0]!;
    expect(headers).toEqual({ Authorization: "Bearer tok_123" });
    expect(out.cart.id).toBe("cart_new");
    expect(cookieStore.jar.get("medusa_cart_id")).toBe("cart_new");
    expect(updateTagMock).toHaveBeenCalledWith("cart");
  });

  it("creates a guest cart with no auth headers when no token cookie is present", async () => {
    const create = vi
      .spyOn(sdk.store.cart, "create")
      .mockResolvedValue({ cart: { id: "cart_guest", items: [] } } as never);

    const out = await getOrSetCart();

    expect(create).toHaveBeenCalledTimes(1);
    const [, , headers] = create.mock.calls[0]!;
    expect(headers).toEqual({});
    expect(out.cart.id).toBe("cart_guest");
    expect(cookieStore.jar.get("medusa_cart_id")).toBe("cart_guest");
  });

  it("retrieves an existing cart when cart cookie is present and the cart is reachable", async () => {
    cookieStore.jar.set("medusa_cart_id", "cart_existing");
    cookieStore.jar.set("sama_customer_session", "tok_xyz");

    const retrieve = vi
      .spyOn(sdk.store.cart, "retrieve")
      .mockResolvedValue({
        cart: { id: "cart_existing", items: [] },
      } as never);
    const create = vi.spyOn(sdk.store.cart, "create");

    const out = await getOrSetCart();

    expect(retrieve).toHaveBeenCalledTimes(1);
    const [retrieveCartId, , retrieveHeaders] = retrieve.mock.calls[0]!;
    expect(retrieveCartId).toBe("cart_existing");
    expect(retrieveHeaders).toEqual({ Authorization: "Bearer tok_xyz" });
    expect(create).not.toHaveBeenCalled();
    expect(out.cart.id).toBe("cart_existing");
  });

  it("falls through to create when retrieve fails for an existing cart cookie", async () => {
    cookieStore.jar.set("medusa_cart_id", "cart_dead");

    vi.spyOn(sdk.store.cart, "retrieve").mockRejectedValue(
      new Error("404 not found"),
    );
    const create = vi
      .spyOn(sdk.store.cart, "create")
      .mockResolvedValue({ cart: { id: "cart_replacement", items: [] } } as never);

    const out = await getOrSetCart();

    expect(create).toHaveBeenCalledTimes(1);
    expect(out.cart.id).toBe("cart_replacement");
    expect(cookieStore.jar.get("medusa_cart_id")).toBe("cart_replacement");
  });
});
