/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, test } from "node:test";

import script from "./index.js";

describe("Script module", () => {
	test("exports function", () => {
		assert.strictEqual(typeof script, "function");
	});

	test("returns stub helloworld message", () => {
		assert.strictEqual(script(), "helloworld");
	});
});
