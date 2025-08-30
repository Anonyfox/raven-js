/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import * as devToolingValidations from "./index.js";

describe("dev-tooling validations index", () => {
	it("should export HasProperBiomeSetup function", () => {
		assert.strictEqual(
			typeof devToolingValidations.HasProperBiomeSetup,
			"function",
		);
	});
});
