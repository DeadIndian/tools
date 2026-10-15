import type { Metadata, Viewport } from "next";
import { SITE } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
	metadataBase: new URL(SITE.url),
	title: { default: `${SITE.name}: ${SITE.tagline}`, template: `%s | ${SITE.name}` },
	description: SITE.description,
	authors: [{ name: SITE.author, url: SITE.authorUrl }],
	creator: SITE.author,
	alternates: { canonical: "/" },
	openGraph: { type: "website", siteName: SITE.name, url: SITE.url },
	twitter: { card: "summary" },
	icons: {
		icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/favicon.svg", type: "image/svg+xml" }],
		apple: "/apple-touch-icon.png",
	},
};

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#fafafa" },
		{ media: "(prefers-color-scheme: dark)", color: "#0f1115" },
	],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>
				{children}
				<footer className="site-footer">
					<small>
						by{" "}
						<a href={SITE.authorUrl} rel="author">
							{SITE.author}
						</a>{" "}
						· <a href={SITE.repoUrl}>source</a> · <a href="/#mcp">MCP</a>
					</small>
				</footer>
			</body>
		</html>
	);
}
