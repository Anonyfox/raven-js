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

describe("hash primitives module", () => {
	it("exports all hash functions", () => {
		assert.strictEqual(typeof fnv1a32, "function");
		assert.strictEqual(typeof fnv1a64, "function");
		assert.strictEqual(typeof fnv32, "function");
	});

	it("functions work correctly through module exports", () => {
		const testInput = "hash module test";

		const hash32a = fnv1a32(testInput);
		const hash64a = fnv1a64(testInput);
		const hashFnv = fnv32(testInput);

		assert.strictEqual(typeof hash32a, "number");
		assert.strictEqual(typeof hash64a, "bigint");
		assert.strictEqual(typeof hashFnv, "number");

		// All should produce different values
		assert.notStrictEqual(hash32a, hashFnv);
	});

	it("provides complete FNV hash family coverage", () => {
		// Test that we have both variants and bit widths covered
		const input = "complete coverage test";

		// 32-bit variants
		const fnv1a32Result = fnv1a32(input);
		const fnv32Result = fnv32(input);

		// 64-bit variant
		const fnv1a64Result = fnv1a64(input);

		// Verify all are valid and different
		assert(fnv1a32Result !== fnv32Result);
		assert(fnv1a64Result > BigInt(fnv1a32Result));
		assert(fnv1a64Result > BigInt(fnv32Result));
	});
});
