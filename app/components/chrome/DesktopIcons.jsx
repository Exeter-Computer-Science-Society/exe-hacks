"use client"

import { useEffect, useState } from "react"

const ICONS = [
	{ id: "about", href: "/#about", ext: "TXT", label: "about.txt" },
	{ id: "events", href: "/#events", ext: "EXE", label: "event.exe" },
	{ id: "schedule", href: "/#schedule", ext: "EXE", label: "schedule.exe" },
	{ id: "sponsors", href: "/#sponsors", ext: "DLL", label: "sponsors.dll" },
	{ id: "team", href: "/#team", ext: "CFG", label: "team.cfg" },
	{ id: "faq", href: "/#faq", ext: "TXT", label: "faq.txt" },
]

export function DesktopIcons() {
	const [current, setCurrent] = useState("")

	useEffect(() => {
		const read = () => setCurrent(window.location.hash.replace("#", ""))
		read()
		window.addEventListener("hashchange", read)
		return () => window.removeEventListener("hashchange", read)
	}, [])

	return (
		<nav className="dicons" aria-label="Desktop">
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
						<span className="dicon-label">{icon.label}</span>
					</a>
				)
			})}
		</nav>
	)
}
