"use client"

import { useState } from "react"

/**
 * A small sleep.exe-style dialog. It stays in normal document flow so it
 * never covers the page. Closing it removes it; nothing is positioned on top
 * of other content.
 */
export function ErrorDialog({
	className = "",
	title = "sleep.exe",
	message = "sleep.exe could not be found. Keep hacking?",
}) {
	const [open, setOpen] = useState(true)
	if (!open) return null

	return (
		<aside className={className ? `exe-pop ${className}` : "exe-pop"} aria-label={title}>
			<div className="exe-pop-bar">
				<span>{title}</span>
				<button type="button" aria-label={`Close ${title}`} onClick={() => setOpen(false)}>
					x
				</button>
			</div>
			<div className="exe-pop-body">
				<span className="exe-pop-warn" aria-hidden="true">
					!
				</span>
				<p>{message}</p>
			</div>
			<div className="exe-pop-foot">
				<button type="button" className="btn btn-primary" onClick={() => setOpen(false)}>
					OK
				</button>
			</div>
		</aside>
	)
}
