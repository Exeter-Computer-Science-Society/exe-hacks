import Link from "next/link"

import { ApplyForm } from "../components/ApplyForm"
import { PageWindow } from "../components/chrome/PageWindow"

export const metadata = {
	title: "Apply to hack: ExeHacks 2027",
	description:
		"Apply for a place at ExeHacks 2027, 6 to 7 February 2027 at the Innovation Centre, Exeter.",
}

export default function ApplyPage() {
	return (
		<PageWindow title="apply.form">
			<div className="sponsor-page">
					<div className="section-head">
						<span className="section-tag">ExeHacks 2027 · 6-7 February · Exeter</span>
						<h1 className="h-section">Apply to hack</h1>
						<p className="lead">
							6 to 7 February 2027 at the Innovation Centre, Exeter. Run by EXCS. Formerly Hack South West.
						</p>
						<p>Open to anyone aged 18 or over on 6 February 2027. We review applications in waves and email you with a decision.</p>
					</div>

					<ApplyForm />

					<p className="mono sponsor-page-back">
						<Link href="/">Back to ExeHacks</Link>
					</p>
			</div>
		</PageWindow>
	)
}
