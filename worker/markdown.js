/**
 * Small Markdown renderer for the organiser guide.
 *
 * The Worker turns worker/handover.md into HTML and only then sends it to a
 * signed-in Hackathon Organiser. Raw HTML in the file is escaped. Links are
 * limited to http, https, mailto, and in-page #anchors.
 *
 * Supported: headings (# to ###), paragraphs, flat - and 1. lists (indent a
 * wrapped line by two spaces), blockquotes, fenced code, --- rules, GFM
 * tables, `code`, **bold**, *italic*, and [label](url).
 */

const UNSAFE_PROTOCOL = /^(javascript|data|vbscript):/i

export function renderMarkdown(source) {
	const lines = String(source).replace(/\r\n?/g, "\n").split("\n")
	const blocks = []
	const ids = new Map()
	let i = 0
	while (i < lines.length) {
		const line = lines[i]
		if (line.trim() === "") {
			i += 1
			continue
		}
		if (isFence(line)) {
			const block = readFence(lines, i)
			blocks.push(block.html)
			i = block.next
			continue
		}
		if (isHeading(line)) {
			blocks.push(renderHeading(line, ids))
			i += 1
			continue
		}
		if (isRule(line)) {
			blocks.push("<hr>")
			i += 1
			continue
		}
		if (isTable(lines, i)) {
			const block = readTable(lines, i)
			blocks.push(block.html)
			i = block.next
			continue
		}
		if (isQuote(line)) {
			const block = readQuote(lines, i)
			blocks.push(block.html)
			i = block.next
			continue
		}
		const list = readList(lines, i)
		if (list) {
			const tag = list.kind === "ol" ? "ol" : "ul"
			const items = list.items.map((item) => `<li>${renderInline(item)}</li>`).join("")
			blocks.push(`<${tag}>${items}</${tag}>`)
			i = list.next
			continue
		}
		const block = readParagraph(lines, i)
		blocks.push(`<p>${renderInline(block.text)}</p>`)
		i = block.next
	}
	return blocks.join("\n")
}

function renderHeading(line, ids) {
	const match = /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(line)
	const level = match[1].length
	const text = match[2].trim()
	const id = uniqueId(slugify(text), ids)
	return `<h${level} id="${id}">${renderInline(text)}</h${level}>`
}

function uniqueId(base, ids) {
	const root = base || "section"
	const seen = ids.get(root) || 0
	ids.set(root, seen + 1)
	return seen === 0 ? root : `${root}-${seen + 1}`
}

