"use client"

import { useEffect, useState } from "react"

// The guide HTML is produced by the Worker from worker/handover.md. The
// renderer escapes raw HTML, so this is the Worker response, not a local string.
export function HandoverGuide() {
	const [html, setHtml] = useState("")
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let cancel = false
		async function load() {
			try {
				const response = await fetch("/api/admin/handover", { headers: { accept: "application/json" } })
				const body = await response.json().catch(() => ({}))
				if (!response.ok) throw new Error(body.error || "Could not load the handover guide.")
				if (cancel) return
				setHtml(typeof body.html === "string" ? body.html : "")
			} catch (cause) {
				if (!cancel) setError(cause instanceof Error ? cause.message : "Could not load the handover guide.")
			} finally {
				if (!cancel) setLoading(false)
			}
		}
		load()
		return () => {
			cancel = true
		}
	}, [])

	if (loading) return <p className="mono">Loading the handover guide…</p>
	if (error) {
		return (
			<p className="sponsor-form-error" role="alert">
				{error}
			</p>
		)
	}
	if (!html) return <p>The handover guide is empty.</p>
	return <div className="handover" dangerouslySetInnerHTML={{ __html: html }} />
}
