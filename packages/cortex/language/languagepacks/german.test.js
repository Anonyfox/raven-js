import assert from "node:assert";
import { describe, it } from "node:test";
import { GERMAN_LANGUAGE_PACK } from "./german.js";

describe("german language pack", () => {
	it("has expected keys", () => {
		assert.ok(GERMAN_LANGUAGE_PACK.categories);
		assert.ok(GERMAN_LANGUAGE_PACK.grammar);
		assert.ok(GERMAN_LANGUAGE_PACK.stopwords instanceof Set);
	});
});
