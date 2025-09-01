/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for fullwidth to halfwidth character conversion.
 */

import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { foldWidth } from "./fold-width.js";

describe("foldWidth", () => {
	it("converts fullwidth digits to halfwidth", () => {
		strictEqual(foldWidth("０１２３４５６７８９"), "0123456789");
	});

	it("converts fullwidth Latin letters to halfwidth", () => {
		strictEqual(
			foldWidth("ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ"),
			"ABCDEFGHIJKLMNOPQRSTUVWXYZ",
		);
		strictEqual(
			foldWidth("ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ"),
			"abcdefghijklmnopqrstuvwxyz",
		);
	});

	it("converts fullwidth punctuation to halfwidth", () => {
		strictEqual(
			foldWidth("！＂＃＄％＆＇（）＊＋，－．／"),
			"!\"#$%&'()*+,-./",
		);
		strictEqual(foldWidth("：；＜＝＞？＠"), ":;<=>?@");
		strictEqual(foldWidth("［＼］＾＿｀"), "[\\]^_`");
		strictEqual(foldWidth("｛｜｝～"), "{|}~");
	});

	it("handles mixed fullwidth and halfwidth content", () => {
		strictEqual(foldWidth("Hello１２３World"), "Hello123World");
		strictEqual(
			foldWidth("Ｅｍａｉｌ：test@example.com"),
			"Email:test@example.com",
		);
	});

	it("preserves non-fullwidth characters", () => {
		// Regular ASCII should remain unchanged
		const ascii = "Hello World 123!";
		strictEqual(foldWidth(ascii), ascii);

		// CJK ideographs should remain unchanged
		const japanese = "今日は世界";
		strictEqual(foldWidth(japanese), japanese);

		// Mix of both
		strictEqual(foldWidth("こんにちは１２３"), "こんにちは123");
	});

	it("handles empty string", () => {
		strictEqual(foldWidth(""), "");
	});

	it("converts complex expressions", () => {
		strictEqual(foldWidth("（２０２４年１月１日）"), "(2024年1月1日)");
		strictEqual(foldWidth("Ｊａｖａｓｃｒｉｐｔ＝＞ＪＳ"), "Javascript=>JS");
	});

	it("handles spaces correctly", () => {
		// Fullwidth space (U+3000) is not in the conversion range
		strictEqual(foldWidth("Ａ　Ｂ"), "A　B");

		// Regular fullwidth space in our range (U+FF20)
		strictEqual(foldWidth("Ａ＠Ｂ"), "A@B");
	});

	it("converts boundary characters correctly", () => {
		// First character in range (U+FF01 = !)
		strictEqual(foldWidth("！"), "!");

		// Last character in range (U+FF5E = ~)
		strictEqual(foldWidth("～"), "~");
	});
});
