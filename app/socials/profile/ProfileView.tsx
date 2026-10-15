"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PLATFORMS, cleanMap, decodePayload, type SocialMap } from "@/lib/social";

const ERRORS: Record<string, string> = {
	"empty-hash": "No profile data found.",
	"missing-s": "No recognized profile links available.",
	"no-platforms": "No recognized profile links available.",
	"invalid-structure": "Profile data is unavailable.",
};

export function ProfileView() {
	const [state, setState] = useState<{ map?: SocialMap; error?: string }>({});

	useEffect(() => {
		const read = () => {
			try {
				const map = cleanMap(decodePayload(window.location.hash) as Record<string, unknown>);
				if (Object.keys(map).length === 0) throw new Error("no-platforms");
				setState({ map });
			} catch (err) {
				setState({ error: ERRORS[(err as Error).message] ?? "Profile data could not be decoded." });
			}
		};
		read();
		window.addEventListener("hashchange", read);
		return () => window.removeEventListener("hashchange", read);
	}, []);

	if (!state.map) {
		return (
			<>
				<h1 className="card-title">Social profile</h1>
				<p className="card-lede" aria-live="polite">
					{state.error ?? "Loading profile..."}
				</p>
				{state.error && (
					<p className="muted-note">
						Profile links open from a social QR code. <Link href="/socials/create">Make your own.</Link>
					</p>
				)}
			</>
		);
	}

	return (
		<>
			<h1 className="card-title">Social profile</h1>
			<ul className="profile-links">
				{PLATFORMS.filter((p) => state.map![p.code]).map((p) => {
					const id = state.map![p.code]!;
					return (
						<li key={p.code}>
							<a className="profile-link" href={p.buildUrl(id)} target="_blank" rel="noopener noreferrer">
								<span className="platform-icon">
									<svg viewBox="0 0 24 24" aria-hidden="true">
										<path d={p.icon} />
									</svg>
								</span>
								<span>
									<span className="platform-name">{p.name}</span>
									<span className="platform-hint">{id}</span>
								</span>
							</a>
						</li>
					);
				})}
			</ul>
		</>
	);
}
