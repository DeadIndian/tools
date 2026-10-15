"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { prepareZXingModule } from "zxing-wasm/reader";
import { decodeRgba } from "@/lib/decode";

// ZXing's .wasm is served from this site (copied into public/ by `npm run zxing`), not a CDN.
prepareZXingModule({ overrides: { locateFile: (file: string) => `/${file}` } });
import { copyText } from "../client-utils";

const isUrl = (s: string) => /^https?:\/\//i.test(s) && URL.canParse(s);

let canvas: HTMLCanvasElement | undefined; // reused across camera frames

function pixels(source: CanvasImageSource, width: number, height: number) {
	canvas ??= document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
	// White first: transparent pixels read back as black, which hides dark-on-transparent codes.
	ctx.fillStyle = "#fff";
	ctx.fillRect(0, 0, width, height);
	ctx.drawImage(source, 0, 0, width, height);
	return ctx.getImageData(0, 0, width, height);
}

export function DecodeTool() {
	const [tab, setTab] = useState<"upload" | "camera">("upload");
	const [result, setResult] = useState("");
	const [status, setStatus] = useState("Ready.");
	const [hint, setHint] = useState("Drop an image here, paste one, or click to browse");
	const [dragging, setDragging] = useState(false);
	const [cameraOn, setCameraOn] = useState(false);
	const [cameraStatus, setCameraStatus] = useState("Camera not started.");
	const fileInput = useRef<HTMLInputElement>(null);
	const video = useRef<HTMLVideoElement>(null);
	const stream = useRef<MediaStream | null>(null);
	const loop = useRef(0);
	const lastScan = useRef("");

	const decodeFile = useCallback(async (file: File | undefined | null) => {
		if (!file?.type.startsWith("image/")) return setStatus("Please select an image file.");
		setResult("");
		setHint(file.name);
		setStatus("Reading image...");
		try {
			const bitmap = await createImageBitmap(file);
			const img = pixels(bitmap, bitmap.width, bitmap.height);
			const data = await decodeRgba(img.data, img.width, img.height);
			if (data === null) return setStatus("No QR code found. Make sure the image is clear and well-lit.");
			setResult(data);
			setStatus("QR decoded.");
		} catch {
			setStatus("Could not load image.");
		}
	}, []);

	const stopCamera = useCallback(() => {
		cancelAnimationFrame(loop.current);
		stream.current?.getTracks().forEach((t) => t.stop());
		stream.current = null;
		setCameraOn(false);
		setCameraStatus("Camera stopped.");
	}, []);

	async function startCamera() {
		setCameraStatus("Requesting camera access...");
		try {
			stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
			const v = video.current!;
			v.srcObject = stream.current;
			await v.play();
			setCameraOn(true);
			setCameraStatus("Scanning...");
			setResult("");
			lastScan.current = "";
			// One frame at a time: the next frame is grabbed only after the previous decode finishes.
			const scan = async () => {
				if (!stream.current) return;
				if (v.readyState >= v.HAVE_ENOUGH_DATA) {
					const img = pixels(v, v.videoWidth, v.videoHeight);
					const data = await decodeRgba(img.data, img.width, img.height);
					if (data !== null && data !== lastScan.current && stream.current) {
						lastScan.current = data;
						setResult(data);
						setCameraStatus("QR code found.");
					}
				}
				if (stream.current) loop.current = requestAnimationFrame(scan);
			};
			scan();
		} catch (err) {
			const e = err as Error;
			setCameraStatus(
				e.name === "NotAllowedError"
					? "Camera access denied. Allow camera access and try again."
					: `Could not start camera: ${e.message}`,
			);
		}
	}

	// Paste an image anywhere on the page (upload tab only).
	useEffect(() => {
		if (tab !== "upload") return;
		const onPaste = (e: ClipboardEvent) => {
			const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith("image/"));
			if (item) decodeFile(item.getAsFile());
		};
		document.addEventListener("paste", onPaste);
		return () => document.removeEventListener("paste", onPaste);
	}, [tab, decodeFile]);

	useEffect(() => stopCamera, [stopCamera]);

	// Fetch + compile the decoder now, so the first scan doesn't wait on the ~1 MB download.
	useEffect(() => {
		prepareZXingModule({ overrides: { locateFile: (file: string) => `/${file}` }, fireImmediately: true });
	}, []);

	function switchTab(next: "upload" | "camera") {
		if (next === tab) return;
		setTab(next);
		setResult("");
		if (next === "upload") {
			stopCamera();
			setStatus("Ready.");
		} else {
			setCameraStatus("Camera not started.");
		}
	}

	return (
		<>
			<div className="tab-bar" role="tablist" aria-label="Input method">
				{(["upload", "camera"] as const).map((t) => (
					<button
						key={t}
						className="tab"
						role="tab"
						type="button"
						aria-selected={tab === t}
						aria-controls={`panel-${t}`}
						onClick={() => switchTab(t)}
					>
						{t === "upload" ? "Upload image" : "Use camera"}
					</button>
				))}
			</div>

			<div id="panel-upload" role="tabpanel" hidden={tab !== "upload"}>
				<div
					className={`drop-zone${dragging ? " dragover" : ""}`}
					tabIndex={0}
					role="button"
					aria-label="Click or drop an image here to decode"
					onClick={() => fileInput.current?.click()}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							fileInput.current?.click();
						}
					}}
					onDragOver={(e) => {
						e.preventDefault();
						setDragging(true);
					}}
					onDragLeave={() => setDragging(false)}
					onDrop={(e) => {
						e.preventDefault();
						setDragging(false);
						decodeFile(e.dataTransfer.files[0]);
					}}
				>
					{hint}
				</div>
				<input
					ref={fileInput}
					type="file"
					accept="image/*"
					className="visually-hidden"
					aria-label="Choose QR code image"
					onChange={(e) => decodeFile(e.target.files?.[0])}
				/>
			</div>

			<div id="panel-camera" role="tabpanel" hidden={tab !== "camera"}>
				<div className="camera-wrap">
					<video ref={video} autoPlay muted playsInline aria-label="Camera feed" />
					<div className="scan-overlay" aria-hidden="true">
						<div className="scan-frame" />
					</div>
				</div>
				<div className="actions" style={{ marginTop: "1rem" }}>
					{cameraOn ? (
						<button className="ghost-button" type="button" onClick={stopCamera}>
							Stop camera
						</button>
					) : (
						<button className="button" type="button" onClick={startCamera}>
							Start camera
						</button>
					)}
					<span className="muted-note" aria-live="polite">
						{cameraStatus}
					</span>
				</div>
			</div>

			{result && (
				<div className="result-panel">
					<label className="field-label" htmlFor="result-text">
						Decoded content
					</label>
					<textarea id="result-text" className="text-input text-area mono" readOnly rows={4} value={result} />
					<div className="actions">
						<button className="ghost-button" type="button" onClick={async () => setStatus(await copyText(result))}>
							Copy
						</button>
						{isUrl(result) && (
							<a className="ghost-button" href={result} target="_blank" rel="noopener noreferrer">
								Open URL
							</a>
						)}
					</div>
				</div>
			)}

			{tab === "upload" && (
				<p className="muted-note" aria-live="polite" style={{ marginTop: "0.75rem" }}>
					{status}
				</p>
			)}
		</>
	);
}
