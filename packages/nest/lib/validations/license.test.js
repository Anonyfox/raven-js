/**
 * @fileoverview Tests for license validation
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { Folder } from "../folder.js";
import { validateLicense } from "./license.js";

describe("validateLicense", () => {
	test("should return error when package.json is missing", () => {
		const folder = new Folder();
		const errors = validateLicense(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "MISSING_PACKAGE_JSON");
		assert.strictEqual(errors[0].field, "package.json");
	});

	test("should return error when package.json is invalid JSON", () => {
		const folder = new Folder();
		folder.addFile("package.json", "{ invalid json");

		const errors = validateLicense(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "INVALID_PACKAGE_JSON");
		assert.strictEqual(errors[0].field, "package.json");
	});

	test("should return error when license field is missing", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
			}),
		);

		const errors = validateLicense(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "MISSING_LICENSE_FIELD");
		assert.strictEqual(errors[0].field, "license");
	});

	test("should return error when license field is empty", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				license: "",
			}),
		);

		const errors = validateLicense(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "MISSING_LICENSE_FIELD");
		assert.strictEqual(errors[0].field, "license");
	});

	test("should return error when license field is whitespace only", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				license: "   ",
			}),
		);

		const errors = validateLicense(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "MISSING_LICENSE_FIELD");
		assert.strictEqual(errors[0].field, "license");
	});

	test("should return error when LICENSE file is missing", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				license: "MIT",
			}),
		);

		const errors = validateLicense(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "MISSING_LICENSE_FILE");
		assert.strictEqual(errors[0].field, "license");
	});

	test("should return no errors when LICENSE file exists", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				license: "MIT",
			}),
		);
		folder.addFile("LICENSE", "MIT License content");

		const errors = validateLicense(folder);

		assert.strictEqual(errors.length, 0);
	});

	test("should return no errors when license file exists (lowercase)", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				license: "MIT",
			}),
		);
		folder.addFile("license", "MIT License content");

		const errors = validateLicense(folder);

		assert.strictEqual(errors.length, 0);
	});

	test("should return no errors when License file exists (titlecase)", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				license: "MIT",
			}),
		);
		folder.addFile("License", "MIT License content");

		const errors = validateLicense(folder);

		assert.strictEqual(errors.length, 0);
	});

	test("should return no errors when both license field and file are valid", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				license: "MIT",
			}),
		);
		folder.addFile("LICENSE", "MIT License content");

		const errors = validateLicense(folder);

		assert.strictEqual(errors.length, 0);
	});
});
