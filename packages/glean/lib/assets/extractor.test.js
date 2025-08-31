/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for asset extractor functionality
 */

import { ok, strictEqual } from "node:assert";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import { extractImageAssets, isLocalImagePath } from "./extractor.js";

// Test data setup
const testDir = "/tmp/glean-asset-extractor-test";

/**
 * Setup test directory with image files
 */
function setupTestDir() {
	// Clean up any existing test directory
	if (existsSync(testDir)) {
		rmSync(testDir, { recursive: true, force: true });
	}

	// Create test directory structure
	mkdirSync(testDir, { recursive: true });
	mkdirSync(join(testDir, "images"), { recursive: true });
	mkdirSync(join(testDir, "assets", "icons"), { recursive: true });

	// Create dummy image files
	writeFileSync(join(testDir, "images", "logo.png"), "fake-png-content");
	writeFileSync(join(testDir, "images", "banner.jpg"), "fake-jpg-content");
	writeFileSync(join(testDir, "assets", "icons", "check.svg"), "<svg></svg>");
	writeFileSync(join(testDir, "screenshot.webp"), "fake-webp-content");
	writeFileSync(join(testDir, "favicon.ico"), "fake-ico-content");
}

/**
 * Cleanup test directory
 */
function cleanupTestDir() {
	if (existsSync(testDir)) {
		rmSync(testDir, { recursive: true, force: true });
	}
}

describe("extractImageAssets", () => {
	test("should extract basic inline image references", () => {
		setupTestDir();

		const markdown = `
# Test Document

![Logo](./images/logo.png)
![Banner](./images/banner.jpg "Banner image")
		`;

		const assets = extractImageAssets(markdown, testDir);

		strictEqual(assets.length, 2);

		// Check first asset
		strictEqual(assets[0].originalPath, "./images/logo.png");
		strictEqual(assets[0].resolvedPath, join(testDir, "images", "logo.png"));
		strictEqual(assets[0].contentType, "image/png");
		strictEqual(assets[0].basePath, testDir);

		// Check second asset
		strictEqual(assets[1].originalPath, "./images/banner.jpg");
		strictEqual(assets[1].resolvedPath, join(testDir, "images", "banner.jpg"));
		strictEqual(assets[1].contentType, "image/jpeg");

		cleanupTestDir();
	});

	test("should handle various image formats", () => {
		setupTestDir();

		const markdown = `
![PNG](./images/logo.png)
![JPG](./images/banner.jpg)
![SVG](./assets/icons/check.svg)
![WebP](./screenshot.webp)
![ICO](./favicon.ico)
		`;

		const assets = extractImageAssets(markdown, testDir);

		strictEqual(assets.length, 5);

		const contentTypes = assets.map((a) => a.contentType);
		ok(contentTypes.includes("image/png"));
		ok(contentTypes.includes("image/jpeg"));
		ok(contentTypes.includes("image/svg+xml"));
		ok(contentTypes.includes("image/webp"));
		ok(contentTypes.includes("image/x-icon"));

		cleanupTestDir();
	});

	test("should skip external URLs", () => {
		setupTestDir();

		const markdown = `
![Local](./images/logo.png)
![HTTP](http://example.com/image.png)
![HTTPS](https://example.com/image.jpg)
![FTP](ftp://example.com/file.gif)
		`;

		const assets = extractImageAssets(markdown, testDir);

		strictEqual(assets.length, 1);
		strictEqual(assets[0].originalPath, "./images/logo.png");

		cleanupTestDir();
	});

	test("should skip data URLs", () => {
		setupTestDir();

		const markdown = `
![Local](./images/logo.png)
![Data](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==)
		`;

		const assets = extractImageAssets(markdown, testDir);

		strictEqual(assets.length, 1);
		strictEqual(assets[0].originalPath, "./images/logo.png");

		cleanupTestDir();
	});

	test("should skip absolute paths", () => {
		setupTestDir();

		const markdown = `
![Local](./images/logo.png)
![Absolute](/etc/passwd)
![Windows](C:\\Windows\\System32\\image.png)
		`;

		const assets = extractImageAssets(markdown, testDir);

		strictEqual(assets.length, 1);
		strictEqual(assets[0].originalPath, "./images/logo.png");

		cleanupTestDir();
	});

	test("should skip non-image files", () => {
		setupTestDir();

		// Create non-image file
		writeFileSync(join(testDir, "document.pdf"), "fake-pdf");

		const markdown = `
![Logo](./images/logo.png)
![PDF](./document.pdf)
![Text](./README.md)
		`;

		const assets = extractImageAssets(markdown, testDir);

		strictEqual(assets.length, 1);
		strictEqual(assets[0].originalPath, "./images/logo.png");

		cleanupTestDir();
	});

	test("should skip non-existent files", () => {
		setupTestDir();

		const markdown = `
![Logo](./images/logo.png)
![Missing](./images/missing.png)
		`;

		const assets = extractImageAssets(markdown, testDir);

		strictEqual(assets.length, 1);
		strictEqual(assets[0].originalPath, "./images/logo.png");

		cleanupTestDir();
	});

	test("should deduplicate identical paths", () => {
		setupTestDir();

		const markdown = `
![Logo 1](./images/logo.png)
![Logo 2](./images/logo.png "Same logo")
		`;

		const assets = extractImageAssets(markdown, testDir);

		strictEqual(assets.length, 1);
		strictEqual(assets[0].originalPath, "./images/logo.png");

		cleanupTestDir();
	});

	test("should handle complex markdown with mixed content", () => {
		setupTestDir();

		const markdown = `
# Complex Document

Some text with **bold** and *italic*.

![Logo](./images/logo.png)

Here's a [link](http://example.com) and some code:

\`\`\`javascript
console.log("Hello");
\`\`\`

![Banner](./images/banner.jpg "Banner")

More text and ![inline image](./favicon.ico) in paragraph.

## Section 2

- List item with ![SVG](./assets/icons/check.svg)
- Another item

> Blockquote with ![WebP](./screenshot.webp)
		`;

		const assets = extractImageAssets(markdown, testDir);

		strictEqual(assets.length, 5);

		const paths = assets.map((a) => a.originalPath);
		ok(paths.includes("./images/logo.png"));
		ok(paths.includes("./images/banner.jpg"));
		ok(paths.includes("./favicon.ico"));
		ok(paths.includes("./assets/icons/check.svg"));
		ok(paths.includes("./screenshot.webp"));

		cleanupTestDir();
	});

	test("should handle empty or invalid input", () => {
		strictEqual(extractImageAssets("", testDir).length, 0);
		strictEqual(extractImageAssets(null, testDir).length, 0);
		strictEqual(extractImageAssets(undefined, testDir).length, 0);
		strictEqual(extractImageAssets("No images here", testDir).length, 0);
		strictEqual(extractImageAssets("![]()", testDir).length, 0);

		// Invalid basePath
		strictEqual(extractImageAssets("![Logo](./logo.png)", "").length, 0);
		strictEqual(extractImageAssets("![Logo](./logo.png)", null).length, 0);
	});

	test("should prevent path traversal attacks", () => {
		setupTestDir();

		const markdown = `
![Traversal](../../../etc/passwd)
![Traversal2](./images/../../../etc/passwd)
![Windows](./images/..\\..\\Windows\\System32)
		`;

		const assets = extractImageAssets(markdown, testDir);

		// Should reject all path traversal attempts
		strictEqual(assets.length, 0);

		cleanupTestDir();
	});

	test("should handle relative paths correctly", () => {
		setupTestDir();

		// Create nested structure
		mkdirSync(join(testDir, "docs"), { recursive: true });
		writeFileSync(join(testDir, "images", "nested.png"), "fake-content");

		const markdown = `![Relative](../images/nested.png)`;
		const docsDir = join(testDir, "docs");

		const assets = extractImageAssets(markdown, docsDir);

		strictEqual(assets.length, 1);
		strictEqual(assets[0].originalPath, "../images/nested.png");
		strictEqual(assets[0].resolvedPath, join(testDir, "images", "nested.png"));

		cleanupTestDir();
	});
});

