"use client"

import { usePathname } from "next/navigation"
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react"

import { DESKTOP_QUERY, WINDOWS, WINDOW_BY_ID } from "./windows"

/**
 * Window manager for the homepage desktop.
 *
 * One piece of state serves both layouts, and CSS decides what it means:
 *   - 1024px and wider: `open` shows or hides a window, `min` parks it on the
 *     taskbar, `order` is the z-order and `x`/`y` are where it was dragged to.
 *   - narrower: every window is stacked down the page, `min` folds a window
 *     to its title bar, and the rest is ignored.
 *
 * The provider lives in the root layout so the taskbar can list the open
 * windows. It only listens for anything while the homepage is mounted.
 */

const DesktopContext = createContext(null)

// How much of a dragged window has to stay on the desktop.
const KEEP_X = 96
const KEEP_Y = 40

const isDesktopNow = () => typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

function initialState() {
	const wins = {}
	for (const win of WINDOWS) wins[win.id] = { open: Boolean(win.open), min: false, x: null, y: null }
	return {
		wins,
		// z-order, last on top. The first window in the list starts in front.
		order: WINDOWS.map((win) => win.id).reverse(),
		// Taskbar order: the order windows were opened in.
		bar: WINDOWS.filter((win) => win.open).map((win) => win.id),
		// Bumped whenever a window should take keyboard focus.
		focus: null,
		// Until the first window is opened or raised, `onTop` windows float above the rest.
		untouched: true,
	}
}

const topOf = (state) => {
	for (let i = state.order.length - 1; i >= 0; i -= 1) {
		const win = state.wins[state.order[i]]
		if (win.open && !win.min) return state.order[i]
	}
	return null
}

const raised = (order, id) => (order[order.length - 1] === id ? order : [...order.filter((other) => other !== id), id])

// `quiet` brings a window forward without moving keyboard focus into it.
const focusOn = (state, id, target, quiet = false) => ({ id, target, quiet, n: (state.focus?.n ?? 0) + 1 })

function reducer(state, action) {
	const win = state.wins[action.id]
	if (!win) return state

	switch (action.type) {
		case "open": {
			const order = raised(state.order, action.id)
			const shown = win.open && !win.min
			if (shown && order === state.order && !action.focus) return state
			return {
				...state,
				order,
				untouched: state.untouched && shown && order === state.order,
				wins: shown ? state.wins : { ...state.wins, [action.id]: { ...win, open: true, min: false } },
				bar: state.bar.includes(action.id) ? state.bar : [...state.bar, action.id],
				focus: action.focus ? focusOn(state, action.id, action.target, action.quiet) : state.focus,
			}
		}
		case "raise": {
			const order = raised(state.order, action.id)
			return order === state.order ? state : { ...state, order, untouched: false }
		}
		case "minimise":
		case "close": {
			const next = {
				...state,
				wins: {
					...state.wins,
					[action.id]: action.type === "close" ? { ...win, open: false, min: false } : { ...win, min: true },
				},
				bar: action.type === "close" ? state.bar.filter((id) => id !== action.id) : state.bar,
			}
			const top = action.refocus ? topOf(next) : null
			return top ? { ...next, focus: focusOn(state, top) } : next
		}
		case "fold":
			return { ...state, wins: { ...state.wins, [action.id]: { ...win, min: !win.min } } }
		case "move":
			if (win.x === action.x && win.y === action.y) return state
			return { ...state, wins: { ...state.wins, [action.id]: { ...win, x: action.x, y: action.y } } }
		default:
			return state
	}
}

