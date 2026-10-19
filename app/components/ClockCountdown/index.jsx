"use client"

import { useEffect, useState } from "react"

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const pad = (n, width = 2) => String(n).padStart(width, "0")

function split(ms) {
	const left = Math.max(0, ms)
	return {
		days: Math.floor(left / DAY),
		hours: Math.floor((left % DAY) / HOUR),
		minutes: Math.floor((left % HOUR) / MINUTE),
		seconds: Math.floor((left % MINUTE) / SECOND),
	}
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`

/**
 * Terminal-style DD:HH:MM:SS clock counting down to `target` (ms since epoch).
 * Client-only: before mount it renders "--" placeholders at the same size, so nothing shifts.
 * Screen readers get a minute-level sentence instead of the ticking digits, with aria-live off
 * so it is read on demand rather than announced every second.
 * Calls onDone once when the target passes.
 */
// dayDigits fixes the width of the days cell (use 3 for targets 100+ days away) so it never resizes.
export function ClockCountdown({ target, label, onDone, prompt = "$ ./open --in", dayDigits = 2 }) {
	const [now, setNow] = useState(null)

	useEffect(() => {
		const tick = () => setNow(Date.now())
		const first = setTimeout(tick, 0)
		const id = setInterval(tick, 250)
		return () => {
			clearTimeout(first)
			clearInterval(id)
		}
	}, [])

	const done = now !== null && now >= target
	useEffect(() => {
		if (done && onDone) onDone()
	}, [done, onDone])

	const parts = now === null ? null : split(target - now)
	const cells = [
		{ key: "days", label: "Days" },
		{ key: "hours", label: "Hours" },
		{ key: "minutes", label: "Mins" },
		{ key: "seconds", label: "Secs" },
	]
	const width = (key) => (key === "days" ? Math.max(2, dayDigits) : 2)
	const spoken = parts
		? `${label} ${plural(parts.days, "day")}, ${plural(parts.hours, "hour")} and ${plural(parts.minutes, "minute")}.`
		: label

	return (
		<div className="clock" role="timer" aria-live="off" aria-atomic="true">
			<span className="clock-sr">{spoken}</span>
			<div className="clock-face" aria-hidden="true">
				<span className="clock-prompt">{prompt}</span>
				<div className="clock-digits">
					{cells.map((cell, index) => (
						<div className="clock-group" key={cell.key}>
							{index > 0 ? <span className="clock-sep">:</span> : null}
							<div className="clock-cell">
								<span className="clock-value" style={{ width: `${width(cell.key)}ch` }}>
									{parts ? pad(parts[cell.key], width(cell.key)) : "-".repeat(width(cell.key))}
								</span>
								<span className="clock-label">{cell.label}</span>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
