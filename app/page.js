import Image from "next/image"
import Link from "next/link"

import { ClockCountdown } from "./components/ClockCountdown"
import { Question } from "./components/Question"
import { RegistrationButton } from "./components/RegistrationButton"
import { DesktopIcons } from "./components/chrome/DesktopIcons"
import { ErrorDialog } from "./components/chrome/ErrorDialog"
import { ProgramIcon } from "./components/chrome/ProgramIcon"
import { ProgressBar } from "./components/chrome/ProgressBar"
import { Window } from "./components/chrome/Window"
import Sponsor from "./components/General/Sponsor"
import { Profile } from "./components/Team/Profiles"
import { CONTACT_EMAIL } from "./config"

// 6-7 February 2027 is the locked weekend. Hacking starts Sat 6 Feb 2027 at
// 11:00 UK time (Run of Show draft); the UK is on GMT then, so 11:00 UTC.
const EVENT_DATE = Date.parse("2027-02-06T11:00:00Z")
const EVENT_WINDOW = "6-7 February 2027"

const TICKER =
	"Beginners welcome   ·   6-7 Feb 2027   ·   Free food all weekend   ·   24 hours   ·   Workshops and mentors   ·   About 150 hackers   ·   Innovation Centre"

const QUESTIONS = [
	{
		id: 1,
		question: "Should I attend ExeHacks",
		answer: "Absolutely! ExeHacks is a great opportunity to learn new skills, meet new people, and have fun. Whether you're a beginner or an experienced hacker, there's something for everyone at ExeHacks.",
	},
	{
		id: 2,
		question: "What is a hackathon?",
		answer: "A hackathon is an event where people come together to work on a project for a set amount of time. It is a great opportunity to learn new skills, meet new people, and have fun!",
	},
	{
		id: 15,
		question: "When is ExeHacks?",
		answer: "6-7 February 2027 at the Innovation Centre, Exeter. Saturday into Sunday, 24 hours. Doors at 9:00, hacking starts at 11:00 UK time on Saturday.",
	},
	{
		id: 3,
		question: "Isn't this event called Hack South West?",
		answer: "It was. Same society, same venue, same event, new name, and the person who started it is still on the team. Every edition has been held in Exeter, so the old name claimed more ground than the event covered. You'll still find us under the old name on LinkedIn, Instagram and Devpost while the rebrand settles in.",
	},
	{
		id: 13,
		question: "Who actually runs ExeHacks?",
		answer: "The Exeter Computer Science Society (EXCS), the same society that ran Hack South West, still with the person who started it, under a name that matches where the event is.",
	},
	{
		id: 4,
		question: "Who can attend?",
		answer: "Everyone. Whether you study at Exeter, at another university, or you're working in industry, come along for a weekend of building and learning.",
	},
	{
		id: 5,
		question: "Where is ExeHacks Happening?",
		answer: "Innovation Centre, Exeter, at the University of Exeter.",
	},
	{
		id: 6,
		question: "What will be available to eat?",
		answer: "We will be providing all hackers with food and drinks throughout the event. Dietary requirement will be catered for as well so no need to worry!",
	},
	{
		id: 7,
		question: "Do I need to be able to code to attend?",
		answer: "Not at all! ExeHacks is open to everyone, regardless of your coding experience. We will have workshops and mentors available to help you get started with your project.",
	},
	{
		id: 8,
		question: "How large can my team be?",
		answer: "We enforce team sizes of no more than 4 people. This is to ensure that everyone has a fair chance of winning the competition.",
	},
	{
		id: 9,
		question: "What should I bring?",
		answer: "You should bring your laptop, charger, and any additional items to make your stay comfortable. We will provide you with seating, power, food, and a lovely atmosphere.",
	},
	{
		id: 10,
		question: "Do we have a code of conduct?",
		answer: "Yes, we have a code of conduct that all attendees must adhere to. This is to ensure that everyone has a safe and enjoyable experience at ExeHacks.",
	},
	{
		id: 11,
		question: "Do we have a code of intellectual property?",
		answer: "Yes, check the link just to the left of this :)",
	},
	{
		id: 12,
		question: "What are the terms and conditions?",
		answer: "Check the link just to the left of this :)",
	},
	{
		id: 14,
		question: "How do I sponsor ExeHacks?",
		answer: `There's a short enquiry form under Partner with us on this page, and a dedicated sponsor page in the footer. Fill it in, or email ${CONTACT_EMAIL}. We reply from the same address.`,
	},
]

const PAST_EVENTS = [
	{ when: "Jan 2026", name: "Hack South West", what: "24-hour hackathon" },
	{ when: "Nov 2025", name: "Capture The Flag", what: "12 hours, 30 boxes" },
	{ when: "Feb 2024", name: "Hack South West", what: "24-hour hackathon", href: "/past/hsw-2024-feb/" },
]

