import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"

import { renderMarkdown, safeUrl } from "./markdown.js"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const source = readFileSync(join(root, "worker", "handover.md"), "utf8")

test("renders headings, lists, links, and tables", () => {
	const html = renderMarkdown("# Title\n\nHello **there** and *you*.\n\n- [Site](https://exehacks.excs.uk/)\n- second\n\n1. First step\n   keeps going\n\n| A | B |\n| --- | --- |\n| `code` | [x](mailto:a@b.c) |\n\n> A note\n\n```\n<tag>\n```\n\n---\n")
	assert.match(html, /<h1 id="title">Title<\/h1>/)
	assert.match(html, /<strong>there<\/strong>/)
	assert.match(html, /<em>you<\/em>/)
	assert.match(html, /<a href="https:\/\/exehacks.excs.uk\/" rel="noopener noreferrer" target="_blank">Site<\/a>/)
	assert.match(html, /<ol><li>First step keeps going<\/li><\/ol>/)
	assert.match(html, /<code>code<\/code>/)
	assert.match(html, /href="mailto:a@b.c"/)
	assert.match(html, /<blockquote><p>A note<\/p><\/blockquote>/)
	assert.match(html, /<pre><code>&lt;tag&gt;<\/code><\/pre>/)
	assert.match(html, /<hr>/)
})

test("escapes raw html and drops unsafe links", () => {
	const html = renderMarkdown('See <script>alert(1)</script> and [click](javascript:alert(1)) and [bad](data:text/html,x).\n')
	assert.equal(html.includes("<script>"), false)
	assert.match(html, /&lt;script&gt;/)
	assert.equal(html.includes("javascript:"), false)
	assert.equal(html.includes("data:"), false)
	assert.equal(safeUrl("javascript:alert(1)"), "")
	assert.equal(safeUrl("#overview-and-timeline"), "#overview-and-timeline")
	assert.equal(safeUrl("#Not Safe"), "")
})

test("guide uses the sections the handover needs", () => {
	const html = renderMarkdown(source)
	const ids = new Set([...html.matchAll(/\sid="([a-z0-9-]+)"/g)].map((match) => match[1]))
	for (const id of [
		"overview-and-timeline",
		"accounts-and-where-things-live",
		"email-setup",
		"website-infrastructure-and-deploy",
		"partners",
		"sponsors",
		"budget",
		"operations-documents",
		"handover-checklist",
	]) {
		assert.ok(ids.has(id), id)
	}
	const hrefs = [...html.matchAll(/href="#([a-z0-9-]+)"/g)].map((match) => match[1])
	assert.ok(hrefs.length >= 9)
	for (const href of hrefs) assert.ok(ids.has(href), `missing #${href}`)
	assert.match(html, /Hackathon Organiser/)
	assert.match(html, /exehacks\.excs@gmail\.com/)
})

test("guide has no secret values, em dashes, or raw html", () => {
	assert.equal(source.includes("\u2014"), false)
	assert.equal(source.includes("\u2013"), false)
	const forbidden = [
		/-----BEGIN [A-Z ]*PRIVATE KEY-----/,
		/\b(sk_live|sk_test|ghp_|github_pat_|xox[baprs]-|AKIA[0-9A-Z]{16})\b/,
		/\bpassword\s*[:=]\s*\S+/i,
		/\bapi[_-]?key\s*[:=]\s*['"]?[A-Za-z0-9_-]{8,}/i,
		/\bBearer\s+[A-Za-z0-9._-]{8,}/,
		/\b(secret|token|key)\s*[:=]\s*['"]?[A-Za-z0-9+/=_-]{12,}/i,
	]
	for (const pattern of forbidden) assert.equal(pattern.test(source), false, String(pattern))
	assert.equal(/<(script|iframe|img|object)\b/i.test(source), false)
	assert.equal(source.includes("kazybekkhairulla@gmail.com"), false)
	assert.match(source, /outgoing organiser's personal Access login \(handed over privately\)/)
	assert.match(source, /smtp-relay\.brevo\.com/)
	assert.match(source, /20 November 2027/)
	assert.equal(/still being set up/i.test(source), false)
})

test("guide text is not shipped in the app, public files, or static export", () => {
	const needles = ["exehacks.excs@gmail.com", "South West Hacks", "kk598@exeter.ac.uk"]
	const hits = []
	function walk(dir) {
		if (!existsSync(dir)) return
		for (const entry of readdirSync(dir)) {
			if (entry === "node_modules" || entry === ".git" || entry === "worker") continue
			const path = join(dir, entry)
			const info = statSync(path)
			if (info.isDirectory()) {
				walk(path)
				continue
			}
			if (!/\.(html|js|jsx|css|txt|json|map|md|mdx)$/.test(entry)) continue
			if (entry === "package-lock.json") continue
			const text = readFileSync(path, "utf8")
			for (const needle of needles) {
				if (text.includes(needle)) hits.push(`${path} contains ${needle}`)
			}
		}
	}
	walk(join(root, "app"))
	walk(join(root, "public"))
	walk(join(root, "out"))
	assert.deepEqual(hits, [])
})