/** The window a URL hash points at: the window itself, or something inside one. */
function windowForHash(hash) {
	let name = hash.replace(/^#/, "")
	try {
		name = decodeURIComponent(name)
	} catch {
		return null
	}
	if (!name) return null
	if (WINDOW_BY_ID[name]) return { id: name }
	const host = document.getElementById(name)?.closest("[data-win]")
	return host ? { id: host.dataset.win, target: name } : null
}

/** Where a window dragged to (x, y) has to sit so it can still be grabbed. */
function reachable(el) {
	const area = el.offsetParent
	if (!area) return null
	return {
		x: clamp(el.offsetLeft, KEEP_X - el.offsetWidth, area.clientWidth - KEEP_X),
		y: clamp(el.offsetTop, 0, area.clientHeight - KEEP_Y),
	}
}

const setHash = (id) => window.history.replaceState(null, "", id ? `#${id}` : window.location.pathname + window.location.search)

export function DesktopProvider({ children }) {
	const isHome = usePathname() === "/"
	const [state, dispatch] = useReducer(reducer, undefined, initialState)
	const [isDesktop, setIsDesktop] = useState(false)

	const activeId = topOf(state)
	const activeRef = useRef(activeId)
	useEffect(() => {
		activeRef.current = activeId
	}, [activeId])

	useEffect(() => {
		// Also set by the inline script in the layout. This covers a script blocker.
		document.documentElement.dataset.js = "1"
		const query = window.matchMedia(DESKTOP_QUERY)
		const sync = () => setIsDesktop(query.matches)
		sync()
		query.addEventListener("change", sync)
		return () => query.removeEventListener("change", sync)
	}, [])

	const open = useCallback((id, target, quiet) => dispatch({ type: "open", id, target, quiet, focus: true }), [])
	const raise = useCallback((id) => {
		if (isDesktopNow()) dispatch({ type: "raise", id })
	}, [])
	const move = useCallback((id, x, y) => dispatch({ type: "move", id, x, y }), [])
	const fold = useCallback((id) => dispatch({ type: "fold", id }), [])

	// Opened from a desktop icon or the taskbar brand, where there is no link to follow.
	const launch = useCallback((id) => {
		dispatch({ type: "open", id, focus: true })
		if (isDesktopNow()) {
			setHash(id)
		} else if (window.location.hash === `#${id}`) {
			document.getElementById(id)?.scrollIntoView()
		} else {
			window.location.hash = id
		}
	}, [])

	const close = useCallback((id) => {
		const hadFocus = Boolean(document.getElementById(id)?.contains(document.activeElement))
		const icon = isDesktopNow() ? document.getElementById(`dicon-${id}`) : null
		dispatch({ type: "close", id, refocus: hadFocus && !icon })
		if (hadFocus && icon) icon.focus()
		if (window.location.hash === `#${id}`) setHash("")
	}, [])

	const minimise = useCallback((id) => {
		const hadFocus = Boolean(document.getElementById(id)?.contains(document.activeElement))
		dispatch({ type: "minimise", id })
		if (hadFocus) document.getElementById(`task-win-${id}`)?.focus()
	}, [])

	// A taskbar button brings its window forward, or parks it if it is already in front.
	const toggleFromTaskbar = useCallback(
		(id) => {
			if (activeRef.current === id) dispatch({ type: "minimise", id })
			else open(id)
		},
		[open]
	)

	// Move keyboard focus into a window once it is actually on screen.
	useEffect(() => {
		if (!state.focus || !isDesktopNow()) return
		const el = document.getElementById(state.focus.id)
		if (!el) return
		// It may have been dragged somewhere that no longer fits, then closed.
		const spot = el.hasAttribute("data-moved") ? reachable(el) : null
		if (spot) move(state.focus.id, spot.x, spot.y)
		if (!state.focus.quiet && !el.contains(document.activeElement)) el.focus({ preventScroll: true })
		if (state.focus.target) document.getElementById(state.focus.target)?.scrollIntoView({ block: "start" })
	}, [state.focus, move])

	useEffect(() => {
		if (!isHome) return undefined

		const openFromHash = (hash, quiet) => {
			const hit = windowForHash(hash)
			if (hit) open(hit.id, hit.target, quiet)
		}

		// A second click on the same link changes no hash, so links are watched too.
		const onClick = (event) => {
			const link = event.target instanceof Element ? event.target.closest("a[href]") : null
			if (!link || !link.hash || link.origin !== window.location.origin) return
			if (link.pathname !== window.location.pathname) return
			openFromHash(link.hash)
		}
		const onHash = () => openFromHash(window.location.hash)

		const onKey = (event) => {
			if (event.key !== "Escape" || event.defaultPrevented || !isDesktopNow()) return
			// The More menu closes itself on Escape. Leave the windows alone then.
			if (document.querySelector(".task-panel")) return
			const focused = document.activeElement
			const host = focused instanceof Element ? focused.closest("[data-win]") : null
			if (host) close(host.dataset.win)
			else if (!focused || focused === document.body) {
				if (activeRef.current) close(activeRef.current)
			}
		}

		// Keep dragged windows reachable when the browser window shrinks.
		const onResize = () => {
			if (!isDesktopNow()) return
			for (const el of document.querySelectorAll("[data-win][data-moved]")) {
				const spot = reachable(el)
				if (spot) move(el.dataset.win, spot.x, spot.y)
			}
		}

		// Deep link, such as /#faq, on load or when arriving from another page. The
		// window comes to the front, and focus stays where the browser put it.
		openFromHash(window.location.hash, true)

		document.addEventListener("click", onClick)
		document.addEventListener("keydown", onKey)
		window.addEventListener("hashchange", onHash)
		window.addEventListener("resize", onResize)
		return () => {
			document.removeEventListener("click", onClick)
			document.removeEventListener("keydown", onKey)
			window.removeEventListener("hashchange", onHash)
			window.removeEventListener("resize", onResize)
		}
	}, [isHome, open, close, move])

	const value = useMemo(
		() => ({ state, activeId, isHome, isDesktop, open, launch, raise, close, minimise, fold, move, toggleFromTaskbar }),
		[state, activeId, isHome, isDesktop, open, launch, raise, close, minimise, fold, move, toggleFromTaskbar]
	)

	return <DesktopContext.Provider value={value}>{children}</DesktopContext.Provider>
}

export function useDesktop() {
	const desk = useContext(DesktopContext)
	if (!desk) throw new Error("useDesktop needs <DesktopProvider> above it")
	return desk
}

/**
 * Everything one managed window needs: its state, the props for its outer
 * element and its title bar (the drag handle), and its button actions.
 */
export function useDeskWindow(id) {
	const desk = useDesktop()
	const def = WINDOW_BY_ID[id]
	if (!def) throw new Error(`No window "${id}" in windows.js`)

	const { state, raise, move } = desk
	const win = state.wins[id]
	const active = desk.activeId === id
	const ref = useRef(null)
	const drag = useRef(null)

	const onPointerDown = useCallback(
		(event) => {
			if (event.button !== 0 || !isDesktopNow()) return
			if (event.target instanceof Element && event.target.closest("button, a")) return
			const el = ref.current
			const area = el?.offsetParent
			if (!area) return
			drag.current = {
				pointer: event.pointerId,
				dx: event.clientX - el.offsetLeft,
				dy: event.clientY - el.offsetTop,
				minX: KEEP_X - el.offsetWidth,
				maxX: area.clientWidth - KEEP_X,
				maxY: area.clientHeight - KEEP_Y,
				x: el.offsetLeft,
				y: el.offsetTop,
				moved: false,
			}
			event.currentTarget.setPointerCapture(event.pointerId)
		},
		[]
	)

	// The drag writes straight to the element and only tells React where the
	// window ended up, so a drag does not re-render the desktop on every move.
	const onPointerMove = useCallback((event) => {
		const d = drag.current
		const el = ref.current
		if (!d || !el || d.pointer !== event.pointerId) return
		d.x = clamp(event.clientX - d.dx, d.minX, d.maxX)
		d.y = clamp(event.clientY - d.dy, 0, d.maxY)
		d.moved = true
		el.dataset.dragging = ""
		el.style.setProperty("--x", `${d.x}px`)
		el.style.setProperty("--y", `${d.y}px`)
	}, [])

	const endDrag = useCallback(
		(event) => {
			const d = drag.current
			if (!d || d.pointer !== event.pointerId) return
			drag.current = null
			if (ref.current) delete ref.current.dataset.dragging
			if (d.moved) move(id, d.x, d.y)
		},
		[id, move]
	)

	const moved = win.x != null
	const z = state.order.indexOf(id) + 10 + (def.onTop && state.untouched ? 100 : 0)

	return {
		title: def.title,
		open: win.open,
		min: win.min,
		active,
		frameProps: {
			id,
			ref,
			"data-win": id,
			"data-open": win.open,
			"data-active": active ? "" : undefined,
			"data-moved": moved ? "" : undefined,
			tabIndex: desk.isDesktop ? 0 : undefined,
			style: {
				"--x": moved ? `${win.x}px` : def.x,
				"--y": moved ? `${win.y}px` : def.y,
				"--w": def.w,
				"--z": z,
			},
			onPointerDownCapture: () => raise(id),
			onFocus: () => raise(id),
		},
		barProps: {
			onPointerDown,
			onPointerMove,
			onPointerUp: endDrag,
			onPointerCancel: endDrag,
			onLostPointerCapture: endDrag,
		},
		close: () => desk.close(id),
		// One button, two jobs: park the window on the taskbar, or fold it on mobile.
		minimise: () => (isDesktopNow() ? desk.minimise(id) : desk.fold(id)),
	}
}