const ABOUT_PHOTOS = [
	{ src: "/images/everyone.JPEG", alt: "The room during the 2024 hackathon" },
	{ src: "/images/presentation.JPEG", alt: "A team presenting to the judges" },
]

const GALLERY_PHOTOS = [
	{ src: "/images/introduction.jpg", alt: "The opening talk at Hack South West 2024" },
	{ src: "/images/organisers.JPEG", alt: "The 2024 organising team" },
	{ src: "/images/pizza.JPEG", alt: "Food at the 2024 hackathon" },
	{ src: "/images/winners.JPEG", alt: "A team in front of the Hack South West backdrop" },
]

const PAST_STATS = [
	{ num: "128", lab: "Tickets sold" },
	{ num: "56%", lab: "First-timers" },
	{ num: "13", lab: "Products built" },
	{ num: "5", lab: "Cities represented" },
]

const WINNERS = [
	{ cls: "second", rank: "2nd place", team: "BathX", project: "pool" },
	{ cls: "first", rank: "1st place", team: "Headge Hackers", project: "LendEase" },
	{ cls: "third", rank: "3rd place", team: "Asians ++", project: "Asians ++ Training" },
]

const PRIZE_TRACKS = [
	{ title: "Best Overall", blurb: "Best project of the weekend." },
	{ title: "Best of AI Agents", blurb: "Best use of AI agents." },
	{ title: "Best Use of Cloud", blurb: "Best project built on the cloud." },
	{ title: "Best of Hardware", blurb: "Best project that lives in hardware." },
	{ title: "Best of Impact for Exeter / the South West", blurb: "Best project with a real impact on Exeter or the South West." },
]

// The hour-by-hour list below is the February 2024 timetable. It is shown as
// the previous edition, not as the 2027 plan. 2027 only locks doors at 9:00
// and hacking at 11:00 UK until the Run of Show is final.
const SHOW_SCHEDULE = false

const HACK_2027_SATURDAY = [
	{ time: "09:00", what: "Doors open" },
	{ time: "11:00", what: "Hacking starts (UK time)" },
]

const HACK_2027_SUNDAY = [{ time: "TBA", what: "Saturday into Sunday, 24 hours. The rest of the run of show is still being set." }]

const HACK_SATURDAY = [
	{ time: "08:00", what: "Registration Opens + Talk To Sponsors" },
	{ time: "08:30", what: "Board Games + Team Building" },
	{ time: "11:30", what: "Welcome Presentation" },
	{ time: "12:00", what: "Hacking Begins!" },
	{ time: "12:15", what: "Workshop" },
	{ time: "13:00", what: "Lunch" },
	{ time: "19:00", what: "Dinner" },
	{ time: "22:00", what: "Venue Closes, Moving To Forum" },
]

const HACK_SUNDAY = [
	{ time: "08:00", what: "Venue Opens" },
	{ time: "08:30", what: "Breakfast" },
	{ time: "12:00", what: "Hacking Ends" },
	{ time: "12:30", what: "Judging Begins" },
	{ time: "14:00", what: "Prizes & Closing Ceremony" },
	{ time: "15:00", what: "Venue Closes" },
]

const FILES =
	"https://guildgroupssetup-my.sharepoint.com/:f:/g/personal/excs_groups_exeterguild_com/Ej3uvzjcOhxJshyqPG-i7A4Bj-Vd2GYqpygapE_MtUPqgA?e=Xwt0sm"

