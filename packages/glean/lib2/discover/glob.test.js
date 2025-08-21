/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for glob pattern matching function.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { glob } from "./glob.js";

test("glob - invalid inputs", () => {
	strictEqual(glob("", ""), false);
	strictEqual(glob(null, "file.js"), false);
	strictEqual(glob("*.js", null), false);
	strictEqual(glob(undefined, "file.js"), false);
});

test("glob - exact matches", () => {
	strictEqual(glob("file.js", "file.js"), true);
	strictEqual(glob("lib/index.js", "lib/index.js"), true);
	strictEqual(glob("./file.js", "file.js"), true);
	strictEqual(glob("file.js", "./file.js"), true);
	strictEqual(glob("./lib/index.js", "./lib/index.js"), true);
});

test("glob - simple wildcard patterns", () => {
	strictEqual(glob("*.js", "file.js"), true);
	strictEqual(glob("*.js", "index.js"), true);
	strictEqual(glob("*.js", "utils.js"), true);
	strictEqual(glob("*.js", "file.mjs"), false);
	strictEqual(glob("*.js", "file.txt"), false);
});

test("glob - directory wildcard patterns", () => {
	strictEqual(glob("lib/*.js", "lib/index.js"), true);
	strictEqual(glob("lib/*.js", "lib/utils.js"), true);
	strictEqual(glob("lib/*.js", "lib/helper.js"), true);
	strictEqual(glob("lib/*.js", "lib/nested/file.js"), false);
	strictEqual(glob("lib/*.js", "src/file.js"), false);
});

test("glob - generic wildcard patterns", () => {
	strictEqual(glob("lib/*", "lib/index.js"), true);
	strictEqual(glob("lib/*", "lib/utils.mjs"), true);
	strictEqual(glob("lib/*", "lib/config.json"), true);
	strictEqual(glob("lib/*", "lib/nested/file.js"), false);
	strictEqual(glob("utils/*", "utils/format.js"), true);
});

test("glob - leading ./ normalization", () => {
	strictEqual(glob("./lib/*.js", "lib/index.js"), true);
	strictEqual(glob("lib/*.js", "./lib/index.js"), true);
	strictEqual(glob("./lib/*.js", "./lib/index.js"), true);
	strictEqual(glob("./utils/*", "utils/format.js"), true);
});

test("glob - question mark wildcard", () => {
	strictEqual(glob("file?.js", "file1.js"), true);
	strictEqual(glob("file?.js", "fileA.js"), true);
	strictEqual(glob("file?.js", "file.js"), false);
	strictEqual(glob("file?.js", "file12.js"), false);
});

test("glob - multiple wildcards", () => {
	strictEqual(glob("*/*.js", "lib/index.js"), true);
	strictEqual(glob("*/*.js", "src/utils.js"), true);
	strictEqual(glob("*/*.js", "file.js"), false);
	strictEqual(glob("*/test*.js", "lib/test.js"), true);
	strictEqual(glob("*/test*.js", "lib/testUtils.js"), true);
});

test("glob - special characters", () => {
	strictEqual(glob("*.config.js", "webpack.config.js"), true);
	strictEqual(glob("*.config.js", "babel.config.js"), true);
	strictEqual(glob("*.config.js", "configjs"), false);
	strictEqual(glob("file-*.js", "file-utils.js"), true);
	strictEqual(glob("file_*.js", "file_helper.js"), true);
});

test("glob - no match cases", () => {
	strictEqual(glob("*.js", ""), false);
	strictEqual(glob("lib/*.js", "lib/"), false);
	strictEqual(glob("lib/*.js", "lib"), false);
	strictEqual(glob("*.js", "lib/file.js"), false);
	strictEqual(glob("src/*", "lib/file.js"), false);
});
