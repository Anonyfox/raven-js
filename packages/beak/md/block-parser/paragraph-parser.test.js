import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { NODE_TYPES } from "../types.js";
import { parseParagraph } from "./paragraph-parser.js";

describe("Paragraph Parser", () => {
	// Valid paragraphs
	it("should parse valid paragraphs", () => {
		const simple = parseParagraph(["Simple paragraph"], 0);
		assert.ok(simple);
		assert.equal(simple.node.type, NODE_TYPES.PARAGRAPH);
		assert.equal(simple.end, 1);

		const multi = parseParagraph(["Line 1", "Line 2"], 0);
		assert.ok(multi);
		assert.equal(multi.node.type, NODE_TYPES.PARAGRAPH);
		assert.equal(multi.end, 2);
	});

	// Invalid paragraphs - block pattern matches
	it("should reject block pattern lines", () => {
		assert.equal(parseParagraph(["  "], 0), null); // whitespace
		assert.equal(parseParagraph(["# Heading"], 0), null); // heading
		assert.equal(parseParagraph(["---"], 0), null); // horizontal rule
		assert.equal(parseParagraph(["```"], 0), null); // code block start
		assert.equal(parseParagraph(["> Quote"], 0), null); // blockquote
		assert.equal(parseParagraph(["- Item"], 0), null); // unordered list
		assert.equal(parseParagraph(["1. Item"], 0), null); // ordered list
	});

	// Edge cases
	it("should handle edge cases", () => {
		assert.equal(parseParagraph(["Text"], 1), null); // start >= lines.length
		assert.equal(parseParagraph(["Text"], 2), null); // start > lines.length
		assert.equal(parseParagraph([], 0), null); // empty array
		assert.equal(parseParagraph(null, 0), null); // null array
	});

	// Multi-line paragraph with block elements
	it("should stop at block elements", () => {
		const result = parseParagraph(["Line 1", "# Heading", "Line 3"], 0);
		assert.ok(result);
		assert.equal(result.end, 1); // Should stop before heading

		const result2 = parseParagraph(["Line 1", "---", "Line 3"], 0);
		assert.ok(result2);
		assert.equal(result2.end, 1); // Should stop before horizontal rule

		const result3 = parseParagraph(["Line 1", "```", "Line 3"], 0);
		assert.ok(result3);
		assert.equal(result3.end, 1); // Should stop before code block

		const result4 = parseParagraph(["Line 1", "> Quote", "Line 3"], 0);
		assert.ok(result4);
		assert.equal(result4.end, 1); // Should stop before blockquote

		const result5 = parseParagraph(["Line 1", "- Item", "Line 3"], 0);
		assert.ok(result5);
		assert.equal(result5.end, 1); // Should stop before unordered list

		const result6 = parseParagraph(["Line 1", "1. Item", "Line 3"], 0);
		assert.ok(result6);
		assert.equal(result6.end, 1); // Should stop before ordered list
	});
});
