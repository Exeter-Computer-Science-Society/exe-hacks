import { AdminConsole } from "../components/AdminConsole"

export const metadata = {
	title: "Admin: ExeHacks",
	robots: { index: false, follow: false },
}

export default function AdminPage() {
	return (
		<div className="w-full h-fit">
			<section className="band">
				<div className="wrap sponsor-page">
					<div className="section-head">
						<span className="section-tag">ExeHacks admin</span>
						<h1 className="h-section">Signups</h1>
						<p className="lead">
							Interest registrations, newest first. Other D1 tables show up here when they exist, including a future
							registrations table.
						</p>
					</div>
					<AdminConsole />
				</div>
			</section>
		</div>
	)
}
