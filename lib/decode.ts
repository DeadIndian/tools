import jsQR from "jsqr";
import UPNG from "upng-js";
import jpeg from "jpeg-js";

export class UnsupportedImageError extends Error {
	constructor() {
		super("Unsupported image. Use PNG or JPEG.");
	}
}

// Normal first, then inverted (light-on-dark codes). Live camera frames skip the second pass.
export function decodeRgba(data: Uint8ClampedArray, width: number, height: number, tryInverted = true): string | null {
	return jsQR(data, width, height, { inversionAttempts: tryInverted ? "attemptBoth" : "dontInvert" })?.data ?? null;
}

const isPng = (b: Uint8Array) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
const isJpeg = (b: Uint8Array) => b[0] === 0xff && b[1] === 0xd8;

// Server-side path (MCP): pure JS, since Workers has no canvas or sharp.
export function decodeImageBytes(bytes: Uint8Array): string | null {
	if (isPng(bytes)) {
		const img = UPNG.decode(bytes.slice().buffer);
		const rgba = new Uint8ClampedArray(UPNG.toRGBA8(img)[0]);
		return decodeRgba(rgba, img.width, img.height);
	}
	if (isJpeg(bytes)) {
		// ponytail: 64 MB decode cap guards against decompression bombs; tune if big photos fail.
		const img = jpeg.decode(bytes, { useTArray: true, maxMemoryUsageInMB: 64 });
		return decodeRgba(new Uint8ClampedArray(img.data.buffer), img.width, img.height);
	}
	throw new UnsupportedImageError();
}
