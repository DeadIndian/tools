import { test } from "node:test";
import assert from "node:assert/strict";
import { STYLE_NAMES, stripMarkup, styleText, styleMarkup, unstyleText } from "../lib/text-style";

const ALL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

test("every style maps letters to distinct styled chars and round-trips", () => {
	for (const style of STYLE_NAMES) {
		const out = styleText(ALL, style);
		const letters = [...styleText(ALL.slice(0, 52), style)];
		assert.equal(new Set(letters).size, 52, style);
		assert.ok(letters.every((ch) => !/[A-Za-z]/.test(ch)), style);
		assert.equal(unstyleText(out), ALL, style);
	}
});

test("known code points, including Unicode's holes", () => {
	assert.equal(styleText("Bold 1", "bold"), "𝗕𝗼𝗹𝗱 𝟭");
	assert.equal(styleText("hi", "italicSerif"), "ℎ𝑖");
	assert.equal(styleText("BEe", "script"), "ℬℰℯ");
	assert.equal(styleText("CR", "doubleStruck"), "ℂℝ");
	assert.equal(styleText("7", "italic"), "7"); // no italic digits in Unicode
});

test("accents keep their mark and recompose on unstyle", () => {
	const out = styleText("café", "bold");
	assert.equal(out, "𝗰𝗮𝗳𝗲́");
	assert.equal(unstyleText(out), "café");
});

test("URLs, hashtags, mentions stay plain", () => {
	assert.equal(styleText("see https://x.com/a #AI @me ok", "bold"), "𝘀𝗲𝗲 https://x.com/a #AI @me 𝗼𝗸");
});

test("markup converts only marked spans", () => {
	assert.equal(styleMarkup("A **big** *deal* ***now*** `x1`"), "A 𝗯𝗶𝗴 𝘥𝘦𝘢𝘭 𝙣𝙤𝙬 𝚡𝟷");
	assert.equal(styleMarkup("5 * 3 * 2"), "5 * 3 * 2");
	assert.equal(styleMarkup("plain"), "plain");
	assert.equal(stripMarkup("A **big** *deal* `x`"), "A big deal x");
	assert.equal(styleMarkup("**Heading**\nbody"), "𝗛𝗲𝗮𝗱𝗶𝗻𝗴\nbody");
});
