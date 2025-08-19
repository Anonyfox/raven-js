import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import { HasValidAuthor } from "./has-valid-author.js";

describe("HasValidAuthor", () => {
	test("should return true for valid author objects", () => {
		const validAuthors = [
			{
				name: "John Doe",
				email: "john@example.com",
				url: "https://johndoe.com",
			},
			{
				name: "Jane Smith",
				email: "jane@example.org",
				url: "https://janesmith.dev",
			},
		];

		validAuthors.forEach((author, index) => {
			const tempDir = mkdtempSync(join(tmpdir(), "valid-author-test-"));
			const packageJson = { name: "test-package", author };
			writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));

			try {
				const result = HasValidAuthor(tempDir);
				assert.equal(result, true, `Should pass for valid author ${index}`);
			} finally {
				rmSync(tempDir, { recursive: true, force: true });
			}
		});
	});

	test("should throw error for missing author field", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "missing-author-test-"));
		const packageJson = { name: "test-package" };
		writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));

		try {
			assert.throws(
				() => HasValidAuthor(tempDir),
				/Missing author field/,
				"Should throw for missing author field",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for string format author", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "string-author-test-"));
		const packageJson = {
			name: "test-package",
			author: "John Doe <john@example.com> (https://johndoe.com)",
		};
		writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));

		try {
			assert.throws(
				() => HasValidAuthor(tempDir),
				/Author must be an object.*string format not allowed/,
				"Should throw for string format author",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for invalid author types", () => {
		const invalidAuthors = [null, 123, [], true];

		invalidAuthors.forEach((author) => {
			const tempDir = mkdtempSync(join(tmpdir(), "invalid-author-type-test-"));
			const packageJson = { name: "test-package", author };
			writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));

			try {
				assert.throws(
					() => HasValidAuthor(tempDir),
					/Author field must be an object|Missing author field|Author object must have a non-empty.*field/,
					`Should throw for invalid author type: ${typeof author}`,
				);
			} finally {
				rmSync(tempDir, { recursive: true, force: true });
			}
		});
	});

	test("should throw error for missing required fields", () => {
		const incompleteAuthors = [
			{ email: "test@example.com", url: "https://example.com" }, // missing name
			{ name: "John Doe", url: "https://example.com" }, // missing email
			{ name: "John Doe", email: "test@example.com" }, // missing url
			{}, // missing all
		];

		incompleteAuthors.forEach((author, index) => {
			const tempDir = mkdtempSync(join(tmpdir(), "incomplete-author-test-"));
			const packageJson = { name: "test-package", author };
			writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));

			try {
				assert.throws(
					() => HasValidAuthor(tempDir),
					/Author object must have a non-empty.*field/,
					`Should throw for incomplete author ${index}`,
				);
			} finally {
				rmSync(tempDir, { recursive: true, force: true });
			}
		});
	});

	test("should throw error for empty or non-string field values", () => {
		const authorsWithEmptyFields = [
			{ name: "", email: "test@example.com", url: "https://example.com" },
			{ name: "John", email: "", url: "https://example.com" },
			{ name: "John", email: "test@example.com", url: "" },
			{ name: "   ", email: "test@example.com", url: "https://example.com" }, // whitespace only
			{ name: 123, email: "test@example.com", url: "https://example.com" }, // non-string
			{ name: "John", email: null, url: "https://example.com" }, // null
		];

		authorsWithEmptyFields.forEach((author, index) => {
			const tempDir = mkdtempSync(join(tmpdir(), "empty-field-test-"));
			const packageJson = { name: "test-package", author };
			writeFileSync(join(tempDir, "package.json"), JSON.stringify(packageJson));

			try {
				assert.throws(
					() => HasValidAuthor(tempDir),
					/Author object must have a non-empty.*field/,
					`Should throw for empty/invalid field ${index}`,
				);
			} finally {
				rmSync(tempDir, { recursive: true, force: true });
			}
		});
	});

	test("should throw error for missing package.json", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "missing-package-test-"));

		try {
			assert.throws(
				() => HasValidAuthor(tempDir),
				/Cannot read package\.json/,
				"Should throw for missing package.json",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for invalid JSON", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "invalid-json-test-"));
		writeFileSync(join(tempDir, "package.json"), "{ invalid json }");

		try {
			assert.throws(
				() => HasValidAuthor(tempDir),
				/Invalid JSON in package\.json/,
				"Should throw for invalid JSON",
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should throw error for invalid input types", () => {
		const invalidInputs = [null, undefined, 123, {}, []];

		invalidInputs.forEach((input) => {
			assert.throws(
				() => HasValidAuthor(input),
				/Package path must be a non-empty string/,
				`Should throw for invalid input: ${typeof input}`,
			);
		});
	});

	test("should throw error for empty string input", () => {
		assert.throws(
			() => HasValidAuthor(""),
			/Package path must be a non-empty string/,
			"Should throw for empty string input",
		);
	});
});
