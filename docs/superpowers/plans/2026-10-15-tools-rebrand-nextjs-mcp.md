# tools: rebrand + Next.js + MCP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the static thisqr.works QR site to a Next.js app branded `tools` at tools.golla.in, with an MCP endpoint that serves the same tools.

**Architecture:** Pure TS tool logic in `lib/` is imported by the client components under `app/` and by `app/api/mcp/route.ts` (`mcp-handler`). The app deploys to Cloudflare Workers with `@opennextjs/cloudflare`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, plain CSS, `qrcode-generator`, `jsqr`, `upng-js`, `jpeg-js`, `mcp-handler@2` + `@modelcontextprotocol/server@2` + `zod@4`, `@opennextjs/cloudflare`, `wrangler`, `tsx` + `node:test`.

Spec: `docs/superpowers/specs/2026-10-15-tools-rebrand-nextjs-mcp-design.md`

## Global Constraints

- Site name `tools`, URL `https://tools.golla.in`, tagline "Small tools. No BS."
- Author DeadIndian, linking `https://github.com/DeadIndian`. Repo: `https://github.com/DeadIndian/tools`.
- No ads line, no Bharath name/email/site, no `thisqrworks` keyword stuffing.
- Default download filenames use the `tools-` prefix instead of `thisqrworks-`.
- Social payload format stays `#base64url(JSON {v:1, uid, s:{wa,dc,fb,ig,yt}})`.
- Every user-supplied value interpolated into SVG gets validated (hex colors) or XML-escaped (text, image href).
- MCP spec version: `mcp-handler@2` requires `@modelcontextprotocol/server@^2` (not `@modelcontextprotocol/sdk`). Inputs are `z.object(...)`.

---

### Task 1: Scaffold

**Files:** create `package.json`, `tsconfig.json`, `next.config.ts`, `open-next.config.ts`, `wrangler.jsonc`, `.gitignore`, `next-env.d.ts` (generated); move favicons to `public/`.

- [ ] Install deps: `next react react-dom qrcode-generator jsqr upng-js jpeg-js mcp-handler @modelcontextprotocol/server zod`; dev: `typescript @types/react @types/react-dom @types/node @opennextjs/cloudflare wrangler tsx`.
- [ ] Scripts: `dev`, `build`, `start`, `test` (`tsx --test test/*.test.ts`), `preview` (`opennextjs-cloudflare build && opennextjs-cloudflare preview`), `deploy`.
- [ ] `next.config.ts`: redirects `/socials`, `/socials/index.html`, `/socials/create.html` → `/socials/create`; `/socials/profile.html` → `/socials/profile`; `/:tool(qr|custom|decode)/index.html` → `/:tool`. Call `initOpenNextCloudflareForDev()`.
- [ ] `wrangler.jsonc`: `main: .open-next/worker.js`, `compatibility_flags: ["nodejs_compat"]`, assets binding.
- [ ] Commit.

### Task 2: Shared lib + tests

**Files:** `lib/site.ts`, `lib/qr.ts`, `lib/custom-qr.ts`, `lib/decode.ts`, `lib/social.ts`, `lib/types.d.ts`, `test/lib.test.ts`.

**Interfaces (produced):**
- `site.ts`: `SITE = {name, url, tagline, author, authorUrl, repoUrl}`, `TOOLS: {slug, href, name, description, category}[]`.
- `qr.ts`: `type Ecc = "L"|"M"|"Q"|"H"`; `makeQr(text, ecc?) → {count, isDark(r,c)}` (throws `QrTooLongError`); `plainSvg(text, {ecc?, cellSize?, margin?, fg?, bg?}) → string`; `isHex(s)`; `escapeXml(s)`.
- `custom-qr.ts`: `CustomQrConfig` (all style fields from old `getConfig()` minus text/liveUpdate/pngSize/fileName; `badgeImage` string replaces `badgeImageDataUrl`), `DEFAULT_CONFIG`, `PRESETS`, `randomConfig()`, `renderCustomSvg(text, config) → string`.
- `decode.ts`: `decodeRgba(data, w, h) → string|null` (normal, then inverted); `decodeImageBytes(bytes: Uint8Array) → string|null` (PNG via upng-js, JPEG via jpeg-js, throws `UnsupportedImageError`).
- `social.ts`: `PLATFORMS: {code, name, field, placeholder, helper, buildUrl, icon}[]`; `encodePayload(map, uid?) → string`; `decodePayload(hash) → Record<code,string>` (throws `Error` with codes `empty-hash|invalid-structure|missing-s`); `profileUrl(map) → string`.

- [ ] Write tests first: round-trip `makeQr` → rasterize → `decodeRgba`; round-trip PNG bytes (encode with `UPNG.encode`) → `decodeImageBytes`; `renderCustomSvg` escapes caption `<script>` and rejects non-hex colors; social encode/decode with unicode; v1 fixture decodes.
- [ ] Run `npm test` → fails. Implement. Run → passes. Commit.

### Task 3: Layout, styles, home, SEO

**Files:** `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `app/sitemap.ts`, `app/robots.ts`, `app/components/ToolHeader.tsx`.

- [ ] One `globals.css` that merges main.css plus the tool CSS, with CSS variables for light and dark.
- [ ] The layout renders the footer "by DeadIndian · source"; `metadataBase` = SITE.url.
- [ ] The homepage lists `TOOLS` grouped by category and keeps the principles tags and the FAQ `<details>`. WebSite JSON-LD.
- [ ] `next build` passes. Commit.

### Task 4: Tool pages

**Files:** `app/qr/{page,QrTool}.tsx`, `app/decode/{page,DecodeTool}.tsx`, `app/socials/create/{page,CreateTool}.tsx`, `app/socials/profile/{page,ProfileView}.tsx`, `app/custom/{page,CustomTool}.tsx`, `app/lib-client.ts` (download/copy helpers).

- [ ] Each `page.tsx` is a server component that exports `metadata` and renders its client tool. Behavior matches the old scripts: Enter-to-generate, SVG copy/download, Customize link `?data=`, decode via upload/drop/paste/camera with an inversion retry, profile list from the hash with `hashchange`, and custom QR with every control, preset, randomize, badge upload persisted to localStorage, and PNG export.
- [ ] Commit after each page compiles.

### Task 5: MCP route

**Files:** `app/api/mcp/route.ts`.

- [ ] Tools `qr_generate`, `qr_custom`, `qr_decode`, `social_profile_link` per the spec. `qr_decode` fetches only `https:` URLs, caps input at 5 MB, and returns `isError` on failure.
- [ ] Smoke: `curl` `tools/list` + `tools/call qr_generate` against `next dev`. Commit.

### Task 6: Cleanup, README, verify

- [ ] Delete the old static files and stale docs (`SEO-IMPLEMENTATION.md`, `CONTEXT-FOR-FUTURE.md`, `robots.txt`, `sitemap.xml`, `customize-link-helper.js`, the tool folders, `index.html`, `main.css`).
- [ ] Rewrite the README.
- [ ] `npm test`, `next build`, `npm run preview` with a curl smoke on the worker. Commit.
