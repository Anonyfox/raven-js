/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, test } from "node:test";

import fledge, { binary, script, static as staticGen } from "./index.js";

describe("Fledge package", () => {
	test("exports default object with three modules", () => {
		assert.strictEqual(typeof fledge, "object");
		assert.strictEqual(typeof fledge.binary, "function");
		assert.strictEqual(typeof fledge.script, "function");
		assert.strictEqual(typeof fledge.static, "function");
	});

	test("exports individual module functions", () => {
		assert.strictEqual(typeof binary, "function");
		assert.strictEqual(typeof script, "function");
		assert.strictEqual(typeof staticGen, "function");
	});

	test("binary module returns stub message", () => {
		assert.strictEqual(binary(), "helloworld");
		assert.strictEqual(fledge.binary(), "helloworld");
	});

	test("script module returns stub message", () => {
		assert.strictEqual(script(), "helloworld");
		assert.strictEqual(fledge.script(), "helloworld");
	});

	test("static module returns stub message", () => {
		assert.strictEqual(staticGen(), "helloworld");
		assert.strictEqual(fledge.static(), "helloworld");
	});
});
