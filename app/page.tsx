import Link from "next/link";
import { SITE, TOOLS } from "@/lib/site";
import { JsonLd } from "./components/JsonLd";

const MCP_URL = `${SITE.url}/api/mcp`;

export default function Home() {
	const categories = [...new Set(TOOLS.map((t) => t.category))];
	return (
		<div className="home">
			<JsonLd
				data={{
					"@context": "https://schema.org",
					"@type": "WebSite",
					name: SITE.name,
					url: SITE.url,
					description: SITE.description,
					author: { "@type": "Person", name: SITE.author, url: SITE.authorUrl },
				}}
			/>
			<header className="hero">
				<h1 className="wordmark">{SITE.name}</h1>
				<p className="tagline">{SITE.tagline}</p>
			</header>

			<main>
				<p className="intro">
					Niche tools I use, open source so you can too. Open one, get what you came for, leave.
				</p>
				<div className="principles">
					{["No login", "No signup", "Free", "Runs in your browser", "Open source", "MCP ready"].map((p) => (
						<span key={p} className="principle-tag">
							{p}
						</span>
					))}
				</div>

				{categories.map((category) => (
					<section key={category} className="tools-section">
						<h2 className="section-title">{category}</h2>
						<div className="tools-grid">
							{TOOLS.filter((t) => t.category === category).map((t) => (
								<Link key={t.href} href={t.href} className="tool-card">
									<h3 className="tool-title">{t.name}</h3>
									<p className="tool-description">{t.description}</p>
								</Link>
							))}
						</div>
					</section>
				))}

				<section className="tools-section" id="mcp">
					<h2 className="section-title">For agents</h2>
					<p className="intro">
						Every tool is also an MCP tool. Point your agent at <code>{MCP_URL}</code>.
					</p>
					<pre className="code-block">
						<code>claude mcp add --transport http tools {MCP_URL}</code>
					</pre>
					<details className="faq-item">
						<summary className="faq-question">Other MCP clients</summary>
						<pre className="code-block">
							<code>{JSON.stringify({ mcpServers: { tools: { url: MCP_URL } } }, null, 2)}</code>
						</pre>
					</details>
				</section>

				<section className="tools-section">
					<h2 className="section-title">Quick answers</h2>
					<details className="faq-item">
						<summary className="faq-question">Do I need an account?</summary>
						<p className="faq-answer">No. Open a tool and start.</p>
					</details>
					<details className="faq-item">
						<summary className="faq-question">Is it free?</summary>
						<p className="faq-answer">Yes. All of it, and the code is on GitHub.</p>
					</details>
					<details className="faq-item">
						<summary className="faq-question">Is it private?</summary>
						<p className="faq-answer">
							The web tools run in your browser; nothing you type or upload is sent anywhere. The MCP
							endpoint processes requests and keeps nothing.
						</p>
					</details>
				</section>
			</main>
		</div>
	);
}
