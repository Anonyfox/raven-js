/**
 * @fileoverview Tests for bundle generation functions
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { Folder } from "../folder.js";
import {
	canGenerateBundles,
	generateAllBundles,
	generateCommonJSBundle,
	generateESMBundle,
	generateESMMinifiedBundle,
	getBundleEntryPoint,
} from "./generate-bundle.js";

describe("getBundleEntryPoint", () => {
	test("should return null when package.json is missing", () => {
		const folder = new Folder();
		const result = getBundleEntryPoint(folder);

		assert.strictEqual(result, null);
	});

	test("should return null when package.json is invalid JSON", () => {
		const folder = new Folder();
		folder.addFile("package.json", "{ invalid json");

		const result = getBundleEntryPoint(folder);

		assert.strictEqual(result, null);
	});

	test("should return main field when present", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				main: "./lib/index.js",
			}),
		);
		folder.addFile("lib/index.js", "export default {};");

		const result = getBundleEntryPoint(folder);

		assert.strictEqual(result, "lib/index.js");
	});

	test("should return exports import when main is not present", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				exports: {
					".": { import: "./src/index.js" },
				},
			}),
		);
		folder.addFile("src/index.js", "export default {};");

		const result = getBundleEntryPoint(folder);

		assert.strictEqual(result, "src/index.js");
	});

	test("should return exports string when import is not present", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				exports: {
					".": "./src/index.js",
				},
			}),
		);
		folder.addFile("src/index.js", "export default {};");

		const result = getBundleEntryPoint(folder);

		assert.strictEqual(result, "src/index.js");
	});

	test("should return index.js when no main or exports", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
			}),
		);
		folder.addFile("index.js", "export default {};");

		const result = getBundleEntryPoint(folder);

		assert.strictEqual(result, "index.js");
	});

	test("should return null when entry point file does not exist", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				main: "./lib/index.js",
			}),
		);
		// No lib/index.js file

		const result = getBundleEntryPoint(folder);

		assert.strictEqual(result, null);
	});
});

describe("canGenerateBundles", () => {
	test("should return false when package.json is missing", () => {
		const folder = new Folder();
		const result = canGenerateBundles(folder);

		assert.strictEqual(result, false);
	});

	test("should return false when entry point is not found", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				main: "./lib/index.js",
			}),
		);
		// No lib/index.js file

		const result = canGenerateBundles(folder);

		assert.strictEqual(result, false);
	});

	test("should return true when entry point exists", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				main: "./index.js",
			}),
		);
		folder.addFile("index.js", "export default {};");

		const result = canGenerateBundles(folder);

		assert.strictEqual(result, true);
	});
});

describe("generateCommonJSBundle", () => {
	test("should return null when entry point is not found", async () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				main: "./lib/index.js",
			}),
		);
		// No lib/index.js file

		const result = await generateCommonJSBundle(folder, "test");

		assert.strictEqual(result, null);
	});

	test("should generate CommonJS bundle when entry point exists", async () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				main: "./index.js",
			}),
		);
		folder.addFile("index.js", "export default { hello: 'world' };");

		const result = await generateCommonJSBundle(folder, "test");

		assert.notStrictEqual(result, null);
		assert.strictEqual(typeof result, "object");
		assert.strictEqual(typeof result.code, "string");
		assert(result.code.includes("RavenJS_Test"));
		assert(result.code.includes("hello"));
		assert(result.code.includes("world"));
	});
});

describe("generateESMBundle", () => {
	test("should return null when entry point is not found", async () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				main: "./lib/index.js",
			}),
		);
		// No lib/index.js file

		const result = await generateESMBundle(folder);

		assert.strictEqual(result, null);
	});

	test("should generate ESM bundle when entry point exists", async () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				main: "./index.js",
			}),
		);
		folder.addFile("index.js", "export default { hello: 'world' };");

		const result = await generateESMBundle(folder);

		assert.notStrictEqual(result, null);
		assert.strictEqual(typeof result, "object");
		assert.strictEqual(typeof result.code, "string");
		assert(result.code.includes("export"));
		assert(result.code.includes("hello"));
		assert(result.code.includes("world"));
	});
});

describe("generateESMMinifiedBundle", () => {
	test("should return null when entry point is not found", async () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				main: "./lib/index.js",
			}),
		);
		// No lib/index.js file

		const result = await generateESMMinifiedBundle(folder);

		assert.strictEqual(result, null);
	});

	test("should generate minified ESM bundle when entry point exists", async () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				main: "./index.js",
			}),
		);
		folder.addFile("index.js", "export default { hello: 'world' };");

		const result = await generateESMMinifiedBundle(folder);

		assert.notStrictEqual(result, null);
		assert.strictEqual(typeof result, "object");
		assert.strictEqual(typeof result.code, "string");
		// Minified bundle should be shorter than non-minified
		assert(result.code.length < 1000);
	});
});

describe("generateAllBundles", () => {
	test("should return null when entry point is not found", async () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				main: "./lib/index.js",
			}),
		);
		// No lib/index.js file

		const result = await generateAllBundles(folder, "test");

		assert.strictEqual(result, null);
	});

	test("should generate all bundles when entry point exists", async () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				main: "./index.js",
			}),
		);
		folder.addFile("index.js", "export default { hello: 'world' };");

		const result = await generateAllBundles(folder, "test");

		assert.notStrictEqual(result, null);
		assert.strictEqual(result.packageName, "test");
		assert.strictEqual(typeof result.cjs, "object");
		assert.strictEqual(typeof result.esm, "object");
		assert.strictEqual(typeof result.esmMin, "object");
		assert(result.cjs.code.includes("RavenJS_Test"));
		assert(result.esm.code.includes("export"));
		assert(result.esmMin.code.length < result.esm.code.length); // Minified should be smaller
	});
});
