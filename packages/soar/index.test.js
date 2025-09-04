/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for @raven-js/soar main module
 */

import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { deploy, plan } from "./index.js";

describe("@raven-js/soar", () => {
	it("exports deploy function", () => {
		strictEqual(typeof deploy, "function");
	});

	it("exports plan function", () => {
		strictEqual(typeof plan, "function");
	});
});
