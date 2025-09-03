import assert from "node:assert";
import { describe, it } from "node:test";
import { GERMAN_SIGNATURE_PHRASES } from "./german.js";

describe("GERMAN_SIGNATURE_PHRASES", () => {
	it("has expected shape", () => {
		assert.equal(GERMAN_SIGNATURE_PHRASES.name, "german");
		assert.ok(typeof GERMAN_SIGNATURE_PHRASES.categories === "object");
		assert.ok(Array.isArray(GERMAN_SIGNATURE_PHRASES.priority));
	});
});
