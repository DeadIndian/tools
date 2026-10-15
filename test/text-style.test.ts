import { test } from "node:test";
import assert from "node:assert/strict";
import {
	STYLES,
	STYLE_NAMES,
	applyStyle,
	decorate,
	hasDecoration,
	hasStyle,
	stripMarkup,
	styleMarkup,
	styleText,
	undecorate,
	unstyleText,
	xLength,
} from "../lib/text-style";

const ALL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

test("every style round-trips and never maps two letters to the same char", () => {
	for (const style of STYLE_NAMES) {
		const out = styleText(ALL, style);
		const styled = [...out].filter((ch, i) => ch !== ALL[i]);
		assert.equal(new Set(styled).size, styled.length, `${style} has duplicate targets`);
		assert.equal(unstyleText(out), ALL, style);
	}
});

test("table styles have exactly 26/26/10 entries", () => {
	for (const name of STYLE_NAMES) {
		const def = STYLES[name];
		if ("table" in def) assert.deepEqual(def.table.map((r) => [...r].length), [26, 26, 10], name);
	}
});

test("known code points, including Unicode's holes", () => {
	assert.equal(styleText("Bold 1", "bold"), "𝗕𝗼𝗹𝗱 𝟭");
	assert.equal(styleText("hi", "italicSerif"), "ℎ𝑖");
	assert.equal(styleText("BEe", "script"), "ℬℰℯ");
	assert.equal(styleText("CR", "doubleStruck"), "ℂℝ");
	assert.equal(styleText("7", "italic"), "7");
	assert.equal(styleText("Ab1", "fullwidth"), "Ａｂ１");
	assert.equal(styleText("Small caps", "smallCaps"), "Sᴍᴀʟʟ ᴄᴀᴘꜱ");
	assert.equal(styleText("x2", "superscript"), "ˣ²");
	assert.equal(styleText("A1", "circled"), "Ⓐ①");
});

test("accents keep their mark and recompose on unstyle", () => {
	assert.equal(styleText("café", "bold"), "𝗰𝗮𝗳𝗲́");
	assert.equal(unstyleText(styleText("café", "bold")), "café");
});

test("URLs, hashtags, mentions stay plain", () => {
	assert.equal(styleText("see https://x.com/a #AI @me ok", "bold"), "𝘀𝗲𝗲 https://x.com/a #AI @me 𝗼𝗸");
	assert.equal(decorate("no #AI", "strikethrough"), "n̶o̶ #AI");
});

test("decorations: per visible char, idempotent, stack on styles, removable", () => {
	assert.equal(decorate("ab c", "strikethrough"), "a̶b̶ c̶");
	assert.equal(decorate(decorate("ab", "underline"), "underline"), "a̲b̲");
	assert.equal(decorate("é", "underline"), "é\u0332");
	const boldStruck = decorate(styleText("hi", "bold"), "strikethrough");
	assert.equal(boldStruck, "𝗵̶𝗶̶");
	assert.ok(hasDecoration(boldStruck, "strikethrough"));
	assert.ok(!hasDecoration("a̶b", "strikethrough"));
	assert.equal(undecorate(boldStruck, "strikethrough"), "𝗵𝗶");
	assert.equal(unstyleText(boldStruck), "hi");
});

test("hasStyle drives toggling", () => {
	assert.ok(hasStyle("𝗵𝗶 !", "bold"));
	assert.ok(!hasStyle("𝗵i", "bold"));
	assert.ok(!hasStyle("hi", "bold"));
	assert.ok(!hasStyle("!!", "bold"));
	assert.equal(applyStyle("hi", "underline"), "h̲i̲");
});

test("markup converts only marked spans, and nests", () => {
	assert.equal(styleMarkup("A **big** *deal* ***now*** `x1`"), "A 𝗯𝗶𝗴 𝘥𝘦𝘢𝘭 𝙣𝙤𝙬 𝚡𝟷");
	assert.equal(styleMarkup("~~old~~ __new__"), "o̶l̶d̶ n̲e̲w̲");
	assert.equal(styleMarkup("**~~gone~~**"), "𝗴̶𝗼̶𝗻̶𝗲̶");
	assert.equal(styleMarkup("5 * 3 * 2"), "5 * 3 * 2");
	assert.equal(styleMarkup("**Heading**\nbody"), "𝗛𝗲𝗮𝗱𝗶𝗻𝗴\nbody");
	assert.equal(stripMarkup("A **big ~~x~~** *deal* `x`"), "A big x deal x");
});

test("xLength follows X's weighting", () => {
	assert.equal(xLength("hello"), 5);
	assert.equal(xLength("𝗵𝗲𝗹𝗹𝗼"), 10); // math letters weigh 2
	assert.equal(xLength("a̶"), 2); // combining mark weighs 1
	assert.equal(xLength("👍🏽"), 2); // emoji with skin tone = one emoji
	assert.equal(xLength("👨‍👩‍👧"), 2); // ZWJ family = one emoji
	assert.equal(xLength("🇮🇳"), 2); // flag
	assert.equal(xLength("日本"), 4); // CJK weighs 2
	assert.equal(xLength("go https://example.com/a/very/long/path"), 3 + 23);
	assert.equal(xLength("tools.golla.in"), 23);
	assert.equal(xLength("—"), 1); // em dash is in a light range
});
