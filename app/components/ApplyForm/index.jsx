"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import {
	ADULT_AGE,
	AGES,
	COUNTRIES,
	EXPERIENCE_LEVELS,
	GRADUATION_YEARS,
	HACKATHONS_ATTENDED,
	HEARD_FROM,
	LEVELS_OF_STUDY,
	MLH_LINKS,
	OPENS_LABEL,
	SCHOOL_SUGGESTIONS,
	TEAM_STATUSES,
	TSHIRT_SIZES,
} from "../../apply/options"
import { CONTACT_EMAIL } from "../../config"

const DIETARY = ["Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free / Coeliac", "Dairy-free", "Nut allergy"]

function ext(href, children) {
	return (
		<a href={href} target="_blank" rel="noopener noreferrer">
			{children}
		</a>
	)
}

export function ApplyForm() {
	const router = useRouter()
	// "loading" until the Worker answers; "open" or "closed" after.
	const [state, setState] = useState("loading")
	const [preview, setPreview] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState("")
	const [duplicate, setDuplicate] = useState(false)
	const [age, setAge] = useState("")
	const [dietary, setDietary] = useState([])

	useEffect(() => {
		let cancel = false
		// ?preview=1 shows the form while closed so it can be checked. The Worker still refuses submissions.
		const wantsPreview = new URLSearchParams(window.location.search).get("preview") === "1"
		fetch("/api/apply/status", { headers: { accept: "application/json" } })
			.then((response) => (response.ok ? response.json() : { open: false }))
			.then((body) => {
				if (cancel) return
				setPreview(wantsPreview)
				setState(body && body.open === true ? "open" : "closed")
			})
			.catch(() => {
				if (cancel) return
				setPreview(wantsPreview)
				setState("closed")
			})
		return () => {
			cancel = true
		}
	}, [])

	async function onSubmit(event) {
		event.preventDefault()
		setError("")
		setDuplicate(false)
		const form = event.currentTarget
		if (!form.reportValidity()) return

		const data = new FormData(form)
		const dietaryOther = String(data.get("dietaryOther") || "").trim()
		const dietaryText = [...dietary, ...(dietaryOther ? [`Other: ${dietaryOther}`] : [])].join("; ")
		setSubmitting(true)
		try {
			const response = await fetch("/api/apply", {
				method: "POST",
				headers: { accept: "application/json", "content-type": "application/json" },
				body: JSON.stringify({
					firstName: data.get("firstName"),
					lastName: data.get("lastName"),
					email: data.get("email"),
					phone: data.get("phone") || "",
					age: data.get("age"),
					school: data.get("school"),
					levelOfStudy: data.get("levelOfStudy"),
					course: data.get("course"),
					graduationYear: data.get("graduationYear"),
					country: data.get("country"),
					dietary: dietaryText,
					accessibility: data.get("accessibility") || "",
					tshirtSize: data.get("tshirtSize"),
					hackathonsAttended: data.get("hackathonsAttended"),
					experienceLevel: data.get("experienceLevel"),
					teamStatus: data.get("teamStatus"),
					github: data.get("github") || "",
					linkedin: data.get("linkedin") || "",
					discord: data.get("discord") || "",
					why: data.get("why"),
					heardFrom: data.get("heardFrom"),
					mlhCodeOfConduct: data.get("mlhCodeOfConduct") === "yes",
					mlhDataSharing: data.get("mlhDataSharing") === "yes",
					mlhMarketing: data.get("mlhMarketing") === "yes",
					privacyConsent: data.get("privacyConsent") === "yes",
					hp_website: data.get("hp_website") || "",
				}),
			})
			if (!response.ok) {
				let body = null
				try {
					body = await response.json()
				} catch {
					body = null
				}
				if (body?.duplicate) setDuplicate(true)
				setError((body && typeof body.error === "string" && body.error) || "We couldn't send your application. Check the form and try again.")
				return
			}
			router.push("/apply/thanks/")
		} catch {
			setError("We couldn't send your application. Check your connection and try again.")
		} finally {
			setSubmitting(false)
		}
	}

	if (state === "loading") {
		return <p className="mono">Checking whether applications are open…</p>
	}

	if (state === "closed" && !preview) {
		return (
			<div className="sponsor-form sent" role="status">
				<p className="mono sponsor-form-kicker">Applications open {OPENS_LABEL}</p>
				<p>
					Hacker applications for ExeHacks 2027 aren&apos;t open yet. Register your interest and we&apos;ll email you the
					moment they open.
				</p>
				<div className="sponsor-form-actions">
					<Link href="/interested/" className="btn btn-primary">
						Register your interest
					</Link>
				</div>
			</div>
		)
	}

	const under18 = age !== "" && Number.parseInt(age, 10) < ADULT_AGE

	return (
		<form className="sponsor-form" onSubmit={onSubmit} noValidate={false}>
			{state === "closed" && preview ? (
				<p className="mono apply-preview" role="note">
					Preview only. Applications open {OPENS_LABEL}; submissions are not saved yet.
				</p>
			) : null}

			<p className="mono sponsor-form-kicker">About you</p>
			<div className="sponsor-form-grid">
				<label className="sponsor-field" htmlFor="apply-first">
					<span>First name</span>
					<input id="apply-first" type="text" name="firstName" autoComplete="given-name" maxLength={80} required />
				</label>
				<label className="sponsor-field" htmlFor="apply-last">
					<span>Last name</span>
					<input id="apply-last" type="text" name="lastName" autoComplete="family-name" maxLength={80} required />
				</label>
				<label className="sponsor-field" htmlFor="apply-email">
					<span>Email</span>
					<input id="apply-email" type="email" name="email" autoComplete="email" maxLength={254} required />
				</label>
				<label className="sponsor-field" htmlFor="apply-phone">
					<span>Phone (optional, for day-of contact)</span>
					<input id="apply-phone" type="tel" name="phone" autoComplete="tel" maxLength={30} pattern="[0-9+()\s\-]{7,30}" />
				</label>
				<label className="sponsor-field" htmlFor="apply-age">
					<span>Age on 6 February 2027</span>
					<select id="apply-age" name="age" required value={age} onChange={(event) => setAge(event.target.value)}>
						<option value="" disabled>
							Choose one
						</option>
						{AGES.map((value) => (
							<option key={value} value={value}>
								{value}
							</option>
						))}
					</select>
				</label>
				<label className="sponsor-field" htmlFor="apply-country">
					<span>Country of residence</span>
					<select id="apply-country" name="country" required defaultValue="">
						<option value="" disabled>
							Choose one
						</option>
						{COUNTRIES.map((value) => (
							<option key={value} value={value}>
								{value}
							</option>
						))}
					</select>
				</label>
			</div>
			{under18 ? (
				<p className="apply-note" role="note">
					You can apply if you&apos;re 16 or 17, but we&apos;ll need a signed parent or guardian consent form before we can
					confirm your place.
				</p>
			) : null}

			<p className="mono sponsor-form-kicker">Study</p>
			<div className="sponsor-form-grid">
				<label className="sponsor-field" htmlFor="apply-school">
					<span>University or school</span>
					<input id="apply-school" type="text" name="school" list="apply-schools" maxLength={160} placeholder="Start typing, e.g. University of Exeter" required />
					<datalist id="apply-schools">
						{SCHOOL_SUGGESTIONS.map((name) => (
							<option key={name} value={name} />
						))}
					</datalist>
				</label>
				<label className="sponsor-field" htmlFor="apply-level">
					<span>Level of study</span>
					<select id="apply-level" name="levelOfStudy" required defaultValue="">
						<option value="" disabled>
							Choose one
						</option>
						{LEVELS_OF_STUDY.map((value) => (
							<option key={value} value={value}>
								{value}
							</option>
						))}
					</select>
				</label>
				<label className="sponsor-field" htmlFor="apply-course">
					<span>Course or major</span>
					<input id="apply-course" type="text" name="course" maxLength={160} placeholder="e.g. Computer Science" required />
				</label>
				<label className="sponsor-field" htmlFor="apply-grad">
					<span>Graduation year</span>
					<select id="apply-grad" name="graduationYear" required defaultValue="">
						<option value="" disabled>
							Choose one
						</option>
						{GRADUATION_YEARS.map((value) => (
							<option key={value} value={value}>
								{value}
							</option>
						))}
					</select>
				</label>
			</div>

			<p className="mono sponsor-form-kicker">Hacking</p>
			<div className="sponsor-form-grid">
				<label className="sponsor-field" htmlFor="apply-hackathons">
					<span>Hackathons you&apos;ve been to</span>
					<select id="apply-hackathons" name="hackathonsAttended" required defaultValue="">
						<option value="" disabled>
							Choose one
						</option>
						{HACKATHONS_ATTENDED.map((item) => (
							<option key={item.value} value={item.value}>
								{item.label}
							</option>
						))}
					</select>
				</label>
				<label className="sponsor-field" htmlFor="apply-experience">
					<span>Coding experience</span>
					<select id="apply-experience" name="experienceLevel" required defaultValue="">
						<option value="" disabled>
							Choose one
						</option>
						{EXPERIENCE_LEVELS.map((item) => (
							<option key={item.value} value={item.value}>
								{item.label}
							</option>
						))}
					</select>
				</label>
				<label className="sponsor-field" htmlFor="apply-team">
					<span>Team</span>
					<select id="apply-team" name="teamStatus" required defaultValue="">
						<option value="" disabled>
							Choose one
						</option>
						{TEAM_STATUSES.map((item) => (
							<option key={item.value} value={item.value}>
								{item.label}
							</option>
						))}
					</select>
				</label>
				<label className="sponsor-field" htmlFor="apply-github">
					<span>GitHub username or URL (optional)</span>
					<input id="apply-github" type="text" name="github" maxLength={200} pattern="(https?://(www\.)?github\.com/)?[A-Za-z0-9](?:[A-Za-z0-9\-]{0,38})/?" title="A GitHub username or github.com link" />
				</label>
				<label className="sponsor-field" htmlFor="apply-linkedin">
					<span>LinkedIn URL (optional)</span>
					<input id="apply-linkedin" type="url" name="linkedin" maxLength={200} pattern="https?://([a-z]{2,3}\.)?linkedin\.com/.+" title="A linkedin.com link" placeholder="https://www.linkedin.com/in/…" />
				</label>
				<label className="sponsor-field" htmlFor="apply-discord">
					<span>Discord username (optional)</span>
					<input id="apply-discord" type="text" name="discord" maxLength={37} pattern="@?[A-Za-z0-9_.]{2,32}(#[0-9]{4})?" title="Your Discord username, e.g. exehacks_fan" />
				</label>
			</div>
			<label className="sponsor-field" htmlFor="apply-why">
				<span>Why do you want to come to ExeHacks? (a few sentences is plenty)</span>
				<textarea id="apply-why" name="why" maxLength={1500} required />
			</label>
			<label className="sponsor-field" htmlFor="apply-heard">
				<span>How did you hear about ExeHacks?</span>
				<select id="apply-heard" name="heardFrom" required defaultValue="">
					<option value="" disabled>
						Choose one
					</option>
					{HEARD_FROM.map((value) => (
						<option key={value} value={value}>
							{value}
						</option>
					))}
				</select>
			</label>

			<p className="mono sponsor-form-kicker">On the day</p>
			<div className="sponsor-form-grid">
				<label className="sponsor-field" htmlFor="apply-tshirt">
					<span>T-shirt size (unisex)</span>
					<select id="apply-tshirt" name="tshirtSize" required defaultValue="">
						<option value="" disabled>
							Choose one
						</option>
						{TSHIRT_SIZES.map((value) => (
							<option key={value} value={value}>
								{value}
							</option>
						))}
					</select>
				</label>
			</div>
			<fieldset className="sponsor-field apply-fieldset">
				<span>Dietary requirements (tick any that apply)</span>
				{DIETARY.map((item, index) => (
					<label className="sponsor-check" key={item} htmlFor={`apply-diet-${index}`}>
						<input
							id={`apply-diet-${index}`}
							type="checkbox"
							value={item}
							checked={dietary.includes(item)}
							onChange={(event) =>
								setDietary((current) => (event.target.checked ? [...current, item] : current.filter((d) => d !== item)))
							}
						/>
						<span>{item}</span>
					</label>
				))}
			</fieldset>
			<label className="sponsor-field" htmlFor="apply-diet-other">
				<span>Other allergies or dietary needs (optional)</span>
				<input id="apply-diet-other" type="text" name="dietaryOther" maxLength={300} />
			</label>
			<label className="sponsor-field" htmlFor="apply-access">
				<span>Accessibility needs (optional). Anything that helps us make the weekend work for you.</span>
				<textarea id="apply-access" name="accessibility" maxLength={1000} />
			</label>

			<p className="mono sponsor-form-kicker">Agreements</p>
			<p className="apply-note">
				We are currently in the process of partnering with MLH. The following 3 checkboxes are for this partnership. If we
				do not end up partnering with MLH, your information will not be shared. The first two are required; the third is
				optional.
			</p>
			<label className="sponsor-check" htmlFor="apply-mlh-coc">
				<input id="apply-mlh-coc" type="checkbox" name="mlhCodeOfConduct" value="yes" required />
				<span>I have read and agree to the {ext(MLH_LINKS.codeOfConduct, "MLH Code of Conduct")}.</span>
			</label>
			<label className="sponsor-check" htmlFor="apply-mlh-data">
				<input id="apply-mlh-data" type="checkbox" name="mlhDataSharing" value="yes" required />
				<span>
					I authorize you to share my application/registration information with Major League Hacking for event
					administration, ranking, and administration (including the creation of linked accounts on MLH and DEV (dev.to))
					in line with the {ext(MLH_LINKS.privacyPolicy, "MLH Privacy Policy")}. I further agree to the terms of both the{" "}
					{ext(MLH_LINKS.contestTerms, "MLH Contest Terms and Conditions")} and the{" "}
					{ext(MLH_LINKS.privacyPolicy, "MLH Privacy Policy")}.
				</span>
			</label>
			<label className="sponsor-check" htmlFor="apply-mlh-marketing">
				<input id="apply-mlh-marketing" type="checkbox" name="mlhMarketing" value="yes" />
				<span>
					I authorize MLH + DEV to send me occasional emails about relevant events, career opportunities, and
					community announcements.
				</span>
			</label>
			<p className="apply-note">
				ExeHacks is run by the Exeter Computer Science Society (EXCS). We use your answers to review your application, plan
				food, kit and access for the weekend, and contact you about ExeHacks 2027. Only the organising team can see them, and
				we don&apos;t sell or share them, apart from MLH as described above. To see, change or delete your data, email{" "}
				<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
			</p>
			<label className="sponsor-check" htmlFor="apply-privacy">
				<input id="apply-privacy" type="checkbox" name="privacyConsent" value="yes" required />
				<span>I agree to EXCS storing and using these details to run ExeHacks 2027, as described above.</span>
			</label>

			<div className="sponsor-honeypot" aria-hidden="true">
				<input type="text" name="hp_website" tabIndex={-1} autoComplete="off" defaultValue="" />
			</div>
			{error ? (
				<div role="alert">
					<p className={duplicate ? "apply-note" : "sponsor-form-error"}>
						{error} {duplicate ? "Need to change something? Email " : "You can also email "}
						<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
					</p>
				</div>
			) : null}
			<div className="sponsor-form-actions">
				<button type="submit" className="btn btn-primary" disabled={submitting}>
					{submitting ? "Sending…" : "Submit application"}
				</button>
			</div>
		</form>
	)
}
