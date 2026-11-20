import Link from "next/link"

import { PageWindow } from "../components/chrome/PageWindow"
import { SponsorForm } from "../components/SponsorForm"
import { CurrentSponsors } from "../components/CurrentSponsors"
import { CONTACT_EMAIL } from "../config"

export const metadata = {
	title: "Sponsor ExeHacks: Exeter's student hackathon",
	description:
		"Sponsor ExeHacks 2027, 6 to 7 February at the Innovation Centre, Exeter. Send an enquiry.",
}

export default function SponsorPage() {
	return (
		<PageWindow title="sponsor.form">
			<div className="sponsor-page">
				<div className="section-head">
					<span className="section-tag">Partner with us</span>
					<h1 className="h-section">Interested in sponsoring?</h1>
					<p className="lead">
						ExeHacks is 6 to 7 February 2027 at the Innovation Centre, Exeter. Fill this in and it goes to{" "}
						<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
					</p>
				</div>

				<CurrentSponsors ctaHref="#enquiry" />

				<div id="enquiry">
					<SponsorForm />
				</div>

				<p className="mono sponsor-page-back">
					<Link href="/#sponsors">Past sponsors and partners</Link>
				</p>
			</div>
		</PageWindow>
	)
}
