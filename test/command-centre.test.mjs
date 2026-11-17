import assert from "node:assert/strict"
import { test } from "node:test"

import { adminAllowList } from "../worker/access.js"
import { createItem, daysUntil, listItems, parseItemId, readOverview, safeLink, updateItem, validateItem } from "../worker/command-centre.js"
import { createDb } from "./d1-shim.mjs"

test("validateItem accepts a full item and fills defaults", () => {
	const result = validateItem({ section: "venue", title: "  Book The Deck  ", tone: "danger" })
	assert.equal(result.ok, true)
	assert.deepEqual(result.item, {
		section: "venue",
		title: "Book The Deck",
		detail: null,
		status: null,
		owner: null,
		due: null,
		link: null,
		tone: "danger",
		done: 0,
		sort: 0,
	})
})

test("validateItem rejects bad input", () => {
	assert.equal(validateItem({ section: "nope", title: "x" }).ok, false)
	assert.equal(validateItem({ section: "venue", title: "" }).ok, false)
	assert.equal(validateItem({ section: "venue", title: "x".repeat(161) }).ok, false)
	assert.equal(validateItem({ section: "venue", title: "x", tone: "purple" }).ok, false)
	assert.equal(validateItem({ section: "venue", title: "x", link: "javascript:alert(1)" }).ok, false)
	assert.equal(validateItem({ section: "venue", title: "x", sort: "1.5" }).ok, false)
	assert.equal(validateItem([]).ok, false)
})

test("validateItem partial only returns sent fields", () => {
	assert.deepEqual(validateItem({ done: true }, { partial: true }), { ok: true, item: { done: 1 } })
	assert.equal(validateItem({}, { partial: true }).ok, false)
	assert.equal(validateItem({ title: "" }, { partial: true }).ok, false)
})

test("safeLink allows https and mailto only", () => {
	assert.equal(safeLink("https://exehacks.excs.uk"), true)
	assert.equal(safeLink("mailto:someone@example.com"), true)
	assert.equal(safeLink("http://example.com"), false)
	assert.equal(safeLink("data:text/html,hi"), false)
})

test("parseItemId only matches numeric ids", () => {
	assert.equal(parseItemId("/api/admin/items/42"), 42)
	assert.equal(parseItemId("/api/admin/items/abc"), null)
	assert.equal(parseItemId("/api/admin/items/1/x"), null)
})

test("daysUntil counts whole days and never goes negative", () => {
	assert.equal(daysUntil("2027-02-06T11:00:00Z", Date.parse("2027-02-05T11:00:00Z")), 1)
	assert.equal(daysUntil("2027-02-06T11:00:00Z", Date.parse("2027-03-01T00:00:00Z")), 0)
})

test("adminAllowList merges ADMIN_EMAILS and ADMIN_TEAM_EMAILS", () => {
	assert.deepEqual(adminAllowList({ ADMIN_EMAILS: "A@x.com", ADMIN_TEAM_EMAILS: "b@x.com, a@x.com\nc@x.com" }), ["a@x.com", "b@x.com", "c@x.com"])
	assert.deepEqual(adminAllowList({}), ["kazybekkhairulla@gmail.com"])
})

test("overview returns counts only, never applicant rows", async () => {
	const db = createDb()
	db.sqlite.exec(`INSERT INTO interest (first_name, email, consent) VALUES ('Ada', 'ada@example.com', 1)`)
	const overview = await readOverview(db, { applicationsOpen: false, email: "kazy@example.com" })
	assert.equal(overview.counts.interest.total, 1)
	assert.equal(overview.counts.hackers.total, 0)
	assert.equal(overview.event.capacity, 150)
	assert.equal(JSON.stringify(overview).includes("ada@example.com"), false)
})

test("items round-trip through create and update", async () => {
	const db = createDb()
	const created = await createItem(db, validateItem({ section: "mlh", title: "Book MLH call" }).item, "kazy@example.com")
	assert.equal(created.ok, true)
	const updated = await updateItem(db, created.item.id, { done: 1 }, "piran@example.com")
	assert.equal(updated.item.done, 1)
	assert.equal(updated.item.updated_by, "piran@example.com")
	assert.equal((await updateItem(db, 999, { done: 1 }, "x@example.com")).ok, false)
	assert.equal((await listItems(db)).length, 1)
})

test("overview still loads before migration 0005 runs", async () => {
	const db = createDb({ migrate: false })
	const overview = await readOverview(db, { applicationsOpen: false, email: "kazy@example.com" })
	assert.deepEqual(overview.items, [])
	assert.equal(overview.counts.interest.total, 0)
})
