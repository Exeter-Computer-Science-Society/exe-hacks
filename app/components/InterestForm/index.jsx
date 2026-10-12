"use client"

import { ValidationError, useForm } from "@formspree/react"

import { CONTACT_EMAIL, FORMSPREE_INTEREST_FORM_KEY } from "../../config"

export function InterestForm() {
	const [state, handleSubmit, reset] = useForm(FORMSPREE_INTEREST_FORM_KEY, {
		data: {
			subject: "ExeHacks 2027 interest registration",
		},
	})

	function onSubmit(event) {
		event.preventDefault()
		const formData = new FormData(event.currentTarget)
		const university = formData.get("university")
		if (typeof university !== "string" || university.trim() === "") {
			formData.delete("university")
		}
		handleSubmit(formData)
	}

	if (state.succeeded) {
		return (
			<div className="sponsor-form sent" role="status">
				<p className="mono sponsor-form-kicker">You&apos;re on the list</p>
				<p>Thanks. We&apos;ll email you as soon as tickets are available.</p>
				<button
					type="button"
					className="btn btn-ghost"
					onClick={reset}
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
						required
					/>
					<ValidationError
						field="firstName"
						prefix="First name"
						errors={state.errors}
						className="sponsor-form-error"
					/>
				</label>
				<label className="sponsor-field" htmlFor="interest-last-name">
					<span>Last name</span>
					<input
						id="interest-last-name"
						type="text"
						name="lastName"
						autoComplete="family-name"
						required
					/>
					<ValidationError
						field="lastName"
						prefix="Last name"
						errors={state.errors}
						className="sponsor-form-error"
					/>
				</label>
				<label className="sponsor-field" htmlFor="interest-email">
					<span>Email</span>
					<input
						id="interest-email"
						type="email"
						name="email"
						autoComplete="email"
						required
					/>
					<ValidationError
						field="email"
						prefix="Email"
						errors={state.errors}
						className="sponsor-form-error"
					/>
				</label>
				<label className="sponsor-field" htmlFor="interest-university">
					<span>University (optional)</span>
					<input
						id="interest-university"
						type="text"
						name="university"
						autoComplete="organization"
					/>
					<ValidationError
						field="university"
						prefix="University"
						errors={state.errors}
						className="sponsor-form-error"
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
			<ValidationError
				field="consent"
				prefix="Consent"
				errors={state.errors}
				className="sponsor-form-error"
			/>
			{state.errors ? (
				<div role="alert">
					<p className="sponsor-form-error">
						We couldn&apos;t register your interest. Check the form and try again, or email{" "}
						<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
					</p>
					<ValidationError
						errors={state.errors}
						className="sponsor-form-error"
					/>
				</div>
			) : null}
			<div className="sponsor-form-actions">
				<button
					type="submit"
					className="btn btn-primary"
					disabled={state.submitting}
				>
					{state.submitting ? "Registering…" : "Register"}
				</button>
				<p className="mono">We&apos;ll only email you about ExeHacks.</p>
			</div>
		</form>
	)
}
