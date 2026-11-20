import { AdminConsole } from "../components/AdminConsole"
import { OrganiserNav } from "../components/OrganiserNav"
import { PageWindow } from "../components/chrome/PageWindow"

export const metadata = {
	title: "Admin: ExeHacks",
	robots: { index: false, follow: false },
}

export default function AdminPage() {
	return (
		<PageWindow title="admin.exe">
			<div className="sponsor-page">
					<div className="section-head">
						<span className="section-tag">ExeHacks admin</span>
						<h1 className="h-section">Signups</h1>
						<p className="lead">
							Interest registrations, core-team applications (team_applications) and hacker applications (hacker_applications), newest first. Pick a table to view or
							download it as CSV. Other D1 tables show up here when they exist.
						</p>
					</div>
					<OrganiserNav />
					<AdminConsole />
			</div>
		</PageWindow>
	)
}
