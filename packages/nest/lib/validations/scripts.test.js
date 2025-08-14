/**
 * @fileoverview Tests for package scripts validation
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { Folder } from "../folder.js";
import { validateScripts } from "./scripts.js";

describe("validateScripts", () => {
	test("should return error when package.json is missing", () => {
		const folder = new Folder();
		const errors = validateScripts(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "MISSING_PACKAGE_JSON");
		assert.strictEqual(errors[0].field, "package.json");
	});

	test("should return error when package.json is invalid JSON", () => {
		const folder = new Folder();
		folder.addFile("package.json", "{ invalid json");

		const errors = validateScripts(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "INVALID_PACKAGE_JSON");
		assert.strictEqual(errors[0].field, "package.json");
	});

	test("should return error when scripts field is missing", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
			}),
		);

		const errors = validateScripts(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "MISSING_SCRIPTS");
		assert.strictEqual(errors[0].field, "scripts");
	});

	test("should return error when scripts field is not an object", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				scripts: "not an object",
			}),
		);

		const errors = validateScripts(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "MISSING_SCRIPTS");
		assert.strictEqual(errors[0].field, "scripts");
	});

	test("should return error when test script is missing", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				scripts: {
					"test:code": "node test.js",
					"test:style": "biome check",
				},
			}),
		);

		const errors = validateScripts(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "MISSING_SCRIPT");
		assert.strictEqual(errors[0].field, "scripts.test");
	});

	test("should return error when test script is empty", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				scripts: {
					test: "",
					"test:code": "node test.js",
					"test:style": "biome check",
				},
			}),
		);

		const errors = validateScripts(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "MISSING_SCRIPT");
		assert.strictEqual(errors[0].field, "scripts.test");
	});

	test("should return error when test script is whitespace only", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				scripts: {
					test: "   ",
					"test:code": "node test.js",
					"test:style": "biome check",
				},
			}),
		);

		const errors = validateScripts(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "MISSING_SCRIPT");
		assert.strictEqual(errors[0].field, "scripts.test");
	});

	test("should return error when test:code script is missing", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				scripts: {
					test: "node test.js",
					"test:style": "biome check",
				},
			}),
		);

		const errors = validateScripts(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "MISSING_SCRIPT");
		assert.strictEqual(errors[0].field, "scripts.test:code");
	});

	test("should return error when test:style script is missing", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				scripts: {
					test: "node test.js",
					"test:code": "node test.js",
				},
			}),
		);

		const errors = validateScripts(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "MISSING_SCRIPT");
		assert.strictEqual(errors[0].field, "scripts.test:style");
	});

	test("should return multiple errors when multiple scripts are missing", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				scripts: {
					test: "node test.js",
					"test:code": "node test.js",
				},
			}),
		);

		const errors = validateScripts(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "MISSING_SCRIPT");
		assert.strictEqual(errors[0].field, "scripts.test:style");
	});

	test("should return no errors when all required scripts are present", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				scripts: {
					test: "node test.js",
					"test:code": "node test.js",
					"test:style": "biome check",
				},
			}),
		);

		const errors = validateScripts(folder);

		assert.strictEqual(errors.length, 0);
	});

	test("should return no errors when all required scripts are present with additional scripts", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				scripts: {
					test: "node test.js",
					"test:code": "node test.js",
					"test:style": "biome check",
					build: "node build.js",
					start: "node start.js",
				},
			}),
		);

		const errors = validateScripts(folder);

		assert.strictEqual(errors.length, 0);
	});
});
