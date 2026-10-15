/**
 * Site-wide constants that change between event cycles.
 */

// Where people are pointed for sponsorship and data questions.
export const CONTACT_EMAIL = "excs@groups.exeterguild.com"

// Formspree CLI project for the sponsor enquiry only. Interest signups go to
// D1 via POST /api/interest, not Formspree. The form key must match formspree.json.
// Project ID comes from the Formspree dashboard (Settings on a CLI project).
export const FORMSPREE_FORM_KEY = "sponsorForm"
export const FORMSPREE_PROJECT_ID = process.env.NEXT_PUBLIC_FORMSPREE_PROJECT_ID ?? ""
