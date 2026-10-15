import { SITE } from "@/lib/site";
import { ToolHeader } from "../components/ToolHeader";
import { JsonLd } from "../components/JsonLd";
import { toolMetadata, toolJsonLd } from "../tool-meta";
import { TextTool } from "./TextTool";

export const metadata = toolMetadata("/text", {
	title: "Bold & Italic Text Generator (Unicode)",
	description:
		"Convert text to Unicode bold, italic, monospace and more for LinkedIn, X, Instagram and other plain-text fields. Free, no login, also an MCP tool for agents.",
});

const FAQ: [string, React.ReactNode][] = [
	[
		"How does this work?",
		"Unicode has separate characters that look like bold, italic and other styled letters (the Mathematical Alphanumeric Symbols block). They are text, not formatting, so they paste anywhere plain text goes.",
	],
	[
		"Where can I use it?",
		"LinkedIn posts, comments and headlines, X, Instagram bios and captions, YouTube titles, Discord, and most places that show Unicode text. A few fields (some usernames and display names) strip or reject them.",
	],
	[
		"How do I style only part of the text?",
		<>
			Wrap it: <code>**bold**</code>, <code>*italic*</code>, <code>***bold italic***</code>, <code>`monospace`</code>. The
			&ldquo;Your marks&rdquo; row converts only the wrapped parts.
		</>,
	],
	[
		"Why are some characters not styled?",
		"Unicode only has styled versions of A–Z, a–z and, for some styles, 0–9. Punctuation, emoji and other alphabets stay as they are. Accented letters keep their accent, attached to the styled letter.",
	],
	[
		"Why are links, #hashtags and @mentions left plain?",
		"Styled letters are different characters. A styled hashtag no longer matches the real one, mentions stop linking, and links break. So they are skipped on purpose.",
	],
	[
		"Any downsides?",
		"Screen readers may read styled letters one by one or skip them, and search (including LinkedIn's) won't match styled words. Use it for a heading or a few words, not whole paragraphs. Each styled letter is also two UTF-16 units, so some sites count it as two characters.",
	],
	["Can I undo it?", "Yes. Paste styled text in; the “Plain” row gives the normal text back."],
	[
		"Can my AI agent do this?",
		<>
			Yes. Connect the MCP server at <code>{SITE.url}/api/mcp</code> and use <code>text_style</code> (with{" "}
			<code>**marks**</code> or a whole-text style) and <code>text_unstyle</code>. <a href="/#mcp">Setup</a>.
		</>,
	],
	["Is my text sent anywhere?", "No. Conversion runs in your browser."],
];

export default function Page() {
	return (
		<>
			<JsonLd data={toolJsonLd("/text")} />
			<ToolHeader current="/text" />
			<main className="content">
				<section className="create-card wide">
					<h1 className="card-title">Bold &amp; Italic Text</h1>
					<p className="card-lede">Styled text for places that only take plain text. Type, then copy the style you want.</p>
					<TextTool />
					<h2 className="section-title" style={{ marginTop: "2.5rem" }}>
						Questions
					</h2>
					{FAQ.map(([q, a]) => (
						<details key={q} className="faq-item">
							<summary className="faq-question">{q}</summary>
							<p className="faq-answer">{a}</p>
						</details>
					))}
				</section>
			</main>
		</>
	);
}
