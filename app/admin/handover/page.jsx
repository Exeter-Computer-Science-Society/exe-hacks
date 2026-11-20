import Link from "next/link"

import { HandoverGuide } from "../../components/HandoverGuide"
import { PageWindow } from "../../components/chrome/PageWindow"

export const metadata = {
	title: "Organiser handover: ExeHacks",
	robots: { index: false, follow: false },
}

export default function HandoverPage() {
	return (
		<PageWindow title="handover.exe">
			<div className="sponsor-page">
				<div className="section-head">
					<span className="section-tag">Hackathon Organiser</span>
					<h1 className="h-section">Handover guide</h1>
					<p className="lead">How ExeHacks works, and what the next organiser needs. Only the Hackathon Organiser can open this page.</p>
				</div>
				<HandoverGuide />
				<p className="mono sponsor-page-back">
					<Link href="/admin/">Back to signups</Link>
				</p>
			</div>
		</PageWindow>
	)
}
