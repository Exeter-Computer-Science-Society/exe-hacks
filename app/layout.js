import { Bricolage_Grotesque, JetBrains_Mono, Pixelify_Sans, VT323 } from "next/font/google"

import "./globals.css"
import "./tokens.css"
import "./exehacks.css"
import { Taskbar } from "./components/chrome/Taskbar"

// The same four faces the pre-desktop site used: Bricolage for body copy,
// Pixelify Sans for headings and the wordmark, VT323 for terminal chrome
// (title bars, labels, the clock), JetBrains Mono for anything code-like.
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], display: "swap", variable: "--font-bricolage" })
const jetbrains = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-jetbrains" })
const pixelify = Pixelify_Sans({ subsets: ["latin"], display: "swap", variable: "--font-pixelify" })
const vt323 = VT323({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-vt323" })

const fontVars = [bricolage.variable, jetbrains.variable, pixelify.variable, vt323.variable].join(" ")

const siteTitle = "ExeHacks: Exeter's student hackathon"
const siteDescription =
	"ExeHacks is the University of Exeter's student hackathon, 6-7 February 2027 at the Innovation Centre, Exeter. Build something that shouldn't exist yet. Run by the Exeter Computer Science Society (EXCS). Formerly Hack South West."

const ogImage = {
	url: "/hero/exehacks-hero-dark-1920x1080.png",
	width: 1920,
	height: 1080,
	alt: "ExeHacks 2027 setup window. 6-7 February 2027, Innovation Centre, Exeter. exehacks.excs.uk",
}

export const metadata = {
	metadataBase: new URL("https://exehacks.excs.uk"),
	title: siteTitle,
	description: siteDescription,
	openGraph: {
		title: siteTitle,
		description: siteDescription,
		url: "/",
		siteName: "ExeHacks",
		images: [ogImage],
		type: "website",
		locale: "en_GB",
	},
	twitter: {
		card: "summary_large_image",
		title: siteTitle,
		description: siteDescription,
		images: [ogImage],
	},
	icons: {
		icon: [
			{ url: "/favicon/favicon-16.png", sizes: "16x16", type: "image/png" },
			{ url: "/favicon/favicon-32.png", sizes: "32x32", type: "image/png" },
			{ url: "/favicon/favicon-64.png", sizes: "64x64", type: "image/png" },
		],
		shortcut: "/favicon/favicon-32.png",
		apple: "/favicon/apple-touch-icon.png",
	},
}

export default function RootLayout({ children }) {
	return (
		<html lang="en" data-theme="dark" className={fontVars}>
			<body>
				<a className="skip" href="#content">
					Skip to content
				</a>
				<div id="content">{children}</div>
				<Taskbar />

				{/* CRT scanline overlay, styled in exehacks.css */}
				<div className="scanlines" aria-hidden="true" />
			</body>
		</html>
	)
}
