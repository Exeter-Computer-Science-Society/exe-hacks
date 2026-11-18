import Image from "next/image"
import Link from "next/link"

export function DocumentCard({ document }) {
	return (
		<Link href={document.link} className="block w-full max-w-[320px] overflow-hidden border-2 border-[color:var(--line)] bg-black">
			<Image src={document.image} alt="" width={640} height={360} className="h-40 w-full object-cover" />
			<span className="block px-3 pt-3 text-xl font-extrabold text-HSWaccent">{document.name}</span>
			<span className="block px-3 pb-4 text-sm text-HSWtext">{document.description}</span>
		</Link>
	)
}
