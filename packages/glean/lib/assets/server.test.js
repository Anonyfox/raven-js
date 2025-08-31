/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for asset serving functionality
 */

import { ok, strictEqual } from "node:assert";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { describe, test } from "node:test";
import { AssetRegistry } from "./registry.js";
import { createAssetMiddleware, serveAsset } from "./server.js";

// Test data setup
const testDir = "/tmp/glean-asset-server-test";

/**
 * Mock Wings Context for testing
 */
class MockContext {
	constructor(pathname = "/assets/test.png", headers = {}) {
		this.url = new URL(`http://localhost${pathname}`);
		this.headers = new Map(Object.entries(headers));
		this.responseHeaders = new Map();
		this.responseStatusCode = 200;
		this.responseBody = null;
	}

	status(code) {
		this.responseStatusCode = code;
	}

	header(name, value) {
		this.responseHeaders.set(name, value);
	}

	text(content) {
		this.responseBody = content;
	}

	body(stream) {
		this.responseBody = stream;
	}
}

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

	writeFileSync(join(testDir, "test.png"), "PNG-CONTENT");
	writeFileSync(join(testDir, "image.jpg"), "JPG-CONTENT");
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

describe("serveAsset", () => {
	test("should serve registered asset successfully", async () => {
		setupTestDir();

		const registry = new AssetRegistry();
		const asset = {
			originalPath: "./test.png",
			resolvedPath: join(testDir, "test.png"),
			contentType: "image/png",
		};

		const assetUrl = registry.register(asset);
		const context = new MockContext(assetUrl);

		await serveAsset(context, registry);

		strictEqual(context.responseStatusCode, 200);
		strictEqual(context.responseHeaders.get("Content-Type"), "image/png");
		strictEqual(context.responseHeaders.get("Content-Length"), "11"); // "PNG-CONTENT".length
		strictEqual(
			context.responseHeaders.get("Cache-Control"),
			"public, max-age=31536000, immutable",
		);

		// Should have ETag header
		ok(context.responseHeaders.get("ETag"));

		// Should have stream body
		ok(context.responseBody instanceof Readable);

		// Close stream before cleanup to prevent async file access
		if (
			context.responseBody &&
			typeof context.responseBody.destroy === "function"
		) {
			context.responseBody.destroy();
		}

		// Small delay to allow async operations to complete
		await new Promise((resolve) => setTimeout(resolve, 10));

		cleanupTestDir();
	});

	test("should return 404 for non-assets path", async () => {
		const registry = new AssetRegistry();
		const context = new MockContext("/not-assets/test.png");

		await serveAsset(context, registry);

		strictEqual(context.responseStatusCode, 404);
		strictEqual(context.responseBody, "Asset not found");
	});

	test("should return 404 for unregistered asset", async () => {
		const registry = new AssetRegistry();
		const context = new MockContext("/assets/unknown.png");

		await serveAsset(context, registry);

		strictEqual(context.responseStatusCode, 404);
		strictEqual(context.responseBody, "Asset not found");
	});

	test("should return 404 for missing file", async () => {
		setupTestDir();

		const registry = new AssetRegistry();

		// Register a valid asset first
		const asset = {
			originalPath: "./test.png",
			resolvedPath: join(testDir, "test.png"),
			contentType: "image/png",
		};

		const assetUrl = registry.register(asset);

		// Now delete the file to simulate missing file
		rmSync(join(testDir, "test.png"), { force: true });

		const context = new MockContext(assetUrl);

		await serveAsset(context, registry);

		strictEqual(context.responseStatusCode, 404);
		strictEqual(context.responseBody, "Asset not found");

		cleanupTestDir();
	});

	test("should handle conditional requests with ETag", async () => {
		setupTestDir();

		const registry = new AssetRegistry();
		const asset = {
			originalPath: "./test.png",
			resolvedPath: join(testDir, "test.png"),
			contentType: "image/png",
		};

		const assetUrl = registry.register(asset);

		// First request to get ETag
		const context1 = new MockContext(assetUrl);
		await serveAsset(context1, registry);

		const etag = context1.responseHeaders.get("ETag");
		ok(etag);

		// Close first stream before second request
		if (
			context1.responseBody &&
			typeof context1.responseBody.destroy === "function"
		) {
			context1.responseBody.destroy();
		}

		// Second request with If-None-Match header
		const context2 = new MockContext(assetUrl, { "if-none-match": etag });
		await serveAsset(context2, registry);

		strictEqual(context2.responseStatusCode, 304);
		strictEqual(context2.responseBody, null);

		// Small delay to allow async operations to complete
		await new Promise((resolve) => setTimeout(resolve, 10));

		cleanupTestDir();
	});

	test("should serve different content types correctly", async () => {
		setupTestDir();

		const registry = new AssetRegistry();

		const assets = [
			{
				originalPath: "./test.png",
				resolvedPath: join(testDir, "test.png"),
				contentType: "image/png",
			},
			{
				originalPath: "./image.jpg",
				resolvedPath: join(testDir, "image.jpg"),
				contentType: "image/jpeg",
			},
			{
				originalPath: "./icon.svg",
				resolvedPath: join(testDir, "icon.svg"),
				contentType: "image/svg+xml",
			},
		];

		for (const asset of assets) {
			const assetUrl = registry.register(asset);
			const context = new MockContext(assetUrl);

			await serveAsset(context, registry);

			strictEqual(context.responseStatusCode, 200);
			strictEqual(
				context.responseHeaders.get("Content-Type"),
				asset.contentType,
			);
			ok(context.responseBody instanceof Readable);

			// Close stream before next iteration
			if (
				context.responseBody &&
				typeof context.responseBody.destroy === "function"
			) {
				context.responseBody.destroy();
			}
		}

		// Small delay to allow async operations to complete
		await new Promise((resolve) => setTimeout(resolve, 10));

		cleanupTestDir();
	});

	test("should handle empty registry gracefully", async () => {
		const registry = new AssetRegistry();
		const context = new MockContext("/assets/test.png");

		await serveAsset(context, registry);

		strictEqual(context.responseStatusCode, 404);
		strictEqual(context.responseBody, "Asset not found");
	});
});

