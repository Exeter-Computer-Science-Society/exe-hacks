/**
 * Command Centre layout and event facts, shared by /admin and the Worker.
 *
 * Edit this file (via a PR) to rename, reorder or add sections, or to change
 * the event dates and capacity. The tracker items themselves live in D1
 * (command_centre_items) because this repo is public and items name real
 * people, sponsors and contacts. Edit those from /admin.
 */

export const EVENT = {
	name: "ExeHacks 2027",
	// Hacking starts Sat 6 Feb 2027, 11:00 UK. Same moment as the homepage countdown.
	startsAt: "2027-02-06T11:00:00Z",
	window: "Sat 6 to Sun 7 Feb 2027",
	capacity: 150,
	minAge: 18,
}

// key: stored in command_centre_items.section. Keep keys stable once items use them.
export const SECTIONS = [
	{ key: "actions", label: "Next actions", hint: "The few things that move the event forward this week." },
	{ key: "venue", label: "Venue", hint: "Rooms, bookings, staffing and risk assessments." },
	{ key: "mlh", label: "MLH", hint: "Member Event application, calls and perks." },
	{ key: "judges", label: "Judges and mentors", hint: "Who is confirmed, who is pending." },
	{ key: "sponsors", label: "Sponsors and partners", hint: "Pipeline, offers and next steps." },
	{ key: "team", label: "Core team", hint: "Roles and open seats." },
	{ key: "site", label: "Website and applications", hint: "Site, forms and tooling." },
	{ key: "inbox", label: "Inbox waiting on replies", hint: "Emails someone needs to answer." },
	{ key: "links", label: "Links", hint: "Booking pages and shared docs." },
]

export const SECTION_KEYS = SECTIONS.map((section) => section.key)

export const TONES = [
	{ value: "", label: "Neutral" },
	{ value: "success", label: "Good" },
	{ value: "warning", label: "Needs attention" },
	{ value: "danger", label: "Blocking" },
]
