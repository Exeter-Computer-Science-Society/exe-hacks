import Link from "next/link"

import { CONTACT_EMAIL } from "../../config"

export const metadata = {
	title: "Application received: ExeHacks 2027",
	robots: { index: false, follow: false },
}

export default function ApplyThanksPage() {
	return (
		<div className="w-full h-fit">
			<section className="band">
				<div className="wrap sponsor-page">
					<div className="section-head">
						<span className="section-tag">ExeHacks 2027 · 6–7 February · Exeter</span>
						<h1 className="h-section">Application received</h1>
						<p className="lead">Thanks for applying to ExeHacks 2027.</p>
					</div>
					<div className="sponsor-form sent" role="status">
						<p className="mono sponsor-form-kicker">What happens next</p>
						<p>We review applications in waves and will email you with a decision. Keep an eye on your inbox, including spam.</p>
						<p>
							Questions, or need to change something? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
						</p>
					</div>
					<p className="mono sponsor-page-back">
						<Link href="/">← Back to ExeHacks</Link>
					</p>
				</div>
			</section>
		</div>
	)
}
