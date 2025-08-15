import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { NODE_TYPES } from "../types.js";
import { tryParseInlineCode } from "./code-parser.js";

describe("Inline Code Parser", () => {
	it("should parse simple inline code", () => {
		const result = tryParseInlineCode("`code`", 0);
		assert.deepEqual(result, {
			node: {
				type: NODE_TYPES.CODE,
				content: "code",
			},
			start: 0,
			end: 6,
		});
	});

	it("should parse inline code with content", () => {
		const result = tryParseInlineCode("`const x = 42;`", 0);
		assert.deepEqual(result, {
			node: {
				type: NODE_TYPES.CODE,
				content: "const x = 42;",
			},
			start: 0,
			end: 15,
		});
	});

	it("should parse empty inline code", () => {
		const result = tryParseInlineCode("``", 0);
		assert.deepEqual(result, {
			node: {
				type: NODE_TYPES.CODE,
				content: "",
			},
			start: 0,
			end: 2,
		});
	});

	it("should not parse incomplete inline code", () => {
		const result = tryParseInlineCode("`incomplete", 0);
		assert.equal(result, null);
	});

	it("should not parse when not at start", () => {
		const result = tryParseInlineCode("text `code`", 5);
		assert.deepEqual(result, {
			node: {
				type: NODE_TYPES.CODE,
				content: "code",
			},
			start: 5,
			end: 11,
		});
	});

	it("should not parse when not starting with `", () => {
		const result = tryParseInlineCode("code", 0);
		assert.equal(result, null);
	});

	it("should not parse when start is beyond text length", () => {
		const result = tryParseInlineCode("text", 5);
		assert.equal(result, null);
	});
});
