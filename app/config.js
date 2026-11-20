/**
 * Site-wide constants that change between event cycles.
 */

// Where people are pointed for sponsorship and data questions.
export const CONTACT_EMAIL = "sponsors@exehacks.excs.uk"

// Formspree CLI project for the sponsor enquiry only. Interest signups go to
// D1 via POST /api/interest, not Formspree. The form key must match formspree.json.
// Project ID comes from the Formspree dashboard (Settings on a CLI project).
export const FORMSPREE_FORM_KEY = "sponsorForm"
export const FORMSPREE_PROJECT_ID = process.env.NEXT_PUBLIC_FORMSPREE_PROJECT_ID ?? ""

// Registration. This is the one switch for every Register button (taskbar,
// More menu, setup window, register.exe window).
//
// Empty: the buttons open the on-site interest form at /interested/.
// A full https:// URL (for example the Tito event page): the buttons open
// that page in a new tab instead, and the copy next to them changes to match.
//
// Either paste the URL between the quotes below, or set NEXT_PUBLIC_REGISTER_URL
// when `next build` runs. The value is inlined at build time.
export const REGISTER_URL = (process.env.NEXT_PUBLIC_REGISTER_URL || "").trim()

const EXTERNAL_REGISTER = /^https?:\/\//i.test(REGISTER_URL)

export const REGISTER = EXTERNAL_REGISTER
	? {
			href: REGISTER_URL,
			external: true,
			label: "Register",
			note: "Opens the registration page in a new tab.",
			blurb: "Grab your place on the registration page.",
		}
	: {
			href: "/interested/",
			external: false,
			label: "Register your interest",
			note: "Registers your interest. We'll email you.",
			blurb: "Leave your details and we'll email you.",
		}
