import { beforeEach, describe, expect, it, vi } from "vitest";
import { sdk, transferCartToCustomer } from "./medusa-client";

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
