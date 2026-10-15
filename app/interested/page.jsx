import Link from "next/link"

import { InterestForm } from "../components/InterestForm"

export const metadata = {
	title: "Register your interest: ExeHacks 2027",
	description:
		"Leave your details and we'll let you know as soon as ExeHacks 2027 tickets are available. 6–7 February 2027 in Exeter.",
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
							Leave your details and we&apos;ll let you know as soon as tickets are available.
						</p>
					</div>

					<InterestForm />

					<p className="mono sponsor-page-back">
						<Link href="/">← Back to ExeHacks</Link>
					</p>
				</div>
			</section>
		</div>
	)
}
