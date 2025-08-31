/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for assets module exports
 */

import { ok, strictEqual } from "node:assert";
import { describe, test } from "node:test";
import * as assetsModule from "./index.js";

describe("assets module exports", () => {
	test("should export extractImageAssets function", () => {
		ok(typeof assetsModule.extractImageAssets === "function");
	});

	test("should export isLocalImagePath function", () => {
		ok(typeof assetsModule.isLocalImagePath === "function");
	});

	test("should export AssetRegistry class", () => {
		ok(typeof assetsModule.AssetRegistry === "function");
		ok(assetsModule.AssetRegistry.prototype);
	});

	test("should export serveAsset function", () => {
		ok(typeof assetsModule.serveAsset === "function");
	});

	test("should export createAssetMiddleware function", () => {
		ok(typeof assetsModule.createAssetMiddleware === "function");
	});

	test("should have all expected exports", () => {
		const expectedExports = [
			"extractImageAssets",
			"isLocalImagePath",
			"AssetRegistry",
			"serveAsset",
			"createAssetMiddleware",
		];

		for (const exportName of expectedExports) {
			ok(exportName in assetsModule, `Missing export: ${exportName}`);
		}
	});

	test("should not have unexpected exports", () => {
		const actualExports = Object.keys(assetsModule);
		const expectedExports = [
			"extractImageAssets",
			"isLocalImagePath",
			"AssetRegistry",
			"serveAsset",
			"createAssetMiddleware",
		];

		strictEqual(actualExports.length, expectedExports.length);

		for (const exportName of actualExports) {
			ok(
				expectedExports.includes(exportName),
				`Unexpected export: ${exportName}`,
			);
		}
	});
});
