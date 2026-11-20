/**
 * Sponsor enquiry choices shared by the form, the Worker and the admin filter.
 * The CHECK constraint in migrations/0005_sponsor_enquiries.sql must list the
 * same values.
 */

export const SPONSOR_INTERESTS = [
	{ value: "track", label: "Named prize track" },
	{ value: "workshop", label: "Workshop or talk" },
	{ value: "booth", label: "Booth on the weekend" },
	{ value: "judging", label: "Judging seat" },
	{ value: "general", label: "General, not sure yet" },
]

export const SPONSOR_LIMITS = {
	name: 120,
	company: 200,
	email: 254,
	interest: 32,
	message: 1000,
}
