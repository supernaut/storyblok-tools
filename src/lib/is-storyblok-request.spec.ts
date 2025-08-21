import { afterEach, describe, expect, it, vi } from "vitest";

// Mock sha1 BEFORE importing the module under test so the import uses the mock
import { isStoryblokRequest } from "./is-storyblok-request";
vi.mock("./sha1", () => ({
  sha1: vi.fn(async () => "0102030405"),
}));
import { sha1 } from "./sha1";

describe("isStoryblokRequest", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when called with no parameters", async () => {
    const result = await isStoryblokRequest(undefined);
    expect(result).toBe(false);
  });

  it("returns false when called with null", async () => {
    const result = await isStoryblokRequest(null);
    expect(result).toBe(false);
  });

  it("returns false when called with empty string", async () => {
    const result = await isStoryblokRequest("");
    expect(result).toBe(false);
  });

  it("returns false when called with a URL missing required query params", async () => {
    process.env["STORYBLOK_PREVIEW_TOKEN"] = "testtoken";
    const result = await isStoryblokRequest("https://example.com/");
    expect(result).toBe(false);
  });

  it("returns false when space_id param is missing but token present", async () => {
    process.env["STORYBLOK_PREVIEW_TOKEN"] = "testtoken";
    const timestamp = Math.floor(Date.now() / 1000);
    const token = "0102030405";
    const url = `https://example.com/?_storyblok_tk[token]=${token}&_storyblok_tk[timestamp]=${timestamp}`;
    const result = await isStoryblokRequest(url);
    expect(result).toBe(false);
  });

  it("returns false when space_id param value is empty", async () => {
    process.env["STORYBLOK_PREVIEW_TOKEN"] = "testtoken";
    const timestamp = Math.floor(Date.now() / 1000);
    const token = "0102030405";
    const url = `https://example.com/?_storyblok_tk[token]=${token}&_storyblok_tk[space_id]=&_storyblok_tk[timestamp]=${timestamp}`;
    const result = await isStoryblokRequest(url);
    expect(result).toBe(false);
  });

  it("returns false when timestamp param is missing but other params present", async () => {
    process.env["STORYBLOK_PREVIEW_TOKEN"] = "testtoken";
    const space_id = "123";
    const token = "0102030405";
    const url = `https://example.com/?_storyblok_tk[token]=${token}&_storyblok_tk[space_id]=${space_id}`;
    const result = await isStoryblokRequest(url);
    expect(result).toBe(false);
  });

  it("returns false when timestamp param value is empty", async () => {
    process.env["STORYBLOK_PREVIEW_TOKEN"] = "testtoken";
    const space_id = "123";
    const token = "0102030405";
    const url = `https://example.com/?_storyblok_tk[token]=${token}&_storyblok_tk[space_id]=${space_id}&_storyblok_tk[timestamp]=`;
    const result = await isStoryblokRequest(url);
    expect(result).toBe(false);
  });

  it("returns false when STORYBLOK_PREVIEW_TOKEN is missing", async () => {
    delete process.env["STORYBLOK_PREVIEW_TOKEN"];
    const url =
      "https://example.com/?_storyblok_tk[token]=abc&_storyblok_tk[space_id]=123&_storyblok_tk[timestamp]=456";
    const result = await isStoryblokRequest(url);
    expect(result).toBe(false);
  });

  it("returns true for valid Storyblok request", async () => {
    const token = "testtoken";
    const space_id = "123";
    const timestamp = Math.floor(Date.now() / 1000);
    const expectedToken = "0102030405"; // from mocked sha1
    process.env["STORYBLOK_PREVIEW_TOKEN"] = token;
    const url = `https://example.com/?_storyblok_tk[token]=${expectedToken}&_storyblok_tk[space_id]=${space_id}&_storyblok_tk[timestamp]=${timestamp}`;
    const result = await isStoryblokRequest(url, token);
    expect(result).toBe(true);
  });

  it("returns false for expired timestamp", async () => {
    process.env["STORYBLOK_PREVIEW_TOKEN"] = "testtoken";
    const space_id = "123";
    const timestamp = Math.floor(Date.now() / 1000) - 4000; // expired
    const expectedToken = "0102030405";
    const url = `https://example.com/?_storyblok_tk[token]=${expectedToken}&_storyblok_tk[space_id]=${space_id}&_storyblok_tk[timestamp]=${timestamp}`;
    const result = await isStoryblokRequest(url);
    expect(result).toBe(false);
  });

  it("returns false when token hash mismatches", async () => {
    process.env["STORYBLOK_PREVIEW_TOKEN"] = "testtoken";
    const space_id = "123";
    const timestamp = Math.floor(Date.now() / 1000);
    const mismatchedToken = "deadbeef"; // different from mocked sha1 output
    const url = `https://example.com/?_storyblok_tk[token]=${mismatchedToken}&_storyblok_tk[space_id]=${space_id}&_storyblok_tk[timestamp]=${timestamp}`;
    const result = await isStoryblokRequest(url);
    expect(result).toBe(false);
  });

  it("returns false when timestamp is exactly 3600s old (boundary not allowed)", async () => {
    process.env["STORYBLOK_PREVIEW_TOKEN"] = "testtoken";
    const space_id = "123";
    const now = Math.floor(Date.now() / 1000);
    const timestamp = now - 3600; // boundary should be invalid because comparison is > now-3600
    const expectedToken = "0102030405";
    const url = `https://example.com/?_storyblok_tk[token]=${expectedToken}&_storyblok_tk[space_id]=${space_id}&_storyblok_tk[timestamp]=${timestamp}`;
    const result = await isStoryblokRequest(url);
    expect(result).toBe(false);
  });

  it("returns true when timestamp is within window by 1 second", async () => {
    process.env["STORYBLOK_PREVIEW_TOKEN"] = "testtoken";
    const space_id = "123";
    const now = Math.floor(Date.now() / 1000);
    const timestamp = now - 3599; // 1 second inside validity window
    const expectedToken = "0102030405";
    const url = `https://example.com/?_storyblok_tk[token]=${expectedToken}&_storyblok_tk[space_id]=${space_id}&_storyblok_tk[timestamp]=${timestamp}`;
    const result = await isStoryblokRequest(url);
    expect(result).toBe(true);
  });

  it("returns false when explicit token argument provided but env var missing", async () => {
    delete process.env["STORYBLOK_PREVIEW_TOKEN"];
    const token = "testtoken"; // passed as argument only
    const space_id = "123";
    const timestamp = Math.floor(Date.now() / 1000);
    const expectedToken = "0102030405"; // mocked sha1 output
    const url = `https://example.com/?_storyblok_tk[token]=${expectedToken}&_storyblok_tk[space_id]=${space_id}&_storyblok_tk[timestamp]=${timestamp}`;
    const result = await isStoryblokRequest(url, token);
    expect(result).toBe(false); // because implementation also requires env var presence
  });

  it("returns false when token param is empty string", async () => {
    process.env["STORYBLOK_PREVIEW_TOKEN"] = "testtoken";
    const space_id = "123";
    const timestamp = Math.floor(Date.now() / 1000);
    const url = `https://example.com/?_storyblok_tk[token]=&_storyblok_tk[space_id]=${space_id}&_storyblok_tk[timestamp]=${timestamp}`;
    const result = await isStoryblokRequest(url);
    expect(result).toBe(false);
  });

  it("returns false when timestamp param is not a number", async () => {
    process.env["STORYBLOK_PREVIEW_TOKEN"] = "testtoken";
    const space_id = "123";
    const badTimestamp = "abc";
    const expectedToken = "0102030405";
    const url = `https://example.com/?_storyblok_tk[token]=${expectedToken}&_storyblok_tk[space_id]=${space_id}&_storyblok_tk[timestamp]=${badTimestamp}`;
    const result = await isStoryblokRequest(url);
    expect(result).toBe(false);
  });

  it("calls sha1 with expected composition string", async () => {
    const previewToken = "testtoken";
    process.env["STORYBLOK_PREVIEW_TOKEN"] = previewToken;
    const space_id = "999";
    const timestamp = Math.floor(Date.now() / 1000);
    const expectedToken = "0102030405"; // mocked
    const url = `https://example.com/?_storyblok_tk[token]=${expectedToken}&_storyblok_tk[space_id]=${space_id}&_storyblok_tk[timestamp]=${timestamp}`;
    await isStoryblokRequest(url);
    expect(sha1).toHaveBeenCalledWith(
      `${space_id}:${previewToken}:${timestamp}`,
    );
  });
});
