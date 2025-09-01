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
import binary from "./src/binary/index.js";
import script from "./src/script/index.js";

describe("Fledge package", () => {
	test("exports static generation functions", () => {
		assert.strictEqual(typeof generateStaticSite, "function");
		assert.strictEqual(typeof Config, "function");
	});

	test("exports individual module functions", () => {
		assert.strictEqual(typeof binary, "function");
		assert.strictEqual(typeof script, "function");
	});

	test("binary module returns stub message", () => {
		assert.strictEqual(binary(), "helloworld");
	});

	test("script module returns stub message", () => {
		assert.strictEqual(script(), "helloworld");
	});
});
