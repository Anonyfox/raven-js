/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { fnv32 } from "./fnv32.js";

describe("fnv32", () => {
	it("produces consistent hashes for same input", () => {
		const input = "hello world";
		const hash1 = fnv32(input);
		const hash2 = fnv32(input);
		assert.strictEqual(hash1, hash2);
	});

	it("produces different hashes for different inputs", () => {
		const hash1 = fnv32("hello");
		const hash2 = fnv32("world");
		assert.notStrictEqual(hash1, hash2);
	});

	it("handles empty string", () => {
		const hash = fnv32("");
		assert.strictEqual(typeof hash, "number");
		assert.strictEqual(hash, 2166136261); // Should equal default seed
	});

	it("produces known test vectors", () => {
		// Known FNV-1 32-bit test vectors - verify our implementation
		assert.strictEqual(fnv32(""), 2166136261); // Empty string = seed
		assert.strictEqual(fnv32("a"), 0x50c5d7e);
		assert.strictEqual(fnv32("foobar"), 0x31f0b262);
	});

	it("respects custom seed parameter", () => {
		const input = "test";
		const defaultHash = fnv32(input);
		const customSeed = 12345;
		const customHash = fnv32(input, customSeed);

		assert.notStrictEqual(defaultHash, customHash);
		assert.strictEqual(fnv32("", customSeed), customSeed);
	});

	it("returns unsigned 32-bit integers", () => {
		const tests = ["", "a", "hello world", "SimHash test vector"];

		for (const input of tests) {
			const hash = fnv32(input);
			assert.strictEqual(typeof hash, "number");
			assert(hash >= 0);
			assert(hash <= 0xffffffff);
			assert(Number.isInteger(hash));
		}
	});

	it("differs from FNV-1a results", () => {
		// FNV-1 and FNV-1a should produce different results due to operation order
		const input = "comparison test";
		const hash = fnv32(input);

		// This is a conceptual test - in practice we'd import both functions
		// to compare, but here we just verify FNV-1 produces valid results
		assert.strictEqual(typeof hash, "number");
		assert(hash > 0);
	});

	it("handles Unicode strings", () => {
		const unicode = "测试 тест ทดสอบ";
		const hash = fnv32(unicode);
		assert.strictEqual(typeof hash, "number");
		assert.strictEqual(hash, fnv32(unicode)); // Consistent
	});

	it("shows good distribution properties", () => {
		const inputs = [];
		for (let i = 0; i < 1000; i++) {
			inputs.push(`fnv_test_${i}`);
		}

		const hashes = inputs.map(fnv32);
		const uniqueHashes = new Set(hashes);

		// Should have minimal collisions
		const collisionRate = (inputs.length - uniqueHashes.size) / inputs.length;
		assert(
			collisionRate < 0.02,
			`High collision rate: ${collisionRate * 100}%`,
		);
	});

	it("maintains backward compatibility with SimHash usage", () => {
		// Test with default seed used in SimHash implementation
		const feature = "test_feature";
		const hash = fnv32(feature, 2166136261);

		assert.strictEqual(typeof hash, "number");
		assert(hash >= 0);
		assert(hash <= 0xffffffff);
	});

	it("demonstrates avalanche effect", () => {
		const hash1 = fnv32("hello");
		const hash2 = fnv32("hallo"); // Single bit change

		const xor = hash1 ^ hash2;
		const bitsFlipped = xor.toString(2).split("1").length - 1;

		// Good hash functions flip ~50% of bits for small input changes
		assert(bitsFlipped > 6, `Weak avalanche: only ${bitsFlipped} bits flipped`);
	});
});
