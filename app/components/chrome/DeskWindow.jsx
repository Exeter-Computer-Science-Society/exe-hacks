"use client"

import { useId } from "react"

import { useDeskWindow } from "./Desktop"

/**
 * A homepage window. Its title and starting place come from windows.js.
 *
 * On the desktop layout it can be dragged by the title bar, raised by clicking
 * it, parked on the taskbar or closed. On the stacked mobile layout the same
 * minimise button folds it to its title bar, and any link to its id opens it.
 */
export function DeskWindow({ id, children, className = "", shadow = false }) {
	const win = useDeskWindow(id)
	const bodyId = useId()

	const classes = ["win", shadow ? "win-shadow" : "", win.min ? "win-min" : "", className].filter(Boolean).join(" ")

	return (
		<section {...win.frameProps} className={classes} aria-label={win.title}>
			<div className="tbar" {...win.barProps}>
				<span className="tdots" aria-hidden="true">
					<i />
					<i />
					<i />
				</span>
				<span className="ttl">{win.title}</span>
				<span className="tbtns">
					<button
						type="button"
						className="tbtn"
						aria-expanded={!win.min}
						aria-controls={bodyId}
						aria-label={win.min ? `Open ${win.title}` : `Minimise ${win.title}`}
						onClick={win.minimise}
					>
						<span aria-hidden="true">{win.min ? "+" : "_"}</span>
					</button>
					<button type="button" className="tbtn tbtn-close" aria-label={`Close ${win.title}`} onClick={win.close}>
						<span aria-hidden="true">x</span>
					</button>
				</span>
			</div>
			<div className="wbody" id={bodyId} hidden={win.min}>
				{children}
			</div>
		</section>
	)
}
