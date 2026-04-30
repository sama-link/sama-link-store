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
    // CART-PERSIST-1A: authed flow now reads customer metadata for adopt
    // lookup (returns no last_cart_id here) and writes back on create.
    const retrieveCustomer = vi
      .spyOn(sdk.store.customer, "retrieve")
      .mockResolvedValue({
        customer: { id: "cus_1", metadata: {} },
      } as never);
    const updateCustomer = vi
      .spyOn(sdk.store.customer, "update")
      .mockResolvedValue({ customer: { id: "cus_1" } } as never);

    const out = await getOrSetCart();

    expect(create).toHaveBeenCalledTimes(1);
    const [, , headers] = create.mock.calls[0]!;
    expect(headers).toEqual({ Authorization: "Bearer tok_123" });
    expect(out.cart.id).toBe("cart_new");
    expect(cookieStore.jar.get("medusa_cart_id")).toBe("cart_new");
    expect(updateTagMock).toHaveBeenCalledWith("cart");
    expect(retrieveCustomer).toHaveBeenCalled();
    expect(updateCustomer).toHaveBeenCalledTimes(1);
    const [updatePayload] = updateCustomer.mock.calls[0]!;
    expect(updatePayload).toEqual({ metadata: { last_cart_id: "cart_new" } });
  });

  it("creates a guest cart with no auth headers when no token cookie is present", async () => {
    const create = vi
      .spyOn(sdk.store.cart, "create")
      .mockResolvedValue({ cart: { id: "cart_guest", items: [] } } as never);
    const retrieveCustomer = vi.spyOn(sdk.store.customer, "retrieve");
    const updateCustomer = vi.spyOn(sdk.store.customer, "update");

    const out = await getOrSetCart();

    expect(create).toHaveBeenCalledTimes(1);
    const [, , headers] = create.mock.calls[0]!;
    expect(headers).toEqual({});
    expect(out.cart.id).toBe("cart_guest");
    expect(cookieStore.jar.get("medusa_cart_id")).toBe("cart_guest");
    // Guest path must never read or write customer metadata.
    expect(retrieveCustomer).not.toHaveBeenCalled();
    expect(updateCustomer).not.toHaveBeenCalled();
  });

  it("retrieves an existing cart when cart cookie is present and the cart is reachable", async () => {
    cookieStore.jar.set("medusa_cart_id", "cart_existing");
    cookieStore.jar.set("sama_customer_session", "tok_xyz");

    const retrieve = vi
      .spyOn(sdk.store.cart, "retrieve")
      .mockResolvedValue({
        cart: {
          id: "cart_existing",
          items: [],
          completed_at: null,
        },
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

describe("getOrSetCart (CART-PERSIST-1A — adopt customer active cart)", () => {
  beforeEach(() => {
    cookieStore.jar.clear();
    cookieStore.get.mockClear();
    cookieStore.set.mockClear();
    updateTagMock.mockClear();
    vi.restoreAllMocks();
  });

  it("adopts customer.metadata.last_cart_id when no cookie + auth + cart is usable", async () => {
    cookieStore.jar.set("sama_customer_session", "tok_persist");

    const retrieveCustomer = vi
      .spyOn(sdk.store.customer, "retrieve")
      .mockResolvedValue({
        customer: {
          id: "cus_persist",
          metadata: { last_cart_id: "cart_remembered" },
        },
      } as never);
    const retrieveCart = vi
      .spyOn(sdk.store.cart, "retrieve")
      .mockResolvedValue({
        cart: {
          id: "cart_remembered",
          items: [],
          completed_at: null,
        },
      } as never);
    const create = vi.spyOn(sdk.store.cart, "create");
    const updateCustomer = vi.spyOn(sdk.store.customer, "update");

    const out = await getOrSetCart();

    expect(retrieveCustomer).toHaveBeenCalledTimes(1);
    expect(retrieveCart).toHaveBeenCalledTimes(1);
    const [adoptedId, , adoptHeaders] = retrieveCart.mock.calls[0]!;
    expect(adoptedId).toBe("cart_remembered");
    expect(adoptHeaders).toEqual({ Authorization: "Bearer tok_persist" });
    expect(create).not.toHaveBeenCalled();
    // The fresh-create metadata write must NOT fire on the adopt path.
    expect(updateCustomer).not.toHaveBeenCalled();
    expect(out.cart.id).toBe("cart_remembered");
    expect(cookieStore.jar.get("medusa_cart_id")).toBe("cart_remembered");
    expect(updateTagMock).toHaveBeenCalledWith("cart");
  });

  it("falls through to create when last_cart_id points to a completed cart", async () => {
    cookieStore.jar.set("sama_customer_session", "tok_persist");

    const existingMetadata = { last_cart_id: "cart_old", marketing_opt_in: true };
    vi.spyOn(sdk.store.customer, "retrieve").mockResolvedValue({
      customer: { id: "cus_persist", metadata: existingMetadata },
    } as never);
    vi.spyOn(sdk.store.cart, "retrieve").mockResolvedValue({
      cart: {
        id: "cart_old",
        items: [],
        completed_at: "2026-04-29T10:00:00.000Z",
      },
    } as never);
    const create = vi
      .spyOn(sdk.store.cart, "create")
      .mockResolvedValue({ cart: { id: "cart_fresh", items: [] } } as never);
    const updateCustomer = vi
      .spyOn(sdk.store.customer, "update")
      .mockResolvedValue({ customer: { id: "cus_persist" } } as never);

    const out = await getOrSetCart();

    expect(create).toHaveBeenCalledTimes(1);
    expect(out.cart.id).toBe("cart_fresh");
    expect(cookieStore.jar.get("medusa_cart_id")).toBe("cart_fresh");
    // Sibling metadata keys must be preserved on the merge write.
    expect(updateCustomer).toHaveBeenCalledTimes(1);
    const [payload] = updateCustomer.mock.calls[0]!;
    expect(payload).toEqual({
      metadata: {
        last_cart_id: "cart_fresh",
        marketing_opt_in: true,
      },
    });
  });

  it("falls through to create when last_cart_id retrieve throws", async () => {
    cookieStore.jar.set("sama_customer_session", "tok_persist");

    vi.spyOn(sdk.store.customer, "retrieve").mockResolvedValue({
      customer: {
        id: "cus_persist",
        metadata: { last_cart_id: "cart_gone" },
      },
    } as never);
    vi.spyOn(sdk.store.cart, "retrieve").mockRejectedValue(
      new Error("404 not found"),
    );
    const create = vi
      .spyOn(sdk.store.cart, "create")
      .mockResolvedValue({ cart: { id: "cart_fresh", items: [] } } as never);
    vi.spyOn(sdk.store.customer, "update").mockResolvedValue({
      customer: { id: "cus_persist" },
    } as never);

    const out = await getOrSetCart();

    expect(create).toHaveBeenCalledTimes(1);
    expect(out.cart.id).toBe("cart_fresh");
  });

  it("falls through to create when customer has no last_cart_id metadata", async () => {
    cookieStore.jar.set("sama_customer_session", "tok_persist");

    const retrieveCustomer = vi
      .spyOn(sdk.store.customer, "retrieve")
      .mockResolvedValue({
        customer: { id: "cus_persist", metadata: {} },
      } as never);
    const retrieveCart = vi.spyOn(sdk.store.cart, "retrieve");
    const create = vi
      .spyOn(sdk.store.cart, "create")
      .mockResolvedValue({ cart: { id: "cart_fresh", items: [] } } as never);
    const updateCustomer = vi
      .spyOn(sdk.store.customer, "update")
      .mockResolvedValue({ customer: { id: "cus_persist" } } as never);

    const out = await getOrSetCart();

    expect(retrieveCustomer).toHaveBeenCalledTimes(1);
    expect(retrieveCart).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledTimes(1);
    expect(out.cart.id).toBe("cart_fresh");
    expect(updateCustomer).toHaveBeenCalledTimes(1);
  });

  it("prefers the cookie cart over the customer's last_cart_id when both exist", async () => {
    cookieStore.jar.set("medusa_cart_id", "cart_cookie");
    cookieStore.jar.set("sama_customer_session", "tok_persist");

    const retrieveCart = vi
      .spyOn(sdk.store.cart, "retrieve")
      .mockResolvedValue({
        cart: { id: "cart_cookie", items: [], completed_at: null },
      } as never);
    const retrieveCustomer = vi.spyOn(sdk.store.customer, "retrieve");
    const create = vi.spyOn(sdk.store.cart, "create");
    const updateCustomer = vi.spyOn(sdk.store.customer, "update");

    const out = await getOrSetCart();

    expect(retrieveCart).toHaveBeenCalledTimes(1);
    expect(out.cart.id).toBe("cart_cookie");
    // The cookie-cart win short-circuits before customer metadata is touched.
    expect(retrieveCustomer).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    expect(updateCustomer).not.toHaveBeenCalled();
  });

  it("creates a fresh cart silently when customer.update fails (best-effort metadata write)", async () => {
    cookieStore.jar.set("sama_customer_session", "tok_persist");

    vi.spyOn(sdk.store.customer, "retrieve").mockResolvedValue({
      customer: { id: "cus_persist", metadata: {} },
    } as never);
    const create = vi
      .spyOn(sdk.store.cart, "create")
      .mockResolvedValue({ cart: { id: "cart_fresh", items: [] } } as never);
    vi.spyOn(sdk.store.customer, "update").mockRejectedValue(
      new Error("metadata write failed"),
    );

    const out = await getOrSetCart();

    expect(create).toHaveBeenCalledTimes(1);
    expect(out.cart.id).toBe("cart_fresh");
    expect(cookieStore.jar.get("medusa_cart_id")).toBe("cart_fresh");
  });
});

describe("rememberCustomerCartIdAfterAuth (CART-PERSIST-1A — auth-boundary sync)", () => {
  beforeEach(() => {
    cookieStore.jar.clear();
    cookieStore.get.mockClear();
    cookieStore.set.mockClear();
    updateTagMock.mockClear();
    vi.restoreAllMocks();
  });

  it("writes metadata.last_cart_id when authed + cart cookie present + metadata stale", async () => {
    cookieStore.jar.set("sama_customer_session", "tok_persist");
    cookieStore.jar.set("medusa_cart_id", "cart_just_promoted");

    vi.spyOn(sdk.store.customer, "retrieve").mockResolvedValue({
      customer: {
        id: "cus_persist",
        metadata: { last_cart_id: "cart_old", marketing_opt_in: true },
      },
    } as never);
    const updateCustomer = vi
      .spyOn(sdk.store.customer, "update")
      .mockResolvedValue({ customer: { id: "cus_persist" } } as never);

    const { rememberCustomerCartIdAfterAuth } = await import("./cart");
    await rememberCustomerCartIdAfterAuth();

    expect(updateCustomer).toHaveBeenCalledTimes(1);
    const [payload] = updateCustomer.mock.calls[0]!;
    expect(payload).toEqual({
      metadata: {
        last_cart_id: "cart_just_promoted",
        marketing_opt_in: true,
      },
    });
  });

  it("is a no-op when not authed (guest)", async () => {
    cookieStore.jar.set("medusa_cart_id", "cart_guest");

    const retrieveCustomer = vi.spyOn(sdk.store.customer, "retrieve");
    const updateCustomer = vi.spyOn(sdk.store.customer, "update");

    const { rememberCustomerCartIdAfterAuth } = await import("./cart");
    await rememberCustomerCartIdAfterAuth();

    expect(retrieveCustomer).not.toHaveBeenCalled();
    expect(updateCustomer).not.toHaveBeenCalled();
  });

  it("is a no-op when authed but no cart cookie", async () => {
    cookieStore.jar.set("sama_customer_session", "tok_persist");

    const retrieveCustomer = vi.spyOn(sdk.store.customer, "retrieve");
    const updateCustomer = vi.spyOn(sdk.store.customer, "update");

    const { rememberCustomerCartIdAfterAuth } = await import("./cart");
    await rememberCustomerCartIdAfterAuth();

    expect(retrieveCustomer).not.toHaveBeenCalled();
    expect(updateCustomer).not.toHaveBeenCalled();
  });

  it("is a no-op (idempotent) when metadata.last_cart_id already matches the cart cookie", async () => {
    cookieStore.jar.set("sama_customer_session", "tok_persist");
    cookieStore.jar.set("medusa_cart_id", "cart_known");

    vi.spyOn(sdk.store.customer, "retrieve").mockResolvedValue({
      customer: {
        id: "cus_persist",
        metadata: { last_cart_id: "cart_known" },
      },
    } as never);
    const updateCustomer = vi.spyOn(sdk.store.customer, "update");

    const { rememberCustomerCartIdAfterAuth } = await import("./cart");
    await rememberCustomerCartIdAfterAuth();

    expect(updateCustomer).not.toHaveBeenCalled();
  });
});

describe("mergeGuestCartIntoCustomerCart (CART-PERSIST-1B)", () => {
  beforeEach(() => {
    cookieStore.jar.clear();
    cookieStore.get.mockClear();
    cookieStore.set.mockClear();
    updateTagMock.mockClear();
    vi.restoreAllMocks();
  });

  function mockCartRetrievals(carts: Record<string, unknown>) {
    return vi
      .spyOn(sdk.store.cart, "retrieve")
      .mockImplementation(async (id: string) => {
        const cart = carts[id];
        if (!cart) throw new Error(`cart ${id} not found`);
        return { cart } as never;
      });
  }

  it("appends a new variant from the guest cart to the customer's previous cart", async () => {
    cookieStore.jar.set("sama_customer_session", "tok");
    cookieStore.jar.set("medusa_cart_id", "cart_guest");

    vi.spyOn(sdk.store.customer, "retrieve").mockResolvedValue({
      customer: { id: "cus", metadata: { last_cart_id: "cart_prev" } },
    } as never);
    mockCartRetrievals({
      cart_prev: {
        id: "cart_prev",
        items: [
          { id: "li_1", variant_id: "var_A", quantity: 1 },
        ],
        completed_at: null,
      },
      cart_guest: {
        id: "cart_guest",
        items: [{ variant_id: "var_B", quantity: 2 }],
        completed_at: null,
      },
    });
    const createLineItem = vi
      .spyOn(sdk.store.cart, "createLineItem")
      .mockResolvedValue({ cart: { id: "cart_prev" } } as never);
    const updateLineItem = vi.spyOn(sdk.store.cart, "updateLineItem");

    const { mergeGuestCartIntoCustomerCart } = await import("./cart");
    await mergeGuestCartIntoCustomerCart();

    expect(createLineItem).toHaveBeenCalledTimes(1);
    const [targetCartId, payload] = createLineItem.mock.calls[0]!;
    expect(targetCartId).toBe("cart_prev");
    expect(payload).toEqual({ variant_id: "var_B", quantity: 2 });
    expect(updateLineItem).not.toHaveBeenCalled();
    expect(cookieStore.jar.get("medusa_cart_id")).toBe("cart_prev");
    expect(updateTagMock).toHaveBeenCalledWith("cart");
  });

  it("sums the quantity when both carts have the same variant", async () => {
    cookieStore.jar.set("sama_customer_session", "tok");
    cookieStore.jar.set("medusa_cart_id", "cart_guest");

    vi.spyOn(sdk.store.customer, "retrieve").mockResolvedValue({
      customer: { id: "cus", metadata: { last_cart_id: "cart_prev" } },
    } as never);
    mockCartRetrievals({
      cart_prev: {
        id: "cart_prev",
        items: [{ id: "li_1", variant_id: "var_A", quantity: 1 }],
        completed_at: null,
      },
      cart_guest: {
        id: "cart_guest",
        items: [{ variant_id: "var_A", quantity: 3 }],
        completed_at: null,
      },
    });
    const updateLineItem = vi
      .spyOn(sdk.store.cart, "updateLineItem")
      .mockResolvedValue({ cart: { id: "cart_prev" } } as never);
    const createLineItem = vi.spyOn(sdk.store.cart, "createLineItem");

    const { mergeGuestCartIntoCustomerCart } = await import("./cart");
    await mergeGuestCartIntoCustomerCart();

    expect(updateLineItem).toHaveBeenCalledTimes(1);
    const [targetCartId, lineItemId, payload] = updateLineItem.mock.calls[0]!;
    expect(targetCartId).toBe("cart_prev");
    expect(lineItemId).toBe("li_1");
    expect(payload).toEqual({ quantity: 4 });
    expect(createLineItem).not.toHaveBeenCalled();
    expect(cookieStore.jar.get("medusa_cart_id")).toBe("cart_prev");
  });

  it("handles a mix of same-variant sum and new-variant append", async () => {
    cookieStore.jar.set("sama_customer_session", "tok");
    cookieStore.jar.set("medusa_cart_id", "cart_guest");

    vi.spyOn(sdk.store.customer, "retrieve").mockResolvedValue({
      customer: { id: "cus", metadata: { last_cart_id: "cart_prev" } },
    } as never);
    mockCartRetrievals({
      cart_prev: {
        id: "cart_prev",
        items: [
          { id: "li_A", variant_id: "var_A", quantity: 2 },
          { id: "li_C", variant_id: "var_C", quantity: 1 },
        ],
        completed_at: null,
      },
      cart_guest: {
        id: "cart_guest",
        items: [
          { variant_id: "var_A", quantity: 1 },
          { variant_id: "var_B", quantity: 5 },
        ],
        completed_at: null,
      },
    });
    const updateLineItem = vi
      .spyOn(sdk.store.cart, "updateLineItem")
      .mockResolvedValue({ cart: { id: "cart_prev" } } as never);
    const createLineItem = vi
      .spyOn(sdk.store.cart, "createLineItem")
      .mockResolvedValue({ cart: { id: "cart_prev" } } as never);

    const { mergeGuestCartIntoCustomerCart } = await import("./cart");
    await mergeGuestCartIntoCustomerCart();

    expect(updateLineItem).toHaveBeenCalledTimes(1);
    expect(updateLineItem.mock.calls[0]![2]).toEqual({ quantity: 3 });
    expect(createLineItem).toHaveBeenCalledTimes(1);
    expect(createLineItem.mock.calls[0]![1]).toEqual({
      variant_id: "var_B",
      quantity: 5,
    });
  });

  it("skips a single failing line-item and continues with the rest", async () => {
    cookieStore.jar.set("sama_customer_session", "tok");
    cookieStore.jar.set("medusa_cart_id", "cart_guest");

    vi.spyOn(sdk.store.customer, "retrieve").mockResolvedValue({
      customer: { id: "cus", metadata: { last_cart_id: "cart_prev" } },
    } as never);
    mockCartRetrievals({
      cart_prev: { id: "cart_prev", items: [], completed_at: null },
      cart_guest: {
        id: "cart_guest",
        items: [
          { variant_id: "var_OOS", quantity: 1 },
          { variant_id: "var_OK", quantity: 1 },
        ],
        completed_at: null,
      },
    });
    const createLineItem = vi
      .spyOn(sdk.store.cart, "createLineItem")
      .mockImplementation(async (_id, payload) => {
        if ((payload as { variant_id?: string }).variant_id === "var_OOS") {
          throw new Error("out of stock");
        }
        return { cart: { id: "cart_prev" } } as never;
      });

    const { mergeGuestCartIntoCustomerCart } = await import("./cart");
    await mergeGuestCartIntoCustomerCart();

    expect(createLineItem).toHaveBeenCalledTimes(2);
    // Cookie still switches even if one line failed.
    expect(cookieStore.jar.get("medusa_cart_id")).toBe("cart_prev");
  });

  it("is a no-op when guest is unauthed", async () => {
    cookieStore.jar.set("medusa_cart_id", "cart_guest");

    const retrieveCustomer = vi.spyOn(sdk.store.customer, "retrieve");
    const retrieveCart = vi.spyOn(sdk.store.cart, "retrieve");

    const { mergeGuestCartIntoCustomerCart } = await import("./cart");
    await mergeGuestCartIntoCustomerCart();

    expect(retrieveCustomer).not.toHaveBeenCalled();
    expect(retrieveCart).not.toHaveBeenCalled();
    expect(cookieStore.jar.get("medusa_cart_id")).toBe("cart_guest");
  });

  it("is a no-op when no cookie cart", async () => {
    cookieStore.jar.set("sama_customer_session", "tok");

    const retrieveCustomer = vi.spyOn(sdk.store.customer, "retrieve");
    const retrieveCart = vi.spyOn(sdk.store.cart, "retrieve");

    const { mergeGuestCartIntoCustomerCart } = await import("./cart");
    await mergeGuestCartIntoCustomerCart();

    expect(retrieveCustomer).not.toHaveBeenCalled();
    expect(retrieveCart).not.toHaveBeenCalled();
  });

  it("is a no-op when customer has no previous cart in metadata", async () => {
    cookieStore.jar.set("sama_customer_session", "tok");
    cookieStore.jar.set("medusa_cart_id", "cart_guest");

    vi.spyOn(sdk.store.customer, "retrieve").mockResolvedValue({
      customer: { id: "cus", metadata: {} },
    } as never);
    const retrieveCart = vi.spyOn(sdk.store.cart, "retrieve");
    const createLineItem = vi.spyOn(sdk.store.cart, "createLineItem");

    const { mergeGuestCartIntoCustomerCart } = await import("./cart");
    await mergeGuestCartIntoCustomerCart();

    expect(retrieveCart).not.toHaveBeenCalled();
    expect(createLineItem).not.toHaveBeenCalled();
    // Cookie unchanged.
    expect(cookieStore.jar.get("medusa_cart_id")).toBe("cart_guest");
  });

  it("is a no-op when metadata.last_cart_id equals the cookie cart (same cart, nothing to merge)", async () => {
    cookieStore.jar.set("sama_customer_session", "tok");
    cookieStore.jar.set("medusa_cart_id", "cart_same");

    vi.spyOn(sdk.store.customer, "retrieve").mockResolvedValue({
      customer: { id: "cus", metadata: { last_cart_id: "cart_same" } },
    } as never);
    const retrieveCart = vi.spyOn(sdk.store.cart, "retrieve");

    const { mergeGuestCartIntoCustomerCart } = await import("./cart");
    await mergeGuestCartIntoCustomerCart();

    expect(retrieveCart).not.toHaveBeenCalled();
  });

  it("is a no-op when the previous cart is no longer usable (completed)", async () => {
    cookieStore.jar.set("sama_customer_session", "tok");
    cookieStore.jar.set("medusa_cart_id", "cart_guest");

    vi.spyOn(sdk.store.customer, "retrieve").mockResolvedValue({
      customer: { id: "cus", metadata: { last_cart_id: "cart_done" } },
    } as never);
    mockCartRetrievals({
      cart_done: {
        id: "cart_done",
        items: [],
        completed_at: "2026-04-30T00:00:00.000Z",
      },
      cart_guest: {
        id: "cart_guest",
        items: [{ variant_id: "var_A", quantity: 1 }],
        completed_at: null,
      },
    });
    const createLineItem = vi.spyOn(sdk.store.cart, "createLineItem");

    const { mergeGuestCartIntoCustomerCart } = await import("./cart");
    await mergeGuestCartIntoCustomerCart();

    expect(createLineItem).not.toHaveBeenCalled();
    // Cookie stays on the just-promoted cart.
    expect(cookieStore.jar.get("medusa_cart_id")).toBe("cart_guest");
  });

  it("is a no-op when either cart retrieve throws", async () => {
    cookieStore.jar.set("sama_customer_session", "tok");
    cookieStore.jar.set("medusa_cart_id", "cart_guest");

    vi.spyOn(sdk.store.customer, "retrieve").mockResolvedValue({
      customer: { id: "cus", metadata: { last_cart_id: "cart_prev" } },
    } as never);
    vi.spyOn(sdk.store.cart, "retrieve").mockRejectedValue(
      new Error("404 cart not found"),
    );
    const createLineItem = vi.spyOn(sdk.store.cart, "createLineItem");

    const { mergeGuestCartIntoCustomerCart } = await import("./cart");
    await mergeGuestCartIntoCustomerCart();

    expect(createLineItem).not.toHaveBeenCalled();
    expect(cookieStore.jar.get("medusa_cart_id")).toBe("cart_guest");
  });

  it("skips guest line items missing variant_id or with non-positive quantity", async () => {
    cookieStore.jar.set("sama_customer_session", "tok");
    cookieStore.jar.set("medusa_cart_id", "cart_guest");

    vi.spyOn(sdk.store.customer, "retrieve").mockResolvedValue({
      customer: { id: "cus", metadata: { last_cart_id: "cart_prev" } },
    } as never);
    mockCartRetrievals({
      cart_prev: { id: "cart_prev", items: [], completed_at: null },
      cart_guest: {
        id: "cart_guest",
        items: [
          { variant_id: null, quantity: 2 },
          { variant_id: "var_OK", quantity: 0 },
          { variant_id: "var_OK", quantity: -1 },
          { variant_id: "var_OK", quantity: 1 },
        ],
        completed_at: null,
      },
    });
    const createLineItem = vi
      .spyOn(sdk.store.cart, "createLineItem")
      .mockResolvedValue({ cart: { id: "cart_prev" } } as never);

    const { mergeGuestCartIntoCustomerCart } = await import("./cart");
    await mergeGuestCartIntoCustomerCart();

    expect(createLineItem).toHaveBeenCalledTimes(1);
    expect(createLineItem.mock.calls[0]![1]).toEqual({
      variant_id: "var_OK",
      quantity: 1,
    });
  });
});
