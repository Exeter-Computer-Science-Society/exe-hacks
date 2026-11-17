import { AdminNav } from "../components/AdminNav"
import { CommandCentre } from "../components/CommandCentre"

export const metadata = {
	title: "Command Centre: ExeHacks admin",
	robots: { index: false, follow: false },
}

// Static shell only. Everything on this page loads from /api/admin/overview after
// Cloudflare Access and the Worker allow-list have checked who is asking.
export default function AdminPage() {
	return (
		<div className="w-full h-fit">
			<section className="band">
				<div className="wrap sponsor-page">
					<div className="section-head">
						<span className="section-tag">ExeHacks admin</span>
						<h1 className="h-section">Command Centre</h1>
						<p className="lead">
							Everything for ExeHacks 2027 in one place. Counts are live from the site database. Anyone on the team can add, tick off or edit items below.
						</p>
					</div>
					<AdminNav base="/admin" current="" />
					<CommandCentre />
				</div>
			</section>
		</div>
	)
}
