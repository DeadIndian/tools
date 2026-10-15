import { makeQr, isHex, escapeXml, type Ecc, ECC_LEVELS } from "./qr";

export const MODULE_STYLES = ["square", "rounded", "dot", "diamond", "soft"] as const;
export const EYE_STYLES = ["square", "rounded", "circle"] as const;
export const FRAME_STYLES = ["none", "solid", "double", "soft"] as const;
export const BADGE_SHAPES = ["rounded", "square", "circle"] as const;

export type CustomQrConfig = {
	errorLevel: Ecc;
	invertModules: boolean;
	cellSize: number;
	quietZone: number;
	moduleScale: number;
	moduleRoundness: number;
	moduleStyle: (typeof MODULE_STYLES)[number];
	fg: string;
	bg: string;
	transparentBg: boolean;
	useGradient: boolean;
	gradientEyes: boolean;
	gradStart: string;
	gradEnd: string;
	gradientType: "linear" | "radial";
	gradientAngle: number;
	eyeOuterStyle: (typeof EYE_STYLES)[number];
	eyeInnerStyle: (typeof EYE_STYLES)[number];
	eyeOuterColor: string;
	eyeInnerColor: string;
	frameStyle: (typeof FRAME_STYLES)[number];
	framePadding: number;
	frameRadius: number;
	frameColor: string;
	/** data:image/... URI or https URL. Empty = no badge. */
	badgeImage: string;
	badgeShape: (typeof BADGE_SHAPES)[number];
	badgeSize: number;
	badgeBg: string;
	badgeImageFit: "cover" | "contain";
	badgeKnockout: boolean;
	showCaption: boolean;
	captionText: string;
	captionSize: number;
	captionColor: string;
	useShadow: boolean;
	shadowBlur: number;
	shadowOffset: number;
	shadowColor: string;
};

export const DEFAULT_CONFIG: CustomQrConfig = {
	errorLevel: "M",
	invertModules: false,
	cellSize: 8,
	quietZone: 4,
	moduleScale: 1,
	moduleRoundness: 0.3,
	moduleStyle: "rounded",
	fg: "#101828",
	bg: "#f8fafc",
	transparentBg: false,
	useGradient: false,
	gradientEyes: false,
	gradStart: "#0f172a",
	gradEnd: "#0ea5e9",
	gradientType: "linear",
	gradientAngle: 45,
	eyeOuterStyle: "rounded",
	eyeInnerStyle: "circle",
	eyeOuterColor: "#0f172a",
	eyeInnerColor: "#0ea5e9",
	frameStyle: "none",
	framePadding: 2,
	frameRadius: 20,
	frameColor: "#e2e8f0",
	badgeImage: "",
	badgeShape: "rounded",
	badgeSize: 24,
	badgeBg: "#ffffff",
	badgeImageFit: "cover",
	badgeKnockout: true,
	showCaption: false,
	captionText: "",
	captionSize: 20,
	captionColor: "#0f172a",
	useShadow: false,
	shadowBlur: 10,
	shadowOffset: 6,
	shadowColor: "#475569",
};

/** Slider ranges; shared by the UI and normalizeConfig. [min, max, step] */
export const RANGES = {
	cellSize: [4, 20, 1],
	quietZone: [0, 12, 1],
	moduleScale: [0.55, 1, 0.01],
	moduleRoundness: [0, 0.5, 0.01],
	gradientAngle: [0, 360, 1],
	framePadding: [0, 8, 1],
	frameRadius: [0, 72, 1],
	badgeSize: [12, 36, 1],
	captionSize: [12, 44, 1],
	shadowBlur: [0, 30, 1],
	shadowOffset: [0, 20, 1],
} as const satisfies Partial<Record<keyof CustomQrConfig, readonly [number, number, number]>>;

