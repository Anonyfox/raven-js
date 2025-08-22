/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for the File model.
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";
import { File } from "./file.js";

test("File - constructor", () => {
	const file = new File("src/index.js", "export const test = 'value';");

	strictEqual(file.path, "src/index.js");
	strictEqual(file.text, "export const test = 'value';");
});

test("File - importedFilePaths with empty file", () => {
	const file = new File("src/index.js", "");
	const availableFiles = new Set(["src/utils.js", "src/helpers.js"]);

	const result = file.importedFilePaths(availableFiles);
	deepStrictEqual(result, new Set());
});

test("File - importedFilePaths with empty Set", () => {
	const file = new File("src/index.js", "import { helper } from './utils.js';");

	// Test with empty Set - no files available to resolve against
	const result = file.importedFilePaths(new Set());
	deepStrictEqual(result, new Set());
});

test("File - importedFilePaths with re-exported imports", () => {
	const fileContent = `
import { helper } from './utils.js';
import { format } from './helpers/format.js';
import { unused } from './unused.js';

// Re-export the imports
export { helper };
export { format };
// unused is not re-exported, so should not be tracked
	`;

	const file = new File("src/index.js", fileContent);
	const availableFiles = new Set([
		"src/utils.js",
		"src/helpers/format.js",
		"src/unused.js",
		"src/other.js",
	]);

	const result = file.importedFilePaths(availableFiles);
	// Only re-exported imports should be tracked
	deepStrictEqual(result, new Set(["src/helpers/format.js", "src/utils.js"]));
});

test("File - importedFilePaths only tracks local re-exports", () => {
	const fileContent = `
import { helper } from './utils.js';
import { external } from 'external-package';

export { helper };
export { external };
export const local = 'value';
`;

	const file = new File("src/index.js", fileContent);
	const availableFiles = new Set(["src/utils.js", "src/other.js"]);

	const result = file.importedFilePaths(availableFiles);
	// Only local re-exported imports should be tracked (npm packages ignored)
	deepStrictEqual(result, new Set(["src/utils.js"]));
});
