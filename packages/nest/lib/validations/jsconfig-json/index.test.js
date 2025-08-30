/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import * as jsconfigValidations from "./index.js";

describe("jsconfig-json validations index", () => {
	it("should export HasMinimalSettings function", () => {
		assert.strictEqual(
			typeof jsconfigValidations.HasMinimalSettings,
			"function",
		);
	});
});
