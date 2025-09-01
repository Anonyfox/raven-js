/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, test } from "node:test";

import {
	Config,
	createConfigFromFlags,
	generateScriptBundle,
	generateStaticSite,
} from "./index.js";
import binary from "./src/binary/index.js";

describe("Fledge package", () => {
	test("exports static generation functions", () => {
		assert.strictEqual(typeof generateStaticSite, "function");
		assert.strictEqual(typeof Config, "function");
	});

	test("exports script generation functions", () => {
		assert.strictEqual(typeof generateScriptBundle, "function");
		assert.strictEqual(typeof createConfigFromFlags, "function");
	});

	test("exports individual module functions", () => {
		assert.strictEqual(typeof binary, "function");
	});

	test("binary module returns stub message", () => {
		assert.strictEqual(binary(), "helloworld");
	});
});
