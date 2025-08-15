import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { NODE_TYPES } from "../types.js";
import { parseHorizontalRule } from "./horizontal-rule-parser.js";

describe("Horizontal Rule Parser", () => {
	it("should parse valid horizontal rule", () => {
		const result = parseHorizontalRule(["---"], 0);
		assert.ok(result);
		assert.equal(result.node.type, NODE_TYPES.HORIZONTAL_RULE);
		assert.equal(result.end, 1);
	});

	it("should parse horizontal rule with more dashes", () => {
		const result = parseHorizontalRule(["-----"], 0);
		assert.ok(result);
		assert.equal(result.node.type, NODE_TYPES.HORIZONTAL_RULE);
	});

	it("should reject insufficient dashes", () => {
		const result = parseHorizontalRule(["--"], 0);
		assert.equal(result, null);
	});

	it("should reject line with extra characters", () => {
		const result = parseHorizontalRule(["---abc"], 0);
		assert.equal(result, null);
	});

	it("should reject when start >= lines.length", () => {
		const result = parseHorizontalRule(["---"], 1);
		assert.equal(result, null);
	});
});