describe("isLocalImagePath", () => {
	test("should identify local image paths", () => {
		ok(isLocalImagePath("./images/logo.png"));
		ok(isLocalImagePath("../assets/icon.svg"));
		ok(isLocalImagePath("image.jpg"));
		ok(isLocalImagePath("folder/subfolder/pic.webp"));
	});

	test("should reject external URLs", () => {
		strictEqual(isLocalImagePath("http://example.com/image.png"), false);
		strictEqual(isLocalImagePath("https://example.com/image.jpg"), false);
		strictEqual(isLocalImagePath("ftp://server.com/file.gif"), false);
		strictEqual(isLocalImagePath("mailto:test@example.com"), false);
	});

	test("should reject data URLs", () => {
		strictEqual(isLocalImagePath("data:image/png;base64,xyz"), false);
		strictEqual(isLocalImagePath("data:image/jpeg;base64,abc"), false);
	});

	test("should reject absolute paths", () => {
		strictEqual(isLocalImagePath("/absolute/path/image.png"), false);
		strictEqual(isLocalImagePath("C:\\Windows\\image.png"), false);
	});

	test("should reject non-image extensions", () => {
		strictEqual(isLocalImagePath("./document.pdf"), false);
		strictEqual(isLocalImagePath("./README.md"), false);
		strictEqual(isLocalImagePath("./script.js"), false);
	});

	test("should handle invalid input", () => {
		strictEqual(isLocalImagePath(""), false);
		strictEqual(isLocalImagePath(null), false);
		strictEqual(isLocalImagePath(undefined), false);
		strictEqual(isLocalImagePath(123), false);
	});
});
