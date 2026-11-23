import { readFileSync } from "node:fs"

export async function load(url, context, nextLoad) {
	if (url.endsWith(".md")) {
		const source = readFileSync(new URL(url), "utf8")
		return {
			format: "module",
			source: `export default ${JSON.stringify(source)};\n`,
			shortCircuit: true,
		}
	}
	return nextLoad(url, context)
}
