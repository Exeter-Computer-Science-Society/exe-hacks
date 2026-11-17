import Link from "next/link"

/** The main public call to action: apply for ExeHacks 2027. */
export function RegistrationButton({ label = "Apply to hack", href = "/apply/" }) {
	return (
		<Link href={href} className="btn btn-primary">
			{label}
		</Link>
	)
}
