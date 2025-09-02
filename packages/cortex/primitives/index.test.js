/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { fnv1a32, fnv1a64, fnv32 } from "./index.js";

describe("primitives module", () => {
	it("exports all hash functions", () => {
		assert.strictEqual(typeof fnv1a32, "function");
		assert.strictEqual(typeof fnv1a64, "function");
		assert.strictEqual(typeof fnv32, "function");
	});

	it("functions are properly accessible through re-exports", () => {
		// Verify that re-exported functions work correctly
		const result32 = fnv1a32("test");
		const result64 = fnv1a64("test");
		const resultFnv = fnv32("test");

		assert.strictEqual(typeof result32, "number");
		assert.strictEqual(typeof result64, "bigint");
		assert.strictEqual(typeof resultFnv, "number");
	});

	it("different hash functions produce different results", () => {
		const input = "primitive test";
		const hash1 = fnv1a32(input);
		const hash2 = Number(fnv1a64(input) & 0xffffffffn); // Truncate to 32-bit for comparison
		const hash3 = fnv32(input);

		// All should be different due to different algorithms/seeds
		assert.notStrictEqual(hash1, hash2);
		assert.notStrictEqual(hash1, hash3);
		assert.notStrictEqual(hash2, hash3);
	});
});
