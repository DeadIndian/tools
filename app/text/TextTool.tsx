"use client";

import { useRef, useState } from "react";
import {
	DECORATIONS,
	STYLES,
	STYLE_NAMES,
	X_LIMIT,
	decorate,
	hasDecoration,
	hasStyle,
	styleText,
	undecorate,
	unstyleLetters,
	unstyleText,
	xLength,
	type AnyStyle,
	type DecorationName,
	type StyleName,
} from "@/lib/text-style";
import { copyText } from "../client-utils";

const BUTTONS: { name: AnyStyle; face: string; title: string }[] = [
	{ name: "bold", face: "𝗕", title: "Bold (Ctrl+B)" },
	{ name: "italic", face: "𝘐", title: "Italic (Ctrl+I)" },
	{ name: "strikethrough", face: "S̶", title: "Strikethrough (Ctrl+Shift+X)" },
	{ name: "underline", face: "U̲", title: "Underline (Ctrl+U)" },
	{ name: "monospace", face: "𝙼", title: "Monospace (Ctrl+E)" },
];

const SHORTCUTS: Record<string, AnyStyle> = { b: "bold", i: "italic", u: "underline", e: "monospace", X: "strikethrough" };

const MORE = STYLE_NAMES.filter((n) => !BUTTONS.some((b) => b.name === n));

/** Toggle: if the selection already has the style, remove it; otherwise apply it. */
function toggle(text: string, name: AnyStyle): string {
	if (name in DECORATIONS) {
		const d = name as DecorationName;
		return hasDecoration(text, d) ? undecorate(text, d) : decorate(text, d);
	}
	const s = name as StyleName;
	return hasStyle(text, s) ? unstyleLetters(text) : styleText(unstyleLetters(text), s);
}

function toggleBullets(text: string): string {
	const lines = text.split("\n");
	const all = lines.every((l) => !l.trim() || l.startsWith("• "));
	return lines.map((l) => (!l.trim() ? l : all ? l.slice(2) : `• ${l}`)).join("\n");
}

export function TextTool() {
	const [text, setText] = useState("");
	const [status, setStatus] = useState("");
	const [copied, setCopied] = useState("");
	const area = useRef<HTMLTextAreaElement>(null);

	/** Replaces the selection (or everything, if nothing is selected) and keeps it selected. */
	function edit(fn: (s: string) => string, wholeLines = false) {
		const ta = area.current!;
		let start = ta.selectionStart;
		let end = ta.selectionEnd;
		if (start === end) [start, end] = [0, ta.value.length];
		if (wholeLines) {
			start = ta.value.lastIndexOf("\n", start - 1) + 1;
			const nl = ta.value.indexOf("\n", end);
			end = nl === -1 ? ta.value.length : nl;
		}
		const next = fn(ta.value.slice(start, end));
		ta.focus();
		ta.setSelectionRange(start, end);
		// execCommand keeps the browser's own undo (Ctrl+Z) working; setRangeText is the fallback.
		if (!document.execCommand("insertText", false, next)) {
			ta.setRangeText(next, start, end, "end");
			setText(ta.value);
		}
		ta.setSelectionRange(start, start + next.length);
		setCopied("");
	}

	const count = xLength(text);
	const plain = unstyleText(text);

	return (
		<>
			<div className="editor">
				<div className="toolbar" role="toolbar" aria-label="Formatting">
					{BUTTONS.map((b) => (
						<button
							key={b.name}
							type="button"
							className="tool-btn"
							title={b.title}
							aria-label={b.title}
							onMouseDown={(e) => e.preventDefault()}
							onClick={() => edit((s) => toggle(s, b.name))}
						>
							{b.face}
						</button>
					))}
					<select
						className="tool-select"
						aria-label="More styles"
						value=""
						onChange={(e) => e.target.value && edit((s) => toggle(s, e.target.value as StyleName))}
					>
						<option value="">More…</option>
						{MORE.map((n) => (
							<option key={n} value={n}>
								{styleText(STYLES[n].label, n)}
							</option>
						))}
					</select>
					<span className="toolbar-gap" />
					<button type="button" className="tool-btn" title="Bullets" aria-label="Bullets" onMouseDown={(e) => e.preventDefault()} onClick={() => edit(toggleBullets, true)}>
						•
					</button>
					<button
						type="button"
						className="tool-btn wide"
						title="Remove all formatting"
						onMouseDown={(e) => e.preventDefault()}
						onClick={() => edit(unstyleText)}
					>
						Clear
					</button>
				</div>
				<textarea
					ref={area}
					id="text-input"
					className="editor-area"
					rows={7}
					aria-label="Your text"
					placeholder="Type or paste. Select words and press B, I, S, U… Nothing selected = whole text."
					spellCheck={false}
					autoFocus
					value={text}
					onChange={(e) => {
						setText(e.target.value);
						setCopied("");
						setStatus("");
					}}
					onKeyDown={(e) => {
						if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
						const name = SHORTCUTS[e.shiftKey ? e.key.toUpperCase() : e.key.toLowerCase()];
						if (!name || (e.shiftKey && name !== "strikethrough")) return;
						e.preventDefault();
						edit((s) => toggle(s, name));
					}}
				/>
				<div className="editor-foot">
					<span className={count > X_LIMIT ? "over" : ""} title="Counted the way X does: styled letters and emoji = 2, links = 23">
						X: {count} / {X_LIMIT}
					</span>
					<span className="muted-note" aria-live="polite">
						{status}
					</span>
					<button
						type="button"
						className="button"
						disabled={!text}
						onClick={async () => setStatus(await copyText(text, "Copied. Paste it anywhere."))}
					>
						Copy text
					</button>
				</div>
			</div>

			<details className="all-styles">
				<summary>Whole text in every style</summary>
				<ul className="style-list">
					{[...STYLE_NAMES, ...(Object.keys(DECORATIONS) as DecorationName[])].map((name) => {
						const label = name in DECORATIONS ? DECORATIONS[name as DecorationName].label : STYLES[name as StyleName].label;
						const source = plain || "Your text here";
						const value = name in DECORATIONS ? decorate(source, name as DecorationName) : styleText(source, name as StyleName);
						return (
							<li key={name} className="style-row">
								<span className="style-label">{label}</span>
								<span className="style-output">{value}</span>
								<button
									className="ghost-button"
									type="button"
									disabled={!text}
									onClick={async () => setCopied((await copyText(value, "ok")) === "ok" ? name : "")}
								>
									{copied === name ? "Copied" : "Copy"}
								</button>
							</li>
						);
					})}
				</ul>
			</details>
		</>
	);
}
