import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCustomerAddress,
  deleteCustomerAddress,
  getCustomerOrder,
  getErrorStatusCode,
  listCustomerAddresses,
  listCustomerOrders,
  sdk,
  transferCartToCustomer,
  updateCustomer,
  updateCustomerAddress,
  type StoreCustomer,
} from "./medusa-client";

function httpError(status: number, message = "request failed") {
  return Object.assign(new Error(message), { status });
}

describe("transferCartToCustomer", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("delegates to sdk.store.cart.transferCart with cart id, empty body, and bearer header", async () => {
    const transferCart = vi
      .spyOn(sdk.store.cart, "transferCart")
      .mockResolvedValue(undefined as never);

    const out = await transferCartToCustomer("cart_123", "token_abc");

    expect(transferCart).toHaveBeenCalledTimes(1);
    expect(transferCart).toHaveBeenCalledWith(
      "cart_123",
      {},
      { Authorization: "Bearer token_abc" },
    );
    expect(out).toBeUndefined();
  });
});

describe("updateCustomer", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns customer on success", async () => {
    const customer = { id: "cus_1", first_name: "A" } as StoreCustomer;
    const update = vi.spyOn(sdk.store.customer, "update").mockResolvedValue({
      customer,
    } as never);

    const out = await updateCustomer({ first_name: "A" }, "tok");

    expect(out).toBe(customer);
    expect(update).toHaveBeenCalledWith(
      { first_name: "A" },
      {},
      { Authorization: "Bearer tok" },
    );
  });

  it("propagates Authorization bearer header", async () => {
    const update = vi.spyOn(sdk.store.customer, "update").mockResolvedValue({
      customer: {} as StoreCustomer,
    } as never);

    await updateCustomer({}, "my_jwt");

    expect(update).toHaveBeenCalledWith(
      {},
      {},
      { Authorization: "Bearer my_jwt" },
    );
  });

  it("propagates 401 with getErrorStatusCode 401", async () => {
    vi.spyOn(sdk.store.customer, "update").mockRejectedValue(httpError(401));

    try {
      await updateCustomer({}, "bad");
      expect.fail("expected throw");
    } catch (e) {
      expect(getErrorStatusCode(e)).toBe(401);
    }
  });

  it("propagates network errors", async () => {
    const err = new Error("fetch failed");
    vi.spyOn(sdk.store.customer, "update").mockRejectedValue(err);

    await expect(updateCustomer({}, "t")).rejects.toThrow("fetch failed");
  });
});

describe("listCustomerAddresses", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns SDK list envelope on success", async () => {
    const envelope = {
      addresses: [],
      count: 0,
      offset: 0,
      limit: 50,
    };
    const listAddress = vi
      .spyOn(sdk.store.customer, "listAddress")
      .mockResolvedValue(envelope as never);

    const out = await listCustomerAddresses("tok");

    expect(out).toEqual(envelope);
    expect(listAddress).toHaveBeenCalledWith(
      {},
      { Authorization: "Bearer tok" },
    );
  });

  it("propagates Authorization bearer header", async () => {
    const listAddress = vi
      .spyOn(sdk.store.customer, "listAddress")
      .mockResolvedValue({
        addresses: [],
        count: 0,
        offset: 0,
        limit: 20,
      } as never);

    await listCustomerAddresses("jwt_1");

    expect(listAddress).toHaveBeenCalledWith(
      {},
      { Authorization: "Bearer jwt_1" },
    );
  });

  it("forwards queryParams when provided", async () => {
    const listAddress = vi
      .spyOn(sdk.store.customer, "listAddress")
      .mockResolvedValue({
        addresses: [],
        count: 0,
        offset: 0,
        limit: 10,
      } as never);

    await listCustomerAddresses("t", { limit: 10, offset: 5 });

    expect(listAddress).toHaveBeenCalledWith(
      { limit: 10, offset: 5 },
      { Authorization: "Bearer t" },
    );
  });

  it("propagates 401", async () => {
    vi.spyOn(sdk.store.customer, "listAddress").mockRejectedValue(
      httpError(401),
    );

    try {
      await listCustomerAddresses("x");
      expect.fail("expected throw");
    } catch (e) {
      expect(getErrorStatusCode(e)).toBe(401);
    }
  });

  it("propagates network errors", async () => {
    vi.spyOn(sdk.store.customer, "listAddress").mockRejectedValue(
      new Error("net down"),
    );

    await expect(listCustomerAddresses("t")).rejects.toThrow("net down");
  });
});

