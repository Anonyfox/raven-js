import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { hashFeatures } from "./hash-features.js";

describe("hashFeatures", () => {
	it("works with sane defaults", () => {
		const text = "Hello world test";
		const hash = hashFeatures(text);
		
		assert.strictEqual(typeof hash, "string");
		assert.strictEqual(hash.length, 128);
		assert(/^[0-9a-f]+$/.test(hash));
		assert.strictEqual(hash, hashFeatures(text));
	});

	it("handles different inputs", () => {
		const hash1 = hashFeatures("Hello");
		const hash2 = hashFeatures("World");
		assert.notStrictEqual(hash1, hash2);
	});

	it("respects options", () => {
		const text = "Test text";
		const hash256 = hashFeatures(text, { numFeatures: 256 });
		const hash512 = hashFeatures(text, { numFeatures: 512 });
		
		assert.strictEqual(hash256.length, 64);
		assert.strictEqual(hash512.length, 128);
	});

	it("throws on invalid input", () => {
		assert.throws(() => hashFeatures(null), TypeError);
		assert.throws(() => hashFeatures(123), TypeError);
	});
});
