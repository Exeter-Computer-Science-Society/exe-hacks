/**
 * Plain window chrome for the inner pages. The homepage windows, which can be
 * dragged, minimised and closed, are DeskWindow.
 */
export function Window({ title, children, className = "" }) {
	return (
		<section className={className ? `win ${className}` : "win"} aria-label={title}>
			<div className="tbar">
				<span className="tdots" aria-hidden="true">
					<i />
					<i />
					<i />
				</span>
				<span className="ttl">{title}</span>
			</div>
			<div className="wbody">{children}</div>
		</section>
	)
}