describe("createCustomerAddress", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the created address from customer.addresses", async () => {
    const addr = {
      id: "caddr_new",
      city: "NYC",
      created_at: "2025-01-02T00:00:00.000Z",
    };
    const createAddress = vi.spyOn(sdk.store.customer, "createAddress").mockResolvedValue({
      customer: {
        id: "cus_1",
        addresses: [addr],
      } as StoreCustomer,
    } as never);

    const out = await createCustomerAddress(
      { city: "NYC", country_code: "us", first_name: "x", last_name: "y", address_1: "1" },
      "tok",
    );

    expect(out).toEqual(addr);
    expect(createAddress).toHaveBeenCalledWith(
      {
        city: "NYC",
        country_code: "us",
        first_name: "x",
        last_name: "y",
        address_1: "1",
      },
      {},
      { Authorization: "Bearer tok" },
    );
  });

  it("propagates payload and Authorization header", async () => {
    vi.spyOn(sdk.store.customer, "createAddress").mockResolvedValue({
      customer: {
        addresses: [{ id: "a1" }],
      } as StoreCustomer,
    } as never);

    await createCustomerAddress({ country_code: "us" }, "bearer");

    expect(sdk.store.customer.createAddress).toHaveBeenCalledWith(
      { country_code: "us" },
      {},
      { Authorization: "Bearer bearer" },
    );
  });

  it("propagates 422 validation errors", async () => {
    vi.spyOn(sdk.store.customer, "createAddress").mockRejectedValue(
      httpError(422, "invalid"),
    );

    try {
      await createCustomerAddress({ country_code: "us" }, "t");
      expect.fail("expected throw");
    } catch (e) {
      expect(getErrorStatusCode(e)).toBe(422);
    }
  });

  it("propagates 401", async () => {
    vi.spyOn(sdk.store.customer, "createAddress").mockRejectedValue(
      httpError(401),
    );

    try {
      await createCustomerAddress({ country_code: "us" }, "t");
      expect.fail("expected throw");
    } catch (e) {
      expect(getErrorStatusCode(e)).toBe(401);
    }
  });
});

describe("updateCustomerAddress", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the updated address for the given id", async () => {
    const addr = { id: "caddr_1", city: "Boston" };
    const updateAddress = vi
      .spyOn(sdk.store.customer, "updateAddress")
      .mockResolvedValue({
        customer: {
          addresses: [addr, { id: "caddr_2", city: "LA" }],
        } as StoreCustomer,
      } as never);

    const out = await updateCustomerAddress(
      "caddr_1",
      { city: "Boston" },
      "tok",
    );

    expect(out).toEqual(addr);
    expect(updateAddress).toHaveBeenCalledWith(
      "caddr_1",
      { city: "Boston" },
      {},
      { Authorization: "Bearer tok" },
    );
  });

  it("propagates addressId, payload, and Authorization header", async () => {
    vi.spyOn(sdk.store.customer, "updateAddress").mockResolvedValue({
      customer: {
        addresses: [{ id: "x" }],
      } as StoreCustomer,
    } as never);

    await updateCustomerAddress("x", { phone: "1" }, "jwt");

    expect(sdk.store.customer.updateAddress).toHaveBeenCalledWith(
      "x",
      { phone: "1" },
      {},
      { Authorization: "Bearer jwt" },
    );
  });

  it("propagates 404", async () => {
    vi.spyOn(sdk.store.customer, "updateAddress").mockRejectedValue(
      httpError(404),
    );

    try {
      await updateCustomerAddress("missing", {}, "t");
      expect.fail("expected throw");
    } catch (e) {
      expect(getErrorStatusCode(e)).toBe(404);
    }
  });

  it("propagates 401", async () => {
    vi.spyOn(sdk.store.customer, "updateAddress").mockRejectedValue(
      httpError(401),
    );

    try {
      await updateCustomerAddress("id", {}, "t");
      expect.fail("expected throw");
    } catch (e) {
      expect(getErrorStatusCode(e)).toBe(401);
    }
  });
});

