// Sama Link · i18n message-shape regression tests.
//
// Locks in the message types we depend on at runtime, so structural
// regressions (an object replacing a string, a missing namespace, a
// typo) fail at test time rather than as a runtime IntlError. Triggered
// by an ACCT-6E hotfix where `account.compare.subheading` failed
// next-intl's strict-ICU resolution because of how a numeric value was
// passed (the message itself was a string but the placeholder coerced
// the resolution); this test guards the structural shape across the
// account.{wishlist,compare} surfaces in both locales.

import { describe, expect, it } from "vitest";
import enMessages from "./en.json";
import arMessages from "./ar.json";

type MessageDict = Record<string, unknown>;

function get(dict: MessageDict, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, dict);
}

const SHARED_KEYS = [
  "account.nav.wishlist",
  "account.nav.compare",
  "account.wishlist.heading",
  "account.wishlist.subheading",
  "account.wishlist.clearAll",
  "account.wishlist.empty.heading",
  "account.wishlist.empty.body",
  "account.wishlist.empty.cta",
  "account.compare.heading",
  "account.compare.subheading",
  "account.compare.clearAll",
  "account.compare.empty.heading",
  "account.compare.empty.body",
  "account.compare.empty.cta",
] as const;

describe("messages — account.{wishlist,compare} structural shape", () => {
  describe.each([
    ["en.json", enMessages as MessageDict],
    ["ar.json", arMessages as MessageDict],
  ])("%s", (_filename, dict) => {
    it.each(SHARED_KEYS)("%s resolves to a string", (key) => {
      const value = get(dict, key);
      expect(typeof value).toBe("string");
      expect((value as string).length).toBeGreaterThan(0);
    });

    it("account.compare.subheading contains the {max} placeholder", () => {
      const value = get(dict, "account.compare.subheading") as string;
      expect(value).toMatch(/\{max\}/);
    });
  });
});
