/**
 * Creates a SHA-1 hash of the input string
 * @param input
 * @returns
 */
const sha1 = async (input: string): Promise<string> => {
  const encoder = new TextEncoder();

  const hash = await crypto.subtle.digest("SHA-1", encoder.encode(input));
  const hashArray = new Uint8Array(hash);

  let hashString = "";
  for (const element of hashArray) {
    hashString += element.toString(16).padStart(2, "0");
  }
  return hashString;
};

/**
 * Checks whether an incoming request URL originates from Storyblok's visual editor.
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
    // Early return if no URL is provided
    if (!requestUrl?.length) {
      throw new Error("No request URL provided");
    }
    // Get token from environment or function parameter
    const previewToken =
      storyblokToken ?? process.env["STORYBLOK_PREVIEW_TOKEN"];
    // Early return if no URL is provided
    if (!previewToken) {
      throw new Error("No Storyblok preview token provided");
    }
    const query = new URL(requestUrl).searchParams;
    const tokenKey = "_storyblok_tk[token]";
    const spaceIdKey = "_storyblok_tk[space_id]";
    const timestampKey = "_storyblok_tk[timestamp]";

    // Early return if URL does not contain the required query parameters
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

    // Extract values
    const space_id = query.get("_storyblok_tk[space_id]") ?? "";
    const timestamp = parseInt(
      query.get("_storyblok_tk[timestamp]") ?? "-1",
      10,
    );
    const token = query.get("_storyblok_tk[token]") ?? "";

    // Create token to compare
    const validationToken = await sha1(
      `${space_id}:${previewToken}:${timestamp}`,
    );

    // Check if token is valid and not expired
    return (
      token === validationToken &&
      !!timestamp &&
      timestamp > Math.floor(Date.now() / 1000) - 3600
    );
  } catch (error) {
    // Log error and return false
    console.error({
      error,
      method: "isStoryblokRequest",
      requestUrl,
    });
    return false;
  }
}
