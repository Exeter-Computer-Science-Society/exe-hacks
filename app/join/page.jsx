import Link from "next/link"

import { JoinForm } from "../components/JoinForm"
import { TEAM_ROLES } from "./roles"

export const metadata = {
	title: "Join the ExeHacks core team",
	description:
		"Help run ExeHacks 2027, Exeter's 24-hour student hackathon, 6–7 February 2027. No experience needed.",
}

export default function JoinPage() {
	return (
		<div className="w-full h-fit">
			<section className="band">
				<div className="wrap sponsor-page">
					<div className="section-head">
						<span className="section-tag">ExeHacks 2027 · 6–7 February · Exeter</span>
						<h1 className="h-section">Join the ExeHacks core team</h1>
						<p className="lead">
							ExeHacks 2027 is Exeter&apos;s 24-hour student hackathon, run by EXCS on 6–7 February 2027 for around 150
							hackers. We&apos;re looking for people to help run it.
						</p>
						<p>
							No experience needed. Expect a few hours a week until February, then all hands on the weekend itself.
						</p>
						<p className="mono">Roles: {TEAM_ROLES.join(" · ")}</p>
					</div>

					<JoinForm />

					<p className="mono sponsor-page-back">
						<Link href="/">← Back to ExeHacks</Link>
					</p>
				</div>
			</section>
		</div>
	)
}
