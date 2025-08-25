import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { NODE_TYPES } from "../types.js";
import { parseHeading } from "./heading-parser.js";

describe("Heading Parser", () => {
	// Valid headings
	it("should parse valid headings", () => {
		const h1 = parseHeading(["# Heading 1"], 0);
		assert.ok(h1);
		assert.equal(h1.node.type, NODE_TYPES.HEADING);
		assert.equal(h1.node.level, 1);
		assert.equal(h1.end, 1);

		const h6 = parseHeading(["###### Heading 6"], 0);
		assert.ok(h6);
		assert.equal(h6.node.level, 6);
	});

	// Invalid headings - regex doesn't match
	it("should reject invalid heading formats", () => {
		assert.equal(parseHeading(["Not a heading"], 0), null);
		assert.equal(parseHeading(["#Heading without space"], 0), null);
		assert.equal(parseHeading(["###"], 0), null);
		assert.equal(parseHeading(["# "], 0), null);
	});

	// Edge cases
	it("should handle edge cases", () => {
		assert.equal(parseHeading(["# Heading"], 1), null); // start >= lines.length
		assert.equal(parseHeading([], 0), null); // empty array
		assert.equal(parseHeading(null, 0), null); // null array
	});
});
