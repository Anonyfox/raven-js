/**
 * @fileoverview Tests for package structure validation
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { Folder } from "../folder.js";
import { validatePackageStructure } from "./structure.js";

describe("validatePackageStructure", () => {
	test("should return error when package.json is missing", () => {
		const folder = new Folder();
		const errors = validatePackageStructure(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "MISSING_PACKAGE_JSON");
		assert.strictEqual(errors[0].field, "package.json");
	});

	test("should return error when package.json is invalid JSON", () => {
		const folder = new Folder();
		folder.addFile("package.json", "{ invalid json");

		const errors = validatePackageStructure(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "INVALID_PACKAGE_JSON");
		assert.strictEqual(errors[0].field, "package.json");
	});

	test("should return error when README.md is missing", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
			}),
		);

		const errors = validatePackageStructure(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "MISSING_README");
		assert.strictEqual(errors[0].field, "README.md");
	});

	test("should return error when main entry point is missing", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				main: "index.js",
			}),
		);
		folder.addFile("README.md", "# Test Package");

		const errors = validatePackageStructure(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "MISSING_MAIN_ENTRY");
		assert.strictEqual(errors[0].field, "main");
	});

	test("should return error when main entry point is missing (with lib path)", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				main: "lib/index.js",
			}),
		);
		folder.addFile("README.md", "# Test Package");

		const errors = validatePackageStructure(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "MISSING_MAIN_ENTRY");
		assert.strictEqual(errors[0].field, "main");
	});

	test("should return no errors when README.md exists", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
			}),
		);
		folder.addFile("README.md", "# Test Package");

		const errors = validatePackageStructure(folder);

		assert.strictEqual(errors.length, 0);
	});

	test("should return no errors when main entry point exists", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				main: "index.js",
			}),
		);
		folder.addFile("README.md", "# Test Package");
		folder.addFile("index.js", "module.exports = {};");

		const errors = validatePackageStructure(folder);

		assert.strictEqual(errors.length, 0);
	});

	test("should return no errors when main entry point exists in subdirectory", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				main: "lib/index.js",
			}),
		);
		folder.addFile("README.md", "# Test Package");
		folder.addFile("lib/index.js", "module.exports = {};");

		const errors = validatePackageStructure(folder);

		assert.strictEqual(errors.length, 0);
	});

	test("should return no errors when no main field is specified", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
			}),
		);
		folder.addFile("README.md", "# Test Package");

		const errors = validatePackageStructure(folder);

		assert.strictEqual(errors.length, 0);
	});

	test("should return multiple errors when both README and main entry are missing", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				main: "index.js",
			}),
		);

		const errors = validatePackageStructure(folder);

		assert.strictEqual(errors.length, 2);
		assert.strictEqual(errors[0].code, "MISSING_README");
		assert.strictEqual(errors[1].code, "MISSING_MAIN_ENTRY");
	});
});
