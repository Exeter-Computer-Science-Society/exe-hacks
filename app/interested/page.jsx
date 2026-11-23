import Link from "next/link"

import { PageWindow } from "../components/chrome/PageWindow"
import { InterestForm } from "../components/InterestForm"

export const metadata = {
	title: "Register your interest: ExeHacks 2027",
	description:
		"Leave your details and we'll email you when ExeHacks 2027 applications open. 6 to 7 February 2027 at the Innovation Centre, Exeter.",
}

export default function InterestedPage() {
	return (
		<PageWindow title="interest.form">
			<div className="sponsor-page">
					<div className="section-head">
						<span className="section-tag">ExeHacks 2027 · 6-7 February · Exeter</span>
						<h1 className="h-section">Register your interest</h1>
						<p className="lead">Leave your details and we&apos;ll email you when applications open.</p>
					</div>

					<InterestForm />

					<p className="mono sponsor-page-back">
						<Link href="/">Back to ExeHacks</Link>
					</p>
			</div>
		</PageWindow>
	)
}
