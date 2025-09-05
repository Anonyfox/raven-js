/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { generateGleanDocs } from "./generate-glean.js";

describe("generateGleanDocs", () => {
	it("should be a function", () => {
		assert.strictEqual(typeof generateGleanDocs, "function");
	});

	it("should return false for invalid paths without throwing", async () => {
		// Test with non-existent paths to trigger error path
		const result = await generateGleanDocs(
			"/nonexistent/path",
			"/nonexistent/output",
		);

		// Function should handle errors gracefully and return false
		assert.strictEqual(result, false);
	});

	it("should handle empty string inputs gracefully", async () => {
		const result = await generateGleanDocs("", "");
		assert.strictEqual(result, false);
	});

	it("should handle real temporary directory paths", async () => {
		const tempDir = mkdtempSync(join(tmpdir(), "nest-test-"));
		const outputDir = mkdtempSync(join(tmpdir(), "nest-output-"));

		try {
			// This will likely fail due to no valid package.json or JS files, but should not hang
			const result = await generateGleanDocs(tempDir, outputDir);
			assert.strictEqual(typeof result, "boolean");
		} finally {
			// Clean up temp directories
			rmSync(tempDir, { recursive: true, force: true });
			rmSync(outputDir, { recursive: true, force: true });
		}
	});
});
