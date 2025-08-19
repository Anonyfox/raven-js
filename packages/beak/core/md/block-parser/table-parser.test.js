import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { NODE_TYPES } from "../types.js";
import { parseTable } from "./table-parser.js";

describe("Table Parser", () => {
	it("should parse simple table", () => {
		const lines = [
			"| Header 1 | Header 2 |",
			"|----------|----------|",
			"| Cell 1   | Cell 2   |",
		];
		const result = parseTable(lines, 0);

		assert.ok(result);
		assert.equal(result.node.type, NODE_TYPES.TABLE);
		assert.equal(result.node.rows.length, 2); // header + 1 data row
		assert.equal(result.end, 3);
	});

	it("should parse table with multiple data rows", () => {
		const lines = [
			"| Name  | Age |",
			"|-------|-----|",
			"| Alice | 25  |",
			"| Bob   | 30  |",
		];
		const result = parseTable(lines, 0);

		assert.ok(result);
		assert.equal(result.node.rows.length, 3); // header + 2 data rows
		assert.equal(result.end, 4);
	});

	it("should stop at non-table line", () => {
		const lines = [
			"| Header 1 | Header 2 |",
			"|----------|----------|",
			"| Cell 1   | Cell 2   |",
			"This is not a table",
		];
		const result = parseTable(lines, 0);

		assert.ok(result);
		assert.equal(result.node.rows.length, 2);
		assert.equal(result.end, 3);
	});

	it("should reject non-table line", () => {
		const lines = ["Not a table"];
		const result = parseTable(lines, 0);
		assert.equal(result, null);
	});

	it("should reject table without separator", () => {
		const lines = ["| Header 1 | Header 2 |", "| Cell 1   | Cell 2   |"];
		const result = parseTable(lines, 0);
		assert.equal(result, null);
	});

	it("should parse table with varying cell content", () => {
		const lines = [
			"| **Bold** | *Italic* |",
			"|----------|----------|",
			"| `code`   | [link](url) |",
		];
		const result = parseTable(lines, 0);

		assert.ok(result);
		assert.equal(result.node.rows.length, 2);
		// Check that inline parsing worked
		assert.ok(Array.isArray(result.node.rows[0].cells[0].content));
	});

	it("should reject when start >= lines.length", () => {
		const result = parseTable(["| Header |"], 1);
		assert.equal(result, null);
	});

	it("should handle edge case with minimal table structure", () => {
		// Test a valid minimal table that should parse successfully
		const lines = [
			"| A |", // Valid table row with content
			"|---|", // Valid separator
			"| B |", // Valid data row
		];
		const result = parseTable(lines, 0);

		// This should work and produce a valid table
		assert.ok(result);
		assert.ok(result.node.type === NODE_TYPES.TABLE);
		assert.equal(result.node.rows.length, 2); // header + data row
	});
});
