import { ToolHeader } from "../../components/ToolHeader";
import { JsonLd } from "../../components/JsonLd";
import { toolMetadata, toolJsonLd } from "../../tool-meta";
import { CreateTool } from "./CreateTool";

export const metadata = toolMetadata("/socials/create");

export default function Page() {
	return (
		<>
			<JsonLd data={toolJsonLd("/socials/create")} />
			<ToolHeader current="/socials/create" />
			<main className="content">
				<section className="create-card wide">
					<h1 className="card-title">Social Links QR</h1>
					<p className="card-lede">
						Add your handles, get one link and one QR. The data lives in the link itself, so nothing is stored.
					</p>
					<CreateTool />
				</section>
			</main>
		</>
	);
}
