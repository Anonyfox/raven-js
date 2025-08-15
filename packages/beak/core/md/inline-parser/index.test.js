import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { NODE_TYPES } from "../types.js";
import { parseInline } from "./index.js";

describe("Inline Parser Index", () => {
	it("should export parseInline function", () => {
		assert.equal(typeof parseInline, "function");
		const result = parseInline("**bold**");
		assert.deepEqual(result, [
			{
				type: NODE_TYPES.BOLD,
				content: [{ type: NODE_TYPES.TEXT, content: "bold" }],
			},
		]);
	});
});
