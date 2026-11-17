import { CommandCentre } from "../components/CommandCentre"

export const metadata = {
	title: "Command Centre: ExeHacks team",
	robots: { index: false, follow: false },
}

// Same dashboard as /admin, for Discord sign-in. Not behind Cloudflare Access: the Worker checks every request (worker/discord-auth.js).
export default function TeamPage() {
	return (
		<div className="w-full h-fit">
			<section className="band">
				<div className="wrap sponsor-page">
					<div className="section-head">
						<span className="section-tag">ExeHacks admin</span>
						<h1 className="h-section">Command Centre</h1>
						<p className="lead">
							Everything for ExeHacks 2027 in one place. Counts are live from the site database. Anyone on the team can add, tick off or edit items below.
						</p>
					</div>
					<CommandCentre base="/team" />
				</div>
			</section>
		</div>
	)
}
