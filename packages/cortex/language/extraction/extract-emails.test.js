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
	// APEX PREDATOR PATTERN
	describe("core functionality", () => {
		it("parses common email forms and domains", () => {
			// basic email
			deepStrictEqual(extractEmails("Contact us at info@example.com"), [
				"info@example.com",
			]);
			// multiple emails in one text
			deepStrictEqual(
				extractEmails("Email admin@example.com or support@company.org"),
				["admin@example.com", "support@company.org"],
			);
			// dots in local part
			deepStrictEqual(extractEmails("Contact first.last@example.com"), [
				"first.last@example.com",
			]);
			// plus in local part
			deepStrictEqual(extractEmails("Send to user+tag@example.com"), [
				"user+tag@example.com",
			]);
			// underscore in local part
			deepStrictEqual(extractEmails("Email test_user@example.com"), [
				"test_user@example.com",
			]);
			// percent in local part
			deepStrictEqual(extractEmails("Special case user%example@domain.com"), [
				"user%example@domain.com",
			]);
			// hyphen in local part
			deepStrictEqual(extractEmails("Contact user-name@example.com"), [
				"user-name@example.com",
			]);
			// subdomains
			deepStrictEqual(extractEmails("Support at help@support.example.com"), [
				"help@support.example.com",
			]);
			// international domain TLD
			deepStrictEqual(extractEmails("Contact support@company.co.uk"), [
				"support@company.co.uk",
			]);
			// hyphenated domain
			deepStrictEqual(extractEmails("Email admin@my-company.com"), [
				"admin@my-company.com",
			]);
			// long TLD
			deepStrictEqual(extractEmails("Contact info@example.technology"), [
				"info@example.technology",
			]);
		});
	});

	describe("edge cases and errors", () => {
		it("handles punctuation, casing, invalids, and empties", () => {
			// surrounded by punctuation
			deepStrictEqual(
				extractEmails("Email (support@example.com) or check admin@test.org!"),
				["support@example.com", "admin@test.org"],
			);
			// sentence boundaries
			deepStrictEqual(
				extractEmails("Contact: admin@example.com. Support: help@test.org?"),
				["admin@example.com", "help@test.org"],
			);
			// mixed case preserved
			deepStrictEqual(extractEmails("Email Admin@Example.COM"), [
				"Admin@Example.COM",
			]);
			// complex mixed example
			deepStrictEqual(
				extractEmails(
					"Send to first.last+tag@sub.domain.co.uk and test_user@example-site.org",
				),
				["first.last+tag@sub.domain.co.uk", "test_user@example-site.org"],
			);
			// invalid patterns ignored
			deepStrictEqual(
				extractEmails("Not emails: @example.com or user@ or user@"),
				[],
			);
			// single-character TLD invalid
			deepStrictEqual(extractEmails("Invalid: user@example.c"), []);
			// numbers in local part
			deepStrictEqual(extractEmails("Contact user123@example.com"), [
				"user123@example.com",
			]);
			// numbers in domain/subdomain
			deepStrictEqual(extractEmails("Support at admin@server1.example.com"), [
				"admin@server1.example.com",
			]);
			// no matches
			deepStrictEqual(
				extractEmails("This is just plain text with no email addresses"),
				[],
			);
			// empty input
			deepStrictEqual(extractEmails(""), []);
			// placeholder replacement with matches
			strictEqual(
				extractEmails("Contact admin@example.com or support@test.org", true),
				"Contact <EMAIL> or <EMAIL>",
			);
			// placeholder replacement with no matches
			strictEqual(
				extractEmails("No email addresses here", true),
				"No email addresses here",
			);
		});
	});

	describe("integration scenarios", () => {
		it("extracts from structured and multiline content", () => {
			// multiline bullet list
			const text = `
				Contacts:
				- Primary: admin@example.com
				- Secondary: backup@test.org
				- Emergency: emergency+urgent@support.company.co.uk
			`;
			deepStrictEqual(extractEmails(text), [
				"admin@example.com",
				"backup@test.org",
				"emergency+urgent@support.company.co.uk",
			]);
		});
	});
});
