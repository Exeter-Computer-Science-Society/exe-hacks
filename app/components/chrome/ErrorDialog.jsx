"use client"

import { useDeskWindow } from "./Desktop"

/** sleep.exe. A small error box that floats over the desktop until it is dismissed. */
export function ErrorDialog({ className = "" }) {
	const win = useDeskWindow("sleep")

	return (
		<aside {...win.frameProps} className={className ? `win err ${className}` : "win err"} aria-label={win.title}>
			<div className="tbar tbar-err" {...win.barProps}>
				<span className="ttl">{win.title}</span>
				<button type="button" className="tbtn" aria-label={`Close ${win.title}`} onClick={win.close}>
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
				<button type="button" className="btn btn-primary" onClick={win.close}>
					OK
				</button>
			</div>
		</aside>
	)
}
