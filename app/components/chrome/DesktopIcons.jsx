"use client"

import { useEffect, useRef, useState } from "react"

const ICONS = [
	{ id: "about", href: "/#about", ext: "TXT", label: "about.txt", short: "About" },
	{ id: "events", href: "/#events", ext: "EXE", label: "event.exe", short: "Event" },
	{ id: "schedule", href: "/#schedule", ext: "EXE", label: "schedule.exe", short: "Times" },
	{ id: "sponsors", href: "/#sponsors", ext: "DLL", label: "sponsors.dll", short: "Sponsors" },
	{ id: "team", href: "/#team", ext: "CFG", label: "team.cfg", short: "Team" },
	{ id: "faq", href: "/#faq", ext: "TXT", label: "faq.txt", short: "FAQ" },
]

export function DesktopIcons() {
	const [current, setCurrent] = useState("")
	const navRef = useRef(null)

	// On phones this row is a fixed bottom dock; the page reserves its height.
	useEffect(() => {
		const el = navRef.current
		if (!el) return undefined
		const root = document.documentElement
		const apply = () => root.style.setProperty("--dock-h", `${el.offsetHeight}px`)
		apply()
		const observer = new ResizeObserver(apply)
		observer.observe(el)
		return () => {
			observer.disconnect()
			root.style.removeProperty("--dock-h")
		}
	}, [])

	useEffect(() => {
		const read = () => setCurrent(window.location.hash.replace("#", ""))
		read()
		window.addEventListener("hashchange", read)
		return () => window.removeEventListener("hashchange", read)
	}, [])

	return (
		<nav className="dicons" aria-label="Desktop" ref={navRef}>
			{ICONS.map((icon) => {
				const selected = current === icon.id
				return (
					<a
						key={icon.id}
						href={icon.href}
						className={selected ? "dicon sel" : "dicon"}
						aria-current={selected ? "true" : undefined}
					>
						<span className="dicon-file" aria-hidden="true">
							<b>.{icon.ext}</b>
						</span>
						<span className="dicon-label">
							<span className="dicon-label-full">{icon.label}</span>
							<span className="dicon-label-short">{icon.short}</span>
						</span>
					</a>
				)
			})}
		</nav>
	)
}
