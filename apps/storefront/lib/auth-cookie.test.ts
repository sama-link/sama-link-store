import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookieSet } = vi.hoisted(() => ({ cookieSet: vi.fn() }));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: cookieSet,
    get: vi.fn(),
  })),
}));

import {
  AUTH_COOKIE_MAX_AGE,
  AUTH_COOKIE_NAME,
  clearAuthCookie,
  setAuthCookie,
} from "./auth-cookie";

describe("auth cookie helpers", () => {
  beforeEach(() => {
    cookieSet.mockClear();
  });

  it("setAuthCookie and clearAuthCookie use matching security attributes; maxAge differs", async () => {
    await setAuthCookie("tok");
    await clearAuthCookie();

    expect(cookieSet).toHaveBeenCalledTimes(2);
    expect(cookieSet.mock.calls[0][0]).toBe(AUTH_COOKIE_NAME);
    expect(cookieSet.mock.calls[0][1]).toBe("tok");
    expect(cookieSet.mock.calls[1][0]).toBe(AUTH_COOKIE_NAME);
    expect(cookieSet.mock.calls[1][1]).toBe("");

    const setOpts = cookieSet.mock.calls[0][2] as Record<string, unknown>;
    const clearOpts = cookieSet.mock.calls[1][2] as Record<string, unknown>;

    expect(setOpts).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: AUTH_COOKIE_MAX_AGE,
    });
    expect(clearOpts).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });

    const { maxAge: _s, ...setRest } = setOpts;
    const { maxAge: _c, ...clearRest } = clearOpts;
    expect(setRest).toEqual(clearRest);
  });
});
