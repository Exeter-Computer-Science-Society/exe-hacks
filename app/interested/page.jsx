import Link from "next/link"

import { InterestForm } from "../components/InterestForm"

export const metadata = {
	title: "Register your interest: ExeHacks 2027",
	description:
		"Leave your details for updates about ExeHacks 2027, or apply for a place. Sat 6 to Sun 7 February 2027 in Exeter, for about 150 hackers, 18+.",
}

export default function InterestedPage() {
	return (
		<div className="w-full h-fit">
			<section className="band">
				<div className="wrap sponsor-page">
					<div className="section-head">
						<span className="section-tag">ExeHacks 2027 · 6–7 February · Exeter</span>
						<h1 className="h-section">Register your interest</h1>
						<p className="lead">
							Applications for ExeHacks 2027 are open. Apply for a place, or leave your email if you just want updates.
						</p>
					</div>

					<p className="sponsor-form-actions" style={{ marginBottom: "1.5rem" }}>
						<Link href="/apply/" className="btn btn-primary">
							Apply to hack
						</Link>
					</p>

					<InterestForm />

					<p className="mono sponsor-page-back">
						<Link href="/">← Back to ExeHacks</Link>
					</p>
				</div>
			</section>
		</div>
	)
}
