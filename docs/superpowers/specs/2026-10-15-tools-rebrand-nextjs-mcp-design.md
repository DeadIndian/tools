# tools: rebrand + Next.js migration + MCP server

Date: 2026-10-15
Author: DeadIndian

## Goal

Turn the static `thisqr.works` QR site into **tools** (`https://tools.golla.in`): a Next.js web app for personal niche tools, open source, that also serves the same tools to agents over MCP.

Keep the existing philosophy: no login, no signup, no BS. Open tool, get result, leave.

## Current state

- Static HTML/CSS/JS, no build. Pages: `/`, `/qr/`, `/custom/`, `/decode/`, `/socials/{index,create,profile}.html`.
- Vendored libs: `qrcode.js` (Kazuhiko Arase, copied 3x) and `decode/jsqr.js`.
- `custom/script.js` `renderSvg(qr, config)` builds the styled QR as a pure SVG string.
- Social profile links: `profile.html#<base64url(JSON {v:1, uid, s:{wa,dc,fb,ig,yt}})>`.
- Branding `thisqr.works` and author "Bharath" (mailto + gollabharath.me) on every page.

## Decisions

| Topic | Decision |
|---|---|
| Name | `tools` |
| Domain | `https://tools.golla.in`, single `SITE_URL` constant |
| Author | DeadIndian, linking `https://github.com/DeadIndian` |
| Footer | "by DeadIndian" + link to source repo `https://github.com/DeadIndian/tools`. Ads line and Bharath email/site removed. |
| Framework | Next.js (App Router, TypeScript) |
| Hosting | Cloudflare Workers via `@opennextjs/cloudflare` |
| MCP | `/api/mcp` route using `mcp-handler`, stateless Streamable HTTP, no SSE/Redis |
| Styling | Plain CSS, one `app/globals.css`, no Tailwind |

## Architecture

One Next.js app. Tool logic lives in pure TypeScript modules under `lib/`. Client pages and the MCP route both import those modules, so the tool code exists in one place.

```text
app/
  layout.tsx            # html shell, header wordmark, footer, base metadata
  page.tsx              # homepage: tools grouped by category
  globals.css
  qr/page.tsx           # + client component
  custom/page.tsx
  decode/page.tsx
  socials/create/page.tsx
  socials/profile/page.tsx
  api/mcp/route.ts      # MCP server
  sitemap.ts
  robots.ts
lib/
  site.ts               # SITE_URL, name, tagline, tool registry (name, href, description, category)
  qr.ts                 # text -> matrix, matrix -> plain SVG
  custom-qr.ts          # typed CustomQrConfig, presets, renderSvg(text, config)
  decode.ts             # rgba -> text (jsQR); server: PNG/JPEG bytes -> rgba
  social.ts             # encode/decode payload, platform resolvers
test/
  lib.test.ts           # node:test
```

`lib/site.ts` holds the tool registry. The homepage, the sitemap and the per-page metadata all read from it, so adding a tool means one registry entry plus one page.

## Dependencies

- `qrcode-generator` (npm build of the vendored `qrcode.js`)
- `jsqr`
- `upng-js`, `jpeg-js`: pure-JS image decoding for server-side `qr_decode` (Workers has no sharp)
- `mcp-handler`, `@modelcontextprotocol/sdk`, `zod`
- `@opennextjs/cloudflare`, `wrangler` (dev)

The vendored `qrcode.js` and `jsqr.js` copies get deleted.

## UI

Keep the current look: mono wordmark, narrow column (~42rem), bordered cards, `<details>` FAQ. Changes:

- Wordmark `tools`, tagline "Small tools. No BS."
- Homepage lists tools grouped by category (`QR` for now).
- Each tool page has a small header linking `← tools`.
- One shared stylesheet replaces the 5 current CSS files. CSS variables cover light and dark (`prefers-color-scheme`).
- Each tool page keeps its current controls and behavior. Custom QR keeps every existing option, preset, randomize, badge upload (localStorage), and SVG/PNG export.
- Copy stays short and task-first. Drop the `thisqrworks` / `this qr works` SEO keyword stuffing.

## Routes

| Path | Notes |
|---|---|
| `/` | Home |
| `/qr` | Generator |
| `/custom` | Custom QR, still accepts `?data=` |
| `/decode` | Upload + camera |
| `/socials/create` | Social QR creator |
| `/socials/profile` | Reads `#payload` |

Redirects (in `next.config`): `/socials`, `/socials/index.html` go to `/socials/create`. `/socials/create.html` goes to `/socials/create`. `/socials/profile.html` goes to `/socials/profile`; the browser keeps the hash, so old profile links still work. The payload format stays at v1 unchanged.

## MCP server

Endpoint: `POST https://tools.golla.in/api/mcp`, stateless, no auth (the tools are free and public, same as the web app).

| Tool | Input | Output |
|---|---|---|
| `qr_generate` | `text`, `errorCorrection?` (L/M/Q/H, default M), `margin?`, `foreground?`, `background?` | SVG text |
| `qr_custom` | `text`, `config?` (partial `CustomQrConfig`), `preset?` | SVG text |
| `qr_decode` | `image` as a base64 string, data URI, or https URL (PNG or JPEG) | decoded text, or an error if no QR is found |
| `social_profile_link` | handles `{whatsapp?, discord?, facebook?, instagram?, youtube?}` | profile URL + QR SVG of that URL |

Limits and errors:

- `qr_decode` caps input at 5 MB and only fetches `https:` URLs. Unsupported formats, oversized input, and "no QR found" come back as MCP tool errors (`isError: true`) with a short message, never thrown 500s.
- Text over QR capacity returns a tool error.
- In `qr_custom` the badge image is a URL or data URI string, because there is no upload over MCP.

Not covered:

- PNG output over MCP. Add later with resvg-wasm if agents need it.
- Rate limiting. Add a Cloudflare rule if abuse shows up.

## SEO

- `metadata` per page: title, description, canonical, OG/Twitter, all using `SITE_URL`.
- JSON-LD stays as `WebSite` on the homepage and `WebApplication` on each tool.
- `sitemap.ts` and `robots.ts` are generated from the registry.
- `SEO-IMPLEMENTATION.md` and `CONTEXT-FOR-FUTURE.md` are deleted (thisqr.works-specific and stale).
- The README is rewritten: what tools is, the tool list, local dev, deploy to Cloudflare, and how to connect the MCP server (Claude Code `claude mcp add --transport http tools https://tools.golla.in/api/mcp`, plus a generic JSON config).

## Testing

- `test/lib.test.ts` (`node --test`, via `tsx`):
  - Round-trip: `qr.ts` matrix rasterized to RGBA, then `decode.ts`, equals the input text.
  - The same round-trip through `custom-qr.ts`'s default config matrix.
  - `social.ts` encode then decode equals the input, including unicode handles.
  - A fixture-built v1 payload decodes. This guards old printed QRs.
- MCP smoke: `curl` `tools/list` and `qr_generate` against `next dev` and against `wrangler dev` (`opennextjs-cloudflare preview`).
- Manual: each page in a browser, light and dark.

## Out of scope

- Redirecting `thisqr.works` to `tools.golla.in`. This is DNS/Cloudflare config, not repo work.
- New (non-QR) tools. The registry makes them easy to add afterwards.
