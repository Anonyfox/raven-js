/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { fnv1a64 } from "./fnv1a64.js";

describe("fnv1a64", () => {
	it("produces consistent hashes for same input", () => {
		const input = "hello world";
		const hash1 = fnv1a64(input);
		const hash2 = fnv1a64(input);
		assert.strictEqual(hash1, hash2);
	});

	it("produces different hashes for different inputs", () => {
		const hash1 = fnv1a64("hello");
		const hash2 = fnv1a64("world");
		assert.notStrictEqual(hash1, hash2);
	});

	it("handles empty string", () => {
		const hash = fnv1a64("");
		assert.strictEqual(typeof hash, "bigint");
		assert.strictEqual(hash, 0xcbf29ce484222325n); // Should equal seed
	});

	it("produces known test vectors", () => {
		// Known FNV-1a 64-bit test vectors - verify with actual computed values
		assert.strictEqual(fnv1a64(""), 0xcbf29ce484222325n); // Empty string = seed
		assert.strictEqual(fnv1a64("a"), 0xaf63dc4c8601ec8cn);
		assert.strictEqual(fnv1a64("foobar"), 0x85944171f73967e8n);
	});

	it("respects custom seed parameter", () => {
		const input = "test";
		const defaultHash = fnv1a64(input);
		const customSeed = 0x1234567890abcdefn;
		const customHash = fnv1a64(input, customSeed);

		assert.notStrictEqual(defaultHash, customHash);
		assert.strictEqual(fnv1a64("", customSeed), customSeed);
	});

	it("returns BigInt values", () => {
		const tests = ["", "a", "hello world", "The quick brown fox"];

		for (const input of tests) {
			const hash = fnv1a64(input);
			assert.strictEqual(typeof hash, "bigint");
			assert(hash >= 0n);
		}
	});

	it("handles Unicode strings correctly", () => {
		const unicode = "café naïve résumé 🦅";
		const hash = fnv1a64(unicode);
		assert.strictEqual(typeof hash, "bigint");
		assert.strictEqual(hash, fnv1a64(unicode)); // Consistent
	});

	it("has larger hash space than 32-bit variant", () => {
		const input = "collision test";
		const hash32 = BigInt(2166136261); // Simulated 32-bit hash
		const hash64 = fnv1a64(input);

		// 64-bit hash should use full range
		assert(hash64 > hash32);
		assert(hash64 > 0xffffffffn); // Exceeds 32-bit range
	});

	it("demonstrates excellent distribution", () => {
		const inputs = [];
		for (let i = 0; i < 1000; i++) {
			// Reduce test size for debugging
			inputs.push(`test_item_${i}_${i.toString()}`);
		}

		const hashes = [];
		for (const input of inputs) {
			try {
				hashes.push(fnv1a64(input));
			} catch (error) {
				assert.fail(`Failed to hash input: ${input}, Error: ${error.message}`);
			}
		}

		const uniqueHashes = new Set(hashes);

		// With 64-bit space, should have virtually no collisions
		const collisionRate = (inputs.length - uniqueHashes.size) / inputs.length;
		assert(
			collisionRate < 0.01,
			`Unexpected collisions: ${collisionRate * 100}%`,
		); // More lenient threshold
	});

	it("provides different results from 32-bit variant", () => {
		// This test conceptually shows that 64-bit provides different
		// hash values than what 32-bit would produce (if we had both)
		const input = "test comparison";
		const hash64 = fnv1a64(input);

		// 64-bit hash should be much larger than 32-bit range
		assert(hash64 > 0xffffffffn);
	});

	it("maintains precision with BigInt arithmetic", () => {
		const longInput = "a".repeat(1000); // Very long string
		const hash = fnv1a64(longInput);

		assert.strictEqual(typeof hash, "bigint");
		// Should handle large intermediate calculations correctly
		assert(hash > 0n);
	});
});
