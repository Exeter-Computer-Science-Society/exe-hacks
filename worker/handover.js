import source from "./handover.md"
import { renderMarkdown } from "./markdown.js"

function asText(value) {
	if (typeof value === "string") return value
	if (value && typeof value.default === "string") return value.default
	return ""
}

export function handoverHtml() {
	return renderMarkdown(asText(source))
}
