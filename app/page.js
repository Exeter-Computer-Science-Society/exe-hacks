import Image from "next/image"
import Link from "next/link"

import { Question } from "./components/Question"
import { RegistrationButton } from "./components/RegistrationButton"
import { DesktopIcons } from "./components/chrome/DesktopIcons"
import { ErrorDialog } from "./components/chrome/ErrorDialog"
import { ProgramIcon } from "./components/chrome/ProgramIcon"
import { Window } from "./components/chrome/Window"
import Sponsor from "./components/General/Sponsor"
import { Profile } from "./components/Team/Profiles"
import { CONTACT_EMAIL } from "./config"

const EVENT_WINDOW = "6 to 7 February 2027"

const TICKER = ["6-7 Feb 2027", "Innovation Centre, Exeter", "Run by EXCS", "Formerly Hack South West"]

const QUESTIONS = [
	{
		id: 2,
		question: "What is a hackathon?",
		answer: "A weekend where people get together and build something. You learn, you meet people, and you leave with a project.",
	},
	{
		id: 15,
		question: "When and where is ExeHacks?",
		answer: "6 to 7 February 2027 at the Innovation Centre, Exeter.",
	},
	{
		id: 13,
		question: "Who runs ExeHacks?",
		answer: "The Exeter Computer Science Society (EXCS). The event used to be called Hack South West. Same society, same venue.",
	},
	{
		id: 4,
		question: "Who can attend?",
		answer: "Anyone aged 18 or over on 6 February 2027. You do not need to study computer science.",
	},
	{
		id: 7,
		question: "Do I need to be able to code?",
		answer: "No. First-timers are welcome.",
	},
	{
		id: 9,
		question: "What should I bring?",
		answer: "A laptop and a charger.",
	},
	{
		id: 14,
		question: "How do I sponsor ExeHacks?",
		answer: `There is a short form under Sponsor on this page, and a sponsor page in the menu. Or email ${CONTACT_EMAIL}.`,
	},
]

const ABOUT_PHOTOS = [
	{ src: "/images/everyone.JPEG", alt: "The room during a previous hackathon" },
	{ src: "/images/presentation.JPEG", alt: "A team presenting at a previous hackathon" },
]

function EventPhoto({ src, alt, sizes }) {
	return (
		<figure className="crt-photo">
			<Image src={src} alt={alt} fill sizes={sizes} style={{ objectFit: "cover" }} />
		</figure>
	)
}

export default function Home() {
	return (
		<div className="desk-page">
			<div className="desk-stage">
				<div className="desk-main">
					<div className="hero-stack">
						<Window title="ExeHacks 2027 Setup" shadow className="setup">
							<div className="setup-body">
								<div className="setup-head">
									<ProgramIcon size={112} />
									<div className="setup-title">
										<h1 className="wordmark" aria-label="ExeHacks">
											<span className="glitch" aria-hidden="true" data-text=".EXEHACKS">
												.EXEHACKS
											</span>
										</h1>
										<p className="tagline">build something that shouldn&apos;t exist yet</p>
									</div>
								</div>
								<dl className="facts">
									<div>
										<dt>When</dt>
										<dd>6-7 Feb 2027</dd>
									</div>
									<div>
										<dt>Where</dt>
										<dd>
											Innovation Centre
											<span className="fact-place">Exeter</span>
										</dd>
									</div>
								</dl>
								<div className="setup-cta">
									<RegistrationButton label="Register" />
									<p className="setup-note">Registers your interest. We&apos;ll email you.</p>
								</div>
							</div>
						</Window>
						<ErrorDialog className="err-pop" />
					</div>

					<div className="ticker" aria-hidden="true">
						<div className="ticker-track">
							{[0, 1].map((copy) => (
								<span className="ticker-item" key={copy}>
									{TICKER.map((item) => (
										<span className="ticker-bit" key={item}>
											<span className="star">✦</span>
											{item}
										</span>
									))}
								</span>
							))}
						</div>
					</div>

					<Window title="about.txt" id="about">
						<div className="welcome-grid">
							<div>
								<span className="section-tag">University of Exeter</span>
								<h2 className="h-section">
									Exeter&apos;s student <span className="grad-text">hackathon</span>.
								</h2>
								<p>
									ExeHacks is run by the <b>Exeter Computer Science Society</b> (EXCS). It used to be called Hack South
									West. Same society, same venue.
								</p>
								<p>
									<b>{EVENT_WINDOW}</b>. Innovation Centre, Exeter.
								</p>
							</div>
							<div className="photo-pair">
								{ABOUT_PHOTOS.map((photo) => (
									<EventPhoto key={photo.src} {...photo} sizes="(max-width: 768px) 46vw, 280px" />
								))}
							</div>
						</div>
					</Window>

					<Window title="tracks.txt" id="tracks">
						<span className="section-tag">What you build</span>
						<h2 className="h-section">Tracks.</h2>
						<p className="lead">Tracks will be announced soon. Likely sponsor tracks, plus an overall prize.</p>
						<p>Schedule coming soon.</p>
					</Window>

					<Window title="team.cfg" id="team">
						<span className="section-tag">Who runs this</span>
						<h2 className="h-section">The people running it.</h2>
						<div className="team-groups">
							<div className="team-group">
								<span className="section-tag">Core team</span>
								<div className="team-grid">
									<Profile
										name="Kazybek Khairulla"
										position="Hackathon Director"
										course="Computer Science, 3rd year"
										image="/team/kazybek.webp"
									/>
									<Profile
										name="Emre Acarsoy"
										position="Tech Lead"
										course="Computer Science, 3rd year"
										image="/team/emre.jpg"
									/>
									<Profile name="Keira Heffernan" position="Logistics Lead" course="Computer Science, 2nd year" />
									<Profile name="Rose Burston" position="Volunteer Coordinator" course="Computer Science, 3rd year" />
									<Profile name="Sam Carpenter" position="Treasurer" course="Computer Science, 3rd year" />
								</div>
							</div>
							<div className="team-group">
								<span className="section-tag">Advisor</span>
								<div className="team-grid">
									<Profile name="Wiktor Wiejak" position="Advisor, creator of HackSouthWest" image="/team/wiktor.webp" />
								</div>
							</div>
						</div>
					</Window>

					<Window title="sponsors.dll" id="sponsors">
						<Sponsor />
					</Window>

					<Window title="faq.txt" id="faq">
						<div className="faq-grid">
							<div>
								<span className="section-tag">Good to know</span>
								<h2 className="h-section">Questions.</h2>
								<p className="lead">
									If something is missing, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
								</p>
								<div className="faq-side-links">
									<Link href="/past/hsw-2024-feb/">Past editions</Link>
									<Link href="/conditions/intellectual/">Intellectual property</Link>
									<Link href="/conditions/terms/">Terms</Link>
								</div>
							</div>
							<div className="faq-list">
								{QUESTIONS.map((question) => (
									<Question key={question.id} info={question} />
								))}
							</div>
						</div>
					</Window>

					<Window title="register.exe" id="register" className="win-center">
						<span className="section-tag">Innovation Centre, Exeter</span>
						<h2 className="h-section">
							Ready to <span className="grad-text">build</span>?
						</h2>
						<p>{EVENT_WINDOW}. Leave your details and we&apos;ll email you.</p>
						<div className="hero-cta">
							<RegistrationButton />
						</div>
					</Window>
				</div>
				<DesktopIcons />
			</div>
		</div>
	)
}
