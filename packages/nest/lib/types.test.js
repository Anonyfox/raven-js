import assert from "node:assert";
import { describe, it } from "node:test";
import * as types from "./types.js";

describe("lib/types.js", () => {
	it("should be a valid module", () => {
		// types.js exports an empty object to make it a module
		// We just need to ensure it can be imported without errors
		assert.strictEqual(typeof types, "object");
	});

	it("should not have any unexpected exports", () => {
		// Since this is a type definition file that exports only an empty object,
		// it should have no enumerable properties
		const exportKeys = Object.keys(types);
		assert.strictEqual(exportKeys.length, 0);
	});
});
