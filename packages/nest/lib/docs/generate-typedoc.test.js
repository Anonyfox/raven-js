/**
 * @fileoverview Tests for TypeDoc generation functions
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { Folder } from "../folder.js";
import {
	canGenerateTypeDoc,
	generateTypeDocConfig,
	getEntryPoints,
} from "./generate-typedoc.js";

describe("getEntryPoints", () => {
	test("should return empty array when package.json is missing", () => {
		const folder = new Folder();
		const result = getEntryPoints(folder);

		assert.deepStrictEqual(result, []);
	});

	test("should return empty array when package.json is invalid JSON", () => {
		const folder = new Folder();
		folder.addFile("package.json", "{ invalid json");

		const result = getEntryPoints(folder);

		assert.deepStrictEqual(result, []);
	});

	test("should extract entry points from exports field", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				exports: {
					".": { import: "./index.js" },
					"./utils": { import: "./utils.js" },
					"./types": { import: "./types.js" },
				},
			}),
		);

		const result = getEntryPoints(folder);

		assert.deepStrictEqual(result, ["./index.js", "./utils.js", "./types.js"]);
	});

	test("should fallback to main field when exports is not present", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				main: "./lib/index.js",
			}),
		);

		const result = getEntryPoints(folder);

		assert.deepStrictEqual(result, ["./lib/index.js"]);
	});

	test("should return empty array when neither exports nor main is present", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				version: "1.0.0",
			}),
		);

		const result = getEntryPoints(folder);

		assert.deepStrictEqual(result, []);
	});

	test("should filter out falsy import values", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				exports: {
					".": { import: "./index.js" },
					"./utils": { import: null },
					"./types": { import: undefined },
					"./empty": { import: "" },
				},
			}),
		);

		const result = getEntryPoints(folder);

		assert.deepStrictEqual(result, ["./index.js"]);
	});
});

describe("generateTypeDocConfig", () => {
	test("should return null when package.json is missing", () => {
		const folder = new Folder();
		const result = generateTypeDocConfig(folder, "./docs");

		assert.strictEqual(result, null);
	});

	test("should return null when package.json is invalid JSON", () => {
		const folder = new Folder();
		folder.addFile("package.json", "{ invalid json");

		const result = generateTypeDocConfig(folder, "./docs");

		assert.strictEqual(result, null);
	});

	test("should return null when no entry points are available", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				version: "1.0.0",
			}),
		);

		const result = generateTypeDocConfig(folder, "./docs");

		assert.strictEqual(result, null);
	});

	test("should generate config for package with exports", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				version: "1.0.0",
				exports: {
					".": { import: "./index.js" },
					"./utils": { import: "./utils.js" },
				},
			}),
		);

		const result = generateTypeDocConfig(folder, "./docs");

		assert.strictEqual(result.out, "./docs");
		assert.strictEqual(result.skipErrorChecking, true);
		assert.strictEqual(
			result.customFooterHtml,
			'<a href="/">View all RavenJS packages</a>',
		);
		assert.strictEqual(result.name, "@raven-js/test");
		assert.strictEqual(result.tsconfig, "./jsconfig.json");
		assert.deepStrictEqual(result.entryPoints, ["./index.js", "./utils.js"]);
	});

	test("should generate config for package with main field", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				version: "1.0.0",
				main: "./lib/index.js",
			}),
		);

		const result = generateTypeDocConfig(folder, "./docs");

		assert.strictEqual(result.out, "./docs");
		assert.deepStrictEqual(result.entryPoints, ["./lib/index.js"]);
		assert.strictEqual(result.name, "@raven-js/test");
	});

	test("should handle scoped package names correctly", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/beak",
				version: "1.0.0",
				main: "./index.js",
			}),
		);

		const result = generateTypeDocConfig(folder, "./docs");

		assert.strictEqual(result.name, "@raven-js/beak");
	});

	test("should handle non-scoped package names correctly", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				main: "./index.js",
			}),
		);

		const result = generateTypeDocConfig(folder, "./docs");

		assert.strictEqual(result.name, "test-package");
	});
});

describe("canGenerateTypeDoc", () => {
	test("should return false when package.json is missing", () => {
		const folder = new Folder();
		const result = canGenerateTypeDoc(folder);

		assert.strictEqual(result, false);
	});

	test("should return false when no entry points are available", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				version: "1.0.0",
			}),
		);

		const result = canGenerateTypeDoc(folder);

		assert.strictEqual(result, false);
	});

	test("should return true when entry points are available", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				version: "1.0.0",
				main: "./index.js",
			}),
		);

		const result = canGenerateTypeDoc(folder);

		assert.strictEqual(result, true);
	});

	test("should return true when exports are available", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test",
				version: "1.0.0",
				exports: {
					".": { import: "./index.js" },
				},
			}),
		);

		const result = canGenerateTypeDoc(folder);

		assert.strictEqual(result, true);
	});
});
