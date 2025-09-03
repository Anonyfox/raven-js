import assert from "node:assert";
import { describe, it } from "node:test";
import { MINIMAL_SIGNATURE_PHRASES } from "./minimal.js";

describe("MINIMAL_SIGNATURE_PHRASES", () => {
	it("has expected shape", () => {
		assert.equal(MINIMAL_SIGNATURE_PHRASES.name, "minimal");
		assert.ok(typeof MINIMAL_SIGNATURE_PHRASES.categories === "object");
		assert.ok(Array.isArray(MINIMAL_SIGNATURE_PHRASES.priority));
	});
});
