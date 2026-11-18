export function Question({ info }) {
	return (
		<details className="faq-item">
			<summary className="faq-q">
				{info.question}
				<span className="ic" aria-hidden="true" />
			</summary>
			<div className="faq-a">
				<div className="faq-a-inner">{info.answer}</div>
			</div>
		</details>
	)
}
