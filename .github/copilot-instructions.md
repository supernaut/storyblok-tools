# AI Coding Agent Instructions

Concise, project-specific guidance for working in this repo. Keep answers short, concrete, and adapt to these conventions.

## Project Purpose

Small TypeScript utility library published as `@supernaut/storyblok-tools` providing helpers for integrating Storyblok preview/editor features (currently: request validation for Storyblok visual editor iframe).

## Tech Stack & Build

- Language: TypeScript (strict) targeting ES2020; ESM + CJS outputs built via `tsup`.
- Entry points declared explicitly in `tsup.config.ts`; update both `src/index.ts` (re-exports) AND `tsup.config.ts` (entry map) AND `package.json.exports` when adding a new public module.
- No runtime framework dependencies beyond the Web Crypto API (Node >=18 provides `crypto.subtle`). Peer deps (`next`, `react`, `react-dom`) are declared for host apps but not used directly (forward compatibility).

## Key Commands

- Build: `pnpm build` (tsup) – cleans & emits `dist` with d.ts + sourcemaps.
- Tests: `pnpm test` (vitest). Coverage: `pnpm test:coverage` (thresholds: branches 85 / funcs 90 / lines 90 / statements 90).
- Lint: `pnpm lint` (ESLint w/ perfectionist, sonarjs, unused-imports). Auto-fix staged on pre-commit.
- Type check (no emit): `pnpm type-check`.
- Release (manual): bump version in `package.json`, generate changelog (step placeholder "conventional-changelog"), commit + tag + push. (No automated release script yet.)

## Testing Patterns

- Vitest with globals; spec files live beside source (`*.spec.ts`).
- For functions that call helpers, mock dependencies BEFORE importing the SUT (see `is-storyblok-request.spec.ts` mocking `./sha1`). Maintain this pattern for new modules needing isolation.
- Exhaustive negative-path tests favored (individual guard clauses). Follow style: one assertion per behavioral branch returning `false`.

## Function Design Conventions

- Use explicit guard clauses for parameter validation; prefer early `return false` for validation utilities instead of throwing (see `isStoryblokRequest`).
- Preserve environment-variable requirements exactly (e.g., even if a preview token is passed as an argument, `process.env.STORYBLOK_PREVIEW_TOKEN` must exist). Document any seemingly redundant checks in JSDoc.
- Async crypto/hash helpers return lowercase hex strings (40 chars for SHA-1). Maintain streaming/Uint8Array to hex pattern if adding hashes.

## Adding a New Public Utility

1. Implement in `src/lib/<name>.ts` with strict typing & JSDoc.
2. Create `src/lib/<name>.spec.ts` covering:
   - Happy path
   - Each early-return / guard
   - Edge boundaries (time window, empty values, mismatched hashes, etc.).
3. Export from `src/index.ts`.
4. Add entry in `tsup.config.ts` `entry` map if standalone path import desired.
5. Add corresponding conditional export block in `package.json.exports` (both `import` & `require`).
6. Run lint, type-check, tests, build.

## Style & Lint Nuances

- Type aliases over interfaces (`@typescript-eslint/consistent-type-definitions`).
- Unused imports auto-removed (`unused-imports` plugin). Avoid leaving commented-out imports.
- Natural sorting preference (`perfectionist` plugin) – keep object keys sorted naturally when modifying existing objects.

## Error & Logging Approach

- Validation utilities swallow errors & return `false`, while logging a structured object via `console.error({ error, method, ...context })`. Keep this shape for consistency & future parsing.

## Coverage Strategy

- Guard branches exist partly to raise branch coverage; when modifying logic, adjust or add tests to maintain thresholds.
- New early-return branches MUST have corresponding spec cases.

## Environment & Crypto

- Node >=18 required; relies on global `crypto.subtle`. If adding code needing Web APIs, either stay within APIs available in Node 18+ or add lightweight polyfills guarded behind feature detection.

## Commit & Hooks

- Conventional commits enforced via commitlint + czg. For automated commits, use a valid type (`feat`, `fix`, `docs`, etc.). No need for emojis (disabled by config).
- Pre-commit runs prettier + eslint (auto-fix) on staged files; pre-push runs full test suite. Ensure tests pass locally before pushing heavy changes.

## Publishing Safety Checklist (Manual)

- All tests & coverage thresholds pass.
- `dist` rebuilt fresh (`pnpm build`).
- Version bumped; `CHANGELOG.md` updated (tool not yet scripted here).
- Tag matches version (e.g., `v1.0.1`).

## Not Yet Implemented (Avoid Assuming)

- No automated changelog script or release GitHub Action present.
- Commented-out tsup entries indicate potential future utilities; don’t resurrect without confirming design.

## When Unsure

Prefer inspecting existing pattern in `is-storyblok-request` & its spec; mirror structure & verbosity level. Keep public API minimal & explicit.

---

Provide clarifying questions only if a requirement cannot be met from repository context.
