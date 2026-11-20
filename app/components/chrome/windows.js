/**
 * Every window on the homepage desktop, in the order they stack on mobile.
 *
 * `x`, `y` and `w` are the window's starting place and width on the desktop
 * layout (1024px and wider). They are CSS lengths measured from the top left
 * of the desktop area, so they may use %, clamp() and calc(). Below 1024px the
 * windows stack down the page and these are ignored.
 *
 * `icon` puts a shortcut on the desktop. `onMobile: false` keeps a shortcut
 * out of the short icon row on small screens.
 */
// Room kept clear on the right for the icon column.
const ICON_COLUMN = 140

/** Left edge that centres a window `w` px wide in the space beside the icons, nudged by `dx`. */
const centred = (w, dx = 0) => `max(20px, calc(50% - ${w / 2 + ICON_COLUMN / 2 - dx}px))`

const SETUP_X = centred(760)
const SETUP_Y = "clamp(58px, calc(50% - 300px), 210px)"

export const WINDOWS = [
	{
		id: "setup",
		title: "ExeHacks 2027 Setup",
		icon: { kind: "program", label: "setup.exe", short: "Setup", onMobile: false },
		open: true,
		x: SETUP_X,
		y: SETUP_Y,
		w: "760px",
	},
	{
		id: "sleep",
		title: "sleep.exe",
		open: true,
		// The error box starts in front of the setup window without taking the
		// focus from it. Opening or raising anything else puts it back in line.
		onTop: true,
		// Over the bottom right corner of the setup window.
		x: `calc(${SETUP_X} + 520px)`,
		y: `calc(${SETUP_Y} + 318px)`,
		w: "300px",
	},
	{
		id: "about",
		title: "about.txt",
		icon: { ext: "TXT", label: "about.txt", short: "About" },
		x: centred(880, -40),
		y: "clamp(62px, calc(50% - 280px), 150px)",
		w: "880px",
	},
	{
		id: "tracks",
		title: "tracks.txt",
		icon: { ext: "TXT", label: "tracks.txt", short: "Tracks" },
		x: centred(560, 70),
		y: "clamp(110px, calc(50% - 170px), 300px)",
		w: "560px",
	},
	{
		id: "team",
		title: "team.cfg",
		icon: { ext: "CFG", label: "team.cfg", short: "Team" },
		x: centred(900),
		y: "70px",
		w: "900px",
	},
	{
		id: "sponsors",
		title: "sponsors.dll",
		icon: { ext: "DLL", label: "sponsors.dll", short: "Sponsors" },
		x: centred(860, 40),
		y: "78px",
		w: "860px",
	},
	{
		id: "faq",
		title: "faq.txt",
		icon: { ext: "TXT", label: "faq.txt", short: "FAQ" },
		x: centred(880, -20),
		y: "clamp(86px, calc(50% - 330px), 160px)",
		w: "880px",
	},
	{
		id: "register",
		title: "register.exe",
		icon: { kind: "program", label: "register.exe", short: "Register", onMobile: false },
		x: centred(520, 30),
		y: "clamp(96px, calc(50% - 150px), 320px)",
		w: "520px",
	},
]

export const WINDOW_BY_ID = Object.fromEntries(WINDOWS.map((win) => [win.id, win]))

// The mobile icon row keeps the order it has always had.
const ICON_ORDER = ["setup", "about", "tracks", "sponsors", "team", "faq", "register"]
export const DESKTOP_ICONS = ICON_ORDER.map((id) => WINDOW_BY_ID[id])

// Matches the breakpoint in exehacks.css where the stacked page becomes the desktop.
export const DESKTOP_QUERY = "(min-width: 1024px)"
