import { Bricolage_Grotesque, JetBrains_Mono, Pixelify_Sans, VT323 } from "next/font/google"
import "./globals.css"
import "./exehacks.css"
import { FormspreeProvider } from "./components/FormspreeProvider"
import { TopBar } from "./components/TopBar"
import { Footer } from "./components/Footer"

// The ExeHacks design system reaches for these through CSS custom properties
// (--font-display / --font-mono in the base theme, --font-pixel / --font-term
// under data-theme="retro"), so each one only needs to expose a variable.
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], display: "swap", variable: "--font-bricolage" })
const jetbrains = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-jetbrains" })
const pixelify = Pixelify_Sans({ subsets: ["latin"], display: "swap", variable: "--font-pixelify" })
const vt323 = VT323({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-vt323" })

const fontVars = [bricolage.variable, jetbrains.variable, pixelify.variable, vt323.variable].join(" ")

const siteTitle = "ExeHacks: Exeter's student hackathon"
const siteDescription =
	"ExeHacks is the University of Exeter's student hackathon, 6–7 February 2027. Venue TBC (University of Exeter). Run by the Exeter Computer Science Society (EXCS). Formerly Hack South West."

// Link preview card for WhatsApp, Discord, LinkedIn, X etc. 1200x630, made from
// the site's own wordmark/palette. Child pages inherit it via the root layout.
const ogImage = {
	url: "/images/og/exehacks-og.png",
	width: 1200,
	height: 630,
	alt: "ExeHacks: 6–7 February 2027. University of Exeter, 24-hour student hackathon. exehacks.excs.uk",
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
	// Sized favicons from public/images/icons/. public/favicon.ico is the same
	// mark so browsers that still request /favicon.ico get the new icon.
	icons: {
		icon: [
			{ url: "/images/icons/exehacks-favicon-purple-16.png", sizes: "16x16", type: "image/png" },
			{ url: "/images/icons/exehacks-favicon-purple-32.png", sizes: "32x32", type: "image/png" },
		],
		shortcut: "/images/icons/exehacks-favicon-purple-32.png",
		apple: "/images/icons/exehacks-icon.png",
	},
}

export default function RootLayout({ children }) {
	return (
		<html
			lang="en"
			data-theme="retro"
			className={`w-full h-full ${fontVars}`}
		>
			<body className="w-full h-fit">
				<FormspreeProvider>
					<TopBar />
					{children}
					<Footer />
				</FormspreeProvider>

				{/* CRT scanline overlay. Retro theme only, styled in exehacks.css */}
				<div
					className="scanlines"
					aria-hidden="true"
				/>
			</body>
		</html>
	)
}
