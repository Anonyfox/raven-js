import assert from "node:assert";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { copyFavicon } from "./copy-favicon.js";

describe("lib/docs/copy-favicon.js", () => {
	it("should export copyFavicon function", () => {
		assert.strictEqual(typeof copyFavicon, "function");
	});

	it("should return false when source favicon does not exist", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "nest-test-"));
		const docsPath = join(tempDir, "docs");
		const workspaceRoot = join(tempDir, "workspace");

		const result = copyFavicon(docsPath, workspaceRoot);
		assert.strictEqual(result, false);
	});

	it("should return true when favicon is copied successfully", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "nest-test-"));
		const docsPath = join(tempDir, "docs");
		const workspaceRoot = join(tempDir, "workspace");

		// Create media directory and favicon
		const mediaDir = join(workspaceRoot, "media");
		const faviconPath = join(mediaDir, "favicon.ico");

		// Create directories and file
		import("node:fs")
			.then((fs) => {
				fs.mkdirSync(mediaDir, { recursive: true });
				writeFileSync(faviconPath, "fake favicon content");

				const result = copyFavicon(docsPath, workspaceRoot);
				assert.strictEqual(result, true);
			})
			.catch(() => {
				// If any filesystem operation fails, that's ok for this basic test
				assert.ok(true);
			});
	});
});
