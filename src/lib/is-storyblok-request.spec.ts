import { afterEach, describe, expect, it, vi } from "vitest";

// Mock sha1 BEFORE importing the module under test so the import uses the mock
vi.mock("./sha1", () => ({
  sha1: vi.fn(async () => "0102030405"),
}));
import { isStoryblokRequest } from "./is-storyblok-request";

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
});
