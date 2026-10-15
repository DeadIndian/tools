import { ToolHeader } from "../components/ToolHeader";
import { JsonLd } from "../components/JsonLd";
import { toolMetadata, toolJsonLd } from "../tool-meta";
import { CustomTool } from "./CustomTool";

export const metadata = toolMetadata("/custom");

export default function Page() {
	return (
		<>
			<JsonLd data={toolJsonLd("/custom")} />
			<ToolHeader current="/custom" />
			<main className="content">
				<section className="create-card xwide">
					<h1 className="card-title">Custom QR</h1>
					<p className="card-lede">Style it your way, then export SVG or PNG.</p>
					<CustomTool />
				</section>
			</main>
		</>
	);
}
