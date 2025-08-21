import { sha1 } from "./sha1";

/**
 * Checks whether an incoming request URL originates from Storyblok's visual editor
 *
 * @param requestUrl Full request URL (including query string) to validate
 * @param storyblokToken Optional explicit preview token
 * @returns Promise resolving to true if the URL passes all validation checks; false otherwise.
 */
export async function isStoryblokRequest(
  requestUrl: null | string | undefined,
  storyblokToken?: string,
): Promise<boolean> {
  try {
    if (!requestUrl?.length) {
      throw new Error("No request URL provided");
    }
    const previewToken =
      storyblokToken || process.env["STORYBLOK_PREVIEW_TOKEN"];
    if (!previewToken) {
      throw new Error("No Storyblok preview token provided");
    }

    const query = new URL(requestUrl).searchParams;
    const tokenKey = "_storyblok_tk[token]";
    const spaceIdKey = "_storyblok_tk[space_id]";
    const timestampKey = "_storyblok_tk[timestamp]";
    // Individual guard clauses for clearer logic & better branch coverage instrumentation
    if (!query.has(tokenKey)) {
      return false; // missing token param entirely
    }
    if (!query.get(tokenKey)) {
      return false; // empty token value
    }
    if (!query.has(spaceIdKey)) {
      return false; // missing space id param
    }
    if (!query.get(spaceIdKey)) {
      return false; // empty space id
    }
    if (!query.has(timestampKey)) {
      return false; // missing timestamp param
    }
    if (!query.get(timestampKey)) {
      return false; // empty timestamp
    }
    // Maintain existing behavior: require env variable presence even if argument provided
    if (!process.env["STORYBLOK_PREVIEW_TOKEN"]) {
      return false;
    }

    const space_id = query.get("_storyblok_tk[space_id]") ?? "";
    const timestamp = parseInt(
      query.get("_storyblok_tk[timestamp]") ?? "-1",
      10,
    );
    const token = query.get("_storyblok_tk[token]") ?? "";

    const validationToken = await sha1(
      `${space_id}:${previewToken}:${timestamp}`,
    );

    return (
      token === validationToken &&
      !!timestamp &&
      timestamp > Math.floor(Date.now() / 1000) - 3600
    );
  } catch (error) {
    console.error({
      error,
      method: "isStoryblokRequest",
      requestUrl,
    });
    return false;
  }
}
