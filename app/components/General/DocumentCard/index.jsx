import Image from "next/image"
import Link from "next/link"

export function DocumentCard({ document }) {
	return (
		<Link href={document.link} className="doc-card">
			<Image src={document.image} alt="" width={640} height={360} className="doc-card-img" />
			<span className="doc-card-name">{document.name}</span>
			<span className="doc-card-desc">{document.description}</span>
		</Link>
	)
}
