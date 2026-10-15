"use client";

import { useState } from "react";
import Link from "next/link";
import { plainSvg } from "@/lib/qr";
import { copySvg, customizeHref, downloadSvg } from "../client-utils";

export function QrTool() {
	const [text, setText] = useState("");
	const [svg, setSvg] = useState("");
	const [status, setStatus] = useState("Ready.");

	function generate() {
		const value = text.trim();
		setSvg("");
		if (!value) return setStatus("Enter some text or a URL first.");
		try {
			setSvg(plainSvg(value));
			setStatus("");
		} catch {
			setStatus("Data too long or unsupported. Try shorter input.");
		}
	}

	function clear() {
		setText("");
		setSvg("");
		setStatus("Ready.");
	}

	return (
		<>
			<div className="field-group" style={{ marginBottom: "1.25rem" }}>
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
					autoFocus
					value={text}
					onChange={(e) => setText(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							generate();
						}
					}}
				/>
			</div>

			<div className="actions">
				<button className="button" type="button" onClick={generate}>
					Generate QR
				</button>
				<button className="ghost-button" type="button" onClick={clear}>
					Clear
				</button>
				<span className="muted-note" aria-live="polite">
					{status}
				</span>
			</div>

			{svg && (
				<div className="qr-panel">
					<div className="qr-preview" dangerouslySetInnerHTML={{ __html: svg }} />
					<div className="actions">
						<button className="ghost-button" type="button" onClick={() => downloadSvg(svg, "tools-qr.svg")}>
							Download SVG
						</button>
						<button className="ghost-button" type="button" onClick={async () => setStatus(await copySvg(svg))}>
							Copy SVG
						</button>
						<Link className="ghost-button" href={customizeHref(text.trim())}>
							Customize
						</Link>
					</div>
				</div>
			)}
		</>
	);
}
