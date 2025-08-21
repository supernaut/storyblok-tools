import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/*.config.{js,mjs}",
        "src/**/index.ts",
        "src/types/",
        "vitest.config.ts",
        "tsup.config.ts",
      ],
      provider: "v8",
      reporter: ["text", "text-summary", "json", "html", "lcov"],
      reportsDirectory: "coverage",
      thresholds: {
        branches: 85,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
    environment: "node",
    exclude: ["node_modules", "dist"],
    globals: true,
    include: ["src/**/*.{test,spec}.{js,ts}"],
  },
});
