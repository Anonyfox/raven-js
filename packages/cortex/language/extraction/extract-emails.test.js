/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for email extraction functionality.
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { extractEmails } from "./extract-emails.js";

describe("extractEmails", () => {
	it("extracts basic email addresses", () => {
		const text = "Contact us at info@example.com";
		const emails = extractEmails(text);
		deepStrictEqual(emails, ["info@example.com"]);
	});

	it("extracts multiple email addresses", () => {
		const text = "Email admin@example.com or support@company.org";
		const emails = extractEmails(text);
		deepStrictEqual(emails, ["admin@example.com", "support@company.org"]);
	});

	it("extracts emails with dots in local part", () => {
		const text = "Contact first.last@example.com";
		const emails = extractEmails(text);
		deepStrictEqual(emails, ["first.last@example.com"]);
	});

	it("extracts emails with plus signs in local part", () => {
		const text = "Send to user+tag@example.com";
		const emails = extractEmails(text);
		deepStrictEqual(emails, ["user+tag@example.com"]);
	});

	it("extracts emails with underscores in local part", () => {
		const text = "Email test_user@example.com";
		const emails = extractEmails(text);
		deepStrictEqual(emails, ["test_user@example.com"]);
	});

	it("extracts emails with percent signs in local part", () => {
		const text = "Special case user%example@domain.com";
		const emails = extractEmails(text);
		deepStrictEqual(emails, ["user%example@domain.com"]);
	});

	it("extracts emails with hyphens in local part", () => {
		const text = "Contact user-name@example.com";
		const emails = extractEmails(text);
		deepStrictEqual(emails, ["user-name@example.com"]);
	});

	it("extracts emails with subdomains", () => {
		const text = "Support at help@support.example.com";
		const emails = extractEmails(text);
		deepStrictEqual(emails, ["help@support.example.com"]);
	});

	it("extracts emails with international domains", () => {
		const text = "Contact support@company.co.uk";
		const emails = extractEmails(text);
		deepStrictEqual(emails, ["support@company.co.uk"]);
	});

	it("extracts emails with hyphens in domain", () => {
		const text = "Email admin@my-company.com";
		const emails = extractEmails(text);
		deepStrictEqual(emails, ["admin@my-company.com"]);
	});

	it("extracts emails with long TLDs", () => {
		const text = "Contact info@example.technology";
		const emails = extractEmails(text);
		deepStrictEqual(emails, ["info@example.technology"]);
	});

	it("handles emails surrounded by punctuation", () => {
		const text = "Email (support@example.com) or check admin@test.org!";
		const emails = extractEmails(text);
		deepStrictEqual(emails, ["support@example.com", "admin@test.org"]);
	});

	it("handles emails at sentence boundaries", () => {
		const text = "Contact: admin@example.com. Support: help@test.org?";
		const emails = extractEmails(text);
		deepStrictEqual(emails, ["admin@example.com", "help@test.org"]);
	});

	it("extracts emails in mixed case", () => {
		const text = "Email Admin@Example.COM";
		const emails = extractEmails(text);
		deepStrictEqual(emails, ["Admin@Example.COM"]);
	});

	it("handles complex email combinations", () => {
		const text =
			"Send to first.last+tag@sub.domain.co.uk and test_user@example-site.org";
		const emails = extractEmails(text);
		deepStrictEqual(emails, [
			"first.last+tag@sub.domain.co.uk",
			"test_user@example-site.org",
		]);
	});

	it("ignores invalid email patterns", () => {
		const text = "Not emails: @example.com or user@ or user@";
		const emails = extractEmails(text);
		deepStrictEqual(emails, []);
	});

	it("ignores emails with single-character TLD", () => {
		const text = "Invalid: user@example.c";
		const emails = extractEmails(text);
		deepStrictEqual(emails, []);
	});

	it("handles emails with numbers in local part", () => {
		const text = "Contact user123@example.com";
		const emails = extractEmails(text);
		deepStrictEqual(emails, ["user123@example.com"]);
	});

	it("handles emails with numbers in domain", () => {
		const text = "Support at admin@server1.example.com";
		const emails = extractEmails(text);
		deepStrictEqual(emails, ["admin@server1.example.com"]);
	});

	it("returns empty array for text without emails", () => {
		const text = "This is just plain text with no email addresses";
		const emails = extractEmails(text);
		deepStrictEqual(emails, []);
	});

	it("handles empty string", () => {
		const emails = extractEmails("");
		deepStrictEqual(emails, []);
	});

	it("replaces emails with placeholders when requested", () => {
		const text = "Contact admin@example.com or support@test.org";
		const result = extractEmails(text, true);
		strictEqual(result, "Contact <EMAIL> or <EMAIL>");
	});

	it("handles placeholder replacement with no emails", () => {
		const text = "No email addresses here";
		const result = extractEmails(text, true);
		strictEqual(result, text);
	});

	it("handles emails in different text formats", () => {
		const text = `
			Contacts:
			- Primary: admin@example.com
			- Secondary: backup@test.org
			- Emergency: emergency+urgent@support.company.co.uk
		`;
		const emails = extractEmails(text);
		deepStrictEqual(emails, [
			"admin@example.com",
			"backup@test.org",
			"emergency+urgent@support.company.co.uk",
		]);
	});
});
