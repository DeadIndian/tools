import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { encode as encodePng } from "fast-png";
import jpeg from "jpeg-js";
import { makeQr, plainSvg, QrTooLongError } from "../lib/qr";
import { renderCustomSvg, normalizeConfig, DEFAULT_CONFIG, PRESETS } from "../lib/custom-qr";
import { prepareZXingModule } from "zxing-wasm/reader";
import { decodeRgba, decodeImageBytes, UnsupportedImageError } from "../lib/decode";

// Node: load the ZXing .wasm from disk (the browser and Workers each load it their own way).
prepareZXingModule({
	overrides: { wasmBinary: readFileSync(new URL("../node_modules/zxing-wasm/dist/reader/zxing_reader.wasm", import.meta.url)).buffer as ArrayBuffer },
});
import { encodePayload, decodePayload, profileUrl } from "../lib/social";

// Paint a QR matrix into an RGBA buffer with a 4-module quiet zone.
function rasterize(text: string, scale = 4) {
	const qr = makeQr(text);
	const size = (qr.count + 8) * scale;
	const data = new Uint8ClampedArray(size * size * 4).fill(255);
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const r = Math.floor(y / scale) - 4;
			const c = Math.floor(x / scale) - 4;
			if (r >= 0 && c >= 0 && r < qr.count && c < qr.count && qr.isDark(r, c)) {
				const i = (y * size + x) * 4;
				data[i] = data[i + 1] = data[i + 2] = 0;
			}
		}
	}
	return { data, size };
}

const SAMPLES = ["https://tools.golla.in", "héllo 🙂 नमस्ते"];

test("qr round-trips through decodeRgba, including unicode", async () => {
	for (const text of SAMPLES) {
		const { data, size } = rasterize(text);
		assert.equal(await decodeRgba(data, size, size), text);
	}
});

test("decodeRgba reads inverted (light-on-dark) codes", async () => {
	const { data, size } = rasterize("inverted");
	for (let i = 0; i < data.length; i += 4) data[i] = data[i + 1] = data[i + 2] = 255 - data[i];
	assert.equal(await decodeRgba(data, size, size), "inverted");
});

test("decodeImageBytes handles PNG and JPEG, rejects junk", async () => {
	const { data, size } = rasterize("png & jpeg");
	const png = encodePng({ width: size, height: size, data: new Uint8Array(data.buffer), channels: 4, depth: 8 });
	assert.equal(await decodeImageBytes(png), "png & jpeg");
	const jpg = jpeg.encode({ data: Buffer.from(data), width: size, height: size }, 95).data;
	assert.equal(await decodeImageBytes(new Uint8Array(jpg)), "png & jpeg");
	await assert.rejects(() => decodeImageBytes(new Uint8Array([1, 2, 3, 4])), UnsupportedImageError);
});

test("blank image decodes to null", async () => {
	const data = new Uint8ClampedArray(64 * 64 * 4).fill(255);
	assert.equal(await decodeRgba(data, 64, 64), null);
});

test("too-long text throws QrTooLongError", () => {
	assert.throws(() => makeQr("x".repeat(5000)), QrTooLongError);
});

test("plainSvg is an svg and rejects bad colors", () => {
	assert.match(plainSvg("hi"), /^<svg[\s\S]*<\/svg>$/);
	assert.ok(!plainSvg("hi", { fg: '"/><script>' }).includes("<script>"));
});

test("custom svg escapes caption and sanitizes config", () => {
	const svg = renderCustomSvg("x", {
		showCaption: true,
		captionText: "<script>alert(1)</script>",
		fg: 'red"/><script>',
		badgeImage: 'javascript:alert(1)',
	});
	assert.ok(!svg.includes("<script>"));
	assert.ok(!svg.includes("javascript:"));
	assert.ok(svg.includes("&lt;script&gt;"));
	assert.equal(normalizeConfig({ fg: "nope" }).fg, DEFAULT_CONFIG.fg);
	assert.equal(normalizeConfig({ cellSize: 999 }).cellSize, 20);
	assert.equal(normalizeConfig({ moduleStyle: "evil" as never }).moduleStyle, DEFAULT_CONFIG.moduleStyle);
});

test("every preset renders", () => {
	for (const name of Object.keys(PRESETS)) {
		assert.match(renderCustomSvg("preset", { ...PRESETS[name as keyof typeof PRESETS] }), /<\/svg>$/);
	}
});

test("social payload round-trips with unicode", () => {
	const map = { ig: "@déad_indian", yt: "@चैनल" };
	assert.deepEqual(decodePayload(encodePayload(map)), map);
	assert.match(profileUrl(map), /^https:\/\/tools\.golla\.in\/socials\/profile#/);
});

test("old v1 payloads from thisqr.works still decode", () => {
	const legacy = Buffer.from('{"v":1,"uid":"abc123","s":{"ig":"@me","wa":"+911234"}}')
		.toString("base64url");
	assert.deepEqual(decodePayload(`#${legacy}`), { ig: "@me", wa: "+911234" });
	assert.throws(() => decodePayload(""), /empty-hash/);
	assert.throws(() => decodePayload(Buffer.from("[1]").toString("base64url")), /invalid-structure/);
	assert.throws(() => decodePayload(Buffer.from('{"v":1}').toString("base64url")), /missing-s/);
});

// Real PNG flavors (made with ImageMagick): 1/4-bit gray, palette, interlaced, and transparent
// RGBA/gray+alpha at 8 and 16 bit. Odd 151px width exercises sub-byte row padding.
test("decodeImageBytes reads every PNG flavor, including transparent ones", async () => {
	const dir = new URL("./fixtures/", import.meta.url);
	const files = readdirSync(dir).filter((f) => f.endsWith(".png"));
	assert.ok(files.length >= 7);
	for (const f of files) assert.equal(await decodeImageBytes(new Uint8Array(readFileSync(new URL(f, dir)))), "fixture ok", f);
});

// Styled presets (dots, gradients, round eyes) that jsQR, the previous decoder, could not read.
test("decodeImageBytes reads styled QR codes", async () => {
	for (const f of ["soft", "sunrise"]) {
		const bytes = new Uint8Array(readFileSync(new URL(`./fixtures/styled/${f}.png`, import.meta.url)));
		assert.equal(await decodeImageBytes(bytes), "styled ok https://tools.golla.in", f);
	}
});
