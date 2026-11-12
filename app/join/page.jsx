import Link from "next/link"

export const metadata = {
	title: "Core team applications are closed: ExeHacks 2027",
	description:
		"Applications to the ExeHacks 2027 core team are now closed. If you already applied, we'll be in touch.",
}

export default function JoinPage() {
	return (
		<div className="w-full h-fit">
			<section className="band">
				<div className="wrap sponsor-page">
					<div className="section-head">
						<span className="section-tag">ExeHacks 2027 · 6–7 February · Exeter</span>
						<h1 className="h-section">Applications are now closed</h1>
						<p className="lead">
							Thanks for wanting to help run ExeHacks 2027. We&apos;re no longer taking new applications for the core team.
						</p>
					</div>

					<div className="sponsor-form sent" role="status">
						<p className="mono sponsor-form-kicker">Applications are now closed</p>
						<p>
							If you already applied, we&apos;ll be in touch about next steps. Want to come and hack? Register your interest
							and we&apos;ll email you when tickets open.
						</p>
						<div className="sponsor-form-actions">
							<Link href="/interested/" className="btn btn-primary">
								Register your interest
							</Link>
						</div>
					</div>

					<p className="mono sponsor-page-back">
						<Link href="/">← Back to ExeHacks</Link>
					</p>
				</div>
			</section>
		</div>
	)
}
