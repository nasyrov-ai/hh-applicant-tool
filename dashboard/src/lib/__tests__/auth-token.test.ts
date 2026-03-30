import { describe, it, expect } from "vitest";
import { makeAuthToken } from "../auth-token";

describe("makeAuthToken", () => {
  it("returns a hex string", async () => {
    const token = await makeAuthToken("test-secret");
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it("returns consistent hash for same input", async () => {
    const token1 = await makeAuthToken("my-secret");
    const token2 = await makeAuthToken("my-secret");
    expect(token1).toBe(token2);
  });

  it("returns different hash for different inputs", async () => {
    const token1 = await makeAuthToken("secret-a");
    const token2 = await makeAuthToken("secret-b");
    expect(token1).not.toBe(token2);
  });

  it("returns a 64-char hex string (SHA-256)", async () => {
    const token = await makeAuthToken("test");
    expect(token).toHaveLength(64);
  });
});