export const PRESETS = {
	classic: {
		moduleStyle: "square",
		moduleScale: 1,
		moduleRoundness: 0,
		fg: "#000000",
		bg: "#ffffff",
		transparentBg: false,
		useGradient: false,
		eyeOuterStyle: "square",
		eyeInnerStyle: "square",
		eyeOuterColor: "#000000",
		eyeInnerColor: "#000000",
		frameStyle: "none",
		useShadow: false,
		showCaption: false,
	},
	neo: {
		moduleStyle: "rounded",
		moduleScale: 0.92,
		moduleRoundness: 0.42,
		fg: "#0f172a",
		bg: "#eff6ff",
		useGradient: true,
		gradStart: "#0f172a",
		gradEnd: "#06b6d4",
		gradientType: "linear",
		gradientAngle: 35,
		gradientEyes: true,
		eyeOuterStyle: "rounded",
		eyeInnerStyle: "circle",
		frameStyle: "soft",
		framePadding: 3,
		frameColor: "#dbeafe",
		useShadow: true,
	},
	soft: {
		moduleStyle: "dot",
		moduleScale: 0.86,
		moduleRoundness: 0.5,
		fg: "#1d4ed8",
		bg: "#f8fafc",
		useGradient: true,
		gradStart: "#1d4ed8",
		gradEnd: "#22d3ee",
		gradientType: "radial",
		gradientEyes: true,
		eyeOuterStyle: "circle",
		eyeInnerStyle: "circle",
		frameStyle: "solid",
		frameColor: "#dbeafe",
		useShadow: true,
	},
	midnight: {
		moduleStyle: "soft",
		moduleScale: 0.94,
		moduleRoundness: 0.45,
		fg: "#e2e8f0",
		bg: "#0f172a",
		useGradient: true,
		gradStart: "#f8fafc",
		gradEnd: "#60a5fa",
		gradientType: "linear",
		gradientAngle: 130,
		eyeOuterStyle: "rounded",
		eyeInnerStyle: "rounded",
		eyeOuterColor: "#e2e8f0",
		eyeInnerColor: "#93c5fd",
		frameStyle: "double",
		frameColor: "#1e293b",
		useShadow: true,
		shadowColor: "#000000",
	},
	sunrise: {
		moduleStyle: "diamond",
		moduleScale: 0.88,
		moduleRoundness: 0.12,
		fg: "#7c2d12",
		bg: "#fff7ed",
		useGradient: true,
		gradStart: "#ea580c",
		gradEnd: "#facc15",
		gradientType: "linear",
		gradientAngle: 20,
		gradientEyes: true,
		eyeOuterStyle: "rounded",
		eyeInnerStyle: "circle",
		eyeOuterColor: "#c2410c",
		eyeInnerColor: "#fb923c",
		frameStyle: "soft",
		frameColor: "#fed7aa",
		useShadow: true,
		shadowColor: "#fdba74",
	},
} satisfies Record<string, Partial<CustomQrConfig>>;

export type PresetName = keyof typeof PRESETS;

export const PRESET_LABELS: Record<PresetName, string> = {
	classic: "Classic Sharp",
	neo: "Neo Gradient",
	soft: "Soft Bubble",
	midnight: "Midnight Card",
	sunrise: "Sunrise Pop",
};

const SAFE_IMAGE = /^(data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+|https:\/\/\S+)$/i;

/**
 * Coerces untrusted input (MCP args, localStorage) into a valid config.
 * Everything that reaches the SVG string passes through here.
 */
