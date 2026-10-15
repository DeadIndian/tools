// Browser-only helpers shared by tool components.

export function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.rel = "noopener";
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadSvg(svg: string, filename: string) {
	downloadBlob(new Blob([svg], { type: "image/svg+xml" }), filename);
}

/** Copies SVG as an image where supported, else as text. Returns a status message. */
export async function copySvg(svg: string): Promise<string> {
	if (navigator.clipboard && "ClipboardItem" in window) {
		try {
			await navigator.clipboard.write([new ClipboardItem({ "image/svg+xml": new Blob([svg], { type: "image/svg+xml" }) })]);
			return "SVG copied.";
		} catch {
			// fall through to text copy
		}
	}
	return copyText(svg, "SVG copied as text.");
}

export async function copyText(text: string, ok = "Copied."): Promise<string> {
	try {
		await navigator.clipboard.writeText(text);
		return ok;
	} catch {
		return "Copy not available in this browser.";
	}
}

export const customizeHref = (data: string) => (data ? `/custom?data=${encodeURIComponent(data)}` : "/custom");
