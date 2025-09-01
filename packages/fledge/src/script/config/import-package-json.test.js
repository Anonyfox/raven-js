/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for package.json import utilities.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { extractMetadata, readPackageJson } from "./import-package-json.js";

describe("readPackageJson", () => {
	it("reads package.json from current directory", () => {
		// Test with real package.json from fledge project
		const pkg = readPackageJson();

		assert.strictEqual(pkg.name, "@raven-js/fledge");
		assert.strictEqual(typeof pkg.version, "string");
		assert.ok(pkg.version.length > 0);
	});

	it("reads package.json from specified directory", () => {
		// Test with fledge package directory
		const pkg = readPackageJson(".");

		assert.strictEqual(pkg.name, "@raven-js/fledge");
		assert.strictEqual(typeof pkg.version, "string");
	});

	it("throws error for missing package.json", () => {
		assert.throws(() => readPackageJson("/nonexistent/directory/path"), {
			name: "Error",
			message: /package\.json not found in any parent directory/,
		});
	});
});

describe("extractMetadata", () => {
	it("extracts complete metadata", () => {
		const packageJson = {
			name: "my-app",
			version: "2.1.0",
			description: "My awesome application",
			author: "Jane Smith <jane@example.com>",
		};

		const metadata = extractMetadata(packageJson);

		assert.strictEqual(metadata.name, "my-app");
		assert.strictEqual(metadata.version, "2.1.0");
		assert.strictEqual(metadata.description, "My awesome application");
		assert.strictEqual(metadata.author, "Jane Smith <jane@example.com>");
	});

	it("handles author object format", () => {
		const packageJson = {
			name: "my-app",
			author: {
				name: "John Doe",
				email: "john@example.com",
			},
		};

		const metadata = extractMetadata(packageJson);

		assert.strictEqual(metadata.author, "John Doe <john@example.com>");
	});

	it("handles author object with name only", () => {
		const packageJson = {
			name: "my-app",
			author: {
				name: "John Doe",
			},
		};

		const metadata = extractMetadata(packageJson);

		assert.strictEqual(metadata.author, "John Doe");
	});

	it("handles author object with email only", () => {
		const packageJson = {
			name: "my-app",
			author: {
				email: "john@example.com",
			},
		};

		const metadata = extractMetadata(packageJson);

		assert.strictEqual(metadata.author, "john@example.com");
	});

	it("provides defaults for missing fields", () => {
		const packageJson = {};

		const metadata = extractMetadata(packageJson);

		assert.strictEqual(metadata.name, "Unknown Application");
		assert.strictEqual(metadata.version, "0.0.0");
		assert.strictEqual(metadata.description, "");
		assert.strictEqual(metadata.author, "Unknown Author");
	});

	it("normalizes whitespace-only fields to empty strings", () => {
		const packageJson = {
			name: "   ",
			description: "\t\n  ",
			author: "  ",
		};

		const metadata = extractMetadata(packageJson);

		assert.strictEqual(metadata.name, "Unknown Application");
		assert.strictEqual(metadata.description, "");
		assert.strictEqual(metadata.author, "Unknown Author");
	});

	it("handles non-string fields gracefully", () => {
		const packageJson = {
			name: 123,
			version: null,
			description: undefined,
			author: false,
		};

		const metadata = extractMetadata(packageJson);

		assert.strictEqual(metadata.name, "Unknown Application");
		assert.strictEqual(metadata.version, "0.0.0");
		assert.strictEqual(metadata.description, "");
		assert.strictEqual(metadata.author, "Unknown Author");
	});

	it("throws error for null package.json", () => {
		assert.throws(() => extractMetadata(null), {
			name: "Error",
			message: "Package.json must be an object",
		});
	});

	it("throws error for non-object package.json", () => {
		assert.throws(() => extractMetadata("string"), {
			name: "Error",
			message: "Package.json must be an object",
		});
	});

	it("handles empty author object", () => {
		const packageJson = {
			name: "my-app",
			author: {},
		};

		const metadata = extractMetadata(packageJson);

		assert.strictEqual(metadata.author, "Unknown Author");
	});

	it("handles author object with whitespace fields", () => {
		const packageJson = {
			name: "my-app",
			author: {
				name: "  ",
				email: "\t",
			},
		};

		const metadata = extractMetadata(packageJson);

		assert.strictEqual(metadata.author, "Unknown Author");
	});

	it("extracts metadata from real fledge package.json", () => {
		// Integration test with real package.json
		const packageJson = readPackageJson();
		const metadata = extractMetadata(packageJson);

		assert.strictEqual(metadata.name, "@raven-js/fledge");
		assert.ok(metadata.version.length > 0);
		assert.ok(metadata.description.length > 0);
		assert.ok(metadata.author.length > 0);
	});
});
