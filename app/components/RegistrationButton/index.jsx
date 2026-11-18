import Link from "next/link"

/** The only public call to action: register interest for ExeHacks 2027. */
export function RegistrationButton({ label = "Register your interest", ariaLabel }) {
	return (
		<Link href="/interested/" className="btn btn-primary" aria-label={ariaLabel || label}>
			{label}
		</Link>
	)
}