describe("deleteCustomerAddress", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves void on success", async () => {
    const deleteAddress = vi
      .spyOn(sdk.store.customer, "deleteAddress")
      .mockResolvedValue({ deleted: true } as never);

    await deleteCustomerAddress("caddr_1", "tok");

    expect(deleteAddress).toHaveBeenCalledTimes(1);
    expect(deleteAddress).toHaveBeenCalledWith("caddr_1", {
      Authorization: "Bearer tok",
    });
  });

  it("propagates addressId and Authorization header", async () => {
    vi.spyOn(sdk.store.customer, "deleteAddress").mockResolvedValue(
      {} as never,
    );

    await deleteCustomerAddress("addr_z", "secret");

    expect(sdk.store.customer.deleteAddress).toHaveBeenCalledWith("addr_z", {
      Authorization: "Bearer secret",
    });
  });

  it("propagates 404", async () => {
    vi.spyOn(sdk.store.customer, "deleteAddress").mockRejectedValue(
      httpError(404),
    );

    try {
      await deleteCustomerAddress("nope", "t");
      expect.fail("expected throw");
    } catch (e) {
      expect(getErrorStatusCode(e)).toBe(404);
    }
  });

  it("propagates 401", async () => {
    vi.spyOn(sdk.store.customer, "deleteAddress").mockRejectedValue(
      httpError(401),
    );

    try {
      await deleteCustomerAddress("id", "t");
      expect.fail("expected throw");
    } catch (e) {
      expect(getErrorStatusCode(e)).toBe(401);
    }
  });
});

describe("listCustomerOrders", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns SDK order list envelope", async () => {
    const envelope = {
      orders: [],
      count: 0,
      offset: 0,
      limit: 20,
    };
    const list = vi.spyOn(sdk.store.order, "list").mockResolvedValue(envelope as never);

    const out = await listCustomerOrders("tok");

    expect(out).toEqual(envelope);
    expect(list).toHaveBeenCalledWith(
      {},
      { Authorization: "Bearer tok" },
    );
  });

  it("propagates Authorization header", async () => {
    vi.spyOn(sdk.store.order, "list").mockResolvedValue({
      orders: [],
      count: 0,
      offset: 0,
      limit: 50,
    } as never);

    await listCustomerOrders("jwt");

    expect(sdk.store.order.list).toHaveBeenCalledWith(
      {},
      { Authorization: "Bearer jwt" },
    );
  });

  it("forwards queryParams when provided", async () => {
    vi.spyOn(sdk.store.order, "list").mockResolvedValue({
      orders: [],
      count: 0,
      offset: 0,
      limit: 5,
    } as never);

    await listCustomerOrders("t", { limit: 5, offset: 10 });

    expect(sdk.store.order.list).toHaveBeenCalledWith(
      { limit: 5, offset: 10 },
      { Authorization: "Bearer t" },
    );
  });

  it("propagates 401", async () => {
    vi.spyOn(sdk.store.order, "list").mockRejectedValue(httpError(401));

    try {
      await listCustomerOrders("x");
      expect.fail("expected throw");
    } catch (e) {
      expect(getErrorStatusCode(e)).toBe(401);
    }
  });

  it("propagates network errors", async () => {
    vi.spyOn(sdk.store.order, "list").mockRejectedValue(new Error("timeout"));

    await expect(listCustomerOrders("t")).rejects.toThrow("timeout");
  });
});

describe("getCustomerOrder", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns order from retrieve response", async () => {
    const order = { id: "order_1", status: "pending" };
    const retrieve = vi.spyOn(sdk.store.order, "retrieve").mockResolvedValue({
      order,
    } as never);

    const out = await getCustomerOrder("order_1", "tok");

    expect(out).toBe(order);
    expect(retrieve).toHaveBeenCalledWith(
      "order_1",
      {},
      { Authorization: "Bearer tok" },
    );
  });

  it("forwards orderId, queryParams, and Authorization header", async () => {
    vi.spyOn(sdk.store.order, "retrieve").mockResolvedValue({
      order: { id: "o" },
    } as never);

    await getCustomerOrder("o", "j", { fields: "id,*items" });

    expect(sdk.store.order.retrieve).toHaveBeenCalledWith(
      "o",
      { fields: "id,*items" },
      { Authorization: "Bearer j" },
    );
  });

  it("propagates 404", async () => {
    vi.spyOn(sdk.store.order, "retrieve").mockRejectedValue(httpError(404));

    try {
      await getCustomerOrder("missing", "t");
      expect.fail("expected throw");
    } catch (e) {
      expect(getErrorStatusCode(e)).toBe(404);
    }
  });

  it("propagates 401", async () => {
    vi.spyOn(sdk.store.order, "retrieve").mockRejectedValue(httpError(401));

    try {
      await getCustomerOrder("id", "t");
      expect.fail("expected throw");
    } catch (e) {
      expect(getErrorStatusCode(e)).toBe(401);
    }
  });
});
