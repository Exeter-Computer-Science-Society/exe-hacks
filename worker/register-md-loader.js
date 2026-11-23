import { register } from "node:module"

// Lets `npm test` import worker/handover.md. Wrangler bundles that file itself.
register("./md-loader.js", import.meta.url)
