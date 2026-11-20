"use client"

import Link from "next/link"

import { CurrentSponsors } from "../../CurrentSponsors"
import { SponsorForm } from "../../SponsorForm"
import { CONTACT_EMAIL } from "../../../config"
import SponsorCard from "./Card"

const info = {
	liminal: {
		name: "Liminal",
		image: "/images/sponsors/liminal-logo.webp",
		site: "https://www.becomeliminal.com",
		level: "gold",
	},
    nvidia: {
        name: "NVIDIA",
        image: "/images/sponsors/nvidia.png",
        site: "https://www.nvidia.com/",
        level: "silver",
    },
    superteam: {
		name: "Superteam Exeter",
		image: "/images/sponsors/superteamexeter.jpeg",
		site: "https://superteam.fun/",
		level: "silver",
	},
	solana: {
		name: "Solana",
		image: "/images/sponsors/solana.png",
		site: "https://www.solana.com/",
		level: "bronze",
	},
    exeter: {
        name: "Exeter CS Department",
        image: "/images/sponsors/exeter.png",
        site: "https://computerscience.exeter.ac.uk/",
        level: "bronze",
    },
    tenzing: {
        name: "Tenzing",
        image: "/images/sponsors/tenzing.jpg",
        site: "https://tenzingnaturalenergy.com/",
        level: "bronze",
    }
    // rootmepro: {
    //     name: "Root Me Pro",
    //     image: "/images/sponsors/rootmepro.png",
    //     site: "https://pro.root-me.org/",
	// 	level: "silver",
    // },
	// hh: {
	// 	name: "Hacking Hub",
	// 	image: "/images/sponsors/HackingHub.svg",
	// 	site: "https://www.hackinghub.io/",
	// 	level: "silver",
	// },
	// cybersoc: {
	// 	name: "Cyber Security Society",
	// 	image: "/images/sponsors/cybersoc.png",
	// 	site: "https://my.exeterguild.com/groups/TT2W9/cyber-security-society",
	// 	level: "bronze",
	// }
    // checkout: {
	// 	name: "Checkout.com",
	// 	image: "/images/sponsors/checkout.jpeg",
	// 	site: "https://www.checkout.com/",
	// 	level: "bronze",
	// },
}

export default function Sponsor() {
	const sponsors = Object.values(info)

	return (
		<section className="w-full">
			<CurrentSponsors ctaHref="#enquiry" />

			<div className="section-head">
				<span className="section-tag">Who has backed us</span>
				<h2 className="h-section">Past sponsors.</h2>
				<p className="lead">These organisations backed the event when it ran as Hack South West.</p>
			</div>

			<div className="sponsor-grid">
				{sponsors.map((s) => (
					<SponsorCard
						key={s.name}
						sName={s.name}
						sSite={s.site}
						sImage={s.image}
						sLevel={s.level}
					/>
				))}
			</div>

			<div className="section-head">
				<span className="section-tag">Who we have worked with</span>
				<h2 className="h-section">Past partners.</h2>
			</div>

			<div className="sponsor-grid">
				<SponsorCard
					sName={"Encode Club"}
					sSite={"https://www.encodeclub.com/"}
					sImage={"/images/sponsors/encode.webp"}
					sLevel={"partner"}
				/>
				<SponsorCard
					sName={"Hackathons UK"}
					sSite={"https://www.hackathons.org.uk/"}
					sImage={"/images/sponsors/hackathonsUk.png"}
					sLevel={"partner"}
				/>
			</div>

			<div className="section-head">
				<span className="section-tag">Partner with us</span>
				<h2 className="h-section">Sponsor ExeHacks.</h2>
				<p className="lead">
					Interested in the 6 to 7 February 2027 weekend? Send a note, or email{" "}
					<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
				</p>
				<p className="mono" style={{ color: "var(--muted)", marginTop: "0.8rem" }}>
					Powered by{" "}
					<a
						href="https://excs.uk/"
						target="_blank"
						rel="noopener noreferrer"
					>
						the Exeter Computer Science Society
					</a>
					{" · "}
					<Link href="/sponsor/">Share this form</Link>
				</p>
			</div>

			<div id="enquiry">
				<SponsorForm />
			</div>
		</section>
	)
}
