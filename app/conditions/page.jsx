import { DocumentCard } from "../components/General/DocumentCard"
import { PageWindow } from "../components/chrome/PageWindow"

export default function DocumentsPage() {
	const documents = [
		{
			name: "Terms & Conditions",
			description: "The terms and conditions of the event",
			image: "/images/terms/terms.jpg",
			link: "/conditions/terms/",
		},
		{
			name: "Intellectual Property",
			description: "The intellectual property rights of the event",
			image: "/images/terms/intellectual.jpg",
			link: "/conditions/intellectual/",
		},
	]

	return (
		<PageWindow title="docs.txt">
			<h1 className="h-section">Documents</h1>
			<div className="doc-grid">
				{documents.map((doc) => (
					<DocumentCard key={doc.link} document={doc} />
				))}
			</div>
		</PageWindow>
	)
}
