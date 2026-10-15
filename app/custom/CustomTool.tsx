"use client";

import { useEffect, useMemo, useState } from "react";
import {
	BADGE_SHAPES,
	DEFAULT_CONFIG,
	EYE_STYLES,
	FRAME_STYLES,
	MODULE_STYLES,
	PRESETS,
	PRESET_LABELS,
	RANGES,
	normalizeConfig,
	randomConfig,
	renderCustomSvg,
	type CustomQrConfig,
	type PresetName,
} from "@/lib/custom-qr";
import { isHex } from "@/lib/qr";
import { downloadBlob, downloadSvg } from "../client-utils";

const BADGE_KEY = "tools-custom-badge-image";
const DEFAULT_FILE = "tools-custom";
const PNG_SIZES = [512, 768, 1024, 1536, 2048];

type Cfg = CustomQrConfig;
type Setter = <K extends keyof Cfg>(key: K, value: Cfg[K]) => void;

const ECC_LABELS = { L: "L - Low (7%)", M: "M - Medium (15%)", Q: "Q - Quartile (25%)", H: "H - High (30%)" };
const MODULE_LABELS = { square: "Square", rounded: "Rounded", dot: "Dot", diamond: "Diamond", soft: "Soft blob" };
const EYE_LABELS = { square: "Square", rounded: "Rounded", circle: "Circle" };
const FRAME_LABELS = { none: "None", solid: "Solid", double: "Double", soft: "Soft card" };

const safeFilename = (name: string) =>
	name.trim().replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "") || DEFAULT_FILE;

/* ---------- small controls ---------- */

type NumKey = keyof typeof RANGES;

function Range({ k, label, unit = "", c, set }: { k: NumKey; label: string; unit?: string; c: Cfg; set: Setter }) {
	const [min, max, step] = RANGES[k];
	const value = c[k];
	return (
		<div className="field-group">
			<label className="field-label" htmlFor={k}>
				{label}: {step < 1 ? value.toFixed(2) : value}
				{unit}
			</label>
			<input
				id={k}
				type="range"
				className="range-input"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => set(k, Number(e.target.value))}
			/>
		</div>
	);
}

type ColorKey = { [K in keyof Cfg]: Cfg[K] extends string ? (K extends `${string}Color` | "fg" | "bg" | "gradStart" | "gradEnd" | "badgeBg" ? K : never) : never }[keyof Cfg];

function Color({ k, label, c, set }: { k: ColorKey; label: string; c: Cfg; set: Setter }) {
	// Local text state so partially typed hex values don't get rejected mid-typing.
	const [draft, setDraft] = useState(c[k]);
	useEffect(() => setDraft(c[k]), [c[k]]);
	return (
		<div className="field-group">
			<label className="field-label" htmlFor={`${k}-hex`}>
				{label}
			</label>
			<div className="color-row">
				<input type="color" className="color-swatch" aria-label={`${label} picker`} value={c[k]} onChange={(e) => set(k, e.target.value)} />
				<input
					id={`${k}-hex`}
					type="text"
					className="text-input color-hex"
					maxLength={7}
					spellCheck={false}
					value={draft}
					onChange={(e) => {
						setDraft(e.target.value);
						if (isHex(e.target.value)) set(k, e.target.value.toLowerCase());
					}}
				/>
			</div>
		</div>
	);
}

function Select<K extends keyof Cfg>({ k, label, options, c, set }: { k: K; label: string; options: Record<string, string>; c: Cfg; set: Setter }) {
	return (
		<div className="field-group">
			<label className="field-label" htmlFor={k}>
				{label}
			</label>
			<select id={k} className="text-input select-input" value={String(c[k])} onChange={(e) => set(k, e.target.value as Cfg[K])}>
				{Object.entries(options).map(([value, text]) => (
					<option key={value} value={value}>
						{text}
					</option>
				))}
			</select>
		</div>
	);
}

type BoolKey = { [K in keyof Cfg]: Cfg[K] extends boolean ? K : never }[keyof Cfg];

function Check({ k, label, c, set }: { k: BoolKey; label: string; c: Cfg; set: Setter }) {
	return (
		<label>
			<input type="checkbox" checked={c[k]} onChange={(e) => set(k, e.target.checked)} /> {label}
		</label>
	);
}

const pick = <T extends readonly string[], L extends Record<T[number], string>>(_: T, labels: L) => labels;

