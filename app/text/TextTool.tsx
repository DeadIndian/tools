"use client";

import { useState } from "react";
import { STYLES, STYLE_NAMES, stripMarkup, styleMarkup, styleText, unstyleText } from "@/lib/text-style";
import { copyText } from "../client-utils";

const SAMPLE = "Your **text** here";

export function TextTool() {
	const [text, setText] = useState("");
	const [copied, setCopied] = useState("");
	const source = text || SAMPLE;
	const plain = unstyleText(stripMarkup(source));

	const rows: [string, string][] = [
		["Your marks", styleMarkup(source)],
		...STYLE_NAMES.map((name): [string, string] => [STYLES[name].label, styleText(plain, name)]),
		["Plain", plain],
	];

	async function copy(label: string, value: string) {
		const msg = await copyText(value, "Copied");
		setCopied(msg === "Copied" ? label : "");
	}

	return (
		<>
			<div className="field-group" style={{ marginBottom: "1.25rem" }}>
				<label className="field-label" htmlFor="text-input">
					Your text
				</label>
				<textarea
					id="text-input"
					className="text-input text-area"
					rows={3}
					placeholder={SAMPLE}
					spellCheck={false}
					autoFocus
					value={text}
					onChange={(e) => {
						setText(e.target.value);
						setCopied("");
					}}
				/>
				<p className="helper-text">
					Style parts with <code>**bold**</code> <code>*italic*</code> <code>***bold italic***</code>{" "}
					<code>`mono`</code>
				</p>
			</div>

			<ul className="style-list">
				{rows.map(([label, value]) => (
					<li key={label} className="style-row">
						<span className="style-label">{label}</span>
						<span className="style-output">{value}</span>
						<button className="ghost-button" type="button" disabled={!text} onClick={() => copy(label, value)}>
							{copied === label ? "Copied" : "Copy"}
						</button>
					</li>
				))}
			</ul>
		</>
	);
}
