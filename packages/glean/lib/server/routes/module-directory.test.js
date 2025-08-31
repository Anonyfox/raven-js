/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for module directory route handler - simplified for optimized design
 */

import { strict as assert } from "node:assert";
import { describe, test } from "node:test";
import { createModuleDirectoryHandler } from "./module-directory.js";

describe("createModuleDirectoryHandler", () => {
	test("returns a valid route handler function", () => {
		const handler = createModuleDirectoryHandler();
		assert(typeof handler === "function", "Returns a function");
	});

	test("handler function structure is valid", () => {
		const handler = createModuleDirectoryHandler();
		assert(
			handler.name === "handleModuleDirectory",
			"Has correct function name",
		);
	});
});
