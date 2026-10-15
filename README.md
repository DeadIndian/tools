# tools

Small tools. No BS. **[tools.golla.in](https://tools.golla.in)**

Niche web tools I use day to day, open source so anyone can use them. No login, no signup, no tracking. Every tool also works as an [MCP](https://modelcontextprotocol.io) tool, so agents can call it.

## Tools

| Tool | Web | MCP tool |
|---|---|---|
| QR Generator | [`/qr`](https://tools.golla.in/qr) | `qr_generate` |
| Custom QR (shapes, gradients, frame, logo, caption) | [`/custom`](https://tools.golla.in/custom) | `qr_custom` |
| QR Decoder (upload, paste, camera) | [`/decode`](https://tools.golla.in/decode) | `qr_decode` |
| Social Links QR | [`/socials/create`](https://tools.golla.in/socials/create) | `social_profile_link` |
| Bold, italic, strikethrough & more text editor (Unicode, for LinkedIn/X/etc., with X character count) | [`/text`](https://tools.golla.in/text) | `text_style`, `text_unstyle` |

The web tools run entirely in your browser. The MCP endpoint processes each request and stores nothing.

## Use with agents

Endpoint: `https://tools.golla.in/api/mcp` (Streamable HTTP, stateless, no auth).

Claude Code:

```bash
claude mcp add --transport http tools https://tools.golla.in/api/mcp
```

Other clients:

```json
{ "mcpServers": { "tools": { "url": "https://tools.golla.in/api/mcp" } } }
```

For stdio-only clients, use `npx -y mcp-remote https://tools.golla.in/api/mcp`.

The QR tools return SVG markup as text; the text tools return paste-ready Unicode text. `qr_decode` takes base64 data, a `data:` URI, or an `https://` URL for a PNG or JPEG (max 5 MB).

## Develop

```bash
npm install
npm run dev      # http://localhost:3000, MCP at /api/mcp
npm test         # lib tests (node:test)
npm run preview  # build and run on the local Cloudflare Workers runtime
```

## Deploy

Hosted on Cloudflare Workers through [OpenNext](https://opennext.js.org/cloudflare). The custom domain is set in `wrangler.jsonc`.

Pushes to `main` deploy automatically through Workers Builds (connected in the Cloudflare dashboard; build command `npx opennextjs-cloudflare build`, deploy command `npx opennextjs-cloudflare deploy`). To deploy by hand:

```bash
npx wrangler login
npm run deploy
```

## Add a tool

1. Put the logic in `lib/<tool>.ts` as pure TypeScript with no DOM, so the web UI and MCP share it.
2. Add the page at `app/<tool>/page.tsx` and a client component next to it.
3. Add an entry to `TOOLS` in `lib/site.ts`. The homepage, sitemap and metadata read from it.
4. Register an MCP tool in `app/api/mcp/route.ts`.
5. Add a check to `test/lib.test.ts`.

## Layout

```text
app/            pages, styles (globals.css), MCP route (api/mcp)
lib/            tool logic shared by web + MCP
test/           node:test checks
```

## License

[GNU GPL v3](LICENSE)

---

by [DeadIndian](https://github.com/DeadIndian)
