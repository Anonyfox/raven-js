/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for Bundler class.
 */

import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { buildBundle, buildBundles, validateBundleConfig } from "./bundler.js";
import { BundleResource } from "./resource/bundle-resource.js";

test("validateBundleConfig success", () => {
	const validConfig = {
		"/app.js": "./src/app.js",
		"/admin.js": "./src/admin.mjs",
	};

	// Should not throw
	validateBundleConfig(validConfig);
});

test("validateBundleConfig invalid mount path", () => {
	const invalidMountPath = {
		"app.js": "./src/app.js", // Missing leading slash
	};

	assert.throws(
		() => validateBundleConfig(invalidMountPath),
		/Bundle mount path must start with '\//,
	);
});

test("validateBundleConfig mount path not .js", () => {
	const invalidExtension = {
		"/app.css": "./src/app.js", // Wrong extension
	};

	assert.throws(
		() => validateBundleConfig(invalidExtension),
		/Bundle mount path must end with '\.js'/,
	);
});

test("validateBundleConfig empty source path", () => {
	const emptySource = {
		"/app.js": "",
	};

	assert.throws(
		() => validateBundleConfig(emptySource),
		/Bundle source path must be non-empty string/,
	);
});

test("validateBundleConfig invalid source extension", () => {
	const invalidSourceExt = {
		"/app.js": "./src/app.css",
	};

	assert.throws(
		() => validateBundleConfig(invalidSourceExt),
		/Bundle source path must be JavaScript file/,
	);
});

test("buildBundle success", async () => {
	const tempDir = join(process.cwd(), "temp-bundler-test");
	const sourceFile = join(tempDir, "app.js");
	const sourceContent = `
		export const message = "Hello bundle";
		console.log(message);
	`;

	try {
		// Setup test source file
		await mkdir(tempDir, { recursive: true });
		await writeFile(sourceFile, sourceContent);

		const baseUrl = new URL("http://localhost:3000");
		const bundle = await buildBundle("/js/app.js", sourceFile, baseUrl);

		assert(bundle instanceof BundleResource);
		assert.equal(bundle.getUrl().pathname, "/js/app.js");
		assert.equal(bundle.getContentType(), "application/javascript");
		assert.equal(bundle.hasSourcemap(), true); // External sourcemaps have separate buffer

		// Verify bundle content is processed and contains our code
		const bundleContent = new TextDecoder().decode(bundle.getBuffer());
		assert(bundleContent.includes("Hello bundle"));
	} finally {
		await rm(tempDir, { recursive: true, force: true });
	}
});

test("buildBundle with missing source file", async () => {
	const baseUrl = new URL("http://localhost:3000");

	await assert.rejects(
		buildBundle("/app.js", "./nonexistent.js", baseUrl),
		/Failed to build bundle/,
	);
});

test("buildBundles multiple bundles", async () => {
	const tempDir = join(process.cwd(), "temp-bundler-multi-test");
	const appFile = join(tempDir, "app.js");
	const adminFile = join(tempDir, "admin.js");

	try {
		// Setup test source files
		await mkdir(tempDir, { recursive: true });
		await writeFile(appFile, 'console.log("app bundle");');
		await writeFile(adminFile, 'console.log("admin bundle");');

		const bundlesConfig = {
			"/js/app.js": appFile,
			"/js/admin.js": adminFile,
		};

		const baseUrl = new URL("http://localhost:3000");
		const bundles = await buildBundles(bundlesConfig, baseUrl);

		assert.equal(bundles.size, 2);
		assert(bundles.has("/js/app.js"));
		assert(bundles.has("/js/admin.js"));

		const appBundle = bundles.get("/js/app.js");
		const adminBundle = bundles.get("/js/admin.js");

		assert(appBundle instanceof BundleResource);
		assert(adminBundle instanceof BundleResource);
		assert.equal(appBundle.getUrl().pathname, "/js/app.js");
		assert.equal(adminBundle.getUrl().pathname, "/js/admin.js");
	} finally {
		await rm(tempDir, { recursive: true, force: true });
	}
});

test("buildBundles empty config", async () => {
	const baseUrl = new URL("http://localhost:3000");
	const bundles = await buildBundles({}, baseUrl);

	assert.equal(bundles.size, 0);
});

test("buildBundle with import statements", async () => {
	const tempDir = join(process.cwd(), "temp-bundler-import-test");
	const utilFile = join(tempDir, "util.js");
	const mainFile = join(tempDir, "main.js");

	try {
		// Setup source files with imports
		await mkdir(tempDir, { recursive: true });
		await writeFile(utilFile, 'export const helper = () => "helped";');
		await writeFile(
			mainFile,
			`
			import { helper } from "./util.js";
			console.log(helper());
		`,
		);

		const baseUrl = new URL("http://localhost:3000");
		const bundle = await buildBundle("/bundle.js", mainFile, baseUrl);

		// Verify bundle combines both files
		const bundleContent = new TextDecoder().decode(bundle.getBuffer());
		assert(bundleContent.includes("helped"));
		assert(!bundleContent.includes("import")); // Should be bundled, no imports
	} finally {
		await rm(tempDir, { recursive: true, force: true });
	}
});
