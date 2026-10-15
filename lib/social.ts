import { SITE } from "./site";

export type PlatformCode = "wa" | "dc" | "fb" | "ig" | "yt";

export type Platform = {
	code: PlatformCode;
	name: string;
	label: string;
	placeholder: string;
	helper: string;
	autoComplete: string;
	buildUrl: (id: string) => string;
	icon: string; // svg path data, 24x24 viewBox
};

// Form order matches the old create page.
export const PLATFORMS: Platform[] = [
	{
		code: "wa",
		name: "WhatsApp",
		label: "WhatsApp (phone number)",
		placeholder: "e.g. +919987654321",
		helper: "Include country code.",
		autoComplete: "tel",
		buildUrl: (id) => `https://wa.me/${encodeURIComponent(id)}`,
		icon: "M12 2a10 10 0 0 0-8.66 15.06L2 22l5.14-1.33A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.24-1.23l-.3-.19-3 .77.79-2.92-.2-.3A8 8 0 1 1 12 20Zm4.42-5.12c-.24-.12-1.42-.7-1.64-.78s-.38-.12-.54.12-.62.78-.76.94-.28.18-.52.06a6.56 6.56 0 0 1-1.93-1.19 7.2 7.2 0 0 1-1.33-1.65c-.14-.24 0-.37.1-.49s.24-.28.36-.43a1.62 1.62 0 0 0 .24-.41.45.45 0 0 0 0-.43c0-.12-.54-1.3-.74-1.79s-.4-.41-.54-.42h-.46a.9.9 0 0 0-.64.3 2.7 2.7 0 0 0-.84 2c0 1.18.86 2.34 1 2.5s1.7 2.6 4.12 3.65a14 14 0 0 0 1.38.51 3.32 3.32 0 0 0 1.54.1 2.53 2.53 0 0 0 1.65-1.16 2.06 2.06 0 0 0 .14-1.17c-.06-.1-.22-.16-.46-.28Z",
	},
	{
		code: "fb",
		name: "Facebook",
		label: "Facebook",
		placeholder: "e.g. johndoe",
		helper: "Username or profile slug.",
		autoComplete: "off",
		buildUrl: (id) => `https://facebook.com/${encodeURIComponent(id)}`,
		icon: "M13.4 20.91v-7h2.35l.35-2.72H13.4V9.35c0-.79.22-1.33 1.36-1.33h1.45V5.6a19.23 19.23 0 0 0-2.12-.1c-2.1 0-3.54 1.28-3.54 3.62v2h-2.38v2.72h2.38v7Z",
	},
	{
		code: "ig",
		name: "Instagram",
		label: "Instagram",
		placeholder: "e.g. @username",
		helper: "Your handle.",
		autoComplete: "off",
		buildUrl: (id) => `https://instagram.com/${encodeURIComponent(id)}`,
		icon: "M16.5 2h-9A5.51 5.51 0 0 0 2 7.5v9A5.51 5.51 0 0 0 7.5 22h9a5.51 5.51 0 0 0 5.5-5.5v-9A5.51 5.51 0 0 0 16.5 2Zm3.5 14.5A3.5 3.5 0 0 1 16.5 20h-9A3.5 3.5 0 0 1 4 16.5v-9A3.5 3.5 0 0 1 7.5 4h9A3.5 3.5 0 0 1 20 7.5Zm-8-7.5a5 5 0 1 0 5 5 5 5 0 0 0-5-5Zm0 8a3 3 0 1 1 3-3 3 3 0 0 1-3 3Zm5.75-8.88a1.25 1.25 0 1 0 1.25 1.25 1.25 1.25 0 0 0-1.25-1.25Z",
	},
	{
		code: "yt",
		name: "YouTube",
		label: "YouTube",
		placeholder: "e.g. @channel",
		helper: "Channel handle or ID.",
		autoComplete: "off",
		buildUrl: (id) => `https://youtube.com/${encodeURIComponent(id)}`,
		icon: "M21.58 6.2a2.51 2.51 0 0 0-1.76-1.76A53.4 53.4 0 0 0 12 4a53.4 53.4 0 0 0-7.82.44 2.51 2.51 0 0 0-1.76 1.76A26.23 26.23 0 0 0 2 12a26.23 26.23 0 0 0 .42 5.8 2.51 2.51 0 0 0 1.76 1.76A53.4 53.4 0 0 0 12 20a53.4 53.4 0 0 0 7.82-.44 2.51 2.51 0 0 0 1.76-1.76A26.23 26.23 0 0 0 22 12a26.23 26.23 0 0 0-.42-5.8ZM10 15.5V8.5L15.5 12Z",
	},
	{
		code: "dc",
		name: "Discord",
		label: "Discord",
		placeholder: "e.g. 123456789012345678",
		helper: "Use Discord user ID.",
		autoComplete: "off",
		buildUrl: (id) => `https://discord.com/users/${encodeURIComponent(id)}`,
		icon: "M19.36 4.21A16.62 16.62 0 0 0 15.37 3a11.94 11.94 0 0 0-.58 1.18 15.58 15.58 0 0 0-5.58 0A11.37 11.37 0 0 0 8.63 3a16.38 16.38 0 0 0-4 1.26c-2.53 3.63-3.21 7.18-2.87 10.67a17 17 0 0 0 5 2.53 12.46 12.46 0 0 0 1.08-1.73 10.37 10.37 0 0 1-1.71-.82l.41-.31a11.82 11.82 0 0 0 10.92 0l.41.31a10.24 10.24 0 0 1-1.72.83 11.88 11.88 0 0 0 1.09 1.72 16.85 16.85 0 0 0 5-2.53c.41-4.21-.7-7.72-2.67-10.64ZM8.83 13.29c-1 0-1.78-.93-1.78-2.07s.78-2.07 1.78-2.07 1.8.94 1.78 2.07-.78 2.07-1.78 2.07Zm6.35 0c-1 0-1.78-.93-1.78-2.07s.8-2.07 1.78-2.07 1.8.94 1.8 2.07-.81 2.07-1.8 2.07Z",
	},
];

export type SocialMap = Partial<Record<PlatformCode, string>>;

function toBase64Url(text: string): string {
	let binary = "";
	for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(payload: string): string {
	const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
	const binary = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
	return new TextDecoder().decode(Uint8Array.from(binary, (ch) => ch.charCodeAt(0)));
}

function randomUid(): string {
	return crypto.randomUUID().replace(/-/g, "");
}

// Format v1 is frozen: printed QRs from thisqr.works depend on it.
export function encodePayload(map: SocialMap, uid = randomUid()): string {
	return toBase64Url(JSON.stringify({ v: 1, uid, s: map }));
}

/** Throws Error("empty-hash" | "invalid-structure" | "missing-s") or a parse error. */
export function decodePayload(hash: string): SocialMap {
	const encoded = hash.startsWith("#") ? hash.slice(1) : hash;
	if (!encoded) throw new Error("empty-hash");
	const parsed = JSON.parse(fromBase64Url(encoded));
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid-structure");
	if (!parsed.s || typeof parsed.s !== "object" || Array.isArray(parsed.s)) throw new Error("missing-s");
	return parsed.s as SocialMap;
}

/** Keeps known platforms with non-empty string ids, trimmed. */
export function cleanMap(input: Record<string, unknown>): SocialMap {
	const out: SocialMap = {};
	for (const { code } of PLATFORMS) {
		const value = input[code];
		if (typeof value === "string" && value.trim()) out[code] = value.trim();
	}
	return out;
}

export function profileUrl(map: SocialMap, base = SITE.url): string {
	return `${base}/socials/profile#${encodePayload(map)}`;
}
