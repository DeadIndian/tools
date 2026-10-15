import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
	// Left unbundled so OpenNext resolves it with the "workerd" export condition. Bundled by Next,
	// it picks the Node shim (Ajv), which uses new Function and crashes on Cloudflare Workers.
	serverExternalPackages: ["@modelcontextprotocol/server", "mcp-handler"],
	// Old static-site URLs (thisqr.works era). Printed QRs point at /socials/profile.html#...;
	// browsers carry the #hash across redirects, so those keep working.
	async redirects() {
		return [
			{ source: "/socials", destination: "/socials/create", permanent: true },
			{ source: "/socials/index.html", destination: "/socials/create", permanent: true },
			{ source: "/socials/create.html", destination: "/socials/create", permanent: true },
			{ source: "/socials/profile.html", destination: "/socials/profile", permanent: true },
			{ source: "/:tool(qr|custom|decode)/index.html", destination: "/:tool", permanent: true },
		];
	},
};

export default nextConfig;

initOpenNextCloudflareForDev();
