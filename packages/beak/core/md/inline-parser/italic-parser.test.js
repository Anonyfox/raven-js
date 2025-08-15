import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { NODE_TYPES } from "../types.js";
import { tryParseItalic } from "./italic-parser.js";

describe("Italic Parser", () => {
	it("should parse simple italic text", () => {
		const result = tryParseItalic("*italic*", 0);
		assert.deepEqual(result, {
			node: {
				type: NODE_TYPES.ITALIC,
				content: [{ type: NODE_TYPES.TEXT, content: "italic" }],
			},
			start: 0,
			end: 8,
		});
	});

	it("should parse italic text with content", () => {
		const result = tryParseItalic("*italic text*", 0);
		assert.deepEqual(result, {
			node: {
				type: NODE_TYPES.ITALIC,
				content: [{ type: NODE_TYPES.TEXT, content: "italic text" }],
			},
			start: 0,
			end: 13,
		});
	});

	it("should not parse incomplete italic", () => {
		const result = tryParseItalic("*incomplete", 0);
		assert.equal(result, null);
	});

	it("should not parse empty italic", () => {
		const result = tryParseItalic("**", 0);
		assert.equal(result, null);
	});

	it("should not parse when not at start", () => {
		const result = tryParseItalic("text *italic*", 5);
		assert.deepEqual(result, {
			node: {
				type: NODE_TYPES.ITALIC,
				content: [{ type: NODE_TYPES.TEXT, content: "italic" }],
			},
			start: 5,
			end: 13,
		});
	});

	it("should not parse when not starting with *", () => {
		const result = tryParseItalic("bold", 0);
		assert.equal(result, null);
	});

	it("should not parse single asterisk as italic when followed by another", () => {
		const result = tryParseItalic("*not italic**", 0);
		assert.equal(result, null);
	});

	it("should not parse when start is at end of text", () => {
		const result = tryParseItalic("text", 4);
		assert.equal(result, null);
	});
});
