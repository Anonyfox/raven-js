/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Integration tests for normalization module exports.
 */

import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import * as normalization from "./index.js";

describe("normalization module", () => {
	it("exports all normalization functions", () => {
		strictEqual(typeof normalization.normalizeUnicode, "function");
		strictEqual(typeof normalization.foldCase, "function");
		strictEqual(typeof normalization.foldWidth, "function");
	});

	it("provides working character normalization pipeline", () => {
		const { normalizeUnicode, foldCase, foldWidth } = normalization;

		// Start with text containing character normalization challenges
		let text = "Café naïve résumé ＡＢＣ１２３";

		// Normalize Unicode
		text = normalizeUnicode(text);
		strictEqual(typeof text, "string");

		// Apply width folding
		text = foldWidth(text);
		strictEqual(text.includes("ABC123"), true);

		// Apply case folding
		text = foldCase(text, "en");
		strictEqual(text.toLowerCase(), text);
	});

	it("handles edge cases gracefully", () => {
		const { normalizeUnicode, foldCase, foldWidth } = normalization;

		// Empty strings
		strictEqual(normalizeUnicode(""), "");
		strictEqual(foldCase(""), "");
		strictEqual(foldWidth(""), "");

		// Single characters
		strictEqual(normalizeUnicode("a"), "a");
		strictEqual(foldCase("A"), "a");
		strictEqual(foldWidth("a"), "a");
	});
});
