/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for asset management module - CSS generation and file operations.
 */

import { strict as assert } from "node:assert";
import { readFile, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { generateAssets, generateCSSContent } from "./asset-management.js";

test("generateCSSContent returns complete CSS string", () => {
	const css = generateCSSContent();

	// Verify essential CSS components are present
	assert.ok(typeof css === "string");
	assert.ok(css.length > 1000);
	assert.ok(css.includes("/* Glean Documentation Styles */"));
	assert.ok(css.includes("body {"));
	assert.ok(css.includes(".header {"));
	assert.ok(css.includes(".navigation {"));
	assert.ok(css.includes(".entity-grid {"));
	assert.ok(css.includes(".source-code {"));
	assert.ok(css.includes("font-family:"));
	assert.ok(css.includes("color:"));
	assert.ok(css.includes("background:"));
});

test("generateAssets creates assets directory and CSS file", async () => {
	const tempDir = join(tmpdir(), `glean-assets-test-${Date.now()}`);

	try {
		await generateAssets(tempDir);

		// Verify CSS file was created with correct content
		const cssPath = join(tempDir, "assets", "styles.css");
		const cssContent = await readFile(cssPath, "utf-8");

		assert.ok(cssContent.includes("/* Glean Documentation Styles */"));
		assert.ok(cssContent.includes("body {"));
		assert.ok(cssContent.includes(".header {"));
		assert.ok(cssContent.length > 1000);

		// Verify CSS content matches generateCSSContent output
		const expectedCSS = generateCSSContent();
		assert.strictEqual(cssContent, expectedCSS);
	} finally {
		await rmdir(tempDir, { recursive: true });
	}
});