function ScheduleList({ day, rows }) {
	return (
		<>
			<div className="sched-day">{day}</div>
			{rows.map((row) => (
				<div className="sched-row" key={`${day}-${row.time}`}>
					<span className="t">{row.time}</span>
					<span className="w">{row.what}</span>
				</div>
			))}
		</>
	)
}

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
								<ProgramIcon size={148} />
								<div>
									<h1 className="wordmark">.EXEHACKS</h1>
									<p className="slede">
										Setup will install <b>24 hours of building</b> on your weekend.
									</p>
									<p className="tagline">build something that shouldn&apos;t exist yet</p>
									<p className="hero-energy">
										Whether you&apos;re writing your first line of code or you&apos;ve shipped projects before, ExeHacks is 24
										hours, free, with food, for about 150 hackers. Run by <b>EXCS</b>.
									</p>
									<ul className="chips">
										<li>Beginners welcome</li>
										<li>Free, food included</li>
										<li>About 150 hackers</li>
										<li>Workshops and mentors</li>
									</ul>
									<div className="facts">
										<div>
											<small>When</small>
											<b>6-7 Feb 2027</b>
										</div>
										<div>
											<small>Where</small>
											<b>Innovation Centre</b>
											<span className="fact-place">Uni of Exeter</span>
										</div>
										<div>
											<small>Who</small>
											<b>UK-wide</b>
										</div>
									</div>
								</div>
							</div>
							<ProgressBar />
							<div className="sfoot">
								<p className="url">exehacks.excs.uk</p>
								<div className="sbtns">
									<button type="button" className="btn" disabled>
										{"< Back"}
									</button>
									<RegistrationButton label="Register >" />
								</div>
							</div>
							<p className="setup-note">Tickets and more details coming soon. This registers your interest.</p>
						</Window>
						<ErrorDialog className="err-pop" />
					</div>

					<div className="ticker">
						<div className="ticker-track">
							<span className="ticker-item">{TICKER}</span>
							<span className="ticker-item" aria-hidden="true">
								{TICKER}
							</span>
						</div>
					</div>

					{EVENT_DATE ? (
						<Window title="countdown.exe" id="countdown">
							<span className="section-tag">Sat 6 Feb 2027, 11:00 UK</span>
							<h2 className="h-section">The countdown to hacking is on.</h2>
							<p className="lead">Doors at 9:00. Hacking starts at 11:00 UK.</p>
							<ClockCountdown target={EVENT_DATE} label="Hacking starts in" prompt="$ ./hack --starts-in" dayDigits={3} />
						</Window>
					) : null}

					<Window title="about.txt" id="about">
						<div className="welcome-grid">
							<div>
								<span className="section-tag">What is this?</span>
								<h2 className="h-section">24 hours. A team of four. Whatever you can ship.</h2>
								<p>
									ExeHacks is the University of Exeter&apos;s student hackathon, run by <b>EXCS</b>. You get 24 hours, a team of up
									to four, and whatever you can ship in a weekend. Beginners are welcome. We run workshops and put mentors on
									the floor.
								</p>
								<p>
									We run it once a year. Next date: <b>{EVENT_WINDOW}</b>. It ran as Hack South West before this one. Here&apos;s
									what came before.
								</p>
								<ul className="past-list">
									{PAST_EVENTS.map((event) => (
										<li className="past-row" key={`${event.when}-${event.name}`}>
											<span className="pe-when">{event.when}</span>
											<span className="pe-name">
												{event.href ? <Link href={event.href}>{event.name}</Link> : event.name}
											</span>
											<span className="pe-what">{event.what}</span>
										</li>
									))}
								</ul>
								<div className="hero-cta">
									<a className="btn" href={FILES} target="_blank" rel="noopener noreferrer">
										Pictures from previous events
									</a>
								</div>
							</div>
							<div className="photo-pair">
								{ABOUT_PHOTOS.map((photo) => (
									<EventPhoto key={photo.src} {...photo} sizes="(max-width: 768px) 46vw, 280px" />
								))}
							</div>
						</div>
					</Window>

					<Window title="hsw-2024.txt" id="hsw-2024">
						<span className="section-tag">February 2024</span>
						<h2 className="h-section">Last time we ran it.</h2>
						<p className="lead">
							The February 2024 edition, when the event was still called Hack South West. People came from Exeter, Bristol,
							Plymouth, Bournemouth and Cardiff.
						</p>
						<div className="stat-grid">
							{PAST_STATS.map((stat) => (
								<div className="stat" key={stat.lab}>
									<div className="num">{stat.num}</div>
									<div className="lab">{stat.lab}</div>
								</div>
							))}
						</div>
						<div className="gallery">
							{GALLERY_PHOTOS.map((photo) => (
								<div className="ph" key={photo.src}>
									<Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 768px) 46vw, 180px" style={{ objectFit: "cover" }} />
								</div>
							))}
							<Link className="ph ph-more" href="/past/hsw-2024-feb/">
								<span>Full 2024 archive</span>
							</Link>
						</div>
						<div className="sched-past">
							<h3>Winners</h3>
							<p className="lead">Every podium team went home with Raspberry Pi Zeros.</p>
						</div>
						<div className="podium">
							{WINNERS.map((winner) => (
								<div className={`pcol ${winner.cls}`} key={winner.cls}>
									{winner.cls === "first" ? <span className="topline" /> : null}
									<div className="rank">{winner.rank}</div>
									<div className="amt">{winner.team}</div>
									<div className="perk">{winner.project}</div>
								</div>
							))}
						</div>
					</Window>

					<Window title="readme.txt" id="rebrand">
						<div className="note-copy">
							<span className="section-tag">We&apos;ve rebranded</span>
							<h2 className="h-section">Hack South West is now ExeHacks.</h2>
							<p className="lead">
								Every edition has been held in Exeter, so the old name claimed more ground than the event covered. The new one
								says where it is, and puts us next to SotonHacks, HackNotts, DurHack and the rest of the UK student circuit.
								Same organisers, same venue, same event. If you came before, you already know this one.
							</p>
						</div>
					</Window>

					<Window title="excs.cfg" id="excs">
						<span className="section-tag">Who runs it</span>
						<h2 className="h-section">Powered by EXCS.</h2>
						<p>
							ExeHacks is run by the <b>Exeter Computer Science Society</b>. Start to finish. Same society that ran Hack South
							West, still with the person who started it. That part doesn&apos;t change.
						</p>
					</Window>

					<Window title="event.exe" id="events">
						<span className="section-tag">One weekend a year</span>
						<h2 className="h-section">The event.</h2>
						<p className="lead">24 hours to build something. These are the tracks we&apos;re planning.</p>
						<p>
							<b>{EVENT_WINDOW}</b> at the <b>Innovation Centre, Exeter</b>. Food, workshops, teams of up to four. Build
							whatever you want. The tracks below are how you win, not a brief you have to follow.
						</p>
						<div className="ev-facts">
							<div className="ev-fact">
								<span className="k">When</span> {EVENT_WINDOW}
							</div>
							<div className="ev-fact">
								<span className="k">Where</span> Innovation Centre, Exeter
							</div>
							<div className="ev-fact">
								<span className="k">Teams</span> Up to 4 people
							</div>
							<div className="ev-fact">
								<span className="k">Perks</span> Food, workshops, mentors
							</div>
						</div>
						<div className={SHOW_SCHEDULE ? "event-split" : undefined}>
							<div>
								<span className="section-tag">Tracks we&apos;re planning</span>
								<div className="tracks">
									{PRIZE_TRACKS.map((track) => (
										<article className="track" key={track.title}>
											<h3>{track.title}</h3>
											<p>{track.blurb}</p>
										</article>
									))}
								</div>
							</div>
							{SHOW_SCHEDULE ? (
								<div className="sched">
									<span className="section-tag">Schedule</span>
									<ScheduleList day="Saturday 6 Feb" rows={HACK_SATURDAY} />
									<ScheduleList day="Sunday 7 Feb" rows={HACK_SUNDAY} />
								</div>
							) : null}
						</div>
						<div className="hero-cta">
							<RegistrationButton />
						</div>
						<p>Food and refreshments provided throughout the weekend.</p>
					</Window>

					<Window title="schedule.exe" id="schedule">
						<span className="section-tag">Run of show</span>
						<h2 className="h-section">Schedule.</h2>
						<p className="lead">Doors at 9:00. Hacking starts at 11:00 UK. The rest of the 2027 timetable is TBA.</p>
						<div className="sched">
							<ScheduleList day="Saturday 6 Feb 2027" rows={HACK_2027_SATURDAY} />
							<ScheduleList day="Sunday 7 Feb 2027" rows={HACK_2027_SUNDAY} />
						</div>
						<div className="sched-past">
							<h3>February 2024 timetable</h3>
							<p className="lead">What the previous edition looked like. These times are not the 2027 plan.</p>
							<div className="sched">
								<ScheduleList day="Saturday" rows={HACK_SATURDAY} />
								<ScheduleList day="Sunday" rows={HACK_SUNDAY} />
							</div>
						</div>
					</Window>

					<Window title="team.cfg" id="team">
						<span className="section-tag">Who runs this</span>
						<h2 className="h-section">Meet the team.</h2>
						<p className="lead">The lead organiser, an academic organiser and an advisor.</p>
						<div className="team-groups">
							<div className="team-group">
								<span className="section-tag">Organisers</span>
								<div className="team-grid">
									<Profile name="Kazybek Khairulla" position="Lead Organiser" image="/team/kazybek.webp" />
									<Profile name="Emre Acarsoy" position="Academic Organiser" image="/team/emre.jpg" />
								</div>
							</div>
							<div className="team-group">
								<span className="section-tag">Advisor</span>
								<div className="team-grid">
									<Profile name="Wiktor Wiejak" position="Advisor" image="/team/wiktor.webp" />
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
								<h2 className="h-section">Questions, answered.</h2>
								<p className="lead">
									Have questions? Here you&apos;ll find all the answers. If something is missing, reach out via{" "}
									<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
								</p>
								<div className="faq-side-links">
									<Link href="/past/hsw-2024-feb/">Past editions</Link>
									<Link href="/conditions/intellectual/">Intellectual Property</Link>
									<Link href="/conditions/terms/">Terms &amp; Conditions</Link>
									<a href={FILES} target="_blank" rel="noopener noreferrer">
										Access Files
									</a>
								</div>
							</div>
							<div className="faq-list">
								{QUESTIONS.map((question) => (
									<Question key={question.id} info={question} />
								))}
							</div>
						</div>
					</Window>

					<Window title="register.exe" id="register">
						<span className="section-tag">Innovation Centre, Exeter</span>
						<h2 className="h-section">Ready to build?</h2>
						<p>Tickets and more details are coming soon. Leave your details and we&apos;ll email you. See you {EVENT_WINDOW}.</p>
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