export function normalizeConfig(input: Partial<Record<keyof CustomQrConfig, unknown>> = {}): CustomQrConfig {
	const out = { ...DEFAULT_CONFIG };
	const d = DEFAULT_CONFIG as Record<string, unknown>;
	const o = out as Record<string, unknown>;
	const pick = <T extends readonly string[]>(key: keyof CustomQrConfig, allowed: T) => {
		const v = input[key];
		if (typeof v === "string" && allowed.includes(v)) o[key] = v;
	};

	for (const [key, value] of Object.entries(input)) {
		if (value === undefined || !(key in d)) continue;
		const def = d[key];
		if (typeof def === "boolean" && typeof value === "boolean") o[key] = value;
		if (typeof def === "string" && isHex(def) && isHex(value)) o[key] = value.toLowerCase();
		if (typeof def === "number") {
			const n = Number(value);
			const [min, max] = RANGES[key as keyof typeof RANGES];
			if (Number.isFinite(n)) o[key] = Math.min(max, Math.max(min, n));
		}
	}
	pick("errorLevel", ECC_LEVELS);
	pick("moduleStyle", MODULE_STYLES);
	pick("eyeOuterStyle", EYE_STYLES);
	pick("eyeInnerStyle", EYE_STYLES);
	pick("frameStyle", FRAME_STYLES);
	pick("badgeShape", BADGE_SHAPES);
	pick("gradientType", ["linear", "radial"] as const);
	pick("badgeImageFit", ["cover", "contain"] as const);
	if (typeof input.captionText === "string") out.captionText = input.captionText.trim().slice(0, 80);
	if (typeof input.badgeImage === "string" && SAFE_IMAGE.test(input.badgeImage)) out.badgeImage = input.badgeImage;
	return out;
}

const rand = <T>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];
const randomColor = () => `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}`;

export function randomConfig(): Partial<CustomQrConfig> {
	const gradA = randomColor();
	const gradB = randomColor();
	const showCaption = Math.random() > 0.7;
	return {
		moduleStyle: rand(MODULE_STYLES),
		moduleScale: Number((0.72 + Math.random() * 0.28).toFixed(2)),
		moduleRoundness: Number((Math.random() * 0.5).toFixed(2)),
		fg: randomColor(),
		bg: randomColor(),
		useGradient: Math.random() > 0.35,
		gradientEyes: Math.random() > 0.45,
		gradStart: gradA,
		gradEnd: gradB,
		gradientType: Math.random() > 0.5 ? "linear" : "radial",
		gradientAngle: Math.floor(Math.random() * 360),
		eyeOuterStyle: rand(EYE_STYLES),
		eyeInnerStyle: rand(EYE_STYLES),
		eyeOuterColor: gradA,
		eyeInnerColor: gradB,
		frameStyle: rand(FRAME_STYLES),
		framePadding: Math.floor(Math.random() * 5),
		frameRadius: Math.floor(Math.random() * 60),
		frameColor: randomColor(),
		badgeShape: rand(BADGE_SHAPES),
		badgeSize: 16 + Math.floor(Math.random() * 16),
		badgeBg: "#ffffff",
		showCaption,
		captionText: showCaption ? "Scan me" : "",
		captionSize: 16 + Math.floor(Math.random() * 14),
		captionColor: "#0f172a",
		useShadow: Math.random() > 0.5,
		shadowBlur: 4 + Math.floor(Math.random() * 22),
		shadowOffset: 2 + Math.floor(Math.random() * 12),
		shadowColor: randomColor(),
	};
}

