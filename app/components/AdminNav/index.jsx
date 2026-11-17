const LINKS = [
	["", "Command Centre"],
	["/applications", "Applications"],
	["/checkin", "Check-in"],
	["/signups", "All tables"],
]

export function AdminNav({ base = "/admin", current = "" }) {
	return (
		<nav className="admin-tabs admin-nav" aria-label="Admin pages">
			{LINKS.map(([path, label]) => (
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
