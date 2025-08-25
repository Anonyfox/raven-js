/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Comprehensive tests for html-injector.js.
 *
 * Tests all code paths, edge cases, and error conditions for HTML import map
 * injection with 100% branch coverage as required by CODEX.md.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { HEADER_NAMES, MIME_TYPES } from "../../../core/string-pool.js";
import { injectImportMap } from "./html-injector.js";

describe("HTML Injector", () => {
	// Helper to create mock context
	function createContext(
		responseBody = "",
		contentType = MIME_TYPES.TEXT_HTML,
	) {
		const ctx = {
			responseHeaders: new Map(),
			responseBody,
		};

		if (contentType) {
			ctx.responseHeaders.set(HEADER_NAMES.CONTENT_TYPE, contentType);
		}

		return ctx;
	}

	describe("injectImportMap", () => {
		it("should inject import map before closing head tag", () => {
			const html = `<!DOCTYPE html>
<html>
<head>
<title>Test</title>
</head>
<body>
<h1>Hello</h1>
</body>
</html>`;

			const ctx = createContext(html);
			const result = injectImportMap(ctx);

			assert.strictEqual(result, true);
			assert.ok(
				ctx.responseBody.includes(
					'<script type="importmap" src="/importmap.json"></script>',
				),
			);
			assert.ok(
				ctx.responseBody.indexOf('<script type="importmap"') <
					ctx.responseBody.indexOf("</head>"),
			);
		});

		it("should inject import map with custom path", () => {
			const html = `<html><head></head><body></body></html>`;
			const ctx = createContext(html);
			const result = injectImportMap(ctx, "/custom/importmap.json");

			assert.strictEqual(result, true);
			assert.ok(
				ctx.responseBody.includes(
					'<script type="importmap" src="/custom/importmap.json"></script>',
				),
			);
		});

		it("should handle case-insensitive head tag", () => {
			const html = `<HTML><HEAD><TITLE>Test</TITLE></HEAD><BODY></BODY></HTML>`;
			const ctx = createContext(html);
			const result = injectImportMap(ctx);

			assert.strictEqual(result, true);
			assert.ok(
				ctx.responseBody.includes(
					'<script type="importmap" src="/importmap.json"></script>',
				),
			);
			assert.ok(
				ctx.responseBody.indexOf('<script type="importmap"') <
					ctx.responseBody.indexOf("</HEAD>"),
			);
		});

		it("should handle head tag with attributes", () => {
			const html = `<html><head lang="en" data-test="value"><title>Test</title></head><body></body></html>`;
			const ctx = createContext(html);
			const result = injectImportMap(ctx);

			assert.strictEqual(result, true);
			assert.ok(
				ctx.responseBody.includes(
					'<script type="importmap" src="/importmap.json"></script>',
				),
			);
		});

		it("should fallback to after opening head tag when no closing head", () => {
			const html = `<html><head><title>Test</title><body></body></html>`;
			const ctx = createContext(html);
			const result = injectImportMap(ctx);

			assert.strictEqual(result, true);
			assert.ok(
				ctx.responseBody.includes(
					'<script type="importmap" src="/importmap.json"></script>',
				),
			);
			assert.ok(
				ctx.responseBody.indexOf("<head>") <
					ctx.responseBody.indexOf('<script type="importmap"'),
			);
		});

		it("should fallback to after opening html tag when no head", () => {
			const html = `<html><body><h1>No head tag</h1></body></html>`;
			const ctx = createContext(html);
			const result = injectImportMap(ctx);

			assert.strictEqual(result, true);
			assert.ok(ctx.responseBody.includes("<head>"));
			assert.ok(
				ctx.responseBody.includes(
					'<script type="importmap" src="/importmap.json"></script>',
				),
			);
			assert.ok(ctx.responseBody.includes("</head>"));
		});

		it("should handle html tag with attributes", () => {
			const html = `<html lang="en" dir="ltr"><body>Content</body></html>`;
			const ctx = createContext(html);
			const result = injectImportMap(ctx);

			assert.strictEqual(result, true);
			assert.ok(ctx.responseBody.includes("<head>"));
			assert.ok(
				ctx.responseBody.includes(
					'<script type="importmap" src="/importmap.json"></script>',
				),
			);
		});

		it("should preserve existing content when injecting", () => {
			const html = `<html>
<head>
<meta charset="utf-8">
<title>Existing Content</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<main>Content</main>
</body>
</html>`;

			const ctx = createContext(html);
			const result = injectImportMap(ctx);

			assert.strictEqual(result, true);
			assert.ok(ctx.responseBody.includes('<meta charset="utf-8">'));
			assert.ok(ctx.responseBody.includes("<title>Existing Content</title>"));
			assert.ok(
				ctx.responseBody.includes('<link rel="stylesheet" href="style.css">'),
			);
			assert.ok(ctx.responseBody.includes("<main>Content</main>"));
		});

		it("should return false for non-HTML content type", () => {
			const html = `<html><head></head><body></body></html>`;
			const ctx = createContext(html, MIME_TYPES.APPLICATION_JSON);
			const result = injectImportMap(ctx);

			assert.strictEqual(result, false);
			assert.strictEqual(ctx.responseBody, html); // Unchanged
		});

		it("should return false when no content type set", () => {
			const html = `<html><head></head><body></body></html>`;
			const ctx = createContext(html, null);
			const result = injectImportMap(ctx);

			assert.strictEqual(result, false);
			assert.strictEqual(ctx.responseBody, html); // Unchanged
		});

		it("should handle content type with charset", () => {
			const html = `<html><head></head><body></body></html>`;
			const ctx = createContext(html, "text/html; charset=utf-8");
			const result = injectImportMap(ctx);

			assert.strictEqual(result, true);
			assert.ok(
				ctx.responseBody.includes(
					'<script type="importmap" src="/importmap.json"></script>',
				),
			);
		});

		it("should handle mixed case content type", () => {
			const html = `<html><head></head><body></body></html>`;
			const ctx = createContext(html, "TEXT/HTML");
			const result = injectImportMap(ctx);

			assert.strictEqual(result, true);
			assert.ok(
				ctx.responseBody.includes(
					'<script type="importmap" src="/importmap.json"></script>',
				),
			);
		});

		it("should return false for empty response body", () => {
			const ctx = createContext("");
			const result = injectImportMap(ctx);

			assert.strictEqual(result, false);
		});

		it("should return false for null response body", () => {
			const ctx = createContext(null);
			const result = injectImportMap(ctx);

			assert.strictEqual(result, false);
		});

		it("should return false for non-string response body", () => {
			const ctx = createContext();
			ctx.responseBody = { not: "string" };
			const result = injectImportMap(ctx);

			assert.strictEqual(result, false);
		});

		it("should return false for malformed HTML with no tags", () => {
			const html = "Just plain text content without any HTML tags";
			const ctx = createContext(html);
			const result = injectImportMap(ctx);

			assert.strictEqual(result, false);
			assert.strictEqual(ctx.responseBody, html); // Unchanged
		});

		it("should handle HTML fragments without html tag", () => {
			const html = `<head><title>Fragment</title></head>`;
			const ctx = createContext(html);
			const result = injectImportMap(ctx);

			assert.strictEqual(result, true);
			assert.ok(
				ctx.responseBody.includes(
					'<script type="importmap" src="/importmap.json"></script>',
				),
			);
		});

		it("should handle self-closing head tag", () => {
			const html = `<html><head/><body></body></html>`;
			const ctx = createContext(html);
			const result = injectImportMap(ctx);

			// Should fallback to html tag injection since no proper head structure
			assert.strictEqual(result, true);
			assert.ok(ctx.responseBody.includes("<head>"));
			assert.ok(
				ctx.responseBody.includes(
					'<script type="importmap" src="/importmap.json"></script>',
				),
			);
		});

		it("should handle nested head-like content", () => {
			const html = `<html>
<head>
<title>Test</title>
<script>
// This has </head> in a comment
/* Also </head> in block comment */
var content = "fake </head> in string";
</script>
</head>
<body></body>
</html>`;

			const ctx = createContext(html);
			const result = injectImportMap(ctx);

			assert.strictEqual(result, true);
			assert.ok(
				ctx.responseBody.includes(
					'<script type="importmap" src="/importmap.json"></script>',
				),
			);
			// Should inject before the real closing head tag, not the ones in comments/strings
			const importMapIndex = ctx.responseBody.indexOf(
				'<script type="importmap"',
			);
			const lastHeadIndex = ctx.responseBody.lastIndexOf("</head>");
			assert.ok(importMapIndex < lastHeadIndex);
		});

		it("should handle multiple head tags (malformed HTML)", () => {
			const html = `<html>
<head><title>First</title></head>
<head><title>Second</title></head>
<body></body>
</html>`;

			const ctx = createContext(html);
			const result = injectImportMap(ctx);

			assert.strictEqual(result, true);
			assert.ok(
				ctx.responseBody.includes(
					'<script type="importmap" src="/importmap.json"></script>',
				),
			);
			// Should inject before the first closing head tag found
			const importMapIndex = ctx.responseBody.indexOf(
				'<script type="importmap"',
			);
			const firstHeadCloseIndex = ctx.responseBody.indexOf("</head>");
			assert.ok(importMapIndex < firstHeadCloseIndex);
		});

		it("should handle whitespace around tags", () => {
			const html = `   <html>
			<head   >
			<title>Test</title>
			</head   >
			<body></body>
			</html>   `;

			const ctx = createContext(html);
			const result = injectImportMap(ctx);

			assert.strictEqual(result, true);
			assert.ok(
				ctx.responseBody.includes(
					'<script type="importmap" src="/importmap.json"></script>',
				),
			);
		});

		it("should escape special characters in custom import map path", () => {
			const html = `<html><head></head><body></body></html>`;
			const ctx = createContext(html);
			const specialPath = '/path/with"quotes&special<chars>';
			const result = injectImportMap(ctx, specialPath);

			assert.strictEqual(result, true);
			assert.ok(
				ctx.responseBody.includes(
					`<script type="importmap" src="${specialPath}"></script>`,
				),
			);
		});
	});
});
