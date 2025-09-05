/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { Attempt } from "./attempt.js";
import { Resource } from "./resource.js";

describe("Resource", () => {
	// Mock fetch globally for tests
	const originalFetch = globalThis.fetch;

	describe("fromResolver", () => {
		test("creates resource from resolver function", async () => {
			const resolver = async (_path) => {
				return new Response("<html><body>Test content</body></html>", {
					status: 200,
					headers: { "content-type": "text/html" },
				});
			};

			const resource = await Resource.fromResolver(
				"/test",
				"http://localhost:3000",
				resolver,
			);

			assert(resource instanceof Resource);
			assert.strictEqual(resource.getUrl().pathname, "/test");
			assert.strictEqual(resource.isHtml(), true);
			assert.strictEqual(
				resource.getContent().toString(),
				"<html><body>Test content</body></html>",
			);
		});

		test("handles resolver that returns JSON", async () => {
			const resolver = async (path) => {
				const data = { path, message: "Hello from resolver" };
				return new Response(JSON.stringify(data), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			};

			const resource = await Resource.fromResolver(
				"/api/test",
				"http://localhost:3000",
				resolver,
			);

			assert.strictEqual(resource.getUrl().pathname, "/api/test");
			assert.strictEqual(resource.getContentType(), "application/json");
			assert.strictEqual(resource.isAsset(), true); // JSON is not HTML, so it's an asset
			const content = JSON.parse(Buffer.from(resource.getBuffer()).toString());
			assert.strictEqual(content.path, "/api/test");
			assert.strictEqual(content.message, "Hello from resolver");
		});

		test("throws error when resolver fails", async () => {
			const resolver = async (_path) => {
				throw new Error("Resolver error");
			};

			await assert.rejects(
				async () =>
					await Resource.fromResolver(
						"/error",
						"http://localhost:3000",
						resolver,
					),
				/Resolver failed for \/error: Resolver error/,
			);
		});

		test("resolves relative paths correctly", async () => {
			const resolver = async (path) => {
				return new Response(`Path: ${path}`, {
					status: 200,
					headers: { "content-type": "text/plain" },
				});
			};

			const resource = await Resource.fromResolver(
				"relative/path",
				"http://example.com/base/",
				resolver,
			);

			assert.strictEqual(resource.getUrl().pathname, "/base/relative/path");
			assert.strictEqual(resource.getContentType(), "text/plain");
			assert.strictEqual(resource.isAsset(), true); // text/plain is not HTML
			const content = Buffer.from(resource.getBuffer()).toString();
			assert.strictEqual(content, "Path: /base/relative/path");
		});
	});

	function mockFetch(url, _options) {
		// Simple mock that returns based on URL
		const urlStr = url.toString();

		if (urlStr.includes("timeout")) {
			return new Promise((_, reject) => {
				setTimeout(() => {
					const error = new Error("timeout");
					error.name = "AbortError";
					reject(error);
				}, 20);
			});
		}

		if (urlStr.includes("redirect")) {
			// Add small delay to simulate network timing
			return new Promise((resolve) =>
				setTimeout(
					() =>
						resolve({
							ok: false,
							status: 301,
							statusText: "Moved Permanently",
							headers: new Map([
								["Location", "https://example.com/final"],
								["Content-Type", "text/html"],
							]),
							arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
						}),
					1,
				),
			);
		}

		if (urlStr.includes("final")) {
			const htmlContent = `
				<html>
					<body>
						<a href="/page1">Internal Link</a>
						<a href="https://external.com/page">External Link</a>
						<img src="/image.jpg">
					</body>
				</html>
			`;
			const buffer = new TextEncoder().encode(htmlContent);

			// Add small delay to simulate network timing
			return new Promise((resolve) =>
				setTimeout(
					() =>
						resolve({
							ok: true,
							status: 200,
							statusText: "OK",
							headers: new Map([["Content-Type", "text/html; charset=utf-8"]]),
							arrayBuffer: () => Promise.resolve(buffer.buffer),
						}),
					1,
				),
			);
		}

		if (
			urlStr.includes("asset") ||
			/\.(png|jpg|jpeg|gif|svg|ico|webp)$/i.test(urlStr)
		) {
			const buffer = new ArrayBuffer(1024);
			return Promise.resolve({
				ok: true,
				status: 200,
				statusText: "OK",
				headers: new Map([["Content-Type", "image/jpeg"]]),
				arrayBuffer: () => Promise.resolve(buffer),
			});
		}

		// Default HTML response
		const htmlContent = "<html><body><h1>Test Page</h1></body></html>";
		const buffer = new TextEncoder().encode(htmlContent);

		// Add small delay to simulate network timing
		return new Promise((resolve) =>
			setTimeout(
				() =>
					resolve({
						ok: true,
						status: 200,
						statusText: "OK",
						headers: new Map([["Content-Type", "text/html; charset=utf-8"]]),
						arrayBuffer: () => Promise.resolve(buffer.buffer),
					}),
				1,
			),
		);
	}

	test("constructs resource with required properties", () => {
		const url = new URL("https://example.com/page");
		const response = { headers: new Map() };
		const buffer = new ArrayBuffer(100);
		const baseUrl = new URL("https://example.com");
		const attempts = [new Attempt(url, 200, 150)];

		const resource = new Resource(url, response, buffer, baseUrl, attempts);

		assert.strictEqual(resource.getUrl(), url);
		assert.strictEqual(resource.getBuffer(), buffer);
		assert.deepStrictEqual(resource.getAttempts(), attempts);
	});

	test("static fetch resolves relative URLs", async () => {
		globalThis.fetch = mockFetch;

		const resource = await Resource.fetch("/page", "https://example.com");

		assert.strictEqual(resource.getUrl().href, "https://example.com/page");
		assert.strictEqual(resource.isHtml(), true);

		globalThis.fetch = originalFetch;
	});

	test("static fetch follows redirects with attempt tracking", async () => {
		globalThis.fetch = mockFetch;

		const resource = await Resource.fetch("/redirect", "https://example.com");

		assert.strictEqual(resource.getUrl().href, "https://example.com/final");
		assert.strictEqual(resource.getRedirectCount(), 1);

		const attempts = resource.getAttempts();
		assert.strictEqual(attempts.length, 2);
		assert.strictEqual(attempts[0].statusCode, 301);
		assert.strictEqual(attempts[1].statusCode, 200);

		globalThis.fetch = originalFetch;
	});

	test("detects HTML content type", async () => {
		globalThis.fetch = mockFetch;

		const htmlResource = await Resource.fetch("/page", "https://example.com");
		const assetResource = await Resource.fetch("/asset", "https://example.com");

		assert.strictEqual(htmlResource.isHtml(), true);
		assert.strictEqual(htmlResource.isAsset(), false);
		assert.strictEqual(
			htmlResource.getContentType(),
			"text/html; charset=utf-8",
		);

		assert.strictEqual(assetResource.isHtml(), false);
		assert.strictEqual(assetResource.isAsset(), true);
		assert.strictEqual(assetResource.getContentType(), "image/jpeg");

		globalThis.fetch = originalFetch;
	});

	test("extracts and categorizes URLs from HTML", async () => {
		globalThis.fetch = mockFetch;

		const resource = await Resource.fetch("/final", "https://example.com");

		const allUrls = resource.extractUrls();
		assert.strictEqual(allUrls.size, 3);

		const relativeUrls = resource.getRelativeUrls();
		const externalUrls = resource.getExternalUrls();

		assert.strictEqual(relativeUrls.length, 2); // /page1 and /image.jpg
		assert.strictEqual(externalUrls.length, 1); // https://external.com/page

		assert.strictEqual(relativeUrls[0].origin, "https://example.com");
		assert.strictEqual(externalUrls[0].origin, "https://external.com");

		globalThis.fetch = originalFetch;
	});

	test("caches extracted URLs", async () => {
		globalThis.fetch = mockFetch;

		const resource = await Resource.fetch("/final", "https://example.com");

		const urls1 = resource.extractUrls();
		const urls2 = resource.extractUrls();

		// Should return same Set instance (cached)
		assert.strictEqual(urls1, urls2);

		globalThis.fetch = originalFetch;
	});

	test("throws for non-HTML content access", async () => {
		globalThis.fetch = mockFetch;

		const resource = await Resource.fetch("/asset", "https://example.com");

		assert.throws(
			() => resource.getContent(),
			/Cannot get text content from non-HTML resource/,
		);
		assert.throws(
			() => resource.extractUrls(),
			/Cannot extract URLs from non-HTML resource/,
		);
		assert.throws(
			() => resource.getRelativeUrls(),
			/Cannot extract URLs from non-HTML resource/,
		);
		assert.throws(
			() => resource.getExternalUrls(),
			/Cannot extract URLs from non-HTML resource/,
		);

		globalThis.fetch = originalFetch;
	});

	test("provides timing and attempt statistics", async () => {
		globalThis.fetch = mockFetch;

		const resource = await Resource.fetch("/redirect", "https://example.com");

		assert.strictEqual(typeof resource.getTotalResponseTime(), "number");
		assert.strictEqual(resource.getTotalResponseTime() > 0, true);

		const finalAttempt = resource.getFinalAttempt();
		assert.strictEqual(finalAttempt.statusCode, 200);
		assert.strictEqual(finalAttempt.isSuccess(), true);

		globalThis.fetch = originalFetch;
	});

	test("converts to JSON representation", async () => {
		globalThis.fetch = mockFetch;

		const resource = await Resource.fetch("/page", "https://example.com");
		const json = resource.toJSON();

		assert.strictEqual(json.url, "https://example.com/page");
		assert.strictEqual(json.baseUrl, "https://example.com/");
		assert.strictEqual(json.isHtml, true);
		assert.strictEqual(typeof json.contentLength, "number");
		assert.strictEqual(Array.isArray(json.attempts), true);
		assert.strictEqual(typeof json.totalResponseTime, "number");
		assert.strictEqual(json.redirectCount, 0);

		globalThis.fetch = originalFetch;
	});

	test("handles fetch errors gracefully", async () => {
		globalThis.fetch = () => Promise.reject(new Error("Network error"));

		await assert.rejects(
			async () => await Resource.fetch("/page", "https://example.com"),
			/Fetch failed.*Network error/,
		);

		globalThis.fetch = originalFetch;
	});

	test("respects timeout option", async () => {
		globalThis.fetch = mockFetch;

		await assert.rejects(
			async () =>
				await Resource.fetch("/timeout", "https://example.com", {
					timeout: 10,
				}),
			/Request timeout/,
		);

		globalThis.fetch = originalFetch;
	});

	test("handles custom user agent", async () => {
		let capturedHeaders;
		globalThis.fetch = (url, options) => {
			capturedHeaders = options.headers;
			return mockFetch(url, options);
		};

		await Resource.fetch("/page", "https://example.com", {
			userAgent: "Custom Agent/1.0",
		});

		assert.strictEqual(capturedHeaders["User-Agent"], "Custom Agent/1.0");

		globalThis.fetch = originalFetch;
	});

	test("saves HTML resource as index.html", async () => {
		globalThis.fetch = mockFetch;

		const resource = await Resource.fetch("/page", "https://example.com");
		const tempDir = "/tmp/fledge-test";

		// Clean up any existing temp directory
		await import("node:fs/promises").then((fs) =>
			fs.rm(tempDir, { recursive: true, force: true }),
		);

		const savedPath = await resource.saveToFile(tempDir);

		// Should save as index.html in page directory
		assert.strictEqual(savedPath, "/tmp/fledge-test/page/index.html");

		// Verify file exists and has correct content
		const { readFile } = await import("node:fs/promises");
		const content = await readFile(savedPath, "utf8");
		assert.strictEqual(content, "<html><body><h1>Test Page</h1></body></html>");

		// Cleanup
		await import("node:fs/promises").then((fs) =>
			fs.rm(tempDir, { recursive: true, force: true }),
		);
		globalThis.fetch = originalFetch;
	});

	test("saves root HTML resource as index.html", async () => {
		globalThis.fetch = mockFetch;

		const resource = await Resource.fetch("/", "https://example.com");
		const tempDir = "/tmp/fledge-test";

		// Clean up any existing temp directory
		await import("node:fs/promises").then((fs) =>
			fs.rm(tempDir, { recursive: true, force: true }),
		);

		const savedPath = await resource.saveToFile(tempDir);

		// Should save directly as index.html in root
		assert.strictEqual(savedPath, "/tmp/fledge-test/index.html");

		// Verify file exists
		const { readFile } = await import("node:fs/promises");
		const content = await readFile(savedPath, "utf8");
		assert.strictEqual(content, "<html><body><h1>Test Page</h1></body></html>");

		// Cleanup
		await import("node:fs/promises").then((fs) =>
			fs.rm(tempDir, { recursive: true, force: true }),
		);
		globalThis.fetch = originalFetch;
	});

	test("saves asset resource with original path", async () => {
		globalThis.fetch = mockFetch;

		const resource = await Resource.fetch(
			"/images/logo.png",
			"https://example.com",
		);
		const tempDir = "/tmp/fledge-test";

		// Clean up any existing temp directory
		await import("node:fs/promises").then((fs) =>
			fs.rm(tempDir, { recursive: true, force: true }),
		);

		const savedPath = await resource.saveToFile(tempDir);

		// Should save with original path structure
		assert.strictEqual(savedPath, "/tmp/fledge-test/images/logo.png");

		// Verify file exists and is binary
		const { readFile } = await import("node:fs/promises");
		const content = await readFile(savedPath);
		assert.strictEqual(content instanceof Buffer, true);
		assert.strictEqual(content.length > 0, true);

		// Cleanup
		await import("node:fs/promises").then((fs) =>
			fs.rm(tempDir, { recursive: true, force: true }),
		);
		globalThis.fetch = originalFetch;
	});

	test("creates intermediate directories", async () => {
		globalThis.fetch = mockFetch;

		const resource = await Resource.fetch(
			"/deep/nested/path",
			"https://example.com",
		);
		const tempDir = "/tmp/fledge-test";

		// Clean up any existing temp directory
		await import("node:fs/promises").then((fs) =>
			fs.rm(tempDir, { recursive: true, force: true }),
		);

		const savedPath = await resource.saveToFile(tempDir);

		// Should create nested directory structure
		assert.strictEqual(
			savedPath,
			"/tmp/fledge-test/deep/nested/path/index.html",
		);

		// Verify file exists
		const { readFile } = await import("node:fs/promises");
		const content = await readFile(savedPath, "utf8");
		assert.strictEqual(content, "<html><body><h1>Test Page</h1></body></html>");

		// Cleanup
		await import("node:fs/promises").then((fs) =>
			fs.rm(tempDir, { recursive: true, force: true }),
		);
		globalThis.fetch = originalFetch;
	});

	test("saves HTML with basePath in subdirectory", async () => {
		globalThis.fetch = mockFetch;

		const resource = await Resource.fetch("/", "https://example.com");
		const tempDir = "/tmp/fledge-test";

		// Clean up any existing temp directory
		await import("node:fs/promises").then((fs) =>
			fs.rm(tempDir, { recursive: true, force: true }),
		);

		const savedPath = await resource.saveToFile(tempDir, "/my-app");

		// Should save in basePath subdirectory
		assert.strictEqual(savedPath, "/tmp/fledge-test/my-app/index.html");

		// Cleanup
		await import("node:fs/promises").then((fs) =>
			fs.rm(tempDir, { recursive: true, force: true }),
		);
		globalThis.fetch = originalFetch;
	});

	test("saves assets with basePath in subdirectory", async () => {
		globalThis.fetch = mockFetch;

		const resource = await Resource.fetch("/logo.png", "https://example.com");
		const tempDir = "/tmp/fledge-test";

		// Clean up any existing temp directory
		await import("node:fs/promises").then((fs) =>
			fs.rm(tempDir, { recursive: true, force: true }),
		);

		const savedPath = await resource.saveToFile(tempDir, "/my-app");

		// Should save in basePath subdirectory
		assert.strictEqual(savedPath, "/tmp/fledge-test/my-app/logo.png");

		// Cleanup
		await import("node:fs/promises").then((fs) =>
			fs.rm(tempDir, { recursive: true, force: true }),
		);
		globalThis.fetch = originalFetch;
	});

	test("handles various basePath formats", async () => {
		globalThis.fetch = mockFetch;

		const resource = await Resource.fetch("/page", "https://example.com");
		const tempDir = "/tmp/fledge-test";

		// Clean up any existing temp directory
		await import("node:fs/promises").then((fs) =>
			fs.rm(tempDir, { recursive: true, force: true }),
		);

		// Test different basePath formats - they should all normalize the same way
		const path1 = await resource.saveToFile(tempDir, "app");
		assert.strictEqual(path1, "/tmp/fledge-test/app/page/index.html");

		const path2 = await resource.saveToFile(tempDir, "/app/");
		assert.strictEqual(path2, "/tmp/fledge-test/app/page/index.html");

		const path3 = await resource.saveToFile(tempDir, "app/");
		assert.strictEqual(path3, "/tmp/fledge-test/app/page/index.html");

		// Cleanup
		await import("node:fs/promises").then((fs) =>
			fs.rm(tempDir, { recursive: true, force: true }),
		);
		globalThis.fetch = originalFetch;
	});

	test("ignores empty or root basePath", async () => {
		globalThis.fetch = mockFetch;

		const resource = await Resource.fetch("/page", "https://example.com");
		const tempDir = "/tmp/fledge-test";

		// Clean up any existing temp directory
		await import("node:fs/promises").then((fs) =>
			fs.rm(tempDir, { recursive: true, force: true }),
		);

		// These should behave like no basePath
		const path1 = await resource.saveToFile(tempDir, "");
		assert.strictEqual(path1, "/tmp/fledge-test/page/index.html");

		const path2 = await resource.saveToFile(tempDir, "/");
		assert.strictEqual(path2, "/tmp/fledge-test/page/index.html");

		// Cleanup
		await import("node:fs/promises").then((fs) =>
			fs.rm(tempDir, { recursive: true, force: true }),
		);
		globalThis.fetch = originalFetch;
	});

	test("rewrites URLs in HTML with basePath", async () => {
		// Mock HTML content with internal URLs
		const htmlContent = `<!DOCTYPE html>
<html>
<head>
	<link href="/styles.css" rel="stylesheet">
</head>
<body>
	<a href="/about">About</a>
	<img src="/logo.png" alt="Logo">
</body>
</html>`;

		// Mock fetch to return our test HTML
		globalThis.fetch = () =>
			Promise.resolve({
				ok: true,
				status: 200,
				statusText: "OK",
				headers: new Map([["Content-Type", "text/html"]]),
				arrayBuffer: () =>
					Promise.resolve(new TextEncoder().encode(htmlContent).buffer),
			});

		const resource = await Resource.fetch("/", "https://example.com");
		const tempDir = "/tmp/fledge-test";

		// Clean up any existing temp directory
		await import("node:fs/promises").then((fs) =>
			fs.rm(tempDir, { recursive: true, force: true }),
		);

		const savedPath = await resource.saveToFile(tempDir, "/my-app");

		// Read the saved file and check URL rewriting
		const { readFile } = await import("node:fs/promises");
		const savedContent = await readFile(savedPath, "utf8");

		// Check that URLs were rewritten with basePath
		assert.match(savedContent, /<link href="\/my-app\/styles\.css"/);
		assert.match(savedContent, /<a href="\/my-app\/about">/);
		assert.match(savedContent, /<img src="\/my-app\/logo\.png"/);

		// Cleanup
		await import("node:fs/promises").then((fs) =>
			fs.rm(tempDir, { recursive: true, force: true }),
		);
		globalThis.fetch = originalFetch;
	});

	test("does not rewrite URLs without basePath", async () => {
		// Mock HTML content with internal URLs
		const htmlContent = `<html>
<body>
	<a href="/about">About</a>
	<img src="/logo.png" alt="Logo">
</body>
</html>`;

		// Mock fetch to return our test HTML
		globalThis.fetch = () =>
			Promise.resolve({
				ok: true,
				status: 200,
				statusText: "OK",
				headers: new Map([["Content-Type", "text/html"]]),
				arrayBuffer: () =>
					Promise.resolve(new TextEncoder().encode(htmlContent).buffer),
			});

		const resource = await Resource.fetch("/", "https://example.com");
		const tempDir = "/tmp/fledge-test";

		// Clean up any existing temp directory
		await import("node:fs/promises").then((fs) =>
			fs.rm(tempDir, { recursive: true, force: true }),
		);

		const savedPath = await resource.saveToFile(tempDir); // No basePath

		// Read the saved file and check URLs are unchanged
		const { readFile } = await import("node:fs/promises");
		const savedContent = await readFile(savedPath, "utf8");

		// URLs should be unchanged
		assert.match(savedContent, /<a href="\/about">/);
		assert.match(savedContent, /<img src="\/logo\.png"/);

		// Cleanup
		await import("node:fs/promises").then((fs) =>
			fs.rm(tempDir, { recursive: true, force: true }),
		);
		globalThis.fetch = originalFetch;
	});
});
