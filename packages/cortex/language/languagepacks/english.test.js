import assert from "node:assert";
import { describe, it } from "node:test";
import { ENGLISH_LANGUAGE_PACK } from "./english.js";

describe("english language pack", () => {
	it("has expected keys", () => {
		assert.ok(ENGLISH_LANGUAGE_PACK.categories);
		assert.ok(ENGLISH_LANGUAGE_PACK.grammar);
		assert.ok(ENGLISH_LANGUAGE_PACK.stopwords instanceof Set);
	});
});
