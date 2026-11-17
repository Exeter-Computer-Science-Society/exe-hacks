import { AdminNav } from "../../components/AdminNav"
import { ApplicationsReview } from "../../components/ApplicationsReview"

export const metadata = {
	title: "Applications: ExeHacks team",
	robots: { index: false, follow: false },
}

// Static shell. Data loads from /api/team after the Worker checks who is asking.
export default function ApplicationsPage() {
	return (
		<div className="w-full h-fit">
			<section className="band">
				<div className="wrap sponsor-page">
					<div className="section-head">
						<span className="section-tag">ExeHacks team</span>
						<h1 className="h-section">Applications</h1>
						<p className="lead">Review each hacker application, record the decision and notes, and draft the decision email. AI suggestions are advice only: a reviewer always decides.</p>
					</div>
					<AdminNav base="/team" current="/applications" />
					<ApplicationsReview base="/team" />
				</div>
			</section>
		</div>
	)
}
