// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { CART_COOKIE_NAME, clearCartId, setCartId } from "./cart-cookie";

function parseCookieWrite(write: string): {
  path: string | null;
  sameSite: string | null;
  maxAge: string | null;
} {
  const parts = write.split(";").map((p) => p.trim());
  let path: string | null = null;
  let sameSite: string | null = null;
  let maxAge: string | null = null;
  for (let i = 1; i < parts.length; i++) {
    const p = parts[i];
    const lower = p.toLowerCase();
    if (lower.startsWith("path=")) path = p.slice(p.indexOf("=") + 1);
    if (lower.startsWith("samesite="))
      sameSite = p.slice(p.indexOf("=") + 1);
    if (lower.startsWith("max-age="))
      maxAge = p.slice(p.indexOf("=") + 1);
  }
  return { path, sameSite, maxAge };
}

describe("cart-cookie (client)", () => {
  beforeEach(() => {
    document.cookie = "";
  });

  it("setCartId writes medusa_cart_id; clearCartId clears; both agree on path and SameSite", () => {
    const writes: string[] = [];
    const proto = Document.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, "cookie");
    if (!desc?.set || !desc.get) throw new Error("cookie descriptor missing");

    Object.defineProperty(document, "cookie", {
      configurable: true,
      get() {
        return desc.get!.call(document);
      },
      set(value: string) {
        writes.push(value);
        desc.set!.call(document, value);
      },
    });

    try {
      setCartId("cart_xyz");
      expect(document.cookie).toContain(`${CART_COOKIE_NAME}=cart_xyz`);

      clearCartId();

      const setWrite = writes.find((w) => w.includes(`${CART_COOKIE_NAME}=cart_xyz`));
      const clearWrite = writes.find(
        (w) =>
          w.includes(`${CART_COOKIE_NAME}=`) &&
          w.toLowerCase().includes("max-age=0"),
      );
      expect(setWrite).toBeDefined();
      expect(clearWrite).toBeDefined();

      const parsedSet = parseCookieWrite(setWrite!);
      const parsedClear = parseCookieWrite(clearWrite!);

      expect(parsedSet.path).toBe("/");
      expect(parsedSet.sameSite?.toLowerCase()).toBe("lax");
      expect(parsedSet.maxAge).toBeTruthy();
      expect(Number(parsedSet.maxAge)).toBeGreaterThan(0);

      expect(parsedClear.path).toBe("/");
      expect(parsedClear.sameSite?.toLowerCase()).toBe("lax");
      expect(parsedClear.maxAge).toBe("0");

      expect(parsedSet.path).toBe(parsedClear.path);
      expect(parsedSet.sameSite?.toLowerCase()).toBe(
        parsedClear.sameSite?.toLowerCase(),
      );
    } finally {
      Object.defineProperty(document, "cookie", desc);
    }
  });

  it("after clearCartId, readable cookie no longer holds the cart id value", () => {
    setCartId("cart_xyz");
    expect(document.cookie).toContain("cart_xyz");
    clearCartId();
    expect(document.cookie).not.toMatch(
      new RegExp(`${CART_COOKIE_NAME}=cart_xyz`),
    );
  });
});
