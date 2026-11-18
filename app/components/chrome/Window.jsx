export function Window({ title, children, className = "", shadow = false, id }) {
	const classes = ["win", shadow ? "win-shadow" : "", className].filter(Boolean).join(" ")
	return (
		<section id={id} className={classes}>
			<div className="tbar">
				<span className="ttl">{title}</span>
				<span className="tbtns" aria-hidden="true">
					<span className="tbtn">_</span>
					<span className="tbtn">x</span>
				</span>
			</div>
			<div className="wbody">{children}</div>
		</section>
	)
}
