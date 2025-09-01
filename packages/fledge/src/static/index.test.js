/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, test } from "node:test";

import { Config, generateStaticSite } from "./index.js";

describe("Static module", () => {
	test("exports generateStaticSite function", () => {
		assert.strictEqual(typeof generateStaticSite, "function");
	});

	test("exports Config class", () => {
		assert.strictEqual(typeof Config, "function");
	});
});
