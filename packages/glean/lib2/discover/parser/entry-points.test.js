/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for package.json entry point extraction according to Node.js specification.
 */

import { deepStrictEqual } from "node:assert";
import { test } from "node:test";
import { extractEntryPoints } from "./entry-points.js";

test("extractEntryPoints - no main or exports field", () => {
	const packageJson = {
		name: "empty-package",
		version: "1.0.0",
	};

	const result = extractEntryPoints(packageJson, new Set());
	deepStrictEqual(result, {});
});

test("extractEntryPoints - with file validation", () => {
	const packageJson = {
		name: "validated-package",
		exports: {
			".": "./index.js",
			"./utils": "./lib/utils.js",
			"./missing": "./lib/missing.js",
		},
	};

	const availableFiles = new Set(["index.js", "lib/utils.js", "package.json"]);

	const result = extractEntryPoints(packageJson, availableFiles);
	deepStrictEqual(result, {
		".": "index.js",
		"./utils": "lib/utils.js",
		// missing.js should be filtered out
	});
});

test("extractEntryPoints - wildcard pattern resolution", () => {
	const packageJson = {
		name: "wildcard-package",
		exports: {
			".": "./index.js",
			"./lib/*": "./lib/*.js",
			"./utils/*": "./utils/*",
		},
	};

	const availableFiles = new Set([
		"index.js",
		"lib/helper.js",
		"lib/parser.js",
		"lib/readme.md", // Should be filtered out (not JS)
		"utils/format.js",
		"utils/validate.mjs",
		"package.json",
	]);

	const result = extractEntryPoints(packageJson, availableFiles);
	deepStrictEqual(result, {
		".": "index.js",
		"./lib/helper": "./lib/helper.js",
		"./lib/parser": "./lib/parser.js",
		"./utils/format": "./utils/format.js",
		"./utils/validate": "./utils/validate.mjs",
	});
});

test("extractEntryPoints - index.js resolution", () => {
	const packageJson = {
		name: "index-resolution-package",
		exports: {
			".": "./src",
			"./lib": "./lib",
			"./utils": "./utils",
		},
	};

	const availableFiles = new Set([
		"src/index.js",
		"lib/index.mjs",
		"utils/index.jsx",
		"package.json",
	]);

	const result = extractEntryPoints(packageJson, availableFiles);
	deepStrictEqual(result, {
		".": "src/index.js",
		"./lib": "lib/index.mjs",
		"./utils": "utils/index.jsx",
	});
});

test("extractEntryPoints - extension resolution", () => {
	const packageJson = {
		name: "extension-package",
		exports: {
			".": "./index",
			"./utils": "./lib/utils",
		},
	};

	const availableFiles = new Set(["index.js", "lib/utils.js", "package.json"]);

	const result = extractEntryPoints(packageJson, availableFiles);
	deepStrictEqual(result, {
		".": "index.js",
		"./utils": "lib/utils.js",
	});
});

test("extractEntryPoints - JavaScript file filtering", () => {
	const packageJson = {
		name: "js-filtering-package",
		exports: {
			"./lib/*": "./lib/*",
		},
	};

	const availableFiles = new Set([
		"lib/module.js",
		"lib/component.jsx",
		"lib/modern.mjs",
		"lib/readme.md",
		"lib/config.json",
		"lib/styles.css",
	]);

	const result = extractEntryPoints(packageJson, availableFiles);
	deepStrictEqual(result, {
		"./lib/module": "./lib/module.js",
		"./lib/component": "./lib/component.jsx",
		"./lib/modern": "./lib/modern.mjs",
		// Non-JS files should be filtered out
	});
});

test("extractEntryPoints - empty availableFiles", () => {
	const packageJson = {
		name: "empty-files-package",
		main: "./index.js",
		exports: {
			".": "./index.js",
			"./utils": "./lib/utils.js",
		},
	};

	const result = extractEntryPoints(packageJson, new Set());
	deepStrictEqual(result, {});
});

test("extractEntryPoints - throws TypeError when availableFiles is missing", () => {
	const packageJson = {
		name: "test-package",
		main: "./index.js",
	};

	try {
		extractEntryPoints(packageJson);
		throw new Error("Should have thrown TypeError");
	} catch (error) {
		deepStrictEqual(error instanceof TypeError, true);
		deepStrictEqual(error.message, "availableFiles parameter must be a Set");
	}
});

test("extractEntryPoints - throws TypeError when availableFiles is not a Set", () => {
	const packageJson = {
		name: "test-package",
		main: "./index.js",
	};

	try {
		extractEntryPoints(packageJson, ["index.js"]);
		throw new Error("Should have thrown TypeError");
	} catch (error) {
		deepStrictEqual(error instanceof TypeError, true);
		deepStrictEqual(error.message, "availableFiles parameter must be a Set");
	}
});
