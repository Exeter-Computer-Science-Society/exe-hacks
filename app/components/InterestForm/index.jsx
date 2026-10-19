"use client"

import { useState } from "react"

import { CONTACT_EMAIL } from "../../config"

export function InterestForm() {
	const [submitting, setSubmitting] = useState(false)
	const [succeeded, setSucceeded] = useState(false)
	const [error, setError] = useState("")

	async function onSubmit(event) {
		event.preventDefault()
		setError("")
		const form = event.currentTarget
		if (!form.reportValidity()) return

		const data = new FormData(form)
		const university = data.get("university")
		setSubmitting(true)
		try {
			const response = await fetch("/api/interest", {
				method: "POST",
				headers: {
					accept: "application/json",
					"content-type": "application/json",
				},
				body: JSON.stringify({
					firstName: data.get("firstName"),
					lastName: data.get("lastName"),
					email: data.get("email"),
					university: typeof university === "string" ? university : "",
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
				setError(message || "We couldn't register your interest. Check the form and try again.")
				return
			}
			setSucceeded(true)
		} catch {
			setError("We couldn't register your interest. Check your connection and try again.")
		} finally {
			setSubmitting(false)
		}
	}

	if (succeeded) {
		return (
			<div className="sponsor-form sent" role="status">
				<p className="mono sponsor-form-kicker">You&apos;re on the list</p>
				<p>Thanks. We&apos;ll email you as soon as applications open (Mon 9 Nov 2026).</p>
				<button
					type="button"
					className="btn btn-ghost"
					onClick={() => {
						setSucceeded(false)
						setError("")
					}}
				>
					Register someone else
				</button>
			</div>
		)
	}

	return (
		<form
			className="sponsor-form"
			onSubmit={onSubmit}
		>
			<p className="mono sponsor-form-kicker">Your details</p>
			<div className="sponsor-form-grid">
				<label className="sponsor-field" htmlFor="interest-first-name">
					<span>First name</span>
					<input
						id="interest-first-name"
						type="text"
						name="firstName"
						autoComplete="given-name"
						maxLength={80}
						required
					/>
				</label>
				<label className="sponsor-field" htmlFor="interest-last-name">
					<span>Last name</span>
					<input
						id="interest-last-name"
						type="text"
						name="lastName"
						autoComplete="family-name"
						maxLength={80}
					/>
				</label>
				<label className="sponsor-field" htmlFor="interest-email">
					<span>Email</span>
					<input
						id="interest-email"
						type="email"
						name="email"
						autoComplete="email"
						maxLength={254}
						required
					/>
				</label>
				<label className="sponsor-field" htmlFor="interest-university">
					<span>University (optional)</span>
					<input
						id="interest-university"
						type="text"
						name="university"
						autoComplete="organization"
						maxLength={120}
					/>
				</label>
			</div>
			<label className="sponsor-check" htmlFor="interest-consent">
				<input
					id="interest-consent"
					type="checkbox"
					name="consent"
					value="yes"
					required
				/>
				<span>I agree to be emailed about ExeHacks.</span>
			</label>
			<div className="sponsor-honeypot" aria-hidden="true">
				<input
					id="interest-hp"
					type="text"
					name="hp_website"
					tabIndex={-1}
					autoComplete="off"
					defaultValue=""
				/>
			</div>
			{error ? (
				<div role="alert">
					<p className="sponsor-form-error">
						{error} You can also email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
					</p>
				</div>
			) : null}
			<div className="sponsor-form-actions">
				<button
					type="submit"
					className="btn btn-primary"
					disabled={submitting}
				>
					{submitting ? "Registering…" : "Register"}
				</button>
				<p className="mono">We&apos;ll only email you about ExeHacks.</p>
			</div>
		</form>
	)
}
