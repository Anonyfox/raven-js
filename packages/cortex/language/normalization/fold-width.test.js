/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for fullwidth-to-halfwidth folding.
 */

import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { foldWidth } from "./fold-width.js";

describe("foldWidth", () => {
	// APEX PREDATOR PATTERN
	describe("core functionality", () => {
		it("converts fullwidth letters, digits, and punctuation", () => {
			// fullwidth digits/letters
			strictEqual(foldWidth("１２３ＡＢＣ"), "123ABC");
			// fullwidth punctuation
			strictEqual(foldWidth("（Ｈｅｌｌｏ！）"), "(Hello!)");
		});
	});

	describe("edge cases and errors", () => {
		it("handles mixed content and empty input", () => {
			// mixed email-like content
			strictEqual(
				foldWidth("Ｅｍａｉｌ：ｔｅｓｔ＠ｅｘａｍｐｌｅ．ｃｏｍ"),
				"Email:test@example.com",
			);
			// empty string passthrough
			strictEqual(foldWidth(""), "");
		});
	});

	describe("integration scenarios", () => {
		it("normalizes a sentence with fullwidth forms", () => {
			strictEqual(
				foldWidth("Ｈｅｌｌｏ，ｗｏｒｌｄ！ １２３ ＡＢＣ"),
				"Hello,world! 123 ABC",
			);
		});
	});
});
