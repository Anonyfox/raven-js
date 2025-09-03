import assert from "node:assert";
import { describe, it } from "node:test";
import { MINIMAL_LANGUAGE_PACK } from "./minimal.js";

describe("minimal language pack", () => {
	it("has expected keys", () => {
		assert.ok(MINIMAL_LANGUAGE_PACK.categories);
		assert.ok(MINIMAL_LANGUAGE_PACK.grammar);
		assert.ok(MINIMAL_LANGUAGE_PACK.stopwords instanceof Set);
	});
});
