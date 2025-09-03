import assert from "node:assert";
import { describe, it } from "node:test";
import {
	ENGLISH_SIGNATURE_PHRASES,
	GERMAN_SIGNATURE_PHRASES,
	MINIMAL_SIGNATURE_PHRASES,
} from "./index.js";

describe("signaturephrases index", () => {
	it("re-exports packs", () => {
		assert.equal(ENGLISH_SIGNATURE_PHRASES.name, "english");
		assert.equal(GERMAN_SIGNATURE_PHRASES.name, "german");
		assert.equal(MINIMAL_SIGNATURE_PHRASES.name, "minimal");
	});
});
