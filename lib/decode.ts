import { readBarcodes, type ReaderOptions } from "zxing-wasm/reader";
import { convertIndexedToRgb, decode as decodePng, type DecodedPng } from "fast-png";
import jpeg from "jpeg-js";

export class UnsupportedImageError extends Error {
	constructor() {
		super("Unsupported image. Use PNG or JPEG.");
	}
}

// ZXing-C++ (WASM): reads styled codes (dots, gradients, round eyes) and inverted ones.
// Each entry point loads the .wasm its own way first: lib/zxing-server.ts, the /decode page, tests.
const QR_FORMATS: ReaderOptions = { formats: ["QRCode", "MicroQRCode", "rMQRCode"], maxNumberOfSymbols: 1 };

export async function decodeRgba(data: Uint8ClampedArray, width: number, height: number): Promise<string | null> {
	const [hit] = await readBarcodes({ data, width, height, colorSpace: "srgb" } as ImageData, QR_FORMATS);
	return hit?.isValid ? hit.text : null;
}

const isPng = (b: Uint8Array) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
const isJpeg = (b: Uint8Array) => b[0] === 0xff && b[1] === 0xd8;

// Server-side path (MCP): no canvas on Workers, so PNG/JPEG are decoded to RGBA here.
export async function decodeImageBytes(bytes: Uint8Array): Promise<string | null> {
	if (isPng(bytes)) {
		const png = decodePng(bytes);
		return decodeRgba(pngToRgba(png), png.width, png.height);
	}
	if (isJpeg(bytes)) {
		// ponytail: 64 MB decode cap guards against decompression bombs; tune if big photos fail.
		const img = jpeg.decode(bytes, { useTArray: true, maxMemoryUsageInMB: 64 });
		return decodeRgba(new Uint8ClampedArray(img.data.buffer), img.width, img.height);
	}
	throw new UnsupportedImageError();
}

/**
 * Any PNG flavor (1/2/4/8/16-bit, gray, gray+alpha, RGB, RGBA, palette) to 8-bit RGBA,
 * composited onto white: the QR reader ignores alpha, and transparent pixels are often stored as black.
 */
export function pngToRgba(png: DecodedPng): Uint8ClampedArray {
	const { width, height } = png;
	let { data, depth, channels } = png;
	if (png.palette) {
		data = convertIndexedToRgb(png);
		depth = 8;
		channels = data.length / (width * height);
	}
	const max = (1 << depth) - 1;
	const rowBits = width * channels * depth;
	const rowBytes = Math.ceil(rowBits / 8);
	// Sub-byte depths stay bit-packed per row; 8/16-bit come as one array entry per sample.
	const sample = (y: number, i: number): number => {
		if (depth >= 8) return data[y * width * channels + i] / max;
		const bit = i * depth;
		const byte = data[y * rowBytes + (bit >> 3)];
		return ((byte >> (8 - depth - (bit & 7))) & max) / max;
	};
	const key = !png.palette && png.transparency ? Array.from(png.transparency, (v) => v / max) : null;
	const out = new Uint8ClampedArray(width * height * 4);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = x * channels;
			const color = channels < 3 ? [sample(y, i), sample(y, i), sample(y, i)] : [sample(y, i), sample(y, i + 1), sample(y, i + 2)];
			let alpha = channels === 2 || channels === 4 ? sample(y, i + channels - 1) : 1;
			if (key && color.slice(0, key.length).every((v, k) => v === key[k])) alpha = 0;
			const o = (y * width + x) * 4;
			for (let k = 0; k < 3; k++) out[o + k] = Math.round((color[k] * alpha + (1 - alpha)) * 255);
			out[o + 3] = 255;
		}
	}
	return out;
}
