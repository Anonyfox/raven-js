/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, test } from "node:test";

import staticGen from "./index.js";

describe("Static module", () => {
	test("exports function", () => {
		assert.strictEqual(typeof staticGen, "function");
	});

	test("returns stub helloworld message", () => {
		assert.strictEqual(staticGen(), "helloworld");
	});
});
