"use client"

import { useDesktop } from "./Desktop"
import { ProgramIcon } from "./ProgramIcon"
import { DESKTOP_ICONS } from "./windows"

/** Desktop shortcuts. Each one is a button that opens its window. */
export function DesktopIcons() {
	const { activeId, launch } = useDesktop()

	return (
		<div className="dicons" role="group" aria-label="Desktop icons">
			{DESKTOP_ICONS.map(({ id, icon }) => {
				const classes = ["dicon", activeId === id ? "sel" : "", icon.onMobile === false ? "dicon-wide" : ""]
					.filter(Boolean)
					.join(" ")
				return (
					<button key={id} type="button" id={`dicon-${id}`} className={classes} onClick={() => launch(id)}>
						{icon.kind === "program" ? (
							<span className="dicon-prog">
								<ProgramIcon size={56} />
							</span>
						) : (
							<span className="dicon-file" aria-hidden="true">
								<b>.{icon.ext}</b>
							</span>
						)}
						<span className="dicon-label">
							<span className="dicon-label-full">{icon.label}</span>
							<span className="dicon-label-short">{icon.short}</span>
						</span>
					</button>
				)
			})}
		</div>
	)
}
