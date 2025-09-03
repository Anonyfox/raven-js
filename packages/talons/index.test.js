/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for @raven-js/talons main module
 */

import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { connect } from "./index.js";

describe("@raven-js/talons", () => {
	it("exports connect function", () => {
		strictEqual(typeof connect, "function");
	});
});
