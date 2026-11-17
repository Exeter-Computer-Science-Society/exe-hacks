"use client"

import { useEffect, useState } from "react"

// Reviewer-only pages show applicant personal data. They are hidden here for the
// rest of the team, and the Worker refuses them anyway (403).
const LINKS = [
	["", "Command Centre", false],
	["/applications", "Applications", true],
	["/checkin", "Check-in", true],
	["/signups", "All tables", true],
]

export function AdminNav({ base = "/admin", current = "" }) {
	const [reviewer, setReviewer] = useState(false)

	useEffect(() => {
		let cancel = false
		fetch(`${base === "/team" ? "/api/team" : "/api/admin"}/me`, { headers: { accept: "application/json" } })
			.then((response) => (response.ok ? response.json() : null))
			.then((body) => {
				if (!cancel) setReviewer(Boolean(body?.reviewer))
			})
			.catch(() => {})
		return () => {
			cancel = true
		}
	}, [base])

	return (
		<nav className="admin-tabs admin-nav" aria-label="Admin pages">
			{LINKS.filter(([, , reviewerOnly]) => reviewer || !reviewerOnly).map(([path, label]) => (
				<a key={path} href={`${base}${path}/`} className={path === current ? "btn btn-primary" : "btn btn-ghost"} aria-current={path === current ? "page" : undefined}>
					{label}
				</a>
			))}
			{base === "/team" ? (
				<a href="/auth/logout" className="btn btn-ghost">
					Sign out
				</a>
			) : null}
		</nav>
	)
}
