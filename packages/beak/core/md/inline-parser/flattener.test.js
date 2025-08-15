import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { NODE_TYPES } from "../types.js";
import { flattenInlineNodes } from "./flattener.js";

describe("Inline Nodes Flattener", () => {
	it("should flatten text nodes", () => {
		const nodes = [{ type: NODE_TYPES.TEXT, content: "Hello" }];
		assert.equal(flattenInlineNodes(nodes), "Hello");
	});

	it("should flatten nested nodes", () => {
		const nodes = [
			{ type: NODE_TYPES.TEXT, content: "Hello " },
			{
				type: NODE_TYPES.BOLD,
				content: [{ type: NODE_TYPES.TEXT, content: "bold" }],
			},
			{ type: NODE_TYPES.TEXT, content: " world" },
		];
		assert.equal(flattenInlineNodes(nodes), "Hello bold world");
	});

	it("should handle empty array", () => {
		assert.equal(flattenInlineNodes([]), "");
	});

	it("should handle non-array input", () => {
		assert.equal(flattenInlineNodes(null), "");
		assert.equal(flattenInlineNodes(undefined), "");
		assert.equal(flattenInlineNodes("string"), "");
	});

	it("should handle complex nested structure", () => {
		const nodes = [
			{ type: NODE_TYPES.TEXT, content: "Hello " },
			{
				type: NODE_TYPES.BOLD,
				content: [
					{ type: NODE_TYPES.TEXT, content: "bold " },
					{
						type: NODE_TYPES.ITALIC,
						content: [{ type: NODE_TYPES.TEXT, content: "italic" }],
					},
				],
			},
			{ type: NODE_TYPES.TEXT, content: " world" },
		];
		assert.equal(flattenInlineNodes(nodes), "Hello bold italic world");
	});

	it("should handle nodes with non-array content", () => {
		const nodes = [
			{ type: NODE_TYPES.TEXT, content: "Hello" },
			{ type: NODE_TYPES.CODE, content: "code" }, // CODE has string content, not array
			{ type: NODE_TYPES.TEXT, content: " world" },
		];
		assert.equal(flattenInlineNodes(nodes), "Hello world");
	});
});
