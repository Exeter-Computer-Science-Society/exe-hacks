"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

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

const PHOTOS = Array.from({ length: 27 }, (_, i) => `/images/conveyor_belt/${i + 1}.jpg`)

// 6-7 February 2027 is the locked weekend. Hacking starts Sat 6 Feb 2027 at
// 11:00 UK time (Run of Show draft); the UK is on GMT then, so 11:00 UTC.
const EVENT_DATE = Date.parse("2027-02-06T11:00:00Z")
const EVENT_WINDOW = "6-7 February 2027"

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
		answer: "6-7 February 2027. Venue TBC (University of Exeter). Saturday into Sunday, 24 hours.",
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
		answer: "Venue TBC (University of Exeter). We will confirm the exact venue and address before the event.",
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

const PRIZE_TRACKS = [
	{ title: "Best Overall", blurb: "Best project of the weekend." },
	{ title: "Best of AI Agents", blurb: "Best use of AI agents." },
	{ title: "Best Use of Cloud", blurb: "Best project built on the cloud." },
	{ title: "Best of Hardware", blurb: "Best project that lives in hardware." },
	{ title: "Best of Impact for Exeter / the South West", blurb: "Best project with a real impact on Exeter or the South West." },
]

// The schedule below is the old Hack South West 2024 timetable. Hidden until the
// ExeHacks 2027 Run of Show is final: update HACK_SATURDAY/HACK_SUNDAY, then set true.
const SHOW_SCHEDULE = false

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

function useRotatingPhotos() {
	const [current, setCurrent] = useState([PHOTOS[0], PHOTOS[1]])
	const [fading, setFading] = useState([false, false])

	useEffect(() => {
		let first = PHOTOS[0]
		let second = PHOTOS[1]
		let later

		const pick = () => {
			let next = PHOTOS[Math.floor(Math.random() * PHOTOS.length)]
			let guard = 0
			while ((next === first || next === second) && guard < 8) {
				next = PHOTOS[Math.floor(Math.random() * PHOTOS.length)]
				guard += 1
			}
			return next
		}

		const swap = (index) => {
			setFading((state) => state.map((value, i) => (i === index ? true : value)))
			window.setTimeout(() => {
				const next = pick()
				if (index === 0) first = next
				else second = next
				setCurrent((state) => state.map((value, i) => (i === index ? next : value)))
				window.setTimeout(() => {
					setFading((state) => state.map((value, i) => (i === index ? false : value)))
				}, 80)
			}, 280)
		}

		const interval = window.setInterval(() => swap(0), 5000)
		const startLater = window.setTimeout(() => {
			later = window.setInterval(() => swap(1), 5000)
		}, 2500)

		return () => {
			window.clearInterval(interval)
			window.clearTimeout(startLater)
			if (later) window.clearInterval(later)
		}
	}, [])

	return { current, fading }
}

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

export default function Home() {
	const { current, fading } = useRotatingPhotos()

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
									<div className="facts">
										<div>
											<small>When</small>
											<b>6-7 Feb 2027</b>
										</div>
										<div>
											<small>Where</small>
											<b>Uni of Exeter</b>
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

					{EVENT_DATE ? (
						<Window title="countdown.exe" id="countdown">
							<span className="section-tag">Sat 6 Feb 2027, 11:00 UK</span>
							<h2 className="h-section">The countdown to hacking is on.</h2>
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
								<div className="crt-photo">
									<Image
										src={current[0]}
										className={fading[0] ? "opacity-0" : "opacity-100"}
										draggable={false}
										width={500}
										height={500}
										alt="A moment from a previous event"
									/>
								</div>
								<div className="crt-photo photo-second">
									<Image
										src={current[1]}
										className={fading[1] ? "opacity-0" : "opacity-100"}
										draggable={false}
										width={500}
										height={500}
										alt="A moment from a previous event"
									/>
								</div>
							</div>
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
							<b>{EVENT_WINDOW}</b> at <b>Venue TBC (University of Exeter)</b>. Food, workshops, teams of up to four. Build
							whatever you want. The tracks below are how you win, not a brief you have to follow.
						</p>
						<div className="ev-facts">
							<div className="ev-fact">
								<span className="k">When</span> {EVENT_WINDOW}
							</div>
							<div className="ev-fact">
								<span className="k">Where</span> Venue TBC (University of Exeter)
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
						{SHOW_SCHEDULE ? (
							<div className="sched">
								<ScheduleList day="Saturday 6 Feb" rows={HACK_SATURDAY} />
								<ScheduleList day="Sunday 7 Feb" rows={HACK_SUNDAY} />
							</div>
						) : (
							<p className="lead">
								TBA. The 2027 timetable is not final. Hacking starts Sat 6 Feb 2027 at 11:00 UK time. Saturday into Sunday, 24
								hours.
							</p>
						)}
					</Window>

					<Window title="team.cfg" id="team">
						<span className="section-tag">Who runs this</span>
						<h2 className="h-section">Meet the team.</h2>
						<p className="lead">Two lead organisers, an academic organiser and an advisor.</p>
						<div className="team-groups">
							<div className="team-group">
								<span className="section-tag">Organisers</span>
								<div className="team-grid">
									<Profile name="Kazybek Khairulla" position="Lead Organiser" image="/team/kazybek.webp" />
									<Profile name="Piran Trevenna" position="Lead Organiser" />
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
						<span className="section-tag">Venue TBC (University of Exeter)</span>
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
