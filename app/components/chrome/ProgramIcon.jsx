/** Program icon. Screen, chevron and cursor colours do not follow the page theme. */
export function ProgramIcon({ size = 64 }) {
	return (
		<span className="prog-icon" style={{ "--s": `${size}px` }} aria-hidden="true">
			<span className="prog-icon-sh" />
			<span className="prog-icon-body">
				<span className="prog-icon-bar">
					<i />
					<i />
				</span>
				<span className="prog-icon-scr">
					<svg viewBox="0 0 12 10" shapeRendering="crispEdges">
						<path
							fill="var(--green)"
							d="M0 0h2v1H0zM1 1h2v1H1zM2 2h2v1H2zM3 3h2v1H3zM4 4h2v2H4zM3 6h2v1H3zM2 7h2v1H2zM1 8h2v1H1zM0 9h2v1H0z"
						/>
						<path fill="var(--purple)" d="M7 8h5v2H7z" />
					</svg>
				</span>
			</span>
		</span>
	)
}
