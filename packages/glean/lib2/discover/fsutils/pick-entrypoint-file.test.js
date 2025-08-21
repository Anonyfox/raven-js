/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for Node.js entry point file resolution.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { pickEntrypointFile } from "./pick-entrypoint-file.js";

test("pickEntrypointFile - invalid inputs", () => {
	strictEqual(pickEntrypointFile(null, "index.js"), null);
	strictEqual(pickEntrypointFile([], "index.js"), null);
	strictEqual(pickEntrypointFile(["index.js"], null), null);
	strictEqual(pickEntrypointFile(["index.js"], ""), null);
	strictEqual(pickEntrypointFile("not-array", "index.js"), null);
});

test("pickEntrypointFile - exact matches", () => {
	const files = [
		"index.js",
		"lib/utils.js",
		"src/main.mjs",
		"components/Button.jsx",
	];

	strictEqual(pickEntrypointFile(files, "index.js"), "index.js");
	strictEqual(pickEntrypointFile(files, "./index.js"), "index.js");
	strictEqual(pickEntrypointFile(files, "lib/utils.js"), "lib/utils.js");
	strictEqual(pickEntrypointFile(files, "./lib/utils.js"), "lib/utils.js");
	strictEqual(pickEntrypointFile(files, "src/main.mjs"), "src/main.mjs");
	strictEqual(
		pickEntrypointFile(files, "components/Button.jsx"),
		"components/Button.jsx",
	);
});

test("pickEntrypointFile - index.js resolution", () => {
	const files = [
		"lib/index.js",
		"src/index.mjs",
		"components/index.jsx",
		"utils/helper.js",
		"mixed/index.js",
		"mixed/main.js",
	];

	strictEqual(pickEntrypointFile(files, "lib"), "lib/index.js");
	strictEqual(pickEntrypointFile(files, "./lib"), "lib/index.js");
	strictEqual(pickEntrypointFile(files, "src"), "src/index.mjs");
	strictEqual(pickEntrypointFile(files, "components"), "components/index.jsx");
	strictEqual(pickEntrypointFile(files, "mixed"), "mixed/index.js"); // .js takes precedence
});

test("pickEntrypointFile - extension inference", () => {
	const files = [
		"utils.js",
		"parser.mjs",
		"component.jsx",
		"config.json", // Should be ignored
		"readme.md", // Should be ignored
	];

	strictEqual(pickEntrypointFile(files, "utils"), "utils.js");
	strictEqual(pickEntrypointFile(files, "./utils"), "utils.js");
	strictEqual(pickEntrypointFile(files, "parser"), "parser.mjs");
	strictEqual(pickEntrypointFile(files, "component"), "component.jsx");
	strictEqual(pickEntrypointFile(files, "config"), null); // .json not JS
	strictEqual(pickEntrypointFile(files, "readme"), null); // .md not JS
});

test("pickEntrypointFile - precedence order", () => {
	const files = [
		"test.js",
		"test.mjs",
		"test.jsx",
		"test/index.js",
		"test/index.mjs",
		"test/index.jsx",
	];

	// Direct match takes precedence over directory resolution
	strictEqual(pickEntrypointFile(files, "test.js"), "test.js");
	strictEqual(pickEntrypointFile(files, "test.mjs"), "test.mjs");

	// When resolving as directory, index.js takes precedence
	strictEqual(pickEntrypointFile(files, "test"), "test.js"); // Extension inference wins over directory

	// Test directory resolution precedence
	const dirFiles = ["mylib/index.js", "mylib/index.mjs", "mylib/index.jsx"];
	strictEqual(pickEntrypointFile(dirFiles, "mylib"), "mylib/index.js");

	const mjsOnlyDir = ["mylib/index.mjs", "mylib/index.jsx"];
	strictEqual(pickEntrypointFile(mjsOnlyDir, "mylib"), "mylib/index.mjs");

	const jsxOnlyDir = ["mylib/index.jsx"];
	strictEqual(pickEntrypointFile(jsxOnlyDir, "mylib"), "mylib/index.jsx");
});

test("pickEntrypointFile - no matches", () => {
	const files = ["index.js", "lib/utils.js"];

	strictEqual(pickEntrypointFile(files, "missing"), null);
	strictEqual(pickEntrypointFile(files, "src/missing"), null);
	strictEqual(pickEntrypointFile(files, "lib/missing.js"), null);
	strictEqual(pickEntrypointFile(files, "nonexistent"), null);
});

test("pickEntrypointFile - non-JavaScript files filtered", () => {
	const files = [
		"config.json",
		"styles.css",
		"readme.md",
		"data.txt",
		"image.png",
	];

	strictEqual(pickEntrypointFile(files, "config.json"), null);
	strictEqual(pickEntrypointFile(files, "styles.css"), null);
	strictEqual(pickEntrypointFile(files, "config"), null); // No JS equivalent
	strictEqual(pickEntrypointFile(files, "styles"), null); // No JS equivalent
});

test("pickEntrypointFile - complex resolution scenarios", () => {
	const files = [
		"index.js",
		"lib/index.js",
		"lib/parser.js",
		"lib/utils.mjs",
		"src/main.jsx",
		"src/components/Button.jsx",
		"src/components/index.js",
		"package.json",
		"readme.md",
	];

	// Root resolution
	strictEqual(pickEntrypointFile(files, "."), null); // No index at root level matching "."
	strictEqual(pickEntrypointFile(files, "index"), "index.js");

	// Directory resolution
	strictEqual(pickEntrypointFile(files, "lib"), "lib/index.js");
	strictEqual(
		pickEntrypointFile(files, "src/components"),
		"src/components/index.js",
	);

	// Specific file resolution
	strictEqual(pickEntrypointFile(files, "lib/parser"), "lib/parser.js");
	strictEqual(pickEntrypointFile(files, "lib/utils"), "lib/utils.mjs");
	strictEqual(pickEntrypointFile(files, "src/main"), "src/main.jsx");

	// Non-existent paths
	strictEqual(pickEntrypointFile(files, "src/missing"), null);
	strictEqual(pickEntrypointFile(files, "missing/lib"), null);
});

test("pickEntrypointFile - empty inputs", () => {
	strictEqual(pickEntrypointFile([], "index"), null);
	strictEqual(pickEntrypointFile(["index.js"], ""), null);
	strictEqual(pickEntrypointFile([], ""), null);
});
