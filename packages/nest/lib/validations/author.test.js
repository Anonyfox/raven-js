/**
 * @fileoverview Tests for author validation
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { Folder } from "../folder.js";
import { validateAuthor } from "./author.js";

describe("validateAuthor", () => {
	test("should return error when package.json is missing", () => {
		const folder = new Folder();
		const errors = validateAuthor(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "MISSING_PACKAGE_JSON");
		assert.strictEqual(errors[0].field, "package.json");
	});

	test("should return error when package.json is invalid JSON", () => {
		const folder = new Folder();
		folder.addFile("package.json", "{ invalid json");

		const errors = validateAuthor(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "INVALID_PACKAGE_JSON");
		assert.strictEqual(errors[0].field, "package.json");
	});

	test("should return error when author field is missing", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
			}),
		);

		const errors = validateAuthor(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "MISSING_AUTHOR");
		assert.strictEqual(errors[0].field, "author");
	});

	test("should return error when author string is empty", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				author: "",
			}),
		);

		const errors = validateAuthor(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "INVALID_AUTHOR");
		assert.strictEqual(errors[0].field, "author");
	});

	test("should return error when author string is whitespace only", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				author: "   ",
			}),
		);

		const errors = validateAuthor(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "INVALID_AUTHOR");
		assert.strictEqual(errors[0].field, "author");
	});

	test("should return error when author object is missing name", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				author: {
					email: "test@example.com",
					url: "https://example.com",
				},
			}),
		);

		const errors = validateAuthor(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "INVALID_AUTHOR_NAME");
		assert.strictEqual(errors[0].field, "author.name");
	});

	test("should return error when author object has empty name", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				author: {
					name: "",
					email: "test@example.com",
					url: "https://example.com",
				},
			}),
		);

		const errors = validateAuthor(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "INVALID_AUTHOR_NAME");
		assert.strictEqual(errors[0].field, "author.name");
	});

	test("should return error when author object is missing email", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				author: {
					name: "Test Author",
					url: "https://example.com",
				},
			}),
		);

		const errors = validateAuthor(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "INVALID_AUTHOR_EMAIL");
		assert.strictEqual(errors[0].field, "author.email");
	});

	test("should return error when author object has empty email", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				author: {
					name: "Test Author",
					email: "",
					url: "https://example.com",
				},
			}),
		);

		const errors = validateAuthor(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "INVALID_AUTHOR_EMAIL");
		assert.strictEqual(errors[0].field, "author.email");
	});

	test("should return error when author object is missing url", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				author: {
					name: "Test Author",
					email: "test@example.com",
				},
			}),
		);

		const errors = validateAuthor(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "INVALID_AUTHOR_URL");
		assert.strictEqual(errors[0].field, "author.url");
	});

	test("should return error when author object has empty url", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				author: {
					name: "Test Author",
					email: "test@example.com",
					url: "",
				},
			}),
		);

		const errors = validateAuthor(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "INVALID_AUTHOR_URL");
		assert.strictEqual(errors[0].field, "author.url");
	});

	test("should return error when author is invalid type", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				author: 123,
			}),
		);

		const errors = validateAuthor(folder);

		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].code, "INVALID_AUTHOR_TYPE");
		assert.strictEqual(errors[0].field, "author");
	});

	test("should return no errors for valid string author", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				author: "Test Author",
			}),
		);

		const errors = validateAuthor(folder);

		assert.strictEqual(errors.length, 0);
	});

	test("should return no errors for valid object author", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				author: {
					name: "Test Author",
					email: "test@example.com",
					url: "https://example.com",
				},
			}),
		);

		const errors = validateAuthor(folder);

		assert.strictEqual(errors.length, 0);
	});
});
