export const THEME_KEY = "exehacks-theme"

/** Runs before paint. Sets data-theme only when the visitor has saved a choice. */
export const THEME_BOOT = `(function(){try{var s=localStorage.getItem("${THEME_KEY}");if(s==="light"||s==="dark"){document.documentElement.setAttribute("data-theme",s);}}catch(e){}})();`

export function currentTheme() {
	const attr = document.documentElement.getAttribute("data-theme")
	if (attr === "light" || attr === "dark") return attr
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function storeTheme(theme) {
	document.documentElement.setAttribute("data-theme", theme)
	try {
		localStorage.setItem(THEME_KEY, theme)
	} catch (e) {
		/* private mode and blocked storage still toggle for this visit */
	}
}