/* ---------- PNG export ---------- */

function svgToPng(svg: string, width: number): Promise<Blob> {
	const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
	const root = doc.documentElement;
	const [, , vw, vh] = (root.getAttribute("viewBox") ?? "").split(/\s+/).map(Number);
	const height = vw > 0 && vh > 0 ? Math.round((width * vh) / vw) : width;
	root.setAttribute("width", String(width));
	root.setAttribute("height", String(height));
	const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(root)], { type: "image/svg+xml" }));
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;
			canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
			URL.revokeObjectURL(url);
			canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error("image load failed"));
		};
		img.src = url;
	});
}

/* ---------- tool ---------- */

export function CustomTool() {
	const [text, setText] = useState("");
	const [config, setConfig] = useState<Cfg>(DEFAULT_CONFIG);
	const [live, setLive] = useState(true);
	const [frozen, setFrozen] = useState<{ text: string; config: Cfg } | null>(null);
	const [preset, setPreset] = useState("");
	const [badgeName, setBadgeName] = useState("");
	const [pngSize, setPngSize] = useState(512);
	const [fileName, setFileName] = useState(DEFAULT_FILE);
	const [note, setNote] = useState("");

	const set: Setter = (key, value) => setConfig((prev) => ({ ...prev, [key]: value }));
	const apply = (partial: Partial<Cfg>) => setConfig((prev) => normalizeConfig({ ...prev, ...partial }));

	// Incoming ?data= from other tools, and the saved badge image.
	useEffect(() => {
		const data = new URLSearchParams(window.location.search).get("data")?.trim();
		if (data) setText(data);
		try {
			const saved = JSON.parse(localStorage.getItem(BADGE_KEY) ?? "null");
			if (typeof saved?.dataUrl === "string" && saved.dataUrl.startsWith("data:image/")) {
				set("badgeImage", saved.dataUrl);
				setBadgeName(saved.name || "Saved badge image");
			}
		} catch {
			// ignore malformed storage
		}
	}, []);

	const shown = live ? { text: text.trim(), config } : frozen;

	const result = useMemo(() => {
		if (!shown?.text) return { svg: "", error: "" };
		try {
			return { svg: renderCustomSvg(shown.text, shown.config), error: "" };
		} catch {
			return { svg: "", error: "Data too long for current settings. Try shorter text or lower error correction." };
		}
	}, [shown?.text, shown?.config]);

	const status = note || result.error || (shown?.text ? "" : "Enter text to generate.");

	function setBadge(dataUrl: string, name: string) {
		set("badgeImage", dataUrl);
		setBadgeName(name);
		try {
			if (dataUrl) localStorage.setItem(BADGE_KEY, JSON.stringify({ dataUrl, name }));
			else localStorage.removeItem(BADGE_KEY);
		} catch {
			// quota / private mode
		}
	}

	function onBadgeFile(file: File | undefined) {
		if (!file) return;
		if (!file.type.startsWith("image/")) return setNote("Please upload an image file for the center badge.");
		const reader = new FileReader();
		reader.onload = () => {
			const url = String(reader.result ?? "");
			if (!url.startsWith("data:image/")) return setNote("Could not read image. Try a different file.");
			setNote("");
			setBadge(url, file.name);
		};
		reader.onerror = () => setNote("Could not read image.");
		reader.readAsDataURL(file);
	}

	function reset() {
		setText("");
		setConfig(DEFAULT_CONFIG);
		setLive(true);
		setFrozen(null);
		setPreset("");
		setPngSize(512);
		setFileName(DEFAULT_FILE);
		setNote("");
		setBadge("", "");
	}

	async function exportPng() {
		try {
			downloadBlob(await svgToPng(result.svg, pngSize), `${safeFilename(fileName)}.png`);
		} catch {
			setNote("PNG export failed.");
		}
	}

	const p = { c: config, set };

	return (
		<div className="two-col">
			<div className="options-col">
				<fieldset className="control-section">
					<legend>Content</legend>
					<div className="field-group">
						<label className="field-label" htmlFor="qr-input">
							Text or URL
						</label>
						<textarea
							id="qr-input"
							className="text-input text-area"
							rows={3}
							placeholder="https://example.com or any text..."
							autoComplete="off"
							spellCheck={false}
							value={text}
							onChange={(e) => {
								setText(e.target.value);
								setNote("");
							}}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									setFrozen({ text: text.trim(), config });
								}
							}}
						/>
					</div>
					<div className="check-row">
						<label>
							<input
								type="checkbox"
								checked={live}
								onChange={(e) => {
									setLive(e.target.checked);
									setFrozen({ text: text.trim(), config });
								}}
							/>{" "}
							Live preview
						</label>
						<Check k="invertModules" label="Invert modules" {...p} />
					</div>
				</fieldset>

				<fieldset className="control-section">
					<legend>Geometry</legend>
					<div className="field-grid two-up">
						<Range k="cellSize" label="Cell size" unit="px" {...p} />
						<Range k="quietZone" label="Quiet zone" unit=" modules" {...p} />
						<Range k="moduleScale" label="Module scale" unit="x" {...p} />
						<Range k="moduleRoundness" label="Roundness" {...p} />
					</div>
					<div className="field-grid two-up">
						<Select k="errorLevel" label="Error correction" options={ECC_LABELS} {...p} />
						<Select k="moduleStyle" label="Module style" options={pick(MODULE_STYLES, MODULE_LABELS)} {...p} />
					</div>
				</fieldset>

				<fieldset className="control-section">
					<legend>Colors and gradients</legend>
					<div className="field-grid two-up">
						<Color k="fg" label="Foreground" {...p} />
						<Color k="bg" label="Background" {...p} />
					</div>
					<div className="check-row">
						<Check k="transparentBg" label="Transparent background" {...p} />
						<Check k="useGradient" label="Gradient fill" {...p} />
						<Check k="gradientEyes" label="Gradient on eyes" {...p} />
					</div>
					<div className={config.useGradient ? "" : "disabled-controls"} style={{ display: "grid", gap: "0.75rem" }}>
						<div className="field-grid three-up">
							<Color k="gradStart" label="Gradient start" {...p} />
							<Color k="gradEnd" label="Gradient end" {...p} />
							<Select k="gradientType" label="Gradient type" options={{ linear: "Linear", radial: "Radial" }} {...p} />
						</div>
						<Range k="gradientAngle" label="Gradient angle" unit="deg" {...p} />
					</div>
				</fieldset>

				<fieldset className="control-section">
					<legend>Finder eyes</legend>
					<div className="field-grid two-up">
						<Select k="eyeOuterStyle" label="Outer eye style" options={pick(EYE_STYLES, EYE_LABELS)} {...p} />
						<Select k="eyeInnerStyle" label="Inner eye style" options={pick(EYE_STYLES, EYE_LABELS)} {...p} />
						<Color k="eyeOuterColor" label="Outer eye color" {...p} />
						<Color k="eyeInnerColor" label="Inner eye color" {...p} />
					</div>
				</fieldset>

				<fieldset className="control-section">
					<legend>Frame and center badge</legend>
					<div className="field-grid two-up">
						<Select k="frameStyle" label="Frame style" options={pick(FRAME_STYLES, FRAME_LABELS)} {...p} />
						<Range k="framePadding" label="Frame padding" unit=" modules" {...p} />
						<Range k="frameRadius" label="Frame radius" unit="px" {...p} />
						<Color k="frameColor" label="Frame color" {...p} />
					</div>
					<div className="field-grid two-up">
						<div className="field-group">
							<label className="field-label" htmlFor="badge-image">
								Center badge image
							</label>
							<input
								id="badge-image"
								type="file"
								accept="image/*"
								className="text-input"
								style={{ padding: "0.45rem 0.6rem" }}
								onChange={(e) => {
									onBadgeFile(e.target.files?.[0]);
									e.target.value = "";
								}}
							/>
						</div>
						<div className="field-group">
							<span className="field-label">Image</span>
							<div className="actions compact-actions">
								{config.badgeImage && (
									<img className="badge-preview" src={config.badgeImage} alt="Badge preview" />
								)}
								<button className="ghost-button" type="button" onClick={() => setBadge("", "")} disabled={!config.badgeImage}>
									Remove
								</button>
							</div>
							<p className="muted-note">{badgeName || "No image selected."}</p>
						</div>
					</div>
					<div className="field-grid three-up">
						<Select k="badgeShape" label="Badge shape" options={pick(BADGE_SHAPES, { rounded: "Rounded", square: "Square", circle: "Circle" })} {...p} />
						<Range k="badgeSize" label="Badge size" unit="%" {...p} />
						<Select k="badgeImageFit" label="Image fit" options={{ cover: "Cover", contain: "Contain" }} {...p} />
					</div>
					<div className="field-grid two-up">
						<Color k="badgeBg" label="Badge background" {...p} />
					</div>
					<div className="check-row">
						<Check k="badgeKnockout" label="Clear modules under badge" {...p} />
					</div>
				</fieldset>

				<fieldset className="control-section">
					<legend>Text below QR</legend>
					<div className="check-row">
						<Check k="showCaption" label="Show text below QR" {...p} />
					</div>
					<div className={`field-grid three-up${config.showCaption ? "" : " disabled-controls"}`}>
						<div className="field-group">
							<label className="field-label" htmlFor="caption-text">
								Caption
							</label>
							<input
								id="caption-text"
								type="text"
								className="text-input"
								maxLength={80}
								placeholder="Scan to visit"
								value={config.captionText}
								onChange={(e) => set("captionText", e.target.value)}
							/>
						</div>
						<Range k="captionSize" label="Caption size" unit="px" {...p} />
						<Color k="captionColor" label="Caption color" {...p} />
					</div>
				</fieldset>

				<fieldset className="control-section">
					<legend>Effects and export</legend>
					<div className="check-row">
						<Check k="useShadow" label="Shadow" {...p} />
					</div>
					<div className={`field-grid three-up${config.useShadow ? "" : " disabled-controls"}`}>
						<Range k="shadowBlur" label="Shadow blur" {...p} />
						<Range k="shadowOffset" label="Shadow offset" {...p} />
						<Color k="shadowColor" label="Shadow color" {...p} />
					</div>
					<div className="field-grid two-up">
						<div className="field-group">
							<label className="field-label" htmlFor="png-size">
								PNG size
							</label>
							<select id="png-size" className="text-input select-input" value={pngSize} onChange={(e) => setPngSize(Number(e.target.value))}>
								{PNG_SIZES.map((s) => (
									<option key={s} value={s}>
										{s} x {s}
									</option>
								))}
							</select>
						</div>
						<div className="field-group">
							<label className="field-label" htmlFor="file-name">
								File name
							</label>
							<input
								id="file-name"
								type="text"
								className="text-input"
								maxLength={50}
								spellCheck={false}
								value={fileName}
								onChange={(e) => setFileName(e.target.value)}
							/>
						</div>
					</div>
				</fieldset>

				<fieldset className="control-section">
					<legend>Presets</legend>
					<div className="field-grid two-up">
						<div className="field-group">
							<label className="field-label" htmlFor="preset">
								Quick style
							</label>
							<select
								id="preset"
								className="text-input select-input"
								value={preset}
								onChange={(e) => {
									setPreset(e.target.value);
									if (e.target.value) apply(PRESETS[e.target.value as PresetName]);
								}}
							>
								<option value="">Choose preset...</option>
								{Object.entries(PRESET_LABELS).map(([value, label]) => (
									<option key={value} value={value}>
										{label}
									</option>
								))}
							</select>
						</div>
						<div className="field-group">
							<span className="field-label">Actions</span>
							<div className="actions compact-actions">
								<button className="ghost-button" type="button" onClick={() => apply(randomConfig())}>
									Randomize
								</button>
								<button className="button" type="button" onClick={() => setFrozen({ text: text.trim(), config })}>
									Generate
								</button>
								<button className="ghost-button" type="button" onClick={reset}>
									Reset
								</button>
							</div>
						</div>
					</div>
				</fieldset>

				<p className="muted-note" aria-live="polite">
					{status}
				</p>
			</div>

			<div className="preview-col">
				{result.svg ? (
					<div
						className={`qr-preview${config.showCaption && config.captionText ? " preview-tall" : ""}`}
						dangerouslySetInnerHTML={{ __html: result.svg }}
					/>
				) : (
					<div className="qr-preview">
						<p className="preview-placeholder">{result.error ? "Could not generate QR." : "Preview will appear here."}</p>
					</div>
				)}
				<p className="muted-note preview-note">Tip: for print, use Q or H error correction.</p>
				{result.svg && (
					<div className="actions download-actions">
						<button className="ghost-button" type="button" onClick={() => downloadSvg(result.svg, `${safeFilename(fileName)}.svg`)}>
							Download SVG
						</button>
						<button className="ghost-button" type="button" onClick={exportPng}>
							Download PNG
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
