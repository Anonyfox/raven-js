import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { NODE_TYPES } from "../types.js";
import { parseList } from "./list-parser.js";

describe("List Parser", () => {
	it("should parse unordered list", () => {
		const result = parseList(["- Item 1", "- Item 2"], 0);
		assert.ok(result);
		assert.equal(result.node.type, NODE_TYPES.LIST);
		assert.equal(result.node.ordered, false);
		assert.equal(result.node.items.length, 2);
		assert.equal(result.end, 2);
	});

	it("should parse ordered list", () => {
		const result = parseList(["1. Item 1", "2. Item 2"], 0);
		assert.ok(result);
		assert.equal(result.node.type, NODE_TYPES.LIST);
		assert.equal(result.node.ordered, true);
		assert.equal(result.node.items.length, 2);
	});

	it("should handle whitespace between items", () => {
		const result = parseList(["- Item 1", "  ", "- Item 2"], 0);
		assert.ok(result);
		assert.equal(result.end, 3);
	});

	it("should stop at non-list line", () => {
		const result = parseList(["- Item 1", "Not a list"], 0);
		assert.ok(result);
		assert.equal(result.end, 1);
	});

	it("should reject non-list line", () => {
		const result = parseList(["Not a list"], 0);
		assert.equal(result, null);
	});

	it("should reject when start >= lines.length", () => {
		const result = parseList(["- Item"], 1);
		assert.equal(result, null);
	});

	it("should parse task list with checked items", () => {
		const result = parseList(["- [x] Completed task", "- [ ] Pending task"], 0);
		assert.ok(result);
		assert.equal(result.node.type, NODE_TYPES.LIST);
		assert.equal(result.node.ordered, false);
		assert.equal(result.node.items.length, 2);
		assert.equal(result.node.items[0].checked, true);
		assert.equal(result.node.items[1].checked, false);
		assert.equal(result.end, 2);
	});

	it("should parse mixed task list with different checkbox states", () => {
		const result = parseList(
			["- [x] Done", "- [ ] Todo", "- [x] Also done"],
			0,
		);
		assert.ok(result);
		assert.equal(result.node.items.length, 3);
		assert.equal(result.node.items[0].checked, true);
		assert.equal(result.node.items[1].checked, false);
		assert.equal(result.node.items[2].checked, true);
	});
});
