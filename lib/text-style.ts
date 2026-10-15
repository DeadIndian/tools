// Unicode "fake formatting": swaps a-z, A-Z, 0-9 for look-alike characters (mostly from the
// Mathematical Alphanumeric Symbols block), so bold/italic/etc survive plain-text fields.

type RangeDef = {
	label: string;
	upper: number; // code point of styled "A"
	lower: number; // code point of styled "a"
	digits?: number; // code point of styled "0", if the style has digits
	holes?: Record<string, number>; // letters Unicode encoded earlier, outside the block
};

// Styles that aren't one contiguous range: explicit 26/26/10-char tables, in A-Z / a-z / 0-9
// order. A plain character in a table means "Unicode has no styled version", left as-is.
type TableDef = { label: string; table: [upper: string, lower: string, digits: string] };

type StyleDef = RangeDef | TableDef;

const PLAIN_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const PLAIN_LOWER = "abcdefghijklmnopqrstuvwxyz";
const PLAIN_DIGITS = "0123456789";

export const STYLES = {
	bold: { label: "Bold", upper: 0x1d5d4, lower: 0x1d5ee, digits: 0x1d7ec },
	italic: { label: "Italic", upper: 0x1d608, lower: 0x1d622 },
	boldItalic: { label: "Bold italic", upper: 0x1d63c, lower: 0x1d656 },
	monospace: { label: "Monospace", upper: 0x1d670, lower: 0x1d68a, digits: 0x1d7f6 },
	boldSerif: { label: "Bold serif", upper: 0x1d400, lower: 0x1d41a, digits: 0x1d7ce },
	italicSerif: { label: "Italic serif", upper: 0x1d434, lower: 0x1d44e, holes: { h: 0x210e } },
	boldItalicSerif: { label: "Bold italic serif", upper: 0x1d468, lower: 0x1d482 },
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
	fullwidth: { label: "Fullwidth", upper: 0xff21, lower: 0xff41, digits: 0xff10 },
	circled: {
		label: "Circled",
		table: [
			"ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ",
			"ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ",
			"⓪①②③④⑤⑥⑦⑧⑨",
		],
	},
	// Capitals stay capitals (true small-caps look). No small-cap q or x exists.
	smallCaps: { label: "Small caps", table: [PLAIN_UPPER, "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘqʀꜱᴛᴜᴠᴡxʏᴢ", PLAIN_DIGITS] },
	// Unicode has no superscript C F Q S X Y Z q.
	superscript: { label: "Superscript", table: ["ᴬᴮCᴰᴱFᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾQᴿSᵀᵁⱽᵂXYZ", "ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖqʳˢᵗᵘᵛʷˣʸᶻ", "⁰¹²³⁴⁵⁶⁷⁸⁹"] },
} satisfies Record<string, StyleDef>;

export type StyleName = keyof typeof STYLES;
export const STYLE_NAMES = Object.keys(STYLES) as StyleName[];

/** Combining marks drawn through/under each character. They stack on top of any style. */
export const DECORATIONS = {
	strikethrough: { label: "Strikethrough", mark: "̶" },
	underline: { label: "Underline", mark: "̲" },
};

export type DecorationName = keyof typeof DECORATIONS;
export const DECORATION_NAMES = Object.keys(DECORATIONS) as DecorationName[];

export type AnyStyle = StyleName | DecorationName;
export const ALL_STYLE_NAMES = [...STYLE_NAMES, ...DECORATION_NAMES] as [AnyStyle, ...AnyStyle[]];

function buildMap(def: StyleDef): Map<string, string> {
	const map = new Map<string, string>();
	const add = (plain: string, styled: string) => styled !== plain && map.set(plain, styled);
	if ("table" in def) {
		const plains = [PLAIN_UPPER, PLAIN_LOWER, PLAIN_DIGITS];
		def.table.forEach((row, r) => [...row].forEach((styled, i) => add(plains[r][i], styled)));
		return map;
	}
	const holes: Record<string, number> = def.holes ?? {};
	for (let i = 0; i < 26; i++) {
		add(PLAIN_UPPER[i], String.fromCodePoint(holes[PLAIN_UPPER[i]] ?? def.upper + i));
		add(PLAIN_LOWER[i], String.fromCodePoint(holes[PLAIN_LOWER[i]] ?? def.lower + i));
	}
	if (def.digits) for (let i = 0; i < 10; i++) add(PLAIN_DIGITS[i], String.fromCodePoint(def.digits + i));
	return map;
}

const MAPS = Object.fromEntries(STYLE_NAMES.map((n) => [n, buildMap(STYLES[n])])) as Record<StyleName, Map<string, string>>;

const REVERSE = new Map<string, string>();
for (const name of STYLE_NAMES) for (const [plain, styled] of MAPS[name]) REVERSE.set(styled, plain);

const DECORATION_MARKS = new RegExp(`[${DECORATION_NAMES.map((d) => DECORATIONS[d].mark).join("")}]`, "g");

