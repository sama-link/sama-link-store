import { beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import * as AuthCookie from "@/lib/auth-cookie";
import * as CartCookieServer from "@/lib/cart-cookie-server";
import type { StoreCustomer } from "@/lib/medusa-client";
import * as Medusa from "@/lib/medusa-client";
import {
  createAddressAction,
  deleteAddressAction,
  loginAction,
  logoutAction,
  profileUpdateAction,
  registerAction,
  updateAddressAction,
} from "./actions";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getLocale: vi.fn(),
  getTranslations: vi.fn(),
}));

vi.mock("@/lib/medusa-client", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/medusa-client")>();
  return {
    ...mod,
    emailpassLogin: vi.fn(),
    emailpassRegister: vi.fn(),
    createCustomer: vi.fn(),
    refreshAuthToken: vi.fn(),
    logoutSession: vi.fn(),
    transferCartToCustomer: vi.fn(),
    updateCustomer: vi.fn(),
    createCustomerAddress: vi.fn(),
    updateCustomerAddress: vi.fn(),
    deleteCustomerAddress: vi.fn(),
    getErrorStatusCode: vi.fn(),
  };
});

vi.mock("@/lib/auth-cookie", () => ({
  setAuthCookie: vi.fn(),
  getAuthToken: vi.fn(),
  clearAuthCookie: vi.fn(),
}));

vi.mock("@/lib/cart-cookie-server", () => ({
  getCartIdFromCookie: vi.fn(),
  clearCartIdCookie: vi.fn(),
}));

vi.mock("@/lib/data/cart", () => ({
  rememberCustomerCartIdAfterAuth: vi.fn(),
}));

import * as DataCart from "@/lib/data/cart";

const dummyCustomer = { id: "c1", email: "u@example.com" } as StoreCustomer;

function fd(values: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.set(k, v);
  return f;
}

