import assert from "node:assert";
import { describe, it } from "node:test";
import { ENGLISH_SIGNATURE_PHRASES } from "./english.js";

describe("ENGLISH_SIGNATURE_PHRASES", () => {
	it("has expected shape", () => {
		assert.equal(ENGLISH_SIGNATURE_PHRASES.name, "english");
		assert.ok(typeof ENGLISH_SIGNATURE_PHRASES.categories === "object");
		assert.ok(Array.isArray(ENGLISH_SIGNATURE_PHRASES.priority));
	});
});
