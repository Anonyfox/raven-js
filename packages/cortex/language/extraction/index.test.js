/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Integration tests for extraction module exports.
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import * as extraction from "./index.js";

describe("extraction module", () => {
	it("exports all extraction functions", () => {
		strictEqual(typeof extraction.extractUrls, "function");
		strictEqual(typeof extraction.extractEmails, "function");
		strictEqual(typeof extraction.extractMentions, "function");
		strictEqual(typeof extraction.extractHashtags, "function");
		strictEqual(typeof extraction.extractCurrency, "function");
		strictEqual(typeof extraction.extractNumbers, "function");
	});

	it("provides working entity extraction pipeline", () => {
		const {
			extractUrls,
			extractEmails,
			extractMentions,
			extractHashtags,
			extractCurrency,
			extractNumbers,
		} = extraction;

		// Test text with multiple entity types
		const text =
			"Visit https://example.com, email admin@test.org, follow @user, check #hashtag, pay $19.99, quantity 5";

		// Extract each entity type
		const urls = extractUrls(text);
		strictEqual(urls.includes("https://example.com"), true);

		const emails = extractEmails(text);
		strictEqual(emails.includes("admin@test.org"), true);

		const mentions = extractMentions(text);
		strictEqual(mentions.includes("@user"), true);

		const hashtags = extractHashtags(text);
		strictEqual(hashtags.includes("#hashtag"), true);

		const currency = extractCurrency(text);
		strictEqual(currency.includes("$19.99"), true);

		const numbers = extractNumbers(text);
		strictEqual(numbers.includes("19.99"), true);
		strictEqual(numbers.includes("5"), true);
	});

	it("handles placeholder replacement consistently", () => {
		const text = "Contact admin@example.com or visit https://test.org";

		const emailPlaceholder = extraction.extractEmails(text, true);
		strictEqual(emailPlaceholder.includes("<EMAIL>"), true);

		const urlPlaceholder = extraction.extractUrls(text, true);
		strictEqual(urlPlaceholder.includes("<URL>"), true);
	});

	it("handles edge cases gracefully", () => {
		const {
			extractUrls,
			extractEmails,
			extractMentions,
			extractHashtags,
			extractCurrency,
			extractNumbers,
		} = extraction;

		// Empty strings
		deepStrictEqual(extractUrls(""), []);
		deepStrictEqual(extractEmails(""), []);
		deepStrictEqual(extractMentions(""), []);
		deepStrictEqual(extractHashtags(""), []);
		deepStrictEqual(extractCurrency(""), []);
		deepStrictEqual(extractNumbers(""), []);

		// Text without matching patterns
		const plain = "This is just plain text";
		deepStrictEqual(extractUrls(plain), []);
		deepStrictEqual(extractEmails(plain), []);
		deepStrictEqual(extractMentions(plain), []);
		deepStrictEqual(extractHashtags(plain), []);
		deepStrictEqual(extractCurrency(plain), []);
		deepStrictEqual(extractNumbers(plain), []);
	});
});
