import Image from "next/image"
import Link from "next/link"

import { CONTACT_EMAIL } from "../../config"
import { SPONSORS, SPONSOR_TIERS } from "../../sponsors"

function groupedSponsors() {
	const known = new Map(SPONSOR_TIERS.map((tier) => [tier, []]))
	const rest = []
	for (const sponsor of SPONSORS) {
		const tier = typeof sponsor.tier === "string" ? sponsor.tier.toLowerCase() : ""
		if (known.has(tier)) known.get(tier).push(sponsor)
		else rest.push(sponsor)
	}
	const groups = SPONSOR_TIERS.filter((tier) => known.get(tier).length).map((tier) => ({
		tier,
		sponsors: known.get(tier),
	}))
	if (rest.length) groups.push({ tier: null, sponsors: rest })
	return groups
}

function SponsorLogoCard({ sponsor }) {
	const media = sponsor.logo ? (
		<Image src={sponsor.logo} alt="" width={240} height={120} className="sponsor-logo-img" />
	) : (
		<span className="sponsor-logo-fallback">{sponsor.name}</span>
	)

	const body = (
		<>
			{media}
			<span className="sponsor-logo-name">{sponsor.name}</span>
			{sponsor.tier ? <small>{sponsor.tier}</small> : null}
		</>
	)

	if (sponsor.url) {
		return (
			<a className="sponsor-logo-card" href={sponsor.url} target="_blank" rel="noopener noreferrer">
				{body}
			</a>
		)
	}

	return <div className="sponsor-logo-card">{body}</div>
}

export function CurrentSponsors({ ctaHref = "/sponsor/" }) {
	const empty = SPONSORS.length === 0

	return (
		<div className="sponsors-now">
			<div className="section-head">
				<span className="section-tag">Sponsors</span>
				<h2 className="h-section">ExeHacks 2027 sponsors.</h2>
				<p className="lead">
					{empty
						? "Partners for the 6-7 February weekend will show up here as they come on board."
						: "The organisations backing ExeHacks 2027."}
				</p>
			</div>

			{empty ? (
				<div className="sponsor-empty">
					<p className="sponsor-empty-kicker">TBA</p>
					<h3>Sponsors coming soon.</h3>
					<p>Want your name on a track? We would love to talk.</p>
					<div className="sponsor-empty-actions">
						<Link className="btn btn-primary" href={ctaHref}>
							Become a sponsor
						</Link>
						<a className="sponsor-empty-mail" href={`mailto:${CONTACT_EMAIL}`}>
							{CONTACT_EMAIL}
						</a>
					</div>
				</div>
			) : (
				<div className="sponsors-by-tier">
					{groupedSponsors().map((group) => (
						<div key={group.tier ?? "other"} className="sponsors-tier">
							{group.tier ? <h3 className="sponsors-tier-label">{group.tier}</h3> : null}
							<div className="sponsors-grid">
								{group.sponsors.map((sponsor) => (
									<SponsorLogoCard key={sponsor.name} sponsor={sponsor} />
								))}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
