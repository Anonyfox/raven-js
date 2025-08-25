import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { NODE_TYPES } from "../types.js";
import { parseBlockquote } from "./blockquote-parser.js";

describe("Blockquote Parser", () => {
	it("should parse simple blockquote", () => {
		const result = parseBlockquote(["> Quote"], 0);
		assert.ok(result);
		assert.equal(result.node.type, NODE_TYPES.BLOCKQUOTE);
		assert.equal(result.end, 1);
	});

	it("should parse multi-line blockquote", () => {
		const result = parseBlockquote(["> Quote 1", "> Quote 2"], 0);
		assert.ok(result);
		assert.equal(result.node.type, NODE_TYPES.BLOCKQUOTE);
		assert.equal(result.end, 2);
	});

	it("should stop at non-blockquote line", () => {
		const result = parseBlockquote(["> Quote 1", "Not a quote"], 0);
		assert.ok(result);
		assert.equal(result.end, 1);
	});

	it("should reject non-blockquote line", () => {
		const result = parseBlockquote(["Not a blockquote"], 0);
		assert.equal(result, null);
	});

	it("should reject when start >= lines.length", () => {
		const result = parseBlockquote(["> Quote"], 1);
		assert.equal(result, null);
	});
});
