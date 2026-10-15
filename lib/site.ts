export const SITE = {
	name: "tools",
	url: "https://tools.golla.in",
	tagline: "Small tools. No BS.",
	description:
		"Small, free web tools with no login and no signup. Also an MCP server, so agents can use them too.",
	author: "DeadIndian",
	authorUrl: "https://github.com/DeadIndian",
	repoUrl: "https://github.com/DeadIndian/tools",
};

export type Tool = {
	href: string;
	name: string;
	description: string;
	category: string;
};

// Single source for the homepage, sitemap, and page metadata. New tool = new entry + new page.
export const TOOLS: Tool[] = [
	{
		href: "/qr",
		name: "QR Generator",
		description: "Text or URL in, QR out. Download SVG.",
		category: "QR",
	},
	{
		href: "/custom",
		name: "Custom QR",
		description: "Colors, shapes, gradients, frames, logo. Export SVG or PNG.",
		category: "QR",
	},
	{
		href: "/decode",
		name: "QR Decoder",
		description: "Read a QR from an image, paste, or camera.",
		category: "QR",
	},
	{
		href: "/socials/create",
		name: "Social Links QR",
		description: "One QR for all your social profiles.",
		category: "QR",
	},
];

export function tool(href: string): Tool {
	const found = TOOLS.find((t) => t.href === href);
	if (!found) throw new Error(`unknown tool ${href}`);
	return found;
}
