import type { Metadata } from "next";
import { SITE, tool } from "@/lib/site";

export function toolMetadata(href: string, extra: Metadata = {}): Metadata {
	const t = tool(href);
	return {
		title: t.name,
		description: `${t.description} Free, no login.`,
		alternates: { canonical: href },
		openGraph: { title: `${t.name} | ${SITE.name}`, description: t.description, url: href },
		...extra,
	};
}

export function toolJsonLd(href: string) {
	const t = tool(href);
	return {
		"@context": "https://schema.org",
		"@type": "WebApplication",
		name: t.name,
		url: `${SITE.url}${href}`,
		description: t.description,
		applicationCategory: "UtilitiesApplication",
		operatingSystem: "Any",
		offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
		author: { "@type": "Person", name: SITE.author, url: SITE.authorUrl },
	};
}
