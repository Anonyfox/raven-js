/**
 * @fileoverview Tests for package version validation
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { Folder } from "../folder.js";
import { validateVersion } from "./version.js";

describe("validateVersion", () => {
	test("should return error when package.json is missing", () => {
		const folder = new Folder();
		const errors = validateVersion(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "MISSING_PACKAGE_JSON");
		assert.strictEqual(errors[0].field, "package.json");
	});

	test("should return error when package.json is invalid JSON", () => {
		const folder = new Folder();
		folder.addFile("package.json", "{ invalid json");

		const errors = validateVersion(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "INVALID_PACKAGE_JSON");
		assert.strictEqual(errors[0].field, "package.json");
	});

	test("should return error when version field is missing", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
			}),
		);

		const errors = validateVersion(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "MISSING_VERSION");
		assert.strictEqual(errors[0].field, "version");
	});

	test("should return error when version field is empty", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "",
			}),
		);

		const errors = validateVersion(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "MISSING_VERSION");
		assert.strictEqual(errors[0].field, "version");
	});

	test("should return error when version field is whitespace only", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "   ",
			}),
		);

		const errors = validateVersion(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "MISSING_VERSION");
		assert.strictEqual(errors[0].field, "version");
	});

	test("should return error for invalid version format (missing patch)", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0",
			}),
		);

		const errors = validateVersion(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "INVALID_VERSION");
		assert.strictEqual(errors[0].field, "version");
	});

	test("should return error for invalid version format (single number)", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1",
			}),
		);

		const errors = validateVersion(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "INVALID_VERSION");
		assert.strictEqual(errors[0].field, "version");
	});

	test("should return error for invalid version format (letters)", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.a",
			}),
		);

		const errors = validateVersion(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "INVALID_VERSION");
		assert.strictEqual(errors[0].field, "version");
	});

	test("should return error for invalid version format (invalid prerelease)", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0-",
			}),
		);

		const errors = validateVersion(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "INVALID_VERSION");
		assert.strictEqual(errors[0].field, "version");
	});

	test("should return no errors for valid basic version", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
			}),
		);

		const errors = validateVersion(folder);

		assert.strictEqual(errors.length, 0);
	});

	test("should return no errors for valid version with prerelease", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0-alpha",
			}),
		);

		const errors = validateVersion(folder);

		assert.strictEqual(errors.length, 0);
	});

	test("should return no errors for valid version with build metadata", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0+build.1",
			}),
		);

		const errors = validateVersion(folder);

		assert.strictEqual(errors.length, 0);
	});

	test("should return no errors for valid version with both prerelease and build", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0-alpha+build.1",
			}),
		);

		const errors = validateVersion(folder);

		assert.strictEqual(errors.length, 0);
	});

	test("should return no errors for valid version with numeric prerelease", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0-1",
			}),
		);

		const errors = validateVersion(folder);

		assert.strictEqual(errors.length, 0);
	});
});
