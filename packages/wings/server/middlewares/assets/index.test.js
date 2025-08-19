/**
 * @file Test suite for Assets middleware index exports.
 * @author fox <fox@foxreign.com>
 * @license MIT
 * @link https://github.com/Anonyfox/ravenjs
 * @link https://ravenjs.com
 * @link https://ravenjs.com/docs
 * @link https://foxreign.com
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";
import { Assets } from "./index.js";

test("Assets middleware index exports", async (t) => {
	await t.test("should export Assets class", () => {
		assert.strictEqual(typeof Assets, "function");
		assert.strictEqual(Assets.name, "Assets");
	});

	await t.test("should be able to instantiate Assets class", () => {
		const assets = new Assets();
		assert.strictEqual(typeof assets, "object");
		assert.strictEqual(assets.constructor.name, "Assets");
	});

	await t.test("should have expected public methods", () => {
		const assets = new Assets();
		assert.strictEqual(typeof assets.handler, "function");
		assert.strictEqual(typeof assets.identifier, "string");
	});

	await t.test(
		"should maintain identical API to original implementation",
		() => {
			const assets = new Assets();

			// Check that all expected properties exist
			assert.strictEqual(typeof assets.assetsDir, "string");
			assert.strictEqual(typeof assets.mode, "string");
			assert.strictEqual(Array.isArray(assets.assetsList), true);

			// Check handler is a bound function
			assert.strictEqual(typeof assets.handler, "function");
			assert.strictEqual(assets.handler.name, "");
		},
	);
});
