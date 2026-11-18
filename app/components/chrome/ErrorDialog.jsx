"use client"

import { useState } from "react"

export function ErrorDialog({ className = "" }) {
	const [open, setOpen] = useState(true)
	if (!open) return null

	return (
		<aside className={className ? `win err ${className}` : "win err"} aria-label="sleep.exe">
			<div className="tbar tbar-err">
				<span className="ttl">sleep.exe</span>
				<button type="button" className="tbtn" aria-label="Close sleep.exe" onClick={() => setOpen(false)}>
					x
				</button>
			</div>
			<div className="ebody">
				<span className="warn" aria-hidden="true">
					!
				</span>
				<p>sleep.exe could not be found. Keep hacking?</p>
			</div>
			<div className="efoot">
				<button type="button" className="btn btn-primary" onClick={() => setOpen(false)}>
					OK
				</button>
			</div>
		</aside>
	)
}
