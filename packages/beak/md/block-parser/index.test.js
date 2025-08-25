import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { NODE_TYPES } from "../types.js";
import { parseBlocks } from "./index.js";

describe("Block Parser Index", () => {
	it("should parse mixed block elements", () => {
		const result = parseBlocks([
			"# Heading",
			"---",
			"Paragraph text",
			"> Quote",
			"- List item",
		]);
		assert.equal(result.length, 5);
		assert.equal(result[0].type, NODE_TYPES.HEADING);
		assert.equal(result[1].type, NODE_TYPES.HORIZONTAL_RULE);
		assert.equal(result[2].type, NODE_TYPES.PARAGRAPH);
		assert.equal(result[3].type, NODE_TYPES.BLOCKQUOTE);
		assert.equal(result[4].type, NODE_TYPES.LIST);
	});

	it("should handle empty array", () => {
		const result = parseBlocks([]);
		assert.deepEqual(result, []);
	});

	it("should handle non-array input", () => {
		const result = parseBlocks("not an array");
		assert.deepEqual(result, []);
	});

	it("should handle array with empty lines", () => {
		const result = parseBlocks(["", "  ", ""]);
		assert.deepEqual(result, []);
	});

	it("should handle unparseable lines by advancing position", () => {
		// Test the else branch (lines 135-137) by creating a scenario where
		// parseParagraph might return null, forcing the parser to advance by one line
		// This could happen with certain edge cases in paragraph parsing
		const result = parseBlocks(["   ", "content"]);
		// The whitespace line should be skipped, content should be parsed as paragraph
		assert.equal(result.length, 1);
		assert.equal(result[0].type, NODE_TYPES.PARAGRAPH);
	});

	it("should skip unparseable lines using else branch", () => {
		// Test the else branch (lines 135-137) that skips lines when ALL parsers return null
		// Lines like "#" and "-" fail all parsers (including paragraph parser)
		// and get skipped via the else branch (current++)

		const result = parseBlocks(["#", "content"]);
		// The "#" gets skipped, only "content" is parsed as paragraph
		assert.equal(result.length, 1);
		assert.equal(result[0].type, NODE_TYPES.PARAGRAPH);

		const result2 = parseBlocks(["-", "content"]);
		// The "-" gets skipped, only "content" is parsed as paragraph
		assert.equal(result2.length, 1);
		assert.equal(result2[0].type, NODE_TYPES.PARAGRAPH);

		const result3 = parseBlocks(["#", "-", "content"]);
		// Both "#" and "-" get skipped, only "content" is parsed
		assert.equal(result3.length, 1);
		assert.equal(result3[0].type, NODE_TYPES.PARAGRAPH);
	});
});
