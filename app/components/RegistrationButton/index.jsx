import Link from "next/link"

import { REGISTER } from "../../config"

/**
 * The only public call to action. Where it goes is decided by REGISTER in
 * app/config.js: the on-site interest form, or an external registration page.
 */
export function RegistrationButton({ label = REGISTER.label, className = "btn btn-primary", ...rest }) {
	if (REGISTER.external) {
		return (
			<a href={REGISTER.href} className={className} target="_blank" rel="noopener noreferrer" {...rest}>
				{label}
			</a>
		)
	}
	return (
		<Link href={REGISTER.href} className={className} {...rest}>
			{label}
		</Link>
	)
}