const rect = (x: number, y: number, w: number, h: number, rx: number, fill: string, opacity = 1) => {
	const r = Math.max(0, rx || 0);
	return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="${fill}" fill-opacity="${opacity}"/>`;
};

const circle = (cx: number, cy: number, r: number, fill: string, opacity = 1) =>
	`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" fill-opacity="${opacity}"/>`;

function moduleShape(style: CustomQrConfig["moduleStyle"], x: number, y: number, size: number, roundness: number, fill: string) {
	if (style === "dot") return circle(x + size / 2, y + size / 2, size / 2, fill);
	if (style === "diamond") {
		const cx = x + size / 2;
		const cy = y + size / 2;
		return `<path d="M ${cx} ${y} L ${x + size} ${cy} L ${cx} ${y + size} L ${x} ${cy} Z" fill="${fill}"/>`;
	}
	if (style === "soft") return rect(x, y, size, size, size * Math.min(0.49, roundness + 0.16), fill, 0.94);
	if (style === "rounded") return rect(x, y, size, size, size * roundness, fill);
	return rect(x, y, size, size, 0, fill);
}

function eyeShape(style: CustomQrConfig["eyeOuterStyle"], x: number, y: number, size: number, fill: string) {
	if (style === "circle") return circle(x + size / 2, y + size / 2, size / 2, fill);
	if (style === "rounded") return rect(x, y, size, size, size * 0.26, fill);
	return rect(x, y, size, size, 0, fill);
}

function gradientDef(c: CustomQrConfig, box: { x: number; y: number; size: number }) {
	const stops = `<stop offset="0%" stop-color="${c.gradStart}"/><stop offset="100%" stop-color="${c.gradEnd}"/>`;
	if (c.gradientType === "radial") return `<radialGradient id="qr-grad" cx="50%" cy="50%" r="75%">${stops}</radialGradient>`;
	const a = (c.gradientAngle * Math.PI) / 180;
	const at = (pct: number) => (pct / 100) * box.size;
	const [x1, y1, x2, y2] = [50 - Math.cos(a) * 50, 50 - Math.sin(a) * 50, 50 + Math.cos(a) * 50, 50 + Math.sin(a) * 50];
	return `<linearGradient id="qr-grad" gradientUnits="userSpaceOnUse" x1="${box.x + at(x1)}" y1="${box.y + at(y1)}" x2="${box.x + at(x2)}" y2="${box.y + at(y2)}">${stops}</linearGradient>`;
}

const isFinder = (r: number, c: number, n: number) =>
	(r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);

/** Throws QrTooLongError if text doesn't fit. */
export function renderCustomSvg(text: string, partial: Partial<Record<keyof CustomQrConfig, unknown>> = {}): string {
	const c = normalizeConfig(partial);
	const { count, isDark } = makeQr(text, c.errorLevel);
	const cell = c.cellSize;
	const quietPx = c.quietZone * cell;
	const framePadPx = c.framePadding * cell;
	const qrPixelSize = count * cell + quietPx * 2;
	const baseSize = qrPixelSize + framePadPx * 2;
	const qrOffset = framePadPx;
	const matrixOffset = qrOffset + quietPx;
	const moduleSize = Math.max(0.2, cell * c.moduleScale);
	const inset = (cell - moduleSize) / 2;
	const fill = c.useGradient ? "url(#qr-grad)" : c.fg;
	const eyeFill = c.useGradient && c.gradientEyes ? "url(#qr-grad)" : c.eyeOuterColor;
	const eyeCenterFill = c.useGradient && c.gradientEyes ? "url(#qr-grad)" : c.eyeInnerColor;
	const quietColor = c.transparentBg ? "#ffffff" : c.bg;
	const hasBadge = Boolean(c.badgeImage);
	const hasCaption = c.showCaption && Boolean(c.captionText);

	const captionGap = hasCaption ? Math.max(10, cell * 1.2) : 0;
	const captionArea = hasCaption ? Math.max(c.captionSize * 1.75, cell * 4) : 0;
	const totalHeight = baseSize + captionGap + captionArea;

	let badgeZone: { start: number; end: number } | null = null;
	if (hasBadge) {
		const half = Math.floor(Math.max(5, Math.floor((count * c.badgeSize) / 100)) / 2);
		const center = Math.floor(count / 2);
		badgeZone = { start: center - half, end: center + half };
	}

	const defs: string[] = [];
	if (c.useGradient) defs.push(gradientDef(c, { x: matrixOffset, y: matrixOffset, size: count * cell }));
	if (c.useShadow) {
		defs.push(
			`<filter id="qr-shadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="${c.shadowOffset}" stdDeviation="${c.shadowBlur / 2}" flood-color="${c.shadowColor}" flood-opacity="0.45"/></filter>`,
		);
	}

	const frame: string[] = [];
	const r = c.frameRadius;
	if (c.frameStyle === "solid") frame.push(rect(0, 0, baseSize, baseSize, r, c.frameColor));
	if (c.frameStyle === "double") {
		frame.push(rect(0, 0, baseSize, baseSize, r, c.frameColor));
		frame.push(rect(cell, cell, baseSize - cell * 2, baseSize - cell * 2, Math.max(0, r - cell), quietColor));
	}
	if (c.frameStyle === "soft") {
		frame.push(rect(0, 0, baseSize, baseSize, r, c.frameColor, 0.85));
		frame.push(rect(cell * 0.5, cell * 0.5, baseSize - cell, baseSize - cell, Math.max(0, r - cell), "#ffffff", 0.25));
	}

	const modules: string[] = [];
	for (let row = 0; row < count; row++) {
		for (let col = 0; col < count; col++) {
			if (isDark(row, col) === c.invertModules) continue;
			if (isFinder(row, col, count)) continue;
			if (
				badgeZone &&
				c.badgeKnockout &&
				row >= badgeZone.start &&
				row <= badgeZone.end &&
				col >= badgeZone.start &&
				col <= badgeZone.end
			) {
				continue;
			}
			modules.push(
				moduleShape(c.moduleStyle, matrixOffset + col * cell + inset, matrixOffset + row * cell + inset, moduleSize, c.moduleRoundness, fill),
			);
		}
	}

	const eyes: string[] = [];
	for (const eye of [
		{ r: 0, c: 0 },
		{ r: 0, c: count - 7 },
		{ r: count - 7, c: 0 },
	]) {
		const x = matrixOffset + eye.c * cell;
		const y = matrixOffset + eye.r * cell;
		eyes.push(eyeShape(c.eyeOuterStyle, x, y, 7 * cell, eyeFill));
		eyes.push(eyeShape(c.eyeOuterStyle, x + cell, y + cell, 5 * cell, quietColor));
		eyes.push(eyeShape(c.eyeInnerStyle, x + cell * 2, y + cell * 2, 3 * cell, eyeCenterFill));
	}

	const badge: string[] = [];
	if (hasBadge) {
		const size = (count * cell * c.badgeSize) / 100;
		const bx = matrixOffset + (count * cell - size) / 2;
		const by = bx;
		if (c.badgeShape === "circle") {
			defs.push(`<clipPath id="badge-clip"><circle cx="${bx + size / 2}" cy="${by + size / 2}" r="${size / 2}"/></clipPath>`);
			badge.push(circle(bx + size / 2, by + size / 2, size / 2, c.badgeBg));
		} else {
			const rx = c.badgeShape === "square" ? 0 : size * 0.2;
			defs.push(`<clipPath id="badge-clip"><rect x="${bx}" y="${by}" width="${size}" height="${size}" rx="${rx}" ry="${rx}"/></clipPath>`);
			badge.push(rect(bx, by, size, size, rx, c.badgeBg));
		}
		const preserve = c.badgeImageFit === "contain" ? "xMidYMid meet" : "xMidYMid slice";
		badge.push(
			`<image x="${bx}" y="${by}" width="${size}" height="${size}" href="${escapeXml(c.badgeImage)}" preserveAspectRatio="${preserve}" clip-path="url(#badge-clip)"/>`,
		);
	}

	const caption = hasCaption
		? `<text x="${baseSize / 2}" y="${baseSize + captionGap + captionArea * 0.68}" text-anchor="middle" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-weight="600" font-size="${c.captionSize}" fill="${c.captionColor}">${escapeXml(c.captionText)}</text>`
		: "";

	const background = c.transparentBg ? "" : rect(qrOffset, qrOffset, qrPixelSize, qrPixelSize, Math.max(0, r / 2), c.bg);
	const defsBlock = defs.length ? `<defs>${defs.join("")}</defs>` : "";
	const filter = c.useShadow ? ' filter="url(#qr-shadow)"' : "";

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${baseSize} ${totalHeight}" role="img" aria-label="Custom QR code">${defsBlock}${frame.join("")}<g${filter}>${background}${modules.join("")}${eyes.join("")}${badge.join("")}</g>${caption}</svg>`;
}
