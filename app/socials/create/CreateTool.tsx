"use client";

import { useState } from "react";
import Link from "next/link";
import { plainSvg } from "@/lib/qr";
import { PLATFORMS, cleanMap, profileUrl } from "@/lib/social";
import { copySvg, copyText, customizeHref, downloadSvg } from "../../client-utils";

export function CreateTool() {
	const [values, setValues] = useState<Record<string, string>>({});
	const [link, setLink] = useState("");
	const [svg, setSvg] = useState("");
	const [status, setStatus] = useState("All fields are optional.");

	function submit(e: React.FormEvent) {
		e.preventDefault();
		const map = cleanMap(values);
		if (Object.keys(map).length === 0) {
			setLink("");
			setSvg("");
			return setStatus("Add at least one handle to generate a QR.");
		}
		// Same origin as the page, so self-hosted copies link to themselves.
		const url = profileUrl(map, window.location.origin);
		setLink(url);
		setSvg(plainSvg(url));
		setStatus("");
	}

	function clear() {
		setValues({});
		setLink("");
		setSvg("");
		setStatus("All fields are optional.");
	}

	return (
		<>
			<form onSubmit={submit} noValidate>
				<div className="social-grid">
					{PLATFORMS.map((p) => (
						<div key={p.code} className="field-group">
							<label className="field-label" htmlFor={`${p.code}-id`}>
								{p.label}
							</label>
							<input
								id={`${p.code}-id`}
								className="text-input"
								type="text"
								autoComplete={p.autoComplete}
								placeholder={p.placeholder}
								value={values[p.code] ?? ""}
								onChange={(e) => setValues({ ...values, [p.code]: e.target.value })}
							/>
							<p className="helper-text">{p.helper}</p>
						</div>
					))}
				</div>
				<div className="actions">
					<button className="button" type="submit">
						Generate QR
					</button>
					<button className="ghost-button" type="button" onClick={clear}>
						Clear
					</button>
					<span className="muted-note" aria-live="polite">
						{status}
					</span>
				</div>
			</form>

			{link && (
				<>
					<div className="output-block">
						<div className="output-row">
							<input className="text-input mono" type="text" readOnly value={link} aria-label="Shareable link" />
							<button className="ghost-button" type="button" onClick={async () => setStatus(await copyText(link, "Link copied."))}>
								Copy link
							</button>
						</div>
					</div>
					<div className="qr-panel">
						<div className="qr-preview" dangerouslySetInnerHTML={{ __html: svg }} />
						<div className="actions">
							<button className="ghost-button" type="button" onClick={() => downloadSvg(svg, "tools-socials.svg")}>
								Download SVG
							</button>
							<button className="ghost-button" type="button" onClick={async () => setStatus(await copySvg(svg))}>
								Copy SVG
							</button>
							<Link className="ghost-button" href={customizeHref(link)}>
								Customize
							</Link>
						</div>
					</div>
				</>
			)}
		</>
	);
}
