import { describe, expect, it } from "vitest";

import { sha1 } from "./sha1";

describe("sha1", () => {
  it("should return correct SHA-1 hash for a known string", async () => {
    const result = await sha1("hello");
    expect(result).toBe("aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d");
  });

  it("should return correct SHA-1 hash for an empty string", async () => {
    const result = await sha1("");
    expect(result).toBe("da39a3ee5e6b4b0d3255bfef95601890afd80709");
  });

  it("should return different hashes for different inputs", async () => {
    const hash1 = await sha1("foo");
    const hash2 = await sha1("bar");
    expect(hash1).not.toBe(hash2);
  });

  it("should handle unicode characters", async () => {
    const result = await sha1("你好");
    expect(result).toBe("440ee0853ad1e99f962b63e459ef992d7c211722");
  });

  it("should return a 40-character hexadecimal string", async () => {
    const result = await sha1("test");
    expect(result).toMatch(/^[a-f0-9]{40}$/);
  });
});
