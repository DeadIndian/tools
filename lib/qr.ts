import qrcode from "qrcode-generator";

// The lib defaults to latin-1 (charCode & 0xff), which corrupts emoji and non-Latin text.
qrcode.stringToBytes = (s: string) => Array.from(new TextEncoder().encode(s));

export type Ecc = "L" | "M" | "Q" | "H";
export const ECC_LEVELS: Ecc[] = ["L", "M", "Q", "H"];

export class QrTooLongError extends Error {
	constructor() {
		super("Text is too long for a QR code at this error-correction level.");
	}
}

export type QrMatrix = { count: number; isDark: (r: number, c: number) => boolean };

export function makeQr(text: string, ecc: Ecc = "M"): QrMatrix {
	const qr = qrcode(0, ecc);
	try {
		qr.addData(text, "Byte");
		qr.make();
	} catch {
		throw new QrTooLongError();
	}
	return { count: qr.getModuleCount(), isDark: (r, c) => qr.isDark(r, c) };
}

export function isHex(value: unknown): value is string {
	return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

export function escapeXml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

export type PlainOptions = {
	ecc?: Ecc;
	cellSize?: number;
	margin?: number;
	fg?: string;
	bg?: string;
};

// One <path> for all dark modules: small output, crisp edges.
export function plainSvg(text: string, opts: PlainOptions = {}): string {
	const { count, isDark } = makeQr(text, opts.ecc ?? "M");
	const cell = Math.min(Math.max(Math.round(opts.cellSize ?? 6), 1), 40);
	const margin = Math.min(Math.max(Math.round(opts.margin ?? 2), 0), 20);
	const fg = isHex(opts.fg) ? opts.fg : "#000000";
	const bg = isHex(opts.bg) ? opts.bg : "#ffffff";
	const size = (count + margin * 2) * cell;
	let d = "";
	for (let r = 0; r < count; r++) {
		for (let c = 0; c < count; c++) {
			if (isDark(r, c)) d += `M${(c + margin) * cell} ${(r + margin) * cell}h${cell}v${cell}h-${cell}z`;
		}
	}
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="100%" height="100%" fill="${bg}"/><path d="${d}" fill="${fg}"/></svg>`;
}
