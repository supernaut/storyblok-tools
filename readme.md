# Storyblok Tools

Tools to simplify recurring tasks when working with [Storyblok](https://www.storyblok.com/).

## Usage

Install the package using your package manager of choice:

```sh
pnpm add @supernaut/storyblok-tools
```

```sh
npm install @supernaut/storyblok-tools
```

```sh
yarn add @supernaut/storyblok-tools
```

### Check If Request Comes from Storyblok

This function checks whether an incoming request URL originates from Storyblok's visual editor
("in-editor" / preview mode) by validating the signed query parameters Storyblok
appends to iframe / bridge requests.

Validation steps performed:

1. Ensures a request URL and a Storyblok preview token are present. The preview token
   is taken from the optional `storyblokToken` argument or the `STORYBLOK_PREVIEW_TOKEN`
   environment variable.
2. Verifies the URL contains the required query parameters:
   - `_storyblok_tk[token]` (HMAC-like validation hash Storyblok generates)
   - `_storyblok_tk[space_id]` (numeric space identifier)
   - `_storyblok_tk[timestamp]` (unix timestamp in seconds)
3. Recomputes the expected validation token using SHA-1 over the string
   `${space_id}:${previewToken}:${timestamp}`
4. Compares the recomputed token with the provided one AND checks that the timestamp
   is not older than 1 hour (3600 seconds).

Any thrown error or failed validation path results in `false`.

This is heavily inspired by the work of [Jorge Martins](https://gist.github.com/jorgemartins-uon) in [this gist](https://gist.github.com/jorgemartins-uon/60c2ab4972e6ab8484e668ae899e6679)

```ts
import { isStoryblokRequest } from "@supernaut/storyblok-tools";

function requestHandler(request: Request) {
  const isFromStoryblok = await isStoryblokRequest(request.url);
  if (!isFromStoryblok) {
    throw new Error("Request was not from Storyblok preview!");
  }
}
```

### Example Next.js Route Handler for Storyblok Preview

Given that you put the handler in `app/api/draft/route.ts` and your public website is `https://www.example.com/` you can then provide this as the preview URL for the storyblok visual editor: `https://www.example.com/api/draft?slug=`

This route handler only works with the Next.js app router.

```ts
import { isStoryblokRequest } from "@supernaut/storyblok-tools";

return async function GET(request: Request) {
  const isFromStoryblok = await isStoryblokRequest(request.url);
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const slug = searchParams.get("slug");

  if (!isFromStoryblok || !slug) {
    redirect("/api/end-draft");
  }

  if (isFromStoryblok) {
    // Set URL
    const url = new URL(requestUrl);
    url.pathname = `/${slug}`;

    // Enable draft mode
    const draftObject = await draftMode();
    draftObject.enable();

    // Modify draft cookie for Storyblok
    const cookiesObject = await cookies();
    const draftCookie = { ...cookiesObject.get("__prerender_bypass") };
    if (draftCookie) {
      cookiesObject.set({
        httpOnly: true,
        name: "__prerender_bypass",
        path: "/",
        sameSite: "none",
        secure: true,
        value: draftCookie.value ?? "",
      });
    }

    // Redirect to correct location
    return NextResponse.redirect(url, 307);
  }
};
```

### Exmaple Next.js Route Handler for Ending Preview

This route handler only works with the Next.js app router.

```ts
return async function GET(request: Request) {
  // Disable draft mode
  const draftModeObject = await draftMode();
  draftModeObject.disable();

  // Modify draft cookie for Storyblok
  const cookiesObject = await cookies();
  const draftCookie = { ...cookiesObject.get("__prerender_bypass") };
  if (draftCookie) {
    cookiesObject.set({
      expires: new Date(0), // Set expiration date to the past
      httpOnly: true,
      name: "__prerender_bypass",
      path: "/",
      sameSite: "none",
      secure: true,
      value: draftCookie.value ?? "",
    });
  }

  // Redirect to index
  redirect("/");
};
```

## Release Flow

1. Make changes
2. Commit those changes
3. Bump version in package.json
4. conventional-changelog
5. Commit package.json and CHANGELOG.md files
6. Tag
7. Push
