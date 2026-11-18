/**
 * Confirmed ExeHacks 2027 sponsors, shown on the homepage and /sponsor.
 *
 * The list starts empty until a sponsor is confirmed. When it is empty, both
 * pages show a "Sponsors coming soon / Become a sponsor" card.
 *
 * To add a sponsor logo:
 *   1. Drop the file in public/sponsors/ (SVG, PNG, or WebP; landscape or
 *      square works best). Do not put files under public/images/sponsors/.
 *      That folder is for past Hack South West logos.
 *   2. Append an object to SPONSORS:
 *        {
 *          name: "Example Ltd",
 *          logo: "/sponsors/example.svg",
 *          url: "https://example.com",
 *          tier: "gold",
 *        }
 *      `tier` is one of: "title", "gold", "silver", "bronze", "partner".
 *      It is shown as a small label under the logo. Logos stay in array order
 *      and are grouped by that tier list.
 *   3. Commit the image and this file. No other code changes are required.
 *
 * Do not add a logo until the partnership is confirmed.
 */
export const SPONSOR_TIERS = ["title", "gold", "silver", "bronze", "partner"]

export const SPONSORS = []
