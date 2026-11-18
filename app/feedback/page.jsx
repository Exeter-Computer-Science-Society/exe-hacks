import { PageWindow } from "../components/chrome/PageWindow"

export default function FeedbackPage() {
	return (
		<PageWindow title="feedback.url">
			<h1 className="h-section">Feedback</h1>
			<p className="lead">The ExeHacks feedback form.</p>
			<iframe
				className="feedback-frame"
				title="ExeHacks feedback form"
				src="https://forms.office.com/e/h3skKC6kvS?embed=true"
			/>
		</PageWindow>
	)
}
