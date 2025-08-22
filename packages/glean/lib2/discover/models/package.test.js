/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for hardened Package class constructor.
 */

import { deepStrictEqual, strictEqual, throws } from "node:assert";
import { test } from "node:test";
import { Package } from "./package.js";

test("Package - valid package.json with files", () => {
	const packageJson = JSON.stringify({
		name: "test-package",
		version: "1.0.0",
		description: "A test package",
		main: "./index.js",
		exports: {
			".": "./index.js",
			"./utils": "./lib/utils.js",
		},
	});

	const files = new Set(["index.js", "lib/utils.js", "package.json"]);

	const pkg = new Package(packageJson, files);

	strictEqual(pkg.name, "test-package");
	strictEqual(pkg.version, "1.0.0");
	strictEqual(pkg.description, "A test package");
	deepStrictEqual(pkg.entryPoints, {
		".": "index.js",
		"./utils": "lib/utils.js",
	});
});

test("Package - minimal valid package.json", () => {
	const packageJson = JSON.stringify({
		name: "minimal-package",
	});

	const pkg = new Package(packageJson);

	strictEqual(pkg.name, "minimal-package");
	strictEqual(pkg.version, "");
	strictEqual(pkg.description, "");
	deepStrictEqual(pkg.entryPoints, {});
});

test("Package - missing properties default to empty strings", () => {
	const packageJson = JSON.stringify({
		name: "partial-package",
		version: 123, // Invalid type
		description: null, // Invalid type
	});

	const pkg = new Package(packageJson);

	strictEqual(pkg.name, "partial-package");
	strictEqual(pkg.version, "");
	strictEqual(pkg.description, "");
});

test("Package - throws on invalid jsonString type", () => {
	throws(() => new Package(null), {
		name: "Error",
		message: "Package constructor requires a valid JSON string",
	});

	throws(() => new Package(123), {
		name: "Error",
		message: "Package constructor requires a valid JSON string",
	});

	throws(() => new Package({}), {
		name: "Error",
		message: "Package constructor requires a valid JSON string",
	});
});

test("Package - throws on empty JSON string", () => {
	throws(() => new Package(""), {
		name: "Error",
		message: "Package JSON string cannot be empty",
	});

	throws(() => new Package("   "), {
		name: "Error",
		message: "Package JSON string cannot be empty",
	});
});

test("Package - throws on malformed JSON", () => {
	throws(() => new Package('{"invalid": json}'), {
		name: "Error",
		message: /Invalid package\.json format:/,
	});

	throws(() => new Package("{invalid json"), {
		name: "Error",
		message: /Invalid package\.json format:/,
	});

	throws(() => new Package('{"name": "test",}'), {
		name: "Error",
		message: /Invalid package\.json format:/,
	});
});

test("Package - throws on non-object JSON", () => {
	throws(() => new Package('"just a string"'), {
		name: "Error",
		message: "Package JSON must be a valid object",
	});

	throws(() => new Package("123"), {
		name: "Error",
		message: "Package JSON must be a valid object",
	});

	throws(() => new Package('["array", "not", "object"]'), {
		name: "Error",
		message: "Package JSON must be a valid object",
	});

	throws(() => new Package("null"), {
		name: "Error",
		message: "Package JSON must be a valid object",
	});
});

test("Package - throws on invalid files parameter", () => {
	const validJson = JSON.stringify({ name: "test" });

	throws(() => new Package(validJson, "not-a-set"), {
		name: "Error",
		message: "Files parameter must be a Set of file paths",
	});

	throws(() => new Package(validJson, 123), {
		name: "Error",
		message: "Files parameter must be a Set of file paths",
	});

	throws(() => new Package(validJson, {}), {
		name: "Error",
		message: "Files parameter must be a Set of file paths",
	});
});

test("Package - handles entry points extraction", () => {
	const packageJson = JSON.stringify({
		name: "entry-points-test",
		exports: {
			".": "./src/index.js",
			"./utils/*": "./src/utils/*.js",
		},
	});

	const files = new Set([
		"src/index.js",
		"src/utils/format.js",
		"src/utils/validate.js",
		"package.json",
	]);

	const pkg = new Package(packageJson, files);

	strictEqual(pkg.name, "entry-points-test");
	deepStrictEqual(pkg.entryPoints, {
		".": "src/index.js",
		"./utils/format": "./src/utils/format.js",
		"./utils/validate": "./src/utils/validate.js",
	});
});

test("Package - works without files parameter", () => {
	const packageJson = JSON.stringify({
		name: "no-files-test",
		version: "2.0.0",
		main: "./index.js",
	});

	const pkg = new Package(packageJson);

	strictEqual(pkg.name, "no-files-test");
	strictEqual(pkg.version, "2.0.0");
	// Without files, no entry points can be validated - returns empty
	deepStrictEqual(pkg.entryPoints, {});
});

test("Package - handles complex real-world package.json", () => {
	const packageJson = JSON.stringify({
		name: "@scope/complex-package",
		version: "1.2.3-beta.4",
		description: "A complex package with many features",
		main: "./dist/index.js",
		exports: {
			".": {
				import: "./dist/esm/index.js",
				require: "./dist/cjs/index.js",
			},
			"./utils": "./dist/utils.js",
		},
		scripts: {
			build: "tsc",
			test: "jest",
		},
		dependencies: {
			lodash: "^4.17.21",
		},
	});

	const files = new Set([
		"dist/esm/index.js",
		"dist/cjs/index.js",
		"dist/utils.js",
		"package.json",
	]);

	const pkg = new Package(packageJson, files);

	strictEqual(pkg.name, "@scope/complex-package");
	strictEqual(pkg.version, "1.2.3-beta.4");
	strictEqual(pkg.description, "A complex package with many features");
	// Entry points should use import condition for modern ESM
	deepStrictEqual(pkg.entryPoints, {
		".": "dist/esm/index.js",
		"./utils": "dist/utils.js",
	});
});
