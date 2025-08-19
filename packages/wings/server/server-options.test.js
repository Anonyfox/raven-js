import assert from "node:assert";
import { describe, it } from "node:test";
import * as serverOptions from "./server-options.js";

describe("server/server-options.js", () => {
	it("should be a valid module", () => {
		// server-options.js is a typedef definition file that exports nothing
		assert.strictEqual(typeof serverOptions, "object");
	});

	it("should not have any unexpected exports", () => {
		// Since this is a typedef file with no actual exports, it should have no enumerable properties
		const exportKeys = Object.keys(serverOptions);
		assert.strictEqual(exportKeys.length, 0);
	});
});
