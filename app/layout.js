import { JetBrains_Mono, Pixelify_Sans, Silkscreen } from "next/font/google"
import Script from "next/script"

import "./globals.css"
import "./tokens.css"
import "./exehacks.css"
import { FormspreeProvider } from "./components/FormspreeProvider"
import { Taskbar } from "./components/chrome/Taskbar"
import { THEME_BOOT } from "./components/chrome/theme"

const jetbrains = JetBrains_Mono({
	subsets: ["latin"],
	weight: ["400", "500", "700"],
	display: "swap",
	variable: "--font-jetbrains",
})
const pixelify = Pixelify_Sans({
	subsets: ["latin"],
	weight: ["600", "700"],
	display: "swap",
	variable: "--font-pixelify",
})
const silkscreen = Silkscreen({
	subsets: ["latin"],
	weight: "400",
	display: "swap",
	variable: "--font-silkscreen",
})

const fontVars = [jetbrains.variable, pixelify.variable, silkscreen.variable].join(" ")

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
		<html lang="en" suppressHydrationWarning className={fontVars}>
			<body>
				<Script id="exehacks-theme" strategy="beforeInteractive">
					{THEME_BOOT}
				</Script>
				<a className="skip" href="#content">
					Skip to content
				</a>
				<FormspreeProvider>
					<div id="content">{children}</div>
					<Taskbar />
				</FormspreeProvider>
			</body>
		</html>
	)
}
