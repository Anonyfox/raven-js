/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for asset registry functionality
 */

import { notStrictEqual, ok, strictEqual } from "node:assert";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import { AssetRegistry } from "./registry.js";

// Test data setup
const testDir = "/tmp/glean-asset-registry-test";

/**
 * Setup test directory with image files
 */
function setupTestDir() {
	// Clean up any existing test directory
	if (existsSync(testDir)) {
		rmSync(testDir, { recursive: true, force: true });
	}

	// Create test directory and files
	mkdirSync(testDir, { recursive: true });
	mkdirSync(join(testDir, "images"), { recursive: true });

	// Create test files with known content for hash testing
	writeFileSync(join(testDir, "images", "logo.png"), "PNG-CONTENT");
	writeFileSync(join(testDir, "images", "banner.jpg"), "JPG-CONTENT");
	writeFileSync(join(testDir, "images", "duplicate.png"), "PNG-CONTENT"); // Same content as logo.png
	writeFileSync(join(testDir, "icon.svg"), "<svg>test</svg>");
}

/**
 * Cleanup test directory
 */
function cleanupTestDir() {
	if (existsSync(testDir)) {
		rmSync(testDir, { recursive: true, force: true });
	}
}

describe("AssetRegistry", () => {
	describe("constructor", () => {
		test("should create empty registry", () => {
			const registry = new AssetRegistry();

			strictEqual(registry.size, 0);
			strictEqual(registry.getAllAssets().length, 0);
		});
	});

	describe("register", () => {
		test("should register single asset", () => {
			setupTestDir();
			const registry = new AssetRegistry();

			const asset = {
				originalPath: "./images/logo.png",
				resolvedPath: join(testDir, "images", "logo.png"),
				contentType: "image/png",
				altText: "Company Logo",
			};

			const assetUrl = registry.register(asset);

			strictEqual(registry.size, 1);
			ok(assetUrl.startsWith("/assets/"));
			ok(assetUrl.endsWith(".png"));
			ok(assetUrl.includes("company-logo")); // SEO keywords
			ok(/\/assets\/company-logo-[a-f0-9]{8}\.png/.test(assetUrl)); // SEO pattern

			// Verify asset is retrievable
			const retrievedAsset = registry.getAsset(assetUrl);
			ok(retrievedAsset);
			strictEqual(retrievedAsset.originalPath, "./images/logo.png");
			strictEqual(retrievedAsset.contentType, "image/png");

			cleanupTestDir();
		});

		test("should generate deterministic URLs", () => {
			setupTestDir();
			const registry1 = new AssetRegistry();
			const registry2 = new AssetRegistry();

			const asset = {
				originalPath: "./images/logo.png",
				resolvedPath: join(testDir, "images", "logo.png"),
				contentType: "image/png",
				altText: "Company Logo",
			};

			const url1 = registry1.register(asset);
			const url2 = registry2.register(asset);

			// Same content + altText should generate same SEO URL
			strictEqual(url1, url2);
			ok(url1.includes("company-logo"));

			cleanupTestDir();
		});

		test("should deduplicate identical content with same SEO naming", () => {
			setupTestDir();
			const registry = new AssetRegistry();

			const asset1 = {
				originalPath: "./images/logo.png",
				resolvedPath: join(testDir, "images", "logo.png"),
				contentType: "image/png",
				altText: "Logo Image",
			};

			const asset2 = {
				originalPath: "./images/duplicate.png",
				resolvedPath: join(testDir, "images", "duplicate.png"),
				contentType: "image/png",
				altText: "Logo Image", // Same alt text as asset1
			};

			const url1 = registry.register(asset1);
			const url2 = registry.register(asset2);

			// Same content but different filenames -> different SEO URLs (SEO optimization)
			notStrictEqual(url1, url2);
			strictEqual(registry.size, 2); // Two different SEO URLs for same content
			ok(url1.includes("logo-image"));
			ok(url2.includes("logo-image"));

			// Each path should map to its own URL
			strictEqual(registry.getUrlForPath("./images/logo.png"), url1);
			strictEqual(registry.getUrlForPath("./images/duplicate.png"), url2);

			cleanupTestDir();
		});

		test("should handle different file types", () => {
			setupTestDir();
			const registry = new AssetRegistry();

			const assets = [
				{
					originalPath: "./images/logo.png",
					resolvedPath: join(testDir, "images", "logo.png"),
					contentType: "image/png",
				},
				{
					originalPath: "./images/banner.jpg",
					resolvedPath: join(testDir, "images", "banner.jpg"),
					contentType: "image/jpeg",
				},
				{
					originalPath: "./icon.svg",
					resolvedPath: join(testDir, "icon.svg"),
					contentType: "image/svg+xml",
				},
			];

			const urls = assets.map((asset) => registry.register(asset));

			strictEqual(registry.size, 3);
			ok(urls[0].endsWith(".png"));
			ok(urls[1].endsWith(".jpg"));
			ok(urls[2].endsWith(".svg"));

			// All URLs should be different
			const uniqueUrls = new Set(urls);
			strictEqual(uniqueUrls.size, 3);

			cleanupTestDir();
		});

		test("should reuse URL for same original path", () => {
			setupTestDir();
			const registry = new AssetRegistry();

			const asset = {
				originalPath: "./images/logo.png",
				resolvedPath: join(testDir, "images", "logo.png"),
				contentType: "image/png",
			};

			const url1 = registry.register(asset);
			const url2 = registry.register(asset);

			strictEqual(url1, url2);
			strictEqual(registry.size, 1);

			cleanupTestDir();
		});
	});

	describe("getAsset", () => {
		test("should retrieve asset by URL", () => {
			setupTestDir();
			const registry = new AssetRegistry();

			const asset = {
				originalPath: "./images/logo.png",
				resolvedPath: join(testDir, "images", "logo.png"),
				contentType: "image/png",
			};

			const assetUrl = registry.register(asset);
			const retrieved = registry.getAsset(assetUrl);

			ok(retrieved);
			strictEqual(retrieved.originalPath, "./images/logo.png");
			strictEqual(retrieved.assetUrl, assetUrl);
			strictEqual(retrieved.contentType, "image/png");

			cleanupTestDir();
		});

		test("should return undefined for unknown URL", () => {
			const registry = new AssetRegistry();
			const result = registry.getAsset("/assets/unknown.png");

			strictEqual(result, undefined);
		});
	});

	describe("rewriteImagePaths", () => {
		test("should rewrite registered image paths", () => {
			setupTestDir();
			const registry = new AssetRegistry();

			const asset = {
				originalPath: "./images/logo.png",
				resolvedPath: join(testDir, "images", "logo.png"),
				contentType: "image/png",
			};

			const assetUrl = registry.register(asset);

			const html = '<img src="./images/logo.png" alt="Logo">';
			const rewritten = registry.rewriteImagePaths(html);

			strictEqual(rewritten, `<img src="${assetUrl}" alt="Logo">`);

			cleanupTestDir();
		});

		test("should preserve unregistered paths", () => {
			const registry = new AssetRegistry();

			const html = '<img src="./unregistered.png" alt="Unknown">';
			const rewritten = registry.rewriteImagePaths(html);

			strictEqual(rewritten, html);
		});

		test("should handle multiple images in HTML", () => {
			setupTestDir();
			const registry = new AssetRegistry();

			const asset1 = {
				originalPath: "./images/logo.png",
				resolvedPath: join(testDir, "images", "logo.png"),
				contentType: "image/png",
			};

			const asset2 = {
				originalPath: "./images/banner.jpg",
				resolvedPath: join(testDir, "images", "banner.jpg"),
				contentType: "image/jpeg",
			};

			const url1 = registry.register(asset1);
			const url2 = registry.register(asset2);

			const html = `
				<img src="./images/logo.png" alt="Logo">
				<p>Some text</p>
				<img src="./images/banner.jpg" alt="Banner" class="responsive">
				<img src="./unregistered.png" alt="Unknown">
			`;

			const rewritten = registry.rewriteImagePaths(html);

			ok(rewritten.includes(`src="${url1}"`));
			ok(rewritten.includes(`src="${url2}"`));
			ok(rewritten.includes('src="./unregistered.png"')); // Should be unchanged

			cleanupTestDir();
		});

		test("should handle complex HTML attributes", () => {
			setupTestDir();
			const registry = new AssetRegistry();

			const asset = {
				originalPath: "./images/logo.png",
				resolvedPath: join(testDir, "images", "logo.png"),
				contentType: "image/png",
			};

			const assetUrl = registry.register(asset);

			const html =
				'<img class="responsive" src="./images/logo.png" alt="Logo" data-test="value">';
			const rewritten = registry.rewriteImagePaths(html);

			ok(rewritten.includes(`src="${assetUrl}"`));
			ok(rewritten.includes('class="responsive"'));
			ok(rewritten.includes('alt="Logo"'));
			ok(rewritten.includes('data-test="value"'));

			cleanupTestDir();
		});

		test("should handle quotes in src attributes", () => {
			setupTestDir();
			const registry = new AssetRegistry();

			const asset = {
				originalPath: "./images/logo.png",
				resolvedPath: join(testDir, "images", "logo.png"),
				contentType: "image/png",
			};

			const assetUrl = registry.register(asset);

			// Test both single and double quotes
			const html1 = `<img src="./images/logo.png" alt="Logo">`;
			const html2 = `<img src='./images/logo.png' alt='Logo'>`;

			const rewritten1 = registry.rewriteImagePaths(html1);
			const rewritten2 = registry.rewriteImagePaths(html2);

			ok(rewritten1.includes(`src="${assetUrl}"`));
			ok(rewritten2.includes(`src="${assetUrl}"`));

			cleanupTestDir();
		});

		test("should handle empty or invalid HTML", () => {
			const registry = new AssetRegistry();

			strictEqual(registry.rewriteImagePaths(""), "");
			strictEqual(registry.rewriteImagePaths(null), null);
			strictEqual(registry.rewriteImagePaths(undefined), undefined);
			strictEqual(
				registry.rewriteImagePaths("No images here"),
				"No images here",
			);
		});

		test("should handle malformed HTML gracefully", () => {
			setupTestDir();
			const registry = new AssetRegistry();

			const asset = {
				originalPath: "./logo.png",
				resolvedPath: join(testDir, "images", "logo.png"),
				contentType: "image/png",
			};

			registry.register(asset);

			const malformedHtml = '<img src="./logo.png" alt="Logo"'; // Missing closing >
			const result = registry.rewriteImagePaths(malformedHtml);

			// Should not throw and should return something reasonable
			strictEqual(typeof result, "string");

			cleanupTestDir();
		});
	});

	describe("utility methods", () => {
		test("should check path registration", () => {
			setupTestDir();
			const registry = new AssetRegistry();

			const asset = {
				originalPath: "./images/logo.png",
				resolvedPath: join(testDir, "images", "logo.png"),
				contentType: "image/png",
			};

			strictEqual(registry.hasPath("./images/logo.png"), false);

			registry.register(asset);

			strictEqual(registry.hasPath("./images/logo.png"), true);
			strictEqual(registry.hasPath("./unregistered.png"), false);

			cleanupTestDir();
		});

		test("should get URL for path", () => {
			setupTestDir();
			const registry = new AssetRegistry();

			const asset = {
				originalPath: "./images/logo.png",
				resolvedPath: join(testDir, "images", "logo.png"),
				contentType: "image/png",
			};

			const assetUrl = registry.register(asset);

			strictEqual(registry.getUrlForPath("./images/logo.png"), assetUrl);
			strictEqual(registry.getUrlForPath("./unregistered.png"), undefined);

			cleanupTestDir();
		});

		test("should clear registry", () => {
			setupTestDir();
			const registry = new AssetRegistry();

			const asset = {
				originalPath: "./images/logo.png",
				resolvedPath: join(testDir, "images", "logo.png"),
				contentType: "image/png",
			};

			registry.register(asset);
			strictEqual(registry.size, 1);

			registry.clear();
			strictEqual(registry.size, 0);
			strictEqual(registry.getAllAssets().length, 0);

			cleanupTestDir();
		});

		test("should generate statistics", () => {
			setupTestDir();
			const registry = new AssetRegistry();

			const assets = [
				{
					originalPath: "./images/logo.png",
					resolvedPath: join(testDir, "images", "logo.png"),
					contentType: "image/png",
				},
				{
					originalPath: "./images/banner.jpg",
					resolvedPath: join(testDir, "images", "banner.jpg"),
					contentType: "image/jpeg",
				},
				{
					originalPath: "./icon.svg",
					resolvedPath: join(testDir, "icon.svg"),
					contentType: "image/svg+xml",
				},
			];

			assets.forEach((asset) => {
				registry.register(asset);
			});

			const stats = registry.getStats();

			strictEqual(stats.totalAssets, 3);
			ok(stats.totalSize > 0);
			ok(stats.averageSize > 0);

			// Check content type counts
			strictEqual(stats.contentTypes["image/png"], 1);
			strictEqual(stats.contentTypes["image/jpeg"], 1);
			strictEqual(stats.contentTypes["image/svg+xml"], 1);

			cleanupTestDir();
		});
	});
});
