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

    if (
      !query.has(tokenKey) ||
      !query.get(tokenKey) ||
      !query.has(spaceIdKey) ||
      !query.get(spaceIdKey) ||
      !query.has(timestampKey) ||
      !query.get(timestampKey) ||
      !process.env["STORYBLOK_PREVIEW_TOKEN"]
    ) {
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
