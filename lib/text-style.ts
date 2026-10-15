// Unicode "fake formatting": swaps a-z, A-Z, 0-9 for look-alike characters from the
// Mathematical Alphanumeric Symbols block, so bold/italic survive plain-text fields.

type StyleDef = {
	label: string;
	upper: number; // code point of styled "A"
	lower: number; // code point of styled "a"
	digits?: number; // code point of styled "0", if the style has digits
	holes?: Record<string, number>; // letters Unicode encoded earlier, outside the block
};

export const STYLES = {
	bold: { label: "Bold", upper: 0x1d5d4, lower: 0x1d5ee, digits: 0x1d7ec },
	italic: { label: "Italic", upper: 0x1d608, lower: 0x1d622 },
	boldItalic: { label: "Bold italic", upper: 0x1d63c, lower: 0x1d656 },
	boldSerif: { label: "Bold serif", upper: 0x1d400, lower: 0x1d41a, digits: 0x1d7ce },
	italicSerif: { label: "Italic serif", upper: 0x1d434, lower: 0x1d44e, holes: { h: 0x210e } },
	boldItalicSerif: { label: "Bold italic serif", upper: 0x1d468, lower: 0x1d482 },
	monospace: { label: "Monospace", upper: 0x1d670, lower: 0x1d68a, digits: 0x1d7f6 },
	script: {
		label: "Script",
		upper: 0x1d49c,
		lower: 0x1d4b6,
		holes: {
			B: 0x212c, E: 0x2130, F: 0x2131, H: 0x210b, I: 0x2110, L: 0x2112, M: 0x2133, R: 0x211b,
			e: 0x212f, g: 0x210a, o: 0x2134,
		},
	},
	doubleStruck: {
		label: "Double-struck",
		upper: 0x1d538,
		lower: 0x1d552,
		digits: 0x1d7d8,
		holes: { C: 0x2102, H: 0x210d, N: 0x2115, P: 0x2119, Q: 0x211a, R: 0x211d, Z: 0x2124 },
	},
} satisfies Record<string, StyleDef>;

export type StyleName = keyof typeof STYLES;
export const STYLE_NAMES = Object.keys(STYLES) as StyleName[];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function buildMap(def: StyleDef): Map<string, string> {
	const map = new Map<string, string>();
	const holes: Record<string, number> = def.holes ?? {};
	for (let i = 0; i < 26; i++) {
		const up = ALPHABET[i];
		const low = up.toLowerCase();
		map.set(up, String.fromCodePoint(holes[up] ?? def.upper + i));
		map.set(low, String.fromCodePoint(holes[low] ?? def.lower + i));
	}
	if (def.digits) for (let i = 0; i < 10; i++) map.set(String(i), String.fromCodePoint(def.digits + i));
	return map;
}

const MAPS = Object.fromEntries(STYLE_NAMES.map((n) => [n, buildMap(STYLES[n])])) as Record<StyleName, Map<string, string>>;

const REVERSE = new Map<string, string>();
for (const name of STYLE_NAMES) for (const [plain, styled] of MAPS[name]) REVERSE.set(styled, plain);

// Left plain: styled #tags and @handles stop matching on most sites, styled URLs stop working.
const KEEP_PLAIN = /(https?:\/\/\S+|www\.\S+|[#@][\p{L}\p{N}_]+)/u;

function styleRun(text: string, map: Map<string, string>): string {
	let out = "";
	for (const ch of text) {
		const hit = map.get(ch);
		if (hit) {
			out += hit;
			continue;
		}
		// Accented letter: style the base letter, keep the combining accent (é -> 𝗲 + ◌́).
		const parts = ch.normalize("NFD");
		const base = map.get(parts[0]);
		out += base && parts.length > 1 ? base + parts.slice(1) : ch;
	}
	return out;
}

/** Styles every letter/digit in `text`, except URLs, #hashtags and @mentions. */
export function styleText(text: string, style: StyleName): string {
	const map = MAPS[style];
	return text
		.split(KEEP_PLAIN)
		.map((part, i) => (i % 2 === 1 ? part : styleRun(part, map)))
		.join("");
}

// ***x*** bold italic, **x** bold, *x* italic, `x` monospace. Markers must hug the text
// (like Markdown), so "5 * 3 * 2" is left alone.
const MARKUP = /\*\*\*(?=\S)([\s\S]+?)(?<=\S)\*\*\*|\*\*(?=\S)([\s\S]+?)(?<=\S)\*\*|\*(?=\S)([^*]+?)(?<=\S)\*|`([^`]+)`/g;

/** Converts Markdown-ish emphasis marks to styled characters; text outside marks stays plain. */
export function styleMarkup(text: string): string {
	return text.replace(MARKUP, (_, bi, b, i, mono) => {
		if (bi !== undefined) return styleText(bi, "boldItalic");
		if (b !== undefined) return styleText(b, "bold");
		if (i !== undefined) return styleText(i, "italic");
		return styleText(mono, "monospace");
	});
}

/** Back to plain ASCII letters/digits; recomposes accents split by styleText. */
export function unstyleText(text: string): string {
	let out = "";
	for (const ch of text) out += REVERSE.get(ch) ?? ch;
	return out.normalize("NFC");
}

/** Removes emphasis marks, keeping their content. */
export function stripMarkup(text: string): string {
	return text.replace(MARKUP, (_, bi, b, i, mono) => bi ?? b ?? i ?? mono);
}
