import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { cookieSet } = vi.hoisted(() => ({ cookieSet: vi.fn() }));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: cookieSet,
    get: vi.fn(),
  })),
}));

import { CART_COOKIE_NAME } from "./cart-cookie";
import { clearCartIdCookie } from "./cart-cookie-server";

describe("cart-cookie-server", () => {
  beforeEach(() => {
    cookieSet.mockClear();
  });

  it("clearCartIdCookie clears with path, SameSite lax, and maxAge 0 only", async () => {
    await clearCartIdCookie();

    expect(cookieSet).toHaveBeenCalledTimes(1);
    expect(cookieSet).toHaveBeenCalledWith(CART_COOKIE_NAME, "", {
      maxAge: 0,
      path: "/",
      sameSite: "lax",
    });
  });
});
