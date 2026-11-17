import { AdminNav } from "../../components/AdminNav"
import { CheckIn } from "../../components/CheckIn"

export const metadata = {
	title: "Check-in: ExeHacks team",
	robots: { index: false, follow: false },
}

// Static shell. Data loads from /api/team after the Worker checks who is asking.
export default function CheckInPage() {
	return (
		<div className="w-full h-fit">
			<section className="band">
				<div className="wrap sponsor-page">
					<div className="section-head">
						<span className="section-tag">ExeHacks team</span>
						<h1 className="h-section">Check-in</h1>
						<p className="lead">Event day: find a hacker by name or email and check them in.</p>
					</div>
					<AdminNav base="/team" current="/checkin" />
					<CheckIn base="/team" />
				</div>
			</section>
		</div>
	)
}
