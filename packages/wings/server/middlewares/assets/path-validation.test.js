/**
 * @file Path Validation Tests - Comprehensive test suite for path validation utilities
 *
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";
import { isValidAssetPath } from "./path-validation.js";

test("isValidAssetPath", async (t) => {
	await t.test("returns false for non-string inputs", () => {
		assert.strictEqual(isValidAssetPath(null), false);
		assert.strictEqual(isValidAssetPath(undefined), false);
		assert.strictEqual(isValidAssetPath(42), false);
		assert.strictEqual(isValidAssetPath({}), false);
		assert.strictEqual(isValidAssetPath([]), false);
		assert.strictEqual(isValidAssetPath(true), false);
		assert.strictEqual(isValidAssetPath(false), false);
	});

	await t.test("returns false for paths not starting with /", () => {
		assert.strictEqual(isValidAssetPath(""), false);
		assert.strictEqual(isValidAssetPath("css/style.css"), false);
		assert.strictEqual(isValidAssetPath("js/app.js"), false);
		assert.strictEqual(isValidAssetPath("images/logo.png"), false);
		assert.strictEqual(isValidAssetPath("static/file.txt"), false);
		assert.strictEqual(isValidAssetPath("\\css\\style.css"), false);
	});

	await t.test("returns false for root path", () => {
		assert.strictEqual(isValidAssetPath("/"), false);
	});

	await t.test("returns false for paths containing ..", () => {
		assert.strictEqual(isValidAssetPath("/../secret.txt"), false);
		assert.strictEqual(isValidAssetPath("/css/../../../secret.txt"), false);
		assert.strictEqual(isValidAssetPath("/css/.."), false);
		assert.strictEqual(isValidAssetPath("/css/../"), false);
		assert.strictEqual(isValidAssetPath("/css/../style.css"), false);
		assert.strictEqual(isValidAssetPath("/.."), false);
		assert.strictEqual(isValidAssetPath("/../"), false);
		assert.strictEqual(isValidAssetPath("/css/../js/../app.js"), false);
		assert.strictEqual(
			isValidAssetPath("/css/subfolder/../../../etc/passwd"),
			false,
		);
	});

	await t.test("returns false for paths containing backslashes", () => {
		assert.strictEqual(isValidAssetPath("/css\\style.css"), false);
		assert.strictEqual(isValidAssetPath("/css\\..\\secret.txt"), false);
		assert.strictEqual(isValidAssetPath("/\\secret.txt"), false);
		assert.strictEqual(isValidAssetPath("/css\\"), false);
		assert.strictEqual(isValidAssetPath("/css\\subfolder\\file.txt"), false);
		assert.strictEqual(isValidAssetPath("/app\\..\\config.json"), false);
	});

	await t.test("returns false for paths containing null bytes", () => {
		assert.strictEqual(isValidAssetPath("/css/style.css\0"), false);
		assert.strictEqual(isValidAssetPath("/\0secret.txt"), false);
		assert.strictEqual(isValidAssetPath("/css\0/style.css"), false);
		assert.strictEqual(isValidAssetPath("\0/css/style.css"), false);
		assert.strictEqual(isValidAssetPath("/css/\0"), false);
	});

	await t.test("returns true for valid asset paths", () => {
		assert.strictEqual(isValidAssetPath("/css/style.css"), true);
		assert.strictEqual(isValidAssetPath("/js/app.js"), true);
		assert.strictEqual(isValidAssetPath("/images/logo.png"), true);
		assert.strictEqual(isValidAssetPath("/fonts/font.woff2"), true);
		assert.strictEqual(isValidAssetPath("/static/file.txt"), true);
		assert.strictEqual(isValidAssetPath("/index.html"), true);
		assert.strictEqual(isValidAssetPath("/favicon.ico"), true);
	});

	await t.test("returns true for nested valid paths", () => {
		assert.strictEqual(isValidAssetPath("/css/components/button.css"), true);
		assert.strictEqual(isValidAssetPath("/js/modules/utils.js"), true);
		assert.strictEqual(isValidAssetPath("/images/icons/arrow.svg"), true);
		assert.strictEqual(
			isValidAssetPath("/assets/fonts/roboto/regular.woff2"),
			true,
		);
		assert.strictEqual(isValidAssetPath("/deep/nested/folder/file.txt"), true);
	});

	await t.test(
		"returns true for paths with special characters (allowed)",
		() => {
			assert.strictEqual(isValidAssetPath("/css/style-main.css"), true);
			assert.strictEqual(isValidAssetPath("/js/app_v2.js"), true);
			assert.strictEqual(isValidAssetPath("/images/logo@2x.png"), true);
			assert.strictEqual(
				isValidAssetPath("/fonts/font-weight-400.woff2"),
				true,
			);
			assert.strictEqual(isValidAssetPath("/css/style.min.css"), true);
			assert.strictEqual(isValidAssetPath("/js/app.bundle.js"), true);
			assert.strictEqual(isValidAssetPath("/files/document (1).pdf"), true);
			assert.strictEqual(isValidAssetPath("/css/style[mobile].css"), true);
			assert.strictEqual(isValidAssetPath("/js/app{modern}.js"), true);
		},
	);

	await t.test("returns true for URL-encoded characters", () => {
		assert.strictEqual(isValidAssetPath("/css/style%20file.css"), true);
		assert.strictEqual(isValidAssetPath("/js/app%2Butils.js"), true);
		assert.strictEqual(isValidAssetPath("/images/logo%40x2.png"), true);
	});

	await t.test("returns true for unicode characters", () => {
		assert.strictEqual(isValidAssetPath("/css/スタイル.css"), true);
		assert.strictEqual(isValidAssetPath("/js/приложение.js"), true);
		assert.strictEqual(isValidAssetPath("/images/图片.png"), true);
		assert.strictEqual(isValidAssetPath("/fonts/émoji.woff2"), true);
	});

	await t.test("edge cases with multiple violations", () => {
		assert.strictEqual(isValidAssetPath("/../secret.txt\0"), false);
		assert.strictEqual(isValidAssetPath("/css\\..\\style.css\0"), false);
		assert.strictEqual(isValidAssetPath("\\..\\secret.txt"), false);
		assert.strictEqual(isValidAssetPath("css/../..\\secret.txt"), false);
	});
});
