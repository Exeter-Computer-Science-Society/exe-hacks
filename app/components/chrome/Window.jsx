"use client"

import { useEffect, useId, useState } from "react"

/**
 * A desktop window. Windows start open. The title-bar button minimises one to
 * its title bar; any link to the window's id (desktop icon, taskbar, in-page
 * link) opens it again.
 */
export function Window({ title, children, className = "", shadow = false, id, collapsible = true }) {
	const [open, setOpen] = useState(true)
	const bodyId = useId()
	const canCollapse = collapsible && Boolean(id)

	useEffect(() => {
		if (!canCollapse) return undefined
		const onClick = (event) => {
			const link = event.target instanceof Element ? event.target.closest("a[href]") : null
			if (link && link.hash === `#${id}`) setOpen(true)
		}
		const onHash = () => {
			if (window.location.hash === `#${id}`) setOpen(true)
		}
		document.addEventListener("click", onClick)
		window.addEventListener("hashchange", onHash)
		return () => {
			document.removeEventListener("click", onClick)
			window.removeEventListener("hashchange", onHash)
		}
	}, [canCollapse, id])

	const classes = ["win", shadow ? "win-shadow" : "", open ? "" : "win-min", className].filter(Boolean).join(" ")

	return (
		<section id={id} className={classes} aria-label={title}>
			<div className="tbar">
				<span className="tdots" aria-hidden="true">
					<i />
					<i />
					<i />
				</span>
				<span className="ttl">{title}</span>
				{canCollapse ? (
					<button
						type="button"
						className="tbtn"
						aria-expanded={open}
						aria-controls={bodyId}
						aria-label={open ? `Minimise ${title}` : `Open ${title}`}
						onClick={() => setOpen((value) => !value)}
					>
						<span aria-hidden="true">{open ? "_" : "+"}</span>
					</button>
				) : null}
			</div>
			<div className="wbody" id={bodyId} hidden={!open}>
				{children}
			</div>
		</section>
	)
}
