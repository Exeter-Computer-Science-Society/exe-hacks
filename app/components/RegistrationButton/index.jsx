import Link from "next/link"

/** The only public call to action: register interest for ExeHacks 2027. */
export function RegistrationButton({ label = "Register your interest" }) {
	return (
		<Link href="/interested/" className="btn btn-primary">
			{label}
		</Link>
	)
}
