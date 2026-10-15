import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { SITE } from "@/lib/site";
import { ECC_LEVELS, plainSvg, QrTooLongError } from "@/lib/qr";
import {
	BADGE_SHAPES,
	EYE_STYLES,
	FRAME_STYLES,
	MODULE_STYLES,
	PRESETS,
	RANGES,
	renderCustomSvg,
	type PresetName,
} from "@/lib/custom-qr";
import { decodeImageBytes, UnsupportedImageError } from "@/lib/decode";
import { cleanMap, profileUrl } from "@/lib/social";
import { STYLE_NAMES, styleMarkup, styleText, unstyleText, type StyleName } from "@/lib/text-style";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use #rrggbb");
const range = (k: keyof typeof RANGES) => z.number().min(RANGES[k][0]).max(RANGES[k][1]).optional();
const text = z.string().min(1).max(4000).describe("Text or URL to encode");

type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

const ok = (...parts: string[]): ToolResult => ({ content: parts.map((t) => ({ type: "text", text: t })) });
const fail = (message: string): ToolResult => ({ content: [{ type: "text", text: message }], isError: true });

class UserError extends Error {}

// Tool errors go back to the agent as isError results, never as HTTP 500s.
function safe<A>(fn: (args: A) => Promise<ToolResult> | ToolResult) {
	return async (args: A): Promise<ToolResult> => {
		try {
			return await fn(args);
		} catch (err) {
			if (err instanceof QrTooLongError || err instanceof UnsupportedImageError || err instanceof UserError) {
				return fail(err.message);
			}
			console.error(err);
			return fail("Something went wrong processing this request.");
		}
	};
}

async function readCapped(res: Response): Promise<Uint8Array> {
	if (Number(res.headers.get("content-length") ?? 0) > MAX_IMAGE_BYTES) throw new UserError("Image is larger than 5 MB.");
	const reader = res.body?.getReader();
	if (!reader) throw new UserError("Empty response.");
	const chunks: Uint8Array[] = [];
	let size = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		size += value.byteLength;
		if (size > MAX_IMAGE_BYTES) {
			await reader.cancel();
			throw new UserError("Image is larger than 5 MB.");
		}
		chunks.push(value);
	}
	const out = new Uint8Array(size);
	let offset = 0;
	for (const c of chunks) {
		out.set(c, offset);
		offset += c.byteLength;
	}
	return out;
}

async function loadImage(input: string): Promise<Uint8Array> {
	const value = input.trim();
	if (/^https?:\/\//i.test(value)) {
		// Manual redirects so every hop stays https. On Cloudflare, global_fetch_strictly_public
		// (wrangler.jsonc) also blocks private/internal targets; self-hosted Node has no such guard.
		let url = new URL(value);
		for (let hop = 0; hop < 4; hop++) {
			if (url.protocol !== "https:") throw new UserError("Only https:// image URLs are allowed.");
			const res = await fetch(url, { signal: AbortSignal.timeout(10_000), redirect: "manual" });
			const location = res.headers.get("location");
			if (res.status >= 300 && res.status < 400 && location) {
				url = new URL(location, url);
				continue;
			}
			if (!res.ok) throw new UserError(`Could not fetch image (HTTP ${res.status}).`);
			return readCapped(res);
		}
		throw new UserError("Too many redirects.");
	}
	const base64 = value.startsWith("data:") ? value.slice(value.indexOf(",") + 1) : value;
	if (base64.length > Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 4) throw new UserError("Image is larger than 5 MB.");
	try {
		return Uint8Array.from(atob(base64.replace(/\s/g, "")), (c) => c.charCodeAt(0));
	} catch {
		throw new UserError("Image must be base64, a data: URI, or an https:// URL.");
	}
}

const customConfig = z
	.object({
		errorLevel: z.enum(ECC_LEVELS).optional(),
		invertModules: z.boolean().optional(),
		cellSize: range("cellSize"),
		quietZone: range("quietZone"),
		moduleScale: range("moduleScale"),
		moduleRoundness: range("moduleRoundness"),
		moduleStyle: z.enum(MODULE_STYLES).optional(),
		fg: hex.optional(),
		bg: hex.optional(),
		transparentBg: z.boolean().optional(),
		useGradient: z.boolean().optional(),
		gradientEyes: z.boolean().optional(),
		gradStart: hex.optional(),
		gradEnd: hex.optional(),
		gradientType: z.enum(["linear", "radial"]).optional(),
		gradientAngle: range("gradientAngle"),
		eyeOuterStyle: z.enum(EYE_STYLES).optional(),
		eyeInnerStyle: z.enum(EYE_STYLES).optional(),
		eyeOuterColor: hex.optional(),
		eyeInnerColor: hex.optional(),
		frameStyle: z.enum(FRAME_STYLES).optional(),
		framePadding: range("framePadding"),
		frameRadius: range("frameRadius"),
		frameColor: hex.optional(),
		badgeImage: z.string().max(1_000_000).optional().describe("Center logo: https:// URL or data:image/...;base64 URI"),
		badgeShape: z.enum(BADGE_SHAPES).optional(),
		badgeSize: range("badgeSize").describe("Badge size as % of the code"),
		badgeBg: hex.optional(),
		badgeImageFit: z.enum(["cover", "contain"]).optional(),
		badgeKnockout: z.boolean().optional().describe("Clear modules behind the badge (default true)"),
		showCaption: z.boolean().optional(),
		captionText: z.string().max(80).optional(),
		captionSize: range("captionSize"),
		captionColor: hex.optional(),
		useShadow: z.boolean().optional(),
		shadowBlur: range("shadowBlur"),
		shadowOffset: range("shadowOffset"),
		shadowColor: hex.optional(),
	})
	.optional()
	.describe("Style overrides. Applied on top of the preset, if any.");

