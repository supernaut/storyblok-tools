import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: {
    index: "./src/index.ts",
    "is-storyblok-request": "./src/lib/is-storyblok-request.ts",
    // "storyblok-end-draft-handler-side-effect":
    //   "./src/types/storyblok-end-draft-handler-side-effect.ts",
    // "storyblok-end-draft-route-handler-factory":
    //   "./src/lib/storyblok-end-draft-route-handler-factory.ts",
    // "storyblok-preview-url-transformer":
    //   "./src/types/storyblok-preview-url-transformer.ts",
  },
  format: ["esm", "cjs"],
  minify: false,
  platform: "neutral",
  sourcemap: true,
  splitting: false,
  target: "es2020",
  treeshake: true,
});
