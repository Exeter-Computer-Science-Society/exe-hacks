"use client"

import { useEffect, useState } from "react"

/* Fills from the interest opening already published on /interested
   (Mon 9 Nov 2026) to hacking start: Sat 6 Feb 2027, 11:00 UK (GMT). */
const START = Date.parse("2026-11-09T00:00:00Z")
const END = Date.parse("2027-02-06T11:00:00Z")
const BLOCKS = 14

function leftLabel(ms) {
	if (ms <= 0) return "0d left"
	const days = Math.floor(ms / 86400000)
	if (days >= 2) return `${days}d left`
	const hours = Math.max(1, Math.floor(ms / 3600000))
	return `${hours}h left`
}

export function ProgressBar() {
	const [now, setNow] = useState(null)

	useEffect(() => {
		const tick = () => setNow(Date.now())
		const first = setTimeout(tick, 0)
		const id = setInterval(tick, 1000)
		return () => {
			clearTimeout(first)
			clearInterval(id)
		}
	}, [])

	const span = END - START
	const ratio = now == null ? 0 : Math.min(1, Math.max(0, (now - START) / span))
	const filled = Math.max(1, Math.min(BLOCKS, Math.round(ratio * BLOCKS)))
	const remain = now == null ? null : END - now
	const percent = Math.round(ratio * 100)

	return (
		<div className="prog">
			<span>Installing...</span>
			<div
				className="pbar"
				role="progressbar"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={percent}
				aria-label="Time until ExeHacks hacking starts"
			>
				{Array.from({ length: BLOCKS }, (_, i) => (
					<i key={i} className={i < filled ? "on" : undefined} />
				))}
			</div>
			<span>{remain == null ? "--" : leftLabel(remain)}</span>
		</div>
	)
}