const handler = createMcpHandler(
	(server) => {
		server.registerTool(
			"qr_generate",
			{
				title: "Generate QR code",
				description: "Encode text or a URL as a plain QR code. Returns SVG markup.",
				inputSchema: z.object({
					text,
					errorCorrection: z.enum(ECC_LEVELS).default("M").describe("L 7%, M 15%, Q 25%, H 30% recovery"),
					margin: z.number().int().min(0).max(20).default(2).describe("Quiet zone in modules"),
					cellSize: z.number().int().min(1).max(40).default(8).describe("Pixels per module"),
					foreground: hex.default("#000000"),
					background: hex.default("#ffffff"),
				}),
			},
			safe(({ text, errorCorrection, margin, cellSize, foreground, background }) =>
				ok(plainSvg(text, { ecc: errorCorrection, margin, cellSize, fg: foreground, bg: background })),
			),
		);

		server.registerTool(
			"qr_custom",
			{
				title: "Generate styled QR code",
				description:
					"Encode text or a URL as a styled QR code: module shapes, colors, gradients, eye styles, frame, center logo, caption, shadow. Returns SVG markup. Start from a preset and override fields in config.",
				inputSchema: z.object({
					text,
					preset: z.enum(Object.keys(PRESETS) as [PresetName, ...PresetName[]]).optional(),
					config: customConfig,
				}),
			},
			safe(({ text, preset, config }) => ok(renderCustomSvg(text, { ...(preset ? PRESETS[preset] : {}), ...config }))),
		);

		server.registerTool(
			"qr_decode",
			{
				title: "Decode QR code",
				description: "Read the content of a QR code in a PNG or JPEG image (max 5 MB). Returns the decoded text.",
				inputSchema: z.object({
					image: z.string().min(1).describe("Base64 image data, a data: URI, or an https:// URL"),
				}),
			},
			safe(async ({ image }) => {
				const result = decodeImageBytes(await loadImage(image));
				return result === null ? fail("No QR code found in the image.") : ok(result);
			}),
		);

		server.registerTool(
			"social_profile_link",
			{
				title: "Social links profile + QR",
				description: `Build one shareable ${SITE.url} profile link listing someone's social handles, plus a QR code (SVG) for it. Data lives in the link; nothing is stored.`,
				inputSchema: z.object({
					whatsapp: z.string().max(100).optional().describe("Phone number with country code, e.g. +919987654321"),
					instagram: z.string().max(100).optional().describe("Handle, e.g. @username"),
					youtube: z.string().max(100).optional().describe("Channel handle or ID, e.g. @channel"),
					facebook: z.string().max(100).optional().describe("Username or profile slug"),
					discord: z.string().max(100).optional().describe("Discord user ID"),
				}),
			},
			safe(({ whatsapp, instagram, youtube, facebook, discord }) => {
				const map = cleanMap({ wa: whatsapp, ig: instagram, yt: youtube, fb: facebook, dc: discord });
				if (Object.keys(map).length === 0) throw new UserError("Provide at least one handle.");
				const url = profileUrl(map);
				return ok(url, plainSvg(url));
			}),
		);
		server.registerTool(
			"text_style",
			{
				title: "Bold/italic Unicode text",
				description:
					"Make bold, italic, monospace (and more) text for plain-text fields that have no formatting: LinkedIn, X, Instagram, YouTube titles, chat bios. Swaps a-z, A-Z, 0-9 for look-alike Unicode characters; returns paste-ready text. Mark spans with **bold**, *italic*, ***bold italic***, `monospace` (everything else stays plain), or set `style` to convert the whole text. URLs, #hashtags and @mentions are never styled. Use sparingly (headings, key words): screen readers and search handle styled letters poorly. Do not use for Markdown/HTML destinations.",
				inputSchema: z.object({
					text: z.string().min(1).max(10_000),
					style: z
						.enum(STYLE_NAMES as [StyleName, ...StyleName[]])
						.optional()
						.describe("Convert the whole text to this style. Omit to use **marks** instead."),
				}),
			},
			safe(({ text, style }) => ok(style ? styleText(text, style) : styleMarkup(text))),
		);

		server.registerTool(
			"text_unstyle",
			{
				title: "Unicode styled text to plain",
				description: "Turn Unicode bold/italic/monospace/script/double-struck letters back into normal text.",
				inputSchema: z.object({ text: z.string().min(1).max(10_000) }),
			},
			safe(({ text }) => ok(unstyleText(text))),
		);
	},
	{
		serverInfo: { name: SITE.name, version: "1.0.0" },
		instructions: `${SITE.name} (${SITE.url}): small free utilities. QR tools return SVG markup as text; save it to a .svg file or embed it. Text tools return paste-ready Unicode text.`,
	},
);

export { handler as GET, handler as POST, handler as DELETE };
