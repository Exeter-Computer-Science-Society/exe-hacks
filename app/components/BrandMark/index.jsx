import Link from "next/link"

import { ProgramIcon } from "../chrome/ProgramIcon"

/** Terminal icon plus the pixel wordmark. Used in the nav and the footer. */
export function BrandMark() {
	return (
		<Link className="brand brand-lockup" href="/" aria-label="ExeHacks home">
			<ProgramIcon size={32} />
			<b className="brand-word">.EXEHACKS</b>
		</Link>
	)
}
