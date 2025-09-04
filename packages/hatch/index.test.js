/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for @raven-js/hatch main module
 */

import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { create, tutorial } from "./index.js";

describe("@raven-js/hatch", () => {
	it("exports create function", () => {
		strictEqual(typeof create, "function");
	});

	it("exports tutorial function", () => {
		strictEqual(typeof tutorial, "function");
	});
});
