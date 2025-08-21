/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for the File class.
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";
import { File } from "./file.js";
import { Identifier } from "./identifier.js";

test("File - constructor", () => {
	const file = new File("src/index.js", "export const test = 'value';");

	strictEqual(file.path, "src/index.js");
	strictEqual(file.text, "export const test = 'value';");
	deepStrictEqual(file.identifiers, []);
});

test("File - importedFilePaths with empty identifiers", () => {
	const file = new File("src/index.js", "");
	const availableFiles = ["src/utils.js", "src/helpers.js"];

	const result = file.importedFilePaths(availableFiles);
	deepStrictEqual(result, []);
});

test("File - importedFilePaths with no imports (local identifiers only)", () => {
	const file = new File("src/index.js", "");
	file.identifiers = [
		new Identifier("localFunc", "localFunc", null),
		new Identifier("localConst", "localConst", null),
	];

	const availableFiles = ["src/utils.js", "src/helpers.js"];
	const result = file.importedFilePaths(availableFiles);
	deepStrictEqual(result, []);
});

test("File - importedFilePaths with relative imports", () => {
	const file = new File("src/index.js", "");
	file.identifiers = [
		new Identifier("helper", "helper", "./utils.js"),
		new Identifier("format", "format", "./helpers/format.js"),
		new Identifier("localFunc", "localFunc", null),
	];

	const availableFiles = [
		"src/utils.js",
		"src/helpers/format.js",
		"src/other.js",
	];

	const result = file.importedFilePaths(availableFiles);
	deepStrictEqual(result, ["src/helpers/format.js", "src/utils.js"]);
});

test("File - importedFilePaths with extension resolution", () => {
	const file = new File("src/index.js", "");
	file.identifiers = [
		new Identifier("helper", "helper", "./utils"), // no extension
		new Identifier("format", "format", "./helpers/format"), // no extension
	];

	const availableFiles = [
		"src/utils.js", // should match "./utils"
		"src/helpers/format.js", // should match "./helpers/format"
		"src/other.js",
	];

	const result = file.importedFilePaths(availableFiles);
	deepStrictEqual(result, ["src/helpers/format.js", "src/utils.js"]);
});

test("File - importedFilePaths with index resolution", () => {
	const file = new File("src/index.js", "");
	file.identifiers = [
		new Identifier("helper", "helper", "./utils"), // should resolve to utils/index.js
		new Identifier("config", "config", "./config"), // should resolve to config/index.js
	];

	const availableFiles = [
		"src/utils/index.js",
		"src/config/index.js",
		"src/other.js",
	];

	const result = file.importedFilePaths(availableFiles);
	deepStrictEqual(result, ["src/config/index.js", "src/utils/index.js"]);
});

test("File - importedFilePaths skips npm packages", () => {
	const file = new File("src/index.js", "");
	file.identifiers = [
		new Identifier("React", "React", "react"), // npm package - should be skipped
		new Identifier("lodash", "lodash", "lodash"), // npm package - should be skipped
		new Identifier("helper", "helper", "./utils.js"), // relative - should be included
	];

	const availableFiles = [
		"src/utils.js",
		"node_modules/react/index.js", // npm packages shouldn't be resolved
		"node_modules/lodash/index.js",
	];

	const result = file.importedFilePaths(availableFiles);
	deepStrictEqual(result, ["src/utils.js"]);
});

test("File - importedFilePaths with nested directories", () => {
	const file = new File("src/components/Button.js", "");
	file.identifiers = [
		new Identifier("utils", "utils", "../utils.js"), // go up one level
		new Identifier("Icon", "Icon", "./Icon.js"), // same directory
		new Identifier("config", "config", "../../config.js"), // go up two levels
	];

	const availableFiles = [
		"src/utils.js",
		"src/components/Icon.js",
		"config.js",
		"src/other.js",
	];

	const result = file.importedFilePaths(availableFiles);
	deepStrictEqual(result, [
		"config.js",
		"src/components/Icon.js",
		"src/utils.js",
	]);
});

test("File - importedFilePaths with duplicate imports", () => {
	const file = new File("src/index.js", "");
	file.identifiers = [
		new Identifier("helper1", "helper1", "./utils.js"),
		new Identifier("helper2", "helper2", "./utils.js"), // same file
		new Identifier("helper3", "helper3", "./utils"), // same file, different syntax
	];

	const availableFiles = ["src/utils.js", "src/other.js"];

	const result = file.importedFilePaths(availableFiles);
	// Should only return unique paths
	deepStrictEqual(result, ["src/utils.js"]);
});

test("File - importedFilePaths with non-existent imports", () => {
	const file = new File("src/index.js", "");
	file.identifiers = [
		new Identifier("helper", "helper", "./utils.js"), // exists
		new Identifier("missing", "missing", "./missing.js"), // doesn't exist
	];

	const availableFiles = [
		"src/utils.js",
		// missing.js is not in available files
	];

	const result = file.importedFilePaths(availableFiles);
	deepStrictEqual(result, ["src/utils.js"]);
});

test("File - importedFilePaths with invalid input", () => {
	const file = new File("src/index.js", "");
	file.identifiers = [new Identifier("helper", "helper", "./utils.js")];

	// Test with non-array input
	const result1 = file.importedFilePaths(null);
	deepStrictEqual(result1, []);

	const result2 = file.importedFilePaths(undefined);
	deepStrictEqual(result2, []);

	const result3 = file.importedFilePaths("not an array");
	deepStrictEqual(result3, []);
});

test("File - importedFilePaths complex real-world scenario", () => {
	const file = new File("src/components/UserProfile.js", "");
	file.identifiers = [
		// Local identifiers
		new Identifier("UserProfile", "UserProfile", null),
		new Identifier("handleClick", "handleClick", null),

		// Relative imports
		new Identifier("Button", "Button", "./Button.js"),
		new Identifier("Icon", "Icon", "./Icon"),
		new Identifier("utils", "utils", "../utils"),
		new Identifier("api", "api", "../services/api"),

		// npm packages (should be ignored)
		new Identifier("React", "React", "react"),
		new Identifier("useState", "useState", "react"),
		new Identifier("styled", "styled", "styled-components"),

		// More relative imports
		new Identifier("theme", "theme", "../../theme.js"),
		new Identifier("constants", "constants", "../../constants"),
	];

	const availableFiles = [
		"src/components/Button.js",
		"src/components/Icon.js",
		"src/utils.js",
		"src/services/api.js",
		"theme.js",
		"constants/index.js",
		"src/other.js",
	];

	const result = file.importedFilePaths(availableFiles);
	deepStrictEqual(result, [
		"constants/index.js",
		"src/components/Button.js",
		"src/components/Icon.js",
		"src/services/api.js",
		"src/utils.js",
		"theme.js",
	]);
});
