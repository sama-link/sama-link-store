import { describe, expect, it } from "vitest";
import { getErrorStatusCode } from "./medusa-client";

describe("medusa-client smoke", () => {
  it("returns null for non-object inputs", () => {
    expect(getErrorStatusCode(null)).toBeNull();
    expect(getErrorStatusCode("oops")).toBeNull();
  });

  it("reads status from response.status", () => {
    expect(
      getErrorStatusCode({ response: { status: 404 } }),
    ).toBe(404);
  });
});
