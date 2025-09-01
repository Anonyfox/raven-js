/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for BundleResource class.
 */

import assert from "node:assert/strict";
import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { BundleResource } from "./bundle-resource.js";

test("BundleResource - Constructor and basic properties", () => {
	const bundleContent = "console.log('bundled');";
	const sourcemapContent = '{"version":3,"sources":["app.js"]}';
	const bundleBuffer = new TextEncoder().encode(bundleContent);
	const sourcemapBuffer = new TextEncoder().encode(sourcemapContent);
	const url = new URL("http://localhost:3000/app.js");
	const baseUrl = new URL("http://localhost:3000");

	const bundle = new BundleResource(
		bundleBuffer,
		sourcemapBuffer,
		url,
		baseUrl,
	);

	assert.equal(bundle.getUrl().href, "http://localhost:3000/app.js");
	assert.equal(bundle.getContentType(), "application/javascript");
	assert.equal(bundle.isAsset(), true);
	assert.equal(bundle.isHtml(), false);
	assert.equal(bundle.hasSourcemap(), true);
	assert.equal(bundle.getSourcemapBuffer(), sourcemapBuffer);
});

test("BundleResource - Without sourcemap", () => {
	const bundleBuffer = new TextEncoder().encode("console.log('no map');");
	const url = new URL("http://localhost:3000/script.js");
	const baseUrl = new URL("http://localhost:3000");

	const bundle = new BundleResource(bundleBuffer, null, url, baseUrl);

	assert.equal(bundle.hasSourcemap(), false);
	assert.equal(bundle.getSourcemapBuffer(), null);
});

test("BundleResource - Save to file with sourcemap", async () => {
	const tempDir = join(process.cwd(), "temp-bundle-test");
	const bundleContent = "console.log('test bundle');";
	const sourcemapContent = '{"version":3,"mappings":"AAAA"}';
	const bundleBuffer = new TextEncoder().encode(bundleContent);
	const sourcemapBuffer = new TextEncoder().encode(sourcemapContent);
	const url = new URL("http://localhost:3000/assets/app.js");
	const baseUrl = new URL("http://localhost:3000");

	const bundle = new BundleResource(
		bundleBuffer,
		sourcemapBuffer,
		url,
		baseUrl,
	);

	try {
		const savedPath = await bundle.saveToFile(tempDir);
		const expectedPath = join(tempDir, "assets", "app.js");
		assert.equal(savedPath, expectedPath);

		// Verify bundle file was written
		const savedBundle = await readFile(savedPath, "utf8");
		assert.equal(savedBundle, bundleContent);

		// Verify sourcemap file was written
		const savedSourcemap = await readFile(`${savedPath}.map`, "utf8");
		assert.equal(savedSourcemap, sourcemapContent);
	} finally {
		await rm(tempDir, { recursive: true, force: true });
	}
});

test("BundleResource - Save to file without sourcemap", async () => {
	const tempDir = join(process.cwd(), "temp-bundle-test-no-map");
	const bundleContent = "console.log('no sourcemap');";
	const bundleBuffer = new TextEncoder().encode(bundleContent);
	const url = new URL("http://localhost:3000/simple.js");
	const baseUrl = new URL("http://localhost:3000");

	const bundle = new BundleResource(bundleBuffer, null, url, baseUrl);

	try {
		const savedPath = await bundle.saveToFile(tempDir);
		const expectedPath = join(tempDir, "simple.js");
		assert.equal(savedPath, expectedPath);

		// Verify bundle file was written
		const savedBundle = await readFile(savedPath, "utf8");
		assert.equal(savedBundle, bundleContent);

		// Verify no sourcemap file was created
		await assert.rejects(readFile(`${savedPath}.map`, "utf8"), /ENOENT/);
	} finally {
		await rm(tempDir, { recursive: true, force: true });
	}
});

test("BundleResource - Save with basePath", async () => {
	const tempDir = join(process.cwd(), "temp-bundle-test-basepath");
	const bundleContent = "console.log('with basepath');";
	const sourcemapContent = '{"version":3}';
	const bundleBuffer = new TextEncoder().encode(bundleContent);
	const sourcemapBuffer = new TextEncoder().encode(sourcemapContent);
	const url = new URL("http://localhost:3000/js/main.js");
	const baseUrl = new URL("http://localhost:3000");

	const bundle = new BundleResource(
		bundleBuffer,
		sourcemapBuffer,
		url,
		baseUrl,
	);

	try {
		const savedPath = await bundle.saveToFile(tempDir, "/my-app");
		const expectedPath = join(tempDir, "my-app", "js", "main.js");
		assert.equal(savedPath, expectedPath);

		// Verify both files exist
		const savedBundle = await readFile(savedPath, "utf8");
		assert.equal(savedBundle, bundleContent);

		const savedSourcemap = await readFile(`${savedPath}.map`, "utf8");
		assert.equal(savedSourcemap, sourcemapContent);
	} finally {
		await rm(tempDir, { recursive: true, force: true });
	}
});

test("BundleResource - toJSON includes bundle metadata", () => {
	const bundleBuffer = new TextEncoder().encode("console.log('json test');");
	const sourcemapBuffer = new TextEncoder().encode('{"version":3}');
	const url = new URL("http://localhost:3000/test.js");
	const baseUrl = new URL("http://localhost:3000");

	const bundle = new BundleResource(
		bundleBuffer,
		sourcemapBuffer,
		url,
		baseUrl,
	);
	const json = bundle.toJSON();

	assert.equal(json.url, "http://localhost:3000/test.js");
	assert.equal(json.contentType, "application/javascript");
	assert.equal(json.isHtml, false);
	assert.equal(json.hasSourcemap, true);
	assert.equal(json.sourcemapSize, sourcemapBuffer.byteLength);
	assert.equal(json.resourceType, "bundle");
});

test("BundleResource - toJSON without sourcemap", () => {
	const bundleBuffer = new TextEncoder().encode("console.log('no map json');");
	const url = new URL("http://localhost:3000/no-map.js");
	const baseUrl = new URL("http://localhost:3000");

	const bundle = new BundleResource(bundleBuffer, null, url, baseUrl);
	const json = bundle.toJSON();

	assert.equal(json.hasSourcemap, false);
	assert.equal(json.sourcemapSize, 0);
	assert.equal(json.resourceType, "bundle");
});
