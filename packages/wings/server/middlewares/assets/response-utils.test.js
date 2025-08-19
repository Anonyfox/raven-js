/**
 * @file Response Utils Tests - Comprehensive test suite for response utilities
 *
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";
import { setAssetResponse } from "./response-utils.js";

// Mock context for testing
function createMockContext() {
	return {
		responseHeaders: new Map(),
		responseStatusCode: 0,
		responseBody: null,
		responseEnded: false,
	};
}

test("setAssetResponse", async (t) => {
	await t.test("sets correct headers and response for CSS file", () => {
		const ctx = createMockContext();
		const buffer = Buffer.from("body { color: red; }");
		const assetPath = "/css/style.css";

		setAssetResponse(ctx, buffer, assetPath);

		assert.strictEqual(ctx.responseHeaders.get("content-type"), "text/css");
		assert.strictEqual(
			ctx.responseHeaders.get("content-length"),
			buffer.length.toString(),
		);
		assert.strictEqual(
			ctx.responseHeaders.get("cache-control"),
			"public, max-age=3600",
		);
		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseBody, buffer);
		assert.strictEqual(ctx.responseEnded, true);
	});

	await t.test("sets correct headers and response for JavaScript file", () => {
		const ctx = createMockContext();
		const buffer = Buffer.from("console.log('hello');");
		const assetPath = "/js/app.js";

		setAssetResponse(ctx, buffer, assetPath);

		assert.strictEqual(
			ctx.responseHeaders.get("content-type"),
			"text/javascript",
		);
		assert.strictEqual(
			ctx.responseHeaders.get("content-length"),
			buffer.length.toString(),
		);
		assert.strictEqual(
			ctx.responseHeaders.get("cache-control"),
			"public, max-age=3600",
		);
		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseBody, buffer);
		assert.strictEqual(ctx.responseEnded, true);
	});

	await t.test("sets correct headers and response for HTML file", () => {
		const ctx = createMockContext();
		const buffer = Buffer.from("<!DOCTYPE html><html></html>");
		const assetPath = "/index.html";

		setAssetResponse(ctx, buffer, assetPath);

		assert.strictEqual(ctx.responseHeaders.get("content-type"), "text/html");
		assert.strictEqual(
			ctx.responseHeaders.get("content-length"),
			buffer.length.toString(),
		);
		assert.strictEqual(
			ctx.responseHeaders.get("cache-control"),
			"public, max-age=3600",
		);
		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseBody, buffer);
		assert.strictEqual(ctx.responseEnded, true);
	});

	await t.test("sets correct headers and response for PNG image", () => {
		const ctx = createMockContext();
		const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG signature
		const assetPath = "/images/logo.png";

		setAssetResponse(ctx, buffer, assetPath);

		assert.strictEqual(ctx.responseHeaders.get("content-type"), "image/png");
		assert.strictEqual(
			ctx.responseHeaders.get("content-length"),
			buffer.length.toString(),
		);
		assert.strictEqual(
			ctx.responseHeaders.get("cache-control"),
			"public, max-age=3600",
		);
		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseBody, buffer);
		assert.strictEqual(ctx.responseEnded, true);
	});

	await t.test("sets correct headers and response for JSON file", () => {
		const ctx = createMockContext();
		const buffer = Buffer.from('{"key": "value"}');
		const assetPath = "/api/data.json";

		setAssetResponse(ctx, buffer, assetPath);

		assert.strictEqual(
			ctx.responseHeaders.get("content-type"),
			"application/json",
		);
		assert.strictEqual(
			ctx.responseHeaders.get("content-length"),
			buffer.length.toString(),
		);
		assert.strictEqual(
			ctx.responseHeaders.get("cache-control"),
			"public, max-age=3600",
		);
		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseBody, buffer);
		assert.strictEqual(ctx.responseEnded, true);
	});

	await t.test("handles empty buffer correctly", () => {
		const ctx = createMockContext();
		const buffer = Buffer.alloc(0);
		const assetPath = "/empty.txt";

		setAssetResponse(ctx, buffer, assetPath);

		assert.strictEqual(ctx.responseHeaders.get("content-type"), "text/plain");
		assert.strictEqual(ctx.responseHeaders.get("content-length"), "0");
		assert.strictEqual(
			ctx.responseHeaders.get("cache-control"),
			"public, max-age=3600",
		);
		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseBody, buffer);
		assert.strictEqual(ctx.responseEnded, true);
	});

	await t.test("handles large buffer correctly", () => {
		const ctx = createMockContext();
		const buffer = Buffer.alloc(1024 * 1024, "a"); // 1MB buffer
		const assetPath = "/large.txt";

		setAssetResponse(ctx, buffer, assetPath);

		assert.strictEqual(ctx.responseHeaders.get("content-type"), "text/plain");
		assert.strictEqual(
			ctx.responseHeaders.get("content-length"),
			(1024 * 1024).toString(),
		);
		assert.strictEqual(
			ctx.responseHeaders.get("cache-control"),
			"public, max-age=3600",
		);
		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseBody, buffer);
		assert.strictEqual(ctx.responseEnded, true);
	});

	await t.test("sets octet-stream for unknown file extension", () => {
		const ctx = createMockContext();
		const buffer = Buffer.from("binary data");
		const assetPath = "/file.unknown";

		setAssetResponse(ctx, buffer, assetPath);

		assert.strictEqual(
			ctx.responseHeaders.get("content-type"),
			"application/octet-stream",
		);
		assert.strictEqual(
			ctx.responseHeaders.get("content-length"),
			buffer.length.toString(),
		);
		assert.strictEqual(
			ctx.responseHeaders.get("cache-control"),
			"public, max-age=3600",
		);
		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseBody, buffer);
		assert.strictEqual(ctx.responseEnded, true);
	});

	await t.test("handles various file extensions correctly", () => {
		const testCases = [
			{ path: "/style.css", expectedMime: "text/css" },
			{ path: "/app.js", expectedMime: "text/javascript" },
			{ path: "/page.html", expectedMime: "text/html" },
			{ path: "/data.json", expectedMime: "application/json" },
			{ path: "/logo.svg", expectedMime: "image/svg+xml" },
			{ path: "/font.woff", expectedMime: "application/font-woff" },
			{ path: "/document.pdf", expectedMime: "application/pdf" },
			{ path: "/archive.zip", expectedMime: "application/zip" },
		];

		for (const testCase of testCases) {
			const ctx = createMockContext();
			const buffer = Buffer.from("test content");

			setAssetResponse(ctx, buffer, testCase.path);

			assert.strictEqual(
				ctx.responseHeaders.get("content-type"),
				testCase.expectedMime,
				`Wrong MIME type for ${testCase.path}`,
			);
		}
	});

	await t.test("handles nested paths correctly", () => {
		const ctx = createMockContext();
		const buffer = Buffer.from("nested content");
		const assetPath = "/deep/nested/folder/file.css";

		setAssetResponse(ctx, buffer, assetPath);

		assert.strictEqual(ctx.responseHeaders.get("content-type"), "text/css");
		assert.strictEqual(
			ctx.responseHeaders.get("content-length"),
			buffer.length.toString(),
		);
		assert.strictEqual(
			ctx.responseHeaders.get("cache-control"),
			"public, max-age=3600",
		);
		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseBody, buffer);
		assert.strictEqual(ctx.responseEnded, true);
	});

	await t.test("overwrites existing headers", () => {
		const ctx = createMockContext();

		// Pre-set some headers
		ctx.responseHeaders.set("content-type", "application/json");
		ctx.responseHeaders.set("content-length", "999");
		ctx.responseHeaders.set("cache-control", "no-cache");

		const buffer = Buffer.from("body { color: blue; }");
		const assetPath = "/css/theme.css";

		setAssetResponse(ctx, buffer, assetPath);

		// Should overwrite all headers with correct values
		assert.strictEqual(ctx.responseHeaders.get("content-type"), "text/css");
		assert.strictEqual(
			ctx.responseHeaders.get("content-length"),
			buffer.length.toString(),
		);
		assert.strictEqual(
			ctx.responseHeaders.get("cache-control"),
			"public, max-age=3600",
		);
		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseBody, buffer);
		assert.strictEqual(ctx.responseEnded, true);
	});

	await t.test("preserves other existing headers", () => {
		const ctx = createMockContext();

		// Set some custom headers that should be preserved
		ctx.responseHeaders.set("x-custom-header", "custom-value");
		ctx.responseHeaders.set("server", "custom-server");

		const buffer = Buffer.from("test content");
		const assetPath = "/test.txt";

		setAssetResponse(ctx, buffer, assetPath);

		// Should preserve custom headers
		assert.strictEqual(
			ctx.responseHeaders.get("x-custom-header"),
			"custom-value",
		);
		assert.strictEqual(ctx.responseHeaders.get("server"), "custom-server");

		// Should set asset-specific headers
		assert.strictEqual(ctx.responseHeaders.get("content-type"), "text/plain");
		assert.strictEqual(
			ctx.responseHeaders.get("content-length"),
			buffer.length.toString(),
		);
		assert.strictEqual(
			ctx.responseHeaders.get("cache-control"),
			"public, max-age=3600",
		);
		assert.strictEqual(ctx.responseStatusCode, 200);
		assert.strictEqual(ctx.responseBody, buffer);
		assert.strictEqual(ctx.responseEnded, true);
	});
});
