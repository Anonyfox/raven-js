/**
 * @fileoverview Tests for package name validation
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { Folder } from "../folder.js";
import { validatePackageName } from "./name.js";

describe("validatePackageName", () => {
	test("should return error when package.json is missing", () => {
		const folder = new Folder();
		const errors = validatePackageName(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "MISSING_PACKAGE_JSON");
		assert.strictEqual(errors[0].field, "package.json");
	});

	test("should return error when package.json is invalid JSON", () => {
		const folder = new Folder();
		folder.addFile("package.json", "{ invalid json");

		const errors = validatePackageName(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "INVALID_PACKAGE_JSON");
		assert.strictEqual(errors[0].field, "package.json");
	});

	test("should return error when name field is missing", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				version: "1.0.0",
			}),
		);

		const errors = validatePackageName(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "MISSING_NAME");
		assert.strictEqual(errors[0].field, "name");
	});

	test("should return error when name field is empty", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "",
				version: "1.0.0",
			}),
		);

		const errors = validatePackageName(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "MISSING_NAME");
		assert.strictEqual(errors[0].field, "name");
	});

	test("should return error when name field is whitespace only", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "   ",
				version: "1.0.0",
			}),
		);

		const errors = validatePackageName(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "MISSING_NAME");
		assert.strictEqual(errors[0].field, "name");
	});

	test("should return error for invalid scoped package name (missing slash)", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js",
				version: "1.0.0",
			}),
		);

		const errors = validatePackageName(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "INVALID_SCOPED_NAME");
		assert.strictEqual(errors[0].field, "name");
	});

	test("should return error for invalid scoped package name (empty scope)", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@/package-name",
				version: "1.0.0",
			}),
		);

		const errors = validatePackageName(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "INVALID_SCOPED_NAME");
		assert.strictEqual(errors[0].field, "name");
	});

	test("should return error for invalid scoped package name (empty package)", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/",
				version: "1.0.0",
			}),
		);

		const errors = validatePackageName(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "INVALID_SCOPED_NAME");
		assert.strictEqual(errors[0].field, "name");
	});

	test("should return error for invalid scoped package name (too many slashes)", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/package/extra",
				version: "1.0.0",
			}),
		);

		const errors = validatePackageName(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "INVALID_SCOPED_NAME");
		assert.strictEqual(errors[0].field, "name");
	});

	test("should return error for name with invalid characters", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test package",
				version: "1.0.0",
			}),
		);

		const errors = validatePackageName(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "INVALID_NAME_CHARS");
		assert.strictEqual(errors[0].field, "name");
	});

	test("should return error for name with special characters", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test@package",
				version: "1.0.0",
			}),
		);

		const errors = validatePackageName(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "INVALID_NAME_CHARS");
		assert.strictEqual(errors[0].field, "name");
	});

	test("should return no errors for valid simple package name", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
			}),
		);

		const errors = validatePackageName(folder);

		assert.strictEqual(errors.length, 0);
	});

	test("should return no errors for valid scoped package name", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "@raven-js/test-package",
				version: "1.0.0",
			}),
		);

		const errors = validatePackageName(folder);

		assert.strictEqual(errors.length, 0);
	});

	test("should return no errors for name with valid characters", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package_123",
				version: "1.0.0",
			}),
		);

		const errors = validatePackageName(folder);

		assert.strictEqual(errors.length, 0);
	});
});
