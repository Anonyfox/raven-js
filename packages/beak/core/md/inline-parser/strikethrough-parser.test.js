import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { NODE_TYPES } from "../types.js";
import { tryParseStrikethrough } from "./strikethrough-parser.js";

describe("Strikethrough Parser", () => {
	it("should parse simple strikethrough text", () => {
		const result = tryParseStrikethrough("~~strikethrough~~", 0);
		assert.deepEqual(result, {
			node: {
				type: NODE_TYPES.STRIKETHROUGH,
				content: [{ type: NODE_TYPES.TEXT, content: "strikethrough" }],
			},
			start: 0,
			end: 17,
		});
	});

	it("should parse strikethrough text with content", () => {
		const result = tryParseStrikethrough("~~strikethrough text~~", 0);
		assert.deepEqual(result, {
			node: {
				type: NODE_TYPES.STRIKETHROUGH,
				content: [{ type: NODE_TYPES.TEXT, content: "strikethrough text" }],
			},
			start: 0,
			end: 22,
		});
	});

	it("should not parse incomplete strikethrough", () => {
		const result = tryParseStrikethrough("~~incomplete", 0);
		assert.equal(result, null);
	});

	it("should not parse empty strikethrough", () => {
		const result = tryParseStrikethrough("~~~~", 0);
		assert.equal(result, null);
	});

	it("should not parse when not at start", () => {
		const result = tryParseStrikethrough("text ~~strikethrough~~", 5);
		assert.deepEqual(result, {
			node: {
				type: NODE_TYPES.STRIKETHROUGH,
				content: [{ type: NODE_TYPES.TEXT, content: "strikethrough" }],
			},
			start: 5,
			end: 22,
		});
	});

	it("should not parse when too close to end", () => {
		const result = tryParseStrikethrough("~~", 0);
		assert.equal(result, null);
	});

	it("should not parse when not starting with ~~", () => {
		const result = tryParseStrikethrough("~strike~", 0);
		assert.equal(result, null);
	});

	it("should parse nested elements within strikethrough", () => {
		const result = tryParseStrikethrough("~~**bold** text~~", 0);
		assert.deepEqual(result, {
			node: {
				type: NODE_TYPES.STRIKETHROUGH,
				content: [
					{
						type: NODE_TYPES.BOLD,
						content: [{ type: NODE_TYPES.TEXT, content: "bold" }],
					},
					{ type: NODE_TYPES.TEXT, content: " text" },
				],
			},
			start: 0,
			end: 17,
		});
	});
});
