"use client"

import { useState } from "react"

import { CONTACT_EMAIL } from "../../config"
import { SPONSOR_INTERESTS, SPONSOR_LIMITS } from "../../sponsor/options"

export function SponsorForm() {
	const [submitting, setSubmitting] = useState(false)
	const [succeeded, setSucceeded] = useState(false)
	const [error, setError] = useState("")
	const [field, setField] = useState("")

	async function onSubmit(event) {
		event.preventDefault()
		setError("")
		setField("")
		const form = event.currentTarget
		if (!form.reportValidity()) return

		const data = new FormData(form)
		setSubmitting(true)
		try {
			const response = await fetch("/api/sponsor", {
				method: "POST",
				headers: {
					accept: "application/json",
					"content-type": "application/json",
				},
				body: JSON.stringify({
					name: data.get("name"),
					company: data.get("company"),
					email: data.get("email"),
					interest: data.get("interest"),
					message: data.get("message"),
					hp_website: data.get("hp_website") || "",
				}),
			})
			let body = null
			try {
				body = await response.json()
			} catch {
				body = null
			}
			if (!response.ok) {
				setField(body && typeof body.field === "string" ? body.field : "")
				setError((body && typeof body.error === "string" && body.error) || "We couldn't send your enquiry. Check the form and try again.")
				return
			}
			setSucceeded(true)
		} catch {
			setError("We couldn't send your enquiry. Check your connection and try again.")
		} finally {
			setSubmitting(false)
		}
	}

	if (succeeded) {
		return (
			<div className="sponsor-form sent" role="status">
				<p className="mono sponsor-form-kicker">Enquiry sent</p>
				<p>Thanks. We&apos;ll reply from {CONTACT_EMAIL}.</p>
				<button
					type="button"
					className="btn btn-ghost"
					onClick={() => {
						setSucceeded(false)
						setError("")
						setField("")
					}}
				>
					Send another
				</button>
			</div>
		)
	}

	return (
		<form className="sponsor-form" onSubmit={onSubmit}>
			<p className="mono sponsor-form-kicker">Interested in sponsoring?</p>
			<div className="sponsor-form-grid">
				<label className="sponsor-field" htmlFor="sponsor-name">
					<span>Your name</span>
					<input
						id="sponsor-name"
						type="text"
						name="name"
						autoComplete="name"
						maxLength={SPONSOR_LIMITS.name}
						required
						aria-invalid={field === "name" || undefined}
						aria-describedby={field === "name" ? "sponsor-name-error" : undefined}
					/>
					<FieldError id="sponsor-name-error" field={field} name="name" message={error} />
				</label>
				<label className="sponsor-field" htmlFor="sponsor-company">
					<span>Organisation</span>
					<input
						id="sponsor-company"
						type="text"
						name="company"
						autoComplete="organization"
						maxLength={SPONSOR_LIMITS.company}
						required
						aria-invalid={field === "company" || undefined}
						aria-describedby={field === "company" ? "sponsor-company-error" : undefined}
					/>
					<FieldError id="sponsor-company-error" field={field} name="company" message={error} />
				</label>
				<label className="sponsor-field" htmlFor="sponsor-email">
					<span>Work email</span>
					<input
						id="sponsor-email"
						type="email"
						name="email"
						autoComplete="email"
						maxLength={SPONSOR_LIMITS.email}
						required
						aria-invalid={field === "email" || undefined}
						aria-describedby={field === "email" ? "sponsor-email-error" : undefined}
					/>
					<FieldError id="sponsor-email-error" field={field} name="email" message={error} />
				</label>
				<label className="sponsor-field" htmlFor="sponsor-interest">
					<span>What are you interested in?</span>
					<select
						id="sponsor-interest"
						name="interest"
						defaultValue="track"
						required
						aria-invalid={field === "interest" || undefined}
						aria-describedby={field === "interest" ? "sponsor-interest-error" : undefined}
					>
						{SPONSOR_INTERESTS.map((item) => (
							<option key={item.value} value={item.value}>
								{item.label}
							</option>
						))}
					</select>
					<FieldError id="sponsor-interest-error" field={field} name="interest" message={error} />
				</label>
			</div>
			<label className="sponsor-field" htmlFor="sponsor-message">
				<span>A short note</span>
				<textarea
					id="sponsor-message"
					name="message"
					rows={5}
					maxLength={SPONSOR_LIMITS.message}
					placeholder="Track idea, workshop, or just say hello."
					required
					aria-invalid={field === "message" || undefined}
					aria-describedby={field === "message" ? "sponsor-message-error" : undefined}
				/>
				<FieldError id="sponsor-message-error" field={field} name="message" message={error} />
			</label>
			<div className="sponsor-honeypot" aria-hidden="true">
				<input
					id="sponsor-hp"
					type="text"
					name="hp_website"
					tabIndex={-1}
					autoComplete="off"
					defaultValue=""
				/>
			</div>
			{error && !field ? (
				<div role="alert">
					<p className="sponsor-form-error">
						{error} You can also email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
					</p>
				</div>
			) : null}
			<div className="sponsor-form-actions">
				<button type="submit" className="btn btn-primary" disabled={submitting}>
					{submitting ? "Sending…" : "Send enquiry"}
				</button>
				<p className="mono">Goes to {CONTACT_EMAIL}. We reply from the same address.</p>
			</div>
		</form>
	)
}

function FieldError({ id, field, name, message }) {
	if (field !== name || !message) return null
	return (
		<p id={id} className="sponsor-form-error" role="alert">
			{message}
		</p>
	)
}
