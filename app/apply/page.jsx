import Link from "next/link"

import { ApplyForm } from "../components/ApplyForm"
import { PageWindow } from "../components/chrome/PageWindow"

export const metadata = {
	title: "Apply to hack: ExeHacks 2027",
	description:
		"Apply for a place at ExeHacks 2027, Exeter's 24-hour student hackathon, 6-7 February 2027 at the Innovation Centre, Exeter. Free to attend.",
}

export default function ApplyPage() {
	return (
		<PageWindow title="apply.form">
			<div className="sponsor-page">
					<div className="section-head">
						<span className="section-tag">ExeHacks 2027 · 6–7 February · Exeter</span>
						<h1 className="h-section">Apply to hack</h1>
						<p className="lead">
							ExeHacks 2027 is a free 24-hour student hackathon at the Innovation Centre, Exeter, Sat 6 to Sun 7 February 2027,
							for around 150 hackers. It&apos;s run by EXCS and is the new name for Hack South West.
						</p>
						<p>
							Open to anyone aged 18 or over on 6 February 2027. Every level is welcome, including first-timers. We review applications in waves and email you with a decision.
							Takes about 5 minutes.
						</p>
					</div>

					<ApplyForm />

					<p className="mono sponsor-page-back">
						<Link href="/">Back to ExeHacks</Link>
					</p>
			</div>
		</PageWindow>
	)
}