// Left plain: styled #tags and @handles stop matching on most sites, styled URLs stop working.
const KEEP_PLAIN = /(https?:\/\/\S+|www\.\S+|[#@][\p{L}\p{N}_]+)/u;

/** Applies `fn` to everything except URLs, #hashtags and @mentions. */
function outsideKeepPlain(text: string, fn: (part: string) => string): string {
	return text
		.split(KEEP_PLAIN)
		.map((part, i) => (i % 2 === 1 ? part : fn(part)))
		.join("");
}

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
	return outsideKeepPlain(text, (part) => styleRun(part, MAPS[style]));
}

/** Reverts styled letters/digits to plain ones; leaves strikethrough/underline marks alone. */
export function unstyleLetters(text: string): string {
	let out = "";
	for (const ch of text) out += REVERSE.get(ch) ?? ch;
	return out.normalize("NFC");
}

/** Fully plain text: no styled letters, no strikethrough/underline. */
export function unstyleText(text: string): string {
	return unstyleLetters(text.replace(DECORATION_MARKS, ""));
}

/** True if styling `text` with `style` would change nothing (it already is that style). */
export function hasStyle(text: string, style: StyleName): boolean {
	return /[\p{L}\p{N}]/u.test(text) && styleText(unstyleLetters(text), style) === text;
}

// One visible character plus any accents already on it; whitespace gets no line.
const CLUSTER = /\P{M}\p{M}*/gu;

/** Adds a strikethrough/underline mark to every visible character (idempotent). */
export function decorate(text: string, name: DecorationName): string {
	const mark = DECORATIONS[name].mark;
	return outsideKeepPlain(text.replaceAll(mark, ""), (part) =>
		part.replace(CLUSTER, (cluster) => (/^\s/.test(cluster) ? cluster : cluster + mark)),
	);
}

export function undecorate(text: string, name: DecorationName): string {
	return text.replaceAll(DECORATIONS[name].mark, "");
}

export function hasDecoration(text: string, name: DecorationName): boolean {
	const clusters = text.match(CLUSTER)?.filter((c) => !/^\s/.test(c)) ?? [];
	return clusters.length > 0 && clusters.every((c) => c.includes(DECORATIONS[name].mark));
}

/** Whole-text conversion for any style or decoration name. */
export function applyStyle(text: string, name: AnyStyle): string {
	return name in DECORATIONS ? decorate(text, name as DecorationName) : styleText(text, name as StyleName);
}

// ***x*** bold italic, **x** bold, *x* italic, ~~x~~ strikethrough, __x__ underline, `x` monospace.
// Markers must hug the text (like Markdown), so "5 * 3 * 2" is left alone.
const MARKUP =
	/\*\*\*(?=\S)([\s\S]+?)(?<=\S)\*\*\*|\*\*(?=\S)([\s\S]+?)(?<=\S)\*\*|\*(?=\S)([^*]+?)(?<=\S)\*|~~(?=\S)([\s\S]+?)(?<=\S)~~|__(?=\S)([\s\S]+?)(?<=\S)__|`([^`]+)`/g;

/** Converts Markdown-ish marks to styled characters (nesting works); text outside marks stays plain. */
export function styleMarkup(text: string): string {
	return text.replace(MARKUP, (_, bi, b, i, strike, under, mono) => {
		if (bi !== undefined) return styleText(styleMarkup(bi), "boldItalic");
		if (b !== undefined) return styleText(styleMarkup(b), "bold");
		if (i !== undefined) return styleText(styleMarkup(i), "italic");
		if (strike !== undefined) return decorate(styleMarkup(strike), "strikethrough");
		if (under !== undefined) return decorate(styleMarkup(under), "underline");
		return styleText(mono, "monospace");
	});
}

/** Removes emphasis marks, keeping their content. */
export function stripMarkup(text: string): string {
	return text.replace(MARKUP, (_, ...groups: (string | undefined)[]) => stripMarkup(groups.slice(0, 6).find((g) => g !== undefined)!));
}

/* ---------- X (Twitter) length ---------- */

// X's published counting rules (twitter-text "v3" config): code points in these ranges weigh 1,
// everything else 2; every emoji (even multi-code-point ones) weighs 2; every link weighs 23.
const LIGHT_RANGES: [number, number][] = [
	[0, 4351],
	[8192, 8205],
	[8208, 8223],
	[8242, 8247],
];
export const X_LIMIT = 280;
const X_URL_WEIGHT = 23;

// ponytail: bare domains are matched against common TLDs only; twitter-text ships the full IANA
// list. Swap in that list if uncommon TLDs (e.g. "foo.museum") must count as links.
const X_URL =
	/https?:\/\/\S+|\b(?:[a-z0-9-]+\.)+(?:com|net|org|io|co|dev|app|ai|in|me|xyz|gg|tv|ly|so|sh|uk|us|ca|de|fr|jp|info|biz|tech|site|blog|news|link|page|to)\b(?:\/\S*)?/gi;

const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });
const EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;

/** Characters as X counts them toward its 280 limit. */
export function xLength(text: string): number {
	let urls = 0;
	const rest = text.normalize("NFC").replace(X_URL, () => {
		urls++;
		return "";
	});
	let weight = urls * X_URL_WEIGHT;
	for (const { segment } of graphemes.segment(rest)) {
		if (EMOJI.test(segment)) {
			weight += 2;
			continue;
		}
		for (const ch of segment) {
			const cp = ch.codePointAt(0)!;
			weight += LIGHT_RANGES.some(([lo, hi]) => cp >= lo && cp <= hi) ? 1 : 2;
		}
	}
	return weight;
}
