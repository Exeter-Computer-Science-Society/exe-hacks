import { AdminConsole } from "../../components/AdminConsole"

export const metadata = {
	title: "Signups: ExeHacks team",
	robots: { index: false, follow: false },
}

export default function TeamSignupsPage() {
	return (
		<div className="w-full h-fit">
			<section className="band">
				<div className="wrap sponsor-page">
					<div className="section-head">
						<a className="section-tag admin-back" href="/team/">
							Command Centre
						</a>
						<h1 className="h-section">Signups</h1>
						<p className="lead">
							Interest registrations, core-team applications (team_applications) and hacker applications (hacker_applications), newest first. Pick a table to view or
							download it as CSV. Other D1 tables show up here when they exist.
						</p>
					</div>
					<AdminConsole base="/team" />
				</div>
			</section>
		</div>
	)
}
