"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

export function OrganiserNav() {
	const [show, setShow] = useState(false)

	useEffect(() => {
		let cancel = false
		async function load() {
			try {
				const response = await fetch("/api/admin/session", { headers: { accept: "application/json" } })
				if (!response.ok) return
				const body = await response.json()
				if (!cancel && body?.organiser) setShow(true)
			} catch {
				// Signups still load if the role check does not.
			}
		}
		load()
		return () => {
			cancel = true
		}
	}, [])

	if (!show) return null

	return (
		<p className="mono admin-organiser-link">
			<Link href="/admin/handover/">Organiser handover guide</Link>
		</p>
	)
}
