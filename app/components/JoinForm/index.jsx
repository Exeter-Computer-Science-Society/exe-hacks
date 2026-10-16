"use client"

import { useState } from "react"

import { CONTACT_EMAIL } from "../../config"
import { TEAM_ROLES } from "../../join/roles"

const MAX_ROLES = 2

export function JoinForm() {
	const [submitting, setSubmitting] = useState(false)
	const [succeeded, setSucceeded] = useState(false)
	const [error, setError] = useState("")
	const [roles, setRoles] = useState([])

	function toggleRole(role, checked) {
		setRoles((current) => (checked ? [...current, role].slice(0, MAX_ROLES) : current.filter((r) => r !== role)))
	}

	async function onSubmit(event) {
		event.preventDefault()
		setError("")
		const form = event.currentTarget
		if (!form.reportValidity()) return
		if (roles.length < 1 || roles.length > MAX_ROLES) {
			setError("Pick one or two roles.")
			return
		}

		const data = new FormData(form)
		setSubmitting(true)
		try {
			const response = await fetch("/api/join", {
				method: "POST",
				headers: { accept: "application/json", "content-type": "application/json" },
				body: JSON.stringify({
					fullName: data.get("fullName"),
					email: data.get("email"),
					phone: data.get("phone"),
					courseYear: data.get("courseYear"),
					discord: data.get("discord"),
					linkedin: data.get("linkedin") || "",
					github: data.get("github") || "",
					roles,
					why: data.get("why"),
					experience: data.get("experience") || "",
					availability: data.get("availability"),
					consent: data.get("consent") === "yes",
					hp_website: data.get("hp_website") || "",
				}),
			})
			if (!response.ok) {
				let message = ""
				try {
					const body = await response.json()
					if (body && typeof body.error === "string") message = body.error
				} catch {
					message = ""
				}
				setError(message || "We couldn't send your application. Check the form and try again.")
				return
			}
			setSucceeded(true)
		} catch {
			setError("We couldn't send your application. Check your connection and try again.")
		} finally {
			setSubmitting(false)
		}
	}

	if (succeeded) {
		return (
			<div className="sponsor-form sent" role="status">
				<p className="mono sponsor-form-kicker">Application sent</p>
				<p>Thanks for applying. We&apos;ll be in touch about next steps.</p>
			</div>
		)
	}

	return (
		<form className="sponsor-form" onSubmit={onSubmit}>
			<p className="mono sponsor-form-kicker">About you</p>
			<div className="sponsor-form-grid">
				<label className="sponsor-field" htmlFor="join-name">
					<span>Full name</span>
					<input id="join-name" type="text" name="fullName" autoComplete="name" maxLength={120} required />
				</label>
				<label className="sponsor-field" htmlFor="join-email">
					<span>University email</span>
					<input id="join-email" type="email" name="email" autoComplete="email" maxLength={254} required />
				</label>
				<label className="sponsor-field" htmlFor="join-phone">
					<span>Phone (MLH needs this for day-of contact)</span>
					<input id="join-phone" type="tel" name="phone" autoComplete="tel" maxLength={30} pattern="[0-9+()\s\-]{7,30}" required />
				</label>
				<label className="sponsor-field" htmlFor="join-course">
					<span>Course and year</span>
					<input id="join-course" type="text" name="courseYear" maxLength={120} placeholder="e.g. Computer Science, 2nd year" required />
				</label>
				<label className="sponsor-field" htmlFor="join-discord">
					<span>Discord username</span>
					<input id="join-discord" type="text" name="discord" maxLength={37} pattern="@?[A-Za-z0-9_.]{2,32}(#[0-9]{4})?" title="Your Discord username, e.g. exehacks_fan" required />
				</label>
				<label className="sponsor-field" htmlFor="join-linkedin">
					<span>LinkedIn URL (optional)</span>
					<input id="join-linkedin" type="url" name="linkedin" maxLength={200} pattern="https?://([a-z]{2,3}\.)?linkedin\.com/.+" title="A linkedin.com link" placeholder="https://www.linkedin.com/in/…" />
				</label>
				<label className="sponsor-field" htmlFor="join-github">
					<span>GitHub username or URL (optional)</span>
					<input id="join-github" type="text" name="github" maxLength={200} pattern="(https?://(www\.)?github\.com/)?[A-Za-z0-9](?:[A-Za-z0-9\-]{0,38})/?" title="A GitHub username or github.com link" />
				</label>
			</div>

			<fieldset className="sponsor-field">
				<span>Roles you&apos;re interested in (pick up to 2)</span>
				{TEAM_ROLES.map((role, index) => {
					const checked = roles.includes(role)
					return (
						<label className="sponsor-check" key={role} htmlFor={`join-role-${index}`}>
							<input
								id={`join-role-${index}`}
								type="checkbox"
								name="roles"
								value={role}
								checked={checked}
								disabled={!checked && roles.length >= MAX_ROLES}
								onChange={(event) => toggleRole(role, event.target.checked)}
							/>
							<span>{role}</span>
						</label>
					)
				})}
			</fieldset>

			<label className="sponsor-field" htmlFor="join-why">
				<span>Why do you want to help?</span>
				<textarea id="join-why" name="why" maxLength={2000} required />
			</label>
			<label className="sponsor-field" htmlFor="join-experience">
				<span>Relevant experience (optional)</span>
				<textarea id="join-experience" name="experience" maxLength={2000} />
			</label>
			<label className="sponsor-field" htmlFor="join-availability">
				<span>Are you available the full weekend, 6–7 February?</span>
				<select id="join-availability" name="availability" required defaultValue="">
					<option value="" disabled>Choose one</option>
					<option value="yes">Yes</option>
					<option value="partly">Partly</option>
					<option value="no">No</option>
				</select>
			</label>

			<label className="sponsor-check" htmlFor="join-consent">
				<input id="join-consent" type="checkbox" name="consent" value="yes" required />
				<span>I agree to EXCS storing these details for ExeHacks team selection.</span>
			</label>
			<div className="sponsor-honeypot" aria-hidden="true">
				<input type="text" name="hp_website" tabIndex={-1} autoComplete="off" defaultValue="" />
			</div>
			{error ? (
				<div role="alert">
					<p className="sponsor-form-error">
						{error} You can also email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
					</p>
				</div>
			) : null}
			<div className="sponsor-form-actions">
				<button type="submit" className="btn btn-primary" disabled={submitting}>
					{submitting ? "Sending…" : "Apply"}
				</button>
			</div>
		</form>
	)
}
