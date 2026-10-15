import { ToolHeader } from "../components/ToolHeader";
import { JsonLd } from "../components/JsonLd";
import { toolMetadata, toolJsonLd } from "../tool-meta";
import { QrTool } from "./QrTool";

export const metadata = toolMetadata("/qr");

export default function Page() {
	return (
		<>
			<JsonLd data={toolJsonLd("/qr")} />
			<ToolHeader current="/qr" />
			<main className="content">
				<section className="create-card">
					<h1 className="card-title">QR Generator</h1>
					<p className="card-lede">Paste text or a URL. Get a QR code.</p>
					<QrTool />
				</section>
			</main>
		</>
	);
}
