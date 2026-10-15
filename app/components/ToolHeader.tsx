import Link from "next/link";
import { SITE, TOOLS } from "@/lib/site";

/** Top bar for tool pages: wordmark home link + sibling tools in the same category. */
export function ToolHeader({ current }: { current: string }) {
	const category = TOOLS.find((t) => t.href === current)?.category;
	const siblings = TOOLS.filter((t) => t.category === category && t.href !== current);
	return (
		<header className="site-header">
			<Link href="/" className="brand-link">
				{SITE.name}
			</Link>
			<nav className="header-nav" aria-label="Related tools">
				{siblings.map((t) => (
					<Link key={t.href} className="quiet-link" href={t.href}>
						{t.name}
					</Link>
				))}
			</nav>
		</header>
	);
}