function slugify(text) {
	return text
		.toLowerCase()
		.replace(/&/g, " and ")
		.replace(/[`*_]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
}

function readFence(lines, start) {
	const body = []
	let i = start + 1
	while (i < lines.length && !isFence(lines[i])) {
		body.push(lines[i])
		i += 1
	}
	const next = i < lines.length ? i + 1 : i
	return { html: `<pre><code>${escapeHtml(body.join("\n"))}</code></pre>`, next }
}

function readQuote(lines, start) {
	const parts = []
	let i = start
	while (i < lines.length && isQuote(lines[i])) {
		parts.push(lines[i].replace(/^>\s?/, "").trim())
		i += 1
	}
	return { html: `<blockquote><p>${renderInline(parts.join(" "))}</p></blockquote>`, next: i }
}

function readList(lines, start) {
	const first = listMarker(lines[start])
	if (!first) return null
	const items = []
	let i = start
	while (i < lines.length) {
		const line = lines[i]
		if (line.trim() === "") break
		const marker = listMarker(line)
		if (marker && marker.kind === first.kind) {
			items.push(marker.text)
			i += 1
			continue
		}
		if (/^ {2,}\S/.test(line) && items.length) {
			items[items.length - 1] += ` ${line.trim()}`
			i += 1
			continue
		}
		break
	}
	return { kind: first.kind, items, next: i }
}

function readParagraph(lines, start) {
	const parts = []
	let i = start
	while (i < lines.length) {
		const line = lines[i]
		if (line.trim() === "") break
		if (isFence(line) || isHeading(line) || isRule(line) || isQuote(line) || listMarker(line) || isTable(lines, i)) break
		parts.push(line.trim())
		i += 1
	}
	return { text: parts.join(" "), next: i }
}

function readTable(lines, start) {
	const rows = []
	let i = start
	while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
		if (!isSeparator(lines[i])) rows.push(splitRow(lines[i]))
		i += 1
	}
	const header = rows[0] || []
	const body = rows.slice(1)
	const head = `<thead><tr>${header.map((cell) => `<th>${renderInline(cell)}</th>`).join("")}</tr></thead>`
	const renderedBody = body
		.map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join("")}</tr>`)
		.join("")
	return { html: `<div class="admin-table-wrap"><table class="admin-table">${head}<tbody>${renderedBody}</tbody></table></div>`, next: i }
}

function renderInline(text) {
	let out = ""
	let i = 0
	while (i < text.length) {
		if (text[i] === "`") {
			const end = text.indexOf("`", i + 1)
			if (end !== -1) {
				out += `<code>${escapeHtml(text.slice(i + 1, end))}</code>`
				i = end + 1
				continue
			}
		}
		if (text.startsWith("**", i)) {
			const end = text.indexOf("**", i + 2)
			if (end !== -1) {
				out += `<strong>${renderInline(text.slice(i + 2, end))}</strong>`
				i = end + 2
				continue
			}
		}
		if (text[i] === "*") {
			const end = text.indexOf("*", i + 1)
			if (end > i + 1) {
				out += `<em>${renderInline(text.slice(i + 1, end))}</em>`
				i = end + 1
				continue
			}
		}
		if (text[i] === "[") {
			const labelEnd = text.indexOf("]", i + 1)
			if (labelEnd !== -1 && text[labelEnd + 1] === "(") {
				const hrefEnd = text.indexOf(")", labelEnd + 2)
				if (hrefEnd !== -1) {
					const href = safeUrl(text.slice(labelEnd + 2, hrefEnd).trim())
					const label = renderInline(text.slice(i + 1, labelEnd))
					if (href) {
						const external = href.startsWith("http://") || href.startsWith("https://")
						const extra = external ? ' rel="noopener noreferrer" target="_blank"' : ""
						out += `<a href="${escapeHtml(href)}"${extra}>${label}</a>`
					} else {
						out += label
					}
					i = hrefEnd + 1
					continue
				}
			}
		}
		const next = indexOfSpecial(text, i)
		out += escapeHtml(text.slice(i, next))
		i = next
	}
	return out
}

function indexOfSpecial(text, from) {
	for (let i = from + 1; i < text.length; i += 1) {
		const char = text[i]
		if (char === "`" || char === "*" || char === "[") return i
	}
	return text.length
}

export function safeUrl(value) {
	if (value.startsWith("#")) {
		return /^#[a-z0-9-]+$/.test(value) ? value : ""
	}
	if (UNSAFE_PROTOCOL.test(value)) return ""
	try {
		const url = new URL(value)
		if (url.protocol === "https:" || url.protocol === "http:" || url.protocol === "mailto:") return url.href
	} catch {
		return ""
	}
	return ""
}

function listMarker(line) {
	const unordered = /^[-*]\s+(.+)$/.exec(line)
	if (unordered) return { kind: "ul", text: unordered[1].trim() }
	const ordered = /^\d+\.\s+(.+)$/.exec(line)
	if (ordered) return { kind: "ol", text: ordered[1].trim() }
	return null
}

function isFence(line) {
	return /^```/.test(line.trim())
}

function isHeading(line) {
	return /^#{1,3}\s+\S/.test(line)
}

function isRule(line) {
	return /^(---|\*\*\*|___)\s*$/.test(line.trim())
}

function isQuote(line) {
	return /^>\s?/.test(line)
}

function isTable(lines, index) {
	const line = lines[index] || ""
	const next = lines[index + 1] || ""
	return line.includes("|") && isSeparator(next)
}

function isSeparator(line) {
	const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "")
	if (!trimmed.includes("-")) return false
	return trimmed.split("|").every((cell) => /^:?-{3,}:?$/.test(cell.trim()))
}

function splitRow(line) {
	const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "")
	return trimmed.split("|").map((cell) => cell.trim())
}

function escapeHtml(value) {
	return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char])
}
