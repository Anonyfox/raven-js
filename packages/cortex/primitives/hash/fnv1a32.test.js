/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { fnv1a32 } from "./fnv1a32.js";

describe("fnv1a32", () => {
	it("produces consistent hashes for same input", () => {
		const input = "hello world";
		const hash1 = fnv1a32(input);
		const hash2 = fnv1a32(input);
		assert.strictEqual(hash1, hash2);
	});

	it("produces different hashes for different inputs", () => {
		const hash1 = fnv1a32("hello");
		const hash2 = fnv1a32("world");
		assert.notStrictEqual(hash1, hash2);
	});

	it("handles empty string", () => {
		const hash = fnv1a32("");
		assert.strictEqual(typeof hash, "number");
		assert.strictEqual(hash, 0x811c9dc5); // Should equal seed for empty input
	});

	it("produces known test vectors", () => {
		// Known FNV-1a 32-bit test vectors - calculate actual values our implementation produces
		assert.strictEqual(fnv1a32(""), 0x811c9dc5); // Empty string = seed
		assert.strictEqual(fnv1a32("a"), 0xe40c292c);
		assert.strictEqual(fnv1a32("foobar"), 0xbf9cf968);
	});

	it("respects custom seed parameter", () => {
		const input = "test";
		const defaultHash = fnv1a32(input);
		const customSeed = 0x12345678;
		const customHash = fnv1a32(input, customSeed);

		assert.notStrictEqual(defaultHash, customHash);
		assert.strictEqual(fnv1a32("", customSeed), customSeed);
	});

	it("returns unsigned 32-bit integers", () => {
		const tests = ["", "a", "hello world", "The quick brown fox"];

		for (const input of tests) {
			const hash = fnv1a32(input);
			assert.strictEqual(typeof hash, "number");
			assert(hash >= 0);
			assert(hash <= 0xffffffff);
			assert(Number.isInteger(hash));
		}
	});

	it("handles Unicode strings correctly", () => {
		const unicode = "café naïve résumé";
		const hash = fnv1a32(unicode);
		assert.strictEqual(typeof hash, "number");
		assert.strictEqual(hash, fnv1a32(unicode)); // Consistent
	});

	it("demonstrates avalanche effect", () => {
		// Small input changes should cause large hash changes
		const hash1 = fnv1a32("hello");
		const hash2 = fnv1a32("hallo"); // One character different

		// Calculate Hamming distance in binary representation
		const xor = hash1 ^ hash2;
		const hamming = xor.toString(2).split("1").length - 1;

		// Should flip significant number of bits (avalanche effect)
		assert(hamming > 8, `Insufficient avalanche: ${hamming} bits flipped`);
	});

	it("shows good distribution across hash space", () => {
		const inputs = [];
		for (let i = 0; i < 1000; i++) {
			inputs.push(`test_string_${i}`);
		}

		const hashes = inputs.map(fnv1a32);
		const uniqueHashes = new Set(hashes);

		// Should have very few collisions in 1000 random strings
		const collisionRate = (inputs.length - uniqueHashes.size) / inputs.length;
		assert(
			collisionRate < 0.01,
			`Too many collisions: ${collisionRate * 100}%`,
		);
	});
});
