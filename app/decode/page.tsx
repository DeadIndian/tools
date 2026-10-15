import { ToolHeader } from "../components/ToolHeader";
import { JsonLd } from "../components/JsonLd";
import { toolMetadata, toolJsonLd } from "../tool-meta";
import { DecodeTool } from "./DecodeTool";

export const metadata = toolMetadata("/decode");

export default function Page() {
	return (
		<>
			<JsonLd data={toolJsonLd("/decode")} />
			<ToolHeader current="/decode" />
			<main className="content">
				<section className="create-card">
					<h1 className="card-title">QR Decoder</h1>
					<p className="card-lede">Drop, paste, or pick an image. Or scan with your camera.</p>
					<DecodeTool />
				</section>
			</main>
		</>
	);
}
