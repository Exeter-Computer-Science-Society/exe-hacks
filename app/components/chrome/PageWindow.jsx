import { Window } from "./Window"

/** Inner pages sit in one window on the desktop. */
export function PageWindow({ title, children }) {
	return (
		<div className="page-desk">
			<Window title={title} className="win-page">
				{children}
			</Window>
		</div>
	)
}