describe("account server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getLocale).mockResolvedValue("en");
    vi.mocked(getTranslations).mockImplementation(
      async () =>
        ((key: string) => key) as unknown as Awaited<
          ReturnType<typeof getTranslations>
        >,
    );
    vi.mocked(Medusa.emailpassLogin).mockResolvedValue({ token: "loginTok" });
    vi.mocked(Medusa.emailpassRegister).mockResolvedValue({ token: "regTok" });
    vi.mocked(Medusa.createCustomer).mockResolvedValue(dummyCustomer);
    vi.mocked(Medusa.refreshAuthToken).mockResolvedValue("sessionTok");
    vi.mocked(Medusa.logoutSession).mockResolvedValue(undefined);
    vi.mocked(Medusa.transferCartToCustomer).mockResolvedValue(undefined);
    vi.mocked(Medusa.updateCustomer).mockResolvedValue(dummyCustomer);
    vi.mocked(Medusa.createCustomerAddress).mockResolvedValue({} as never);
    vi.mocked(Medusa.updateCustomerAddress).mockResolvedValue({} as never);
    vi.mocked(Medusa.deleteCustomerAddress).mockResolvedValue(undefined);
    vi.mocked(Medusa.getErrorStatusCode).mockReturnValue(null);
    vi.mocked(CartCookieServer.getCartIdFromCookie).mockResolvedValue(null);
    vi.mocked(AuthCookie.setAuthCookie).mockResolvedValue(undefined);
    vi.mocked(AuthCookie.getAuthToken).mockResolvedValue(null);
    vi.mocked(AuthCookie.clearAuthCookie).mockResolvedValue(undefined);
    vi.mocked(CartCookieServer.clearCartIdCookie).mockResolvedValue(undefined);
    vi.mocked(DataCart.rememberCustomerCartIdAfterAuth).mockResolvedValue(
      undefined,
    );
  });

  describe("loginAction", () => {
    it("3a valid credentials and no cart: login, set cookie, no transfer, redirect", async () => {
      await loginAction(
        {},
        fd({ email: "a@b.com", password: "secret12" }),
      );

      expect(Medusa.emailpassLogin).toHaveBeenCalledTimes(1);
      expect(Medusa.emailpassLogin).toHaveBeenCalledWith("a@b.com", "secret12");
      expect(AuthCookie.setAuthCookie).toHaveBeenCalledWith("loginTok");
      expect(Medusa.transferCartToCustomer).not.toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/en/account");
    });

    it("3b valid credentials with cart: transfer once with cart id and token", async () => {
      vi.mocked(CartCookieServer.getCartIdFromCookie).mockResolvedValue(
        "cart_guest",
      );

      await loginAction(
        {},
        fd({ email: "a@b.com", password: "secret12" }),
      );

      expect(Medusa.transferCartToCustomer).toHaveBeenCalledTimes(1);
      expect(Medusa.transferCartToCustomer).toHaveBeenCalledWith(
        "cart_guest",
        "loginTok",
      );
      expect(redirect).toHaveBeenCalledWith("/en/account");
    });

    it("3b-persist syncs customer.last_cart_id after a successful login (CART-PERSIST-1A)", async () => {
      vi.mocked(CartCookieServer.getCartIdFromCookie).mockResolvedValue(
        "cart_guest",
      );

      await loginAction(
        {},
        fd({ email: "a@b.com", password: "secret12" }),
      );

      expect(DataCart.rememberCustomerCartIdAfterAuth).toHaveBeenCalledTimes(1);
      // Must run after the transferCart sequence so the cookie cart id
      // reflects the just-promoted customer cart.
      const transferOrder = vi
        .mocked(Medusa.transferCartToCustomer)
        .mock.invocationCallOrder[0];
      const persistOrder = vi
        .mocked(DataCart.rememberCustomerCartIdAfterAuth)
        .mock.invocationCallOrder[0];
      expect(persistOrder).toBeGreaterThan(transferOrder ?? 0);
    });

    it("3c valid credentials with cart but transfer throws: still set cookie and redirect", async () => {
      vi.mocked(CartCookieServer.getCartIdFromCookie).mockResolvedValue(
        "cart_guest",
      );
      vi.mocked(Medusa.transferCartToCustomer).mockRejectedValue(
        new Error("transfer failed"),
      );

      await loginAction(
        {},
        fd({ email: "a@b.com", password: "secret12" }),
      );

      expect(AuthCookie.setAuthCookie).toHaveBeenCalledWith("loginTok");
      expect(redirect).toHaveBeenCalledWith("/en/account");
    });

    it("3d missing email or password: genericError, no login, no redirect", async () => {
      const r = await loginAction({}, fd({ email: "", password: "secret12" }));
      expect(r).toEqual({ error: "genericError" });
      expect(Medusa.emailpassLogin).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    });

    it("3e emailpassLogin throws generic error: genericError, no setAuthCookie", async () => {
      vi.mocked(Medusa.emailpassLogin).mockRejectedValue(new Error("bad"));

      const r = await loginAction(
        {},
        fd({ email: "a@b.com", password: "secret12" }),
      );
      expect(r).toEqual({ error: "genericError" });
      expect(AuthCookie.setAuthCookie).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
      // Sync must not fire when login itself failed.
      expect(DataCart.rememberCustomerCartIdAfterAuth).not.toHaveBeenCalled();
    });

    it("3f emailpassLogin throws AuthProviderUnavailableError: rethrows", async () => {
      vi.mocked(Medusa.emailpassLogin).mockRejectedValue(
        new Medusa.AuthProviderUnavailableError(),
      );

      await expect(
        loginAction({}, fd({ email: "a@b.com", password: "secret12" })),
      ).rejects.toBeInstanceOf(Medusa.AuthProviderUnavailableError);
      expect(AuthCookie.setAuthCookie).not.toHaveBeenCalled();
    });
  });

  describe("registerAction", () => {
    it("4a valid fields and no cart: register, create, refresh, set cookie, redirect in order", async () => {
      const order: string[] = [];
      vi.mocked(Medusa.emailpassRegister).mockImplementation(async () => {
        order.push("emailpassRegister");
        return { token: "regTok" };
      });
      vi.mocked(Medusa.createCustomer).mockImplementation(async () => {
        order.push("createCustomer");
        return dummyCustomer;
      });
      vi.mocked(Medusa.refreshAuthToken).mockImplementation(async () => {
        order.push("refreshAuthToken");
        return "sessionTok";
      });
      vi.mocked(AuthCookie.setAuthCookie).mockImplementation(async () => {
        order.push("setAuthCookie");
      });

      await registerAction(
        {},
        fd({
          email: "a@b.com",
          password: "secret12",
          first_name: "A",
          last_name: "B",
        }),
      );

      expect(order).toEqual([
        "emailpassRegister",
        "createCustomer",
        "refreshAuthToken",
        "setAuthCookie",
      ]);
      expect(Medusa.createCustomer).toHaveBeenCalledWith(
        {
          email: "a@b.com",
          first_name: "A",
          last_name: "B",
        },
        "regTok",
      );
      expect(Medusa.refreshAuthToken).toHaveBeenCalledWith("regTok");
      expect(AuthCookie.setAuthCookie).toHaveBeenCalledWith("sessionTok");
      expect(Medusa.transferCartToCustomer).not.toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/en/account");
    });

    it("4b valid fields with cart: transfer with session token", async () => {
      vi.mocked(CartCookieServer.getCartIdFromCookie).mockResolvedValue(
        "cart_x",
      );

      await registerAction(
        {},
        fd({
          email: "a@b.com",
          password: "secret12",
          first_name: "A",
          last_name: "B",
        }),
      );

      expect(Medusa.transferCartToCustomer).toHaveBeenCalledTimes(1);
      expect(Medusa.transferCartToCustomer).toHaveBeenCalledWith(
        "cart_x",
        "sessionTok",
      );
      expect(redirect).toHaveBeenCalledWith("/en/account");
    });

    it("4b-persist syncs customer.last_cart_id after a successful register (CART-PERSIST-1A)", async () => {
      vi.mocked(CartCookieServer.getCartIdFromCookie).mockResolvedValue(
        "cart_x",
      );

      await registerAction(
        {},
        fd({
          email: "a@b.com",
          password: "secret12",
          first_name: "A",
          last_name: "B",
        }),
      );

      expect(DataCart.rememberCustomerCartIdAfterAuth).toHaveBeenCalledTimes(1);
      const transferOrder = vi
        .mocked(Medusa.transferCartToCustomer)
        .mock.invocationCallOrder[0];
      const persistOrder = vi
        .mocked(DataCart.rememberCustomerCartIdAfterAuth)
        .mock.invocationCallOrder[0];
      expect(persistOrder).toBeGreaterThan(transferOrder ?? 0);
    });

    it("4c valid fields with cart but transfer throws: still redirect", async () => {
      vi.mocked(CartCookieServer.getCartIdFromCookie).mockResolvedValue(
        "cart_x",
      );
      vi.mocked(Medusa.transferCartToCustomer).mockRejectedValue(
        new Error("boom"),
      );

      await registerAction(
        {},
        fd({
          email: "a@b.com",
          password: "secret12",
          first_name: "A",
          last_name: "B",
        }),
      );

      expect(AuthCookie.setAuthCookie).toHaveBeenCalledWith("sessionTok");
      expect(redirect).toHaveBeenCalledWith("/en/account");
    });

    it("4d missing required field: registerError, no register call", async () => {
      const r = await registerAction(
        {},
        fd({
          email: "a@b.com",
          password: "secret12",
          first_name: "",
          last_name: "B",
        }),
      );
      expect(r).toEqual({ error: "registerError" });
      expect(Medusa.emailpassRegister).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    });

    it("4e emailpassRegister throws AuthProviderUnavailableError: rethrows", async () => {
      vi.mocked(Medusa.emailpassRegister).mockRejectedValue(
        new Medusa.AuthProviderUnavailableError(),
      );

      await expect(
        registerAction(
          {},
          fd({
            email: "a@b.com",
            password: "secret12",
            first_name: "A",
            last_name: "B",
          }),
        ),
      ).rejects.toBeInstanceOf(Medusa.AuthProviderUnavailableError);
    });
  });

  describe("logoutAction", () => {
    it("5a token present: logout, clear auth then cart, redirect", async () => {
      vi.mocked(AuthCookie.getAuthToken).mockResolvedValue("tok");

      const seq: string[] = [];
      vi.mocked(AuthCookie.clearAuthCookie).mockImplementation(async () => {
        seq.push("auth");
      });
      vi.mocked(CartCookieServer.clearCartIdCookie).mockImplementation(
        async () => {
          seq.push("cart");
        },
      );

      await logoutAction();

      expect(Medusa.logoutSession).toHaveBeenCalledWith("tok");
      expect(seq).toEqual(["auth", "cart"]);
      expect(redirect).toHaveBeenCalledWith("/en");
    });

    it("5b token present but logoutSession throws: still clear cookies and redirect", async () => {
      vi.mocked(AuthCookie.getAuthToken).mockResolvedValue("tok");
      vi.mocked(Medusa.logoutSession).mockRejectedValue(new Error("remote"));

      await logoutAction();

      expect(AuthCookie.clearAuthCookie).toHaveBeenCalled();
      expect(CartCookieServer.clearCartIdCookie).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/en");
    });

    it("5c no token: skip logoutSession, still clear cookies and redirect", async () => {
      vi.mocked(AuthCookie.getAuthToken).mockResolvedValue(null);

      await logoutAction();

      expect(Medusa.logoutSession).not.toHaveBeenCalled();
      expect(AuthCookie.clearAuthCookie).toHaveBeenCalled();
      expect(CartCookieServer.clearCartIdCookie).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/en");
    });

    it("5d locale ar redirects to /ar", async () => {
      vi.mocked(getLocale).mockResolvedValue("ar");
      vi.mocked(AuthCookie.getAuthToken).mockResolvedValue(null);

      await logoutAction();

      expect(redirect).toHaveBeenCalledWith("/ar");
    });
  });

  describe("profileUpdateAction", () => {
    it("updates profile with token and returns success", async () => {
      vi.mocked(AuthCookie.getAuthToken).mockResolvedValue("tok");

      const result = await profileUpdateAction(
        {},
        fd({
          first_name: "Jane",
          last_name: "Doe",
          phone: "0100",
        }),
      );

      expect(Medusa.updateCustomer).toHaveBeenCalledWith(
        {
          first_name: "Jane",
          last_name: "Doe",
          phone: "0100",
        },
        "tok",
      );
      expect(result).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith("/en/account");
      expect(revalidatePath).toHaveBeenCalledWith("/en/account/profile");
    });

    it("returns translated error when required fields are missing", async () => {
      const result = await profileUpdateAction(
        {},
        fd({
          first_name: "",
          last_name: "Doe",
          phone: "",
        }),
      );

      expect(result).toEqual({ error: "profile.updateError" });
      expect(Medusa.updateCustomer).not.toHaveBeenCalled();
    });

    it("returns translated error on generic update failure", async () => {
      vi.mocked(AuthCookie.getAuthToken).mockResolvedValue("tok");
      vi.mocked(Medusa.updateCustomer).mockRejectedValue(new Error("boom"));
      vi.mocked(Medusa.getErrorStatusCode).mockReturnValue(500);

      const result = await profileUpdateAction(
        {},
        fd({
          first_name: "Jane",
          last_name: "Doe",
          phone: "",
        }),
      );

      expect(result).toEqual({ error: "profile.updateError" });
    });

    it("redirects to login on 401", async () => {
      vi.mocked(AuthCookie.getAuthToken).mockResolvedValue("tok");
      vi.mocked(Medusa.updateCustomer).mockRejectedValue(new Error("unauthorized"));
      vi.mocked(Medusa.getErrorStatusCode).mockReturnValue(401);

      await profileUpdateAction(
        {},
        fd({
          first_name: "Jane",
          last_name: "Doe",
          phone: "",
        }),
      );

      expect(redirect).toHaveBeenCalledWith("/en/account/login");
    });
  });

  describe("createAddressAction", () => {
    it("creates address and revalidates on success", async () => {
      vi.mocked(AuthCookie.getAuthToken).mockResolvedValue("tok");
      const result = await createAddressAction(
        {},
        fd({
          first_name: "Jane",
          last_name: "Doe",
          address_1: "Line 1",
          city: "Cairo",
          country_code: "eg",
          phone: "0100",
        }),
      );

      expect(Medusa.createCustomerAddress).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: "Jane",
          last_name: "Doe",
          address_1: "Line 1",
          city: "Cairo",
          country_code: "eg",
          phone: "0100",
        }),
        "tok",
      );
      expect(result).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith("/en/account/addresses");
    });

    it("returns error for missing required fields", async () => {
      const result = await createAddressAction(
        {},
        fd({
          first_name: "",
          last_name: "Doe",
          address_1: "Line 1",
          city: "Cairo",
          country_code: "eg",
        }),
      );
      expect(result).toEqual({ error: "addresses.createError" });
      expect(Medusa.createCustomerAddress).not.toHaveBeenCalled();
    });

    it("redirects on 401", async () => {
      vi.mocked(AuthCookie.getAuthToken).mockResolvedValue("tok");
      vi.mocked(Medusa.createCustomerAddress).mockRejectedValue(new Error("401"));
      vi.mocked(Medusa.getErrorStatusCode).mockReturnValue(401);

      await createAddressAction(
        {},
        fd({
          first_name: "Jane",
          last_name: "Doe",
          address_1: "Line 1",
          city: "Cairo",
          country_code: "eg",
        }),
      );
      expect(redirect).toHaveBeenCalledWith("/en/account/login");
    });
  });

  describe("updateAddressAction", () => {
    it("updates address and revalidates on success", async () => {
      vi.mocked(AuthCookie.getAuthToken).mockResolvedValue("tok");
      const result = await updateAddressAction(
        {},
        fd({
          address_id: "addr_1",
          first_name: "Jane",
          last_name: "Doe",
          address_1: "Line 1",
          city: "Cairo",
          country_code: "eg",
        }),
      );

      expect(Medusa.updateCustomerAddress).toHaveBeenCalledWith(
        "addr_1",
        expect.objectContaining({
          first_name: "Jane",
          last_name: "Doe",
          address_1: "Line 1",
          city: "Cairo",
          country_code: "eg",
        }),
        "tok",
      );
      expect(result).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith("/en/account/addresses");
    });

    it("returns error if address_id missing", async () => {
      const result = await updateAddressAction(
        {},
        fd({
          first_name: "Jane",
          last_name: "Doe",
          address_1: "Line 1",
          city: "Cairo",
          country_code: "eg",
        }),
      );
      expect(result).toEqual({ error: "addresses.updateError" });
      expect(Medusa.updateCustomerAddress).not.toHaveBeenCalled();
    });

    it("redirects on 401", async () => {
      vi.mocked(AuthCookie.getAuthToken).mockResolvedValue("tok");
      vi.mocked(Medusa.updateCustomerAddress).mockRejectedValue(new Error("401"));
      vi.mocked(Medusa.getErrorStatusCode).mockReturnValue(401);

      await updateAddressAction(
        {},
        fd({
          address_id: "addr_1",
          first_name: "Jane",
          last_name: "Doe",
          address_1: "Line 1",
          city: "Cairo",
          country_code: "eg",
        }),
      );
      expect(redirect).toHaveBeenCalledWith("/en/account/login");
    });
  });

  describe("deleteAddressAction", () => {
    it("deletes address and revalidates on success", async () => {
      vi.mocked(AuthCookie.getAuthToken).mockResolvedValue("tok");
      const result = await deleteAddressAction({}, fd({ address_id: "addr_1" }));

      expect(Medusa.deleteCustomerAddress).toHaveBeenCalledWith("addr_1", "tok");
      expect(result).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith("/en/account/addresses");
    });

    it("returns error if address_id missing", async () => {
      const result = await deleteAddressAction({}, fd({ address_id: "" }));
      expect(result).toEqual({ error: "addresses.deleteError" });
      expect(Medusa.deleteCustomerAddress).not.toHaveBeenCalled();
    });

    it("redirects on 401", async () => {
      vi.mocked(AuthCookie.getAuthToken).mockResolvedValue("tok");
      vi.mocked(Medusa.deleteCustomerAddress).mockRejectedValue(new Error("401"));
      vi.mocked(Medusa.getErrorStatusCode).mockReturnValue(401);

      await deleteAddressAction({}, fd({ address_id: "addr_1" }));
      expect(redirect).toHaveBeenCalledWith("/en/account/login");
    });
  });
});
