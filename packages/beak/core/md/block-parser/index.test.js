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
});
