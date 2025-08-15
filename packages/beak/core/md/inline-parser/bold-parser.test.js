import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { NODE_TYPES } from "../types.js";
import { tryParseBold } from "./bold-parser.js";

describe("Bold Parser", () => {
	it("should parse simple bold text", () => {
		const result = tryParseBold("**bold**", 0);
		assert.deepEqual(result, {
			node: {
				type: NODE_TYPES.BOLD,
				content: [{ type: NODE_TYPES.TEXT, content: "bold" }],
			},
			start: 0,
			end: 8,
		});
	});

	it("should parse bold text with content", () => {
		const result = tryParseBold("**bold text**", 0);
		assert.deepEqual(result, {
			node: {
				type: NODE_TYPES.BOLD,
				content: [{ type: NODE_TYPES.TEXT, content: "bold text" }],
			},
			start: 0,
			end: 13,
		});
	});

	it("should not parse incomplete bold", () => {
		const result = tryParseBold("**incomplete", 0);
		assert.equal(result, null);
	});

	it("should not parse empty bold", () => {
		const result = tryParseBold("****", 0);
		assert.equal(result, null);
	});

	it("should not parse when not at start", () => {
		const result = tryParseBold("text **bold**", 5);
		assert.deepEqual(result, {
			node: {
				type: NODE_TYPES.BOLD,
				content: [{ type: NODE_TYPES.TEXT, content: "bold" }],
			},
			start: 5,
			end: 13,
		});
	});

	it("should not parse when too close to end", () => {
		const result = tryParseBold("**", 0);
		assert.equal(result, null);
	});

	it("should not parse when not starting with **", () => {
		const result = tryParseBold("*bold*", 0);
		assert.equal(result, null);
	});
});
