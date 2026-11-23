"use client"

import Link from "next/link"
import { useEffect, useId, useRef, useState } from "react"

import { CONTACT_EMAIL, REGISTER } from "../../config"
import { RegistrationButton } from "../RegistrationButton"
import { useDesktop } from "./Desktop"
import { ProgramIcon } from "./ProgramIcon"
import { WINDOW_BY_ID } from "./windows"

// Days until the weekend. No start time is published yet.
const HACK_START = Date.parse("2027-02-06T00:00:00Z")

const PRIMARY = [
	{ href: "/#about", label: "About" },
	{ href: "/#tracks", label: "Tracks" },
	{ href: "/#team", label: "Team" },
	{ href: "/#faq", label: "FAQ" },
	{ href: "/sponsor/", label: "Sponsor" },
]

const REGISTER_ITEM = { href: REGISTER.href, label: REGISTER.label, external: REGISTER.external }

const MORE = [
	{ href: "/#sponsors", label: "Sponsors" },
	{ href: "https://www.linkedin.com/company/hack-south-west/", label: "LinkedIn", external: true },
	{ href: "https://www.instagram.com/hacksouthwest/", label: "Instagram", external: true },
	{ href: "/feedback/", label: "Feedback" },
	{ href: "/past/hsw-2024-feb/", label: "Past events" },
	{ href: "/conditions/", label: "Documents" },
	{ href: "/conditions/terms/", label: "Terms" },
	{ href: "/conditions/intellectual/", label: "Intellectual property" },
	{ href: `mailto:${CONTACT_EMAIL}`, label: CONTACT_EMAIL },
]

function MenuLink({ item, onNavigate }) {
	if (item.external) {
		return (
			<a href={item.href} target="_blank" rel="noopener noreferrer" onClick={onNavigate}>
				{item.label}
			</a>
		)
	}
	if (item.href.startsWith("mailto:") || item.href.startsWith("/#")) {
		return (
			<a href={item.href} onClick={onNavigate}>
				{item.label}
			</a>
		)
	}
	return (
		<Link href={item.href} onClick={onNavigate}>
			{item.label}
		</Link>
	)
}

export function Taskbar() {
	const [open, setOpen] = useState(false)
	const [clock, setClock] = useState("--:--")
	const [days, setDays] = useState(null)
	const barRef = useRef(null)
	const menuId = useId()
	const desk = useDesktop()

	useEffect(() => {
		const el = barRef.current
		if (!el) return undefined
		const apply = () => {
			document.documentElement.style.setProperty("--taskbar-h", `${el.offsetHeight}px`)
		}
		apply()
		const observer = new ResizeObserver(apply)
		observer.observe(el)
		return () => observer.disconnect()
	}, [open])

	useEffect(() => {
		const tick = () => {
			const now = new Date()
			setClock(
				new Intl.DateTimeFormat("en-GB", {
					hour: "2-digit",
					minute: "2-digit",
					hourCycle: "h23",
					timeZone: "Europe/London",
				}).format(now)
			)
			const left = HACK_START - now.getTime()
			setDays(left <= 0 ? 0 : Math.ceil(left / 86400000))
		}
		tick()
		const id = setInterval(tick, 1000)
		return () => clearInterval(id)
	}, [])

	useEffect(() => {
		if (!open) return undefined
		const onKey = (event) => {
			if (event.key === "Escape") setOpen(false)
		}
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [open])

	const spoken =
		days == null ? "UK clock" : `UK time ${clock}. ${days} ${days === 1 ? "day" : "days"} until ExeHacks.`

	return (
		<footer className="taskbar" ref={barRef}>
			<Link
				className="task-brand"
				href="/"
				onClick={(event) => {
					// On the desktop the brand is the way back to the setup window.
					if (!desk.isHome || !desk.isDesktop) return
					event.preventDefault()
					desk.launch("setup")
				}}
			>
				<ProgramIcon size={28} />
				<span className="task-word">.EXEHACKS</span>
			</Link>

			<nav className="task-primary" aria-label="Event">
				{PRIMARY.map((item) => (
					<MenuLink key={item.href} item={item} />
				))}
			</nav>

			{desk.isHome ? (
				<div className="task-wins" role="group" aria-label="Open windows">
					{desk.state.bar.map((id) => {
						const title = WINDOW_BY_ID[id].title
						const active = desk.activeId === id
						return (
							<button
								key={id}
								type="button"
								id={`task-win-${id}`}
								className={active ? "task-win on" : "task-win"}
								aria-pressed={active}
								title={title}
								onClick={() => desk.toggleFromTaskbar(id)}
							>
								{title}
							</button>
						)
					})}
				</div>
			) : null}

			<div className="task-end">
				<RegistrationButton label="Register" className="btn btn-primary task-register" aria-label={REGISTER.label} />
				<button
					type="button"
					className="btn task-menu-btn"
					aria-expanded={open}
					aria-controls={menuId}
					onClick={() => setOpen((value) => !value)}
				>
					<span className="task-menu-short">Menu</span>
					<span className="task-menu-wide">More</span>
				</button>
				<div className="task-time" aria-label={spoken}>
					<span aria-hidden="true">
						{clock}
						{days == null ? "" : ` ${days}d`}
					</span>
				</div>
			</div>

			{open ? (
				<nav id={menuId} className="task-panel" aria-label="More">
					{[...PRIMARY, REGISTER_ITEM, ...MORE].map((item) => (
						<MenuLink key={item.href + item.label} item={item} onNavigate={() => setOpen(false)} />
					))}
				</nav>
			) : null}
		</footer>
	)
}
