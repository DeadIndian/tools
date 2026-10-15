import type { Metadata } from "next";
import { ToolHeader } from "../../components/ToolHeader";
import { ProfileView } from "./ProfileView";

// Content lives in the URL hash, so there is nothing to index.
export const metadata: Metadata = {
	title: "Social profile",
	robots: { index: false, follow: true },
};

export default function Page() {
	return (
		<>
			<ToolHeader current="/socials/create" />
			<main className="content">
				<section className="create-card">
					<ProfileView />
				</section>
			</main>
		</>
	);
}
