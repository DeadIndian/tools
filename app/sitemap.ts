import type { MetadataRoute } from "next";
import { SITE, TOOLS } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{ url: SITE.url, changeFrequency: "weekly", priority: 1 },
		...TOOLS.map((t) => ({ url: `${SITE.url}${t.href}`, changeFrequency: "monthly" as const, priority: 0.8 })),
	];
}
