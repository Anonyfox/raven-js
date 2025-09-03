import assert from "node:assert";
import { describe, it } from "node:test";
import {
	ENGLISH_LANGUAGE_PACK,
	GERMAN_LANGUAGE_PACK,
	MINIMAL_LANGUAGE_PACK,
} from "./index.js";

describe("languagepacks", () => {
	it("exports english pack shape", () => {
		assert.equal(ENGLISH_LANGUAGE_PACK.name, "english");
		assert.ok(ENGLISH_LANGUAGE_PACK.stopwords instanceof Set);
	});

	it("exports german pack shape", () => {
		assert.equal(GERMAN_LANGUAGE_PACK.name, "german");
		assert.ok(GERMAN_LANGUAGE_PACK.stopwords instanceof Set);
	});

	it("exports minimal pack shape", () => {
		assert.equal(MINIMAL_LANGUAGE_PACK.name, "minimal");
		assert.ok(MINIMAL_LANGUAGE_PACK.stopwords instanceof Set);
	});
});
