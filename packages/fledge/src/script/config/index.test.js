/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for script config index module.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import * as configIndex from "./index.js";

describe("script config index", () => {
	it("exports all configuration classes", () => {
		assert.ok(typeof configIndex.ScriptConfig === "function");
		assert.ok(typeof configIndex.Assets === "function");
		assert.ok(typeof configIndex.Environment === "function");
		assert.ok(typeof configIndex.Metadata === "function");
	});

	it("exports utility functions", () => {
		assert.ok(typeof configIndex.parseEnvFile === "function");
		assert.ok(typeof configIndex.importConfigFromFile === "function");
		assert.ok(typeof configIndex.importConfigFromString === "function");
		assert.ok(typeof configIndex.validateConfigObject === "function");
	});
});