describe("createAssetMiddleware", () => {
	test("should create middleware function", () => {
		const registry = new AssetRegistry();
		const middleware = createAssetMiddleware(registry);

		strictEqual(typeof middleware, "function");
	});

	test("should call serveAsset when invoked", async () => {
		setupTestDir();

		const registry = new AssetRegistry();
		const asset = {
			originalPath: "./test.png",
			resolvedPath: join(testDir, "test.png"),
			contentType: "image/png",
		};

		const assetUrl = registry.register(asset);
		const middleware = createAssetMiddleware(registry);
		const context = new MockContext(assetUrl);

		await middleware(context);

		strictEqual(context.responseStatusCode, 200);
		strictEqual(context.responseHeaders.get("Content-Type"), "image/png");

		// Close stream before cleanup
		if (
			context.responseBody &&
			typeof context.responseBody.destroy === "function"
		) {
			context.responseBody.destroy();
		}

		// Small delay to allow async operations to complete
		await new Promise((resolve) => setTimeout(resolve, 10));

		cleanupTestDir();
	});

	test("should handle errors gracefully in middleware", async () => {
		const registry = new AssetRegistry();
		const middleware = createAssetMiddleware(registry);
		const context = new MockContext("/assets/nonexistent.png");

		await middleware(context);

		strictEqual(context.responseStatusCode, 404);
		strictEqual(context.responseBody, "Asset not found");
	});

	test("should work with null/undefined registry", async () => {
		const middleware1 = createAssetMiddleware(null);
		const middleware2 = createAssetMiddleware(undefined);
		const context = new MockContext("/assets/test.png");

		await middleware1(context);
		strictEqual(context.responseStatusCode, 404);

		// Reset context
		context.responseStatusCode = 200;
		context.responseBody = null;

		await middleware2(context);
		strictEqual(context.responseStatusCode, 404);
	});
});
