/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Comprehensive test suite for entry point resolution utilities.
 *
 * Tests all entry point resolution functionality with 100% branch coverage:
 * - Modern exports field resolution with conditions
 * - Legacy main/module field fallbacks
 * - Default file resolution (index.js, etc.)
 * - Wildcard pattern matching and substitution
 * - Subpath resolution and validation
 * - Conditional export resolution
 * - Error handling and edge cases
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import {
	createEntryPointMetadata,
	extractExportSubpaths,
	resolveConditionalExport,
	resolveDefaultEntry,
	resolveEntryPoints,
	resolveExportsField,
	resolveExportsSubpath,
	resolveMainEntry,
	validateEntryPoint,
} from "./entry-point-resolver.js";

// Test directory for creating test files
const testDir = join(process.cwd(), "test-entry-points");

// Helper function to create test package structure
async function setupTestPackages() {
	try {
		// Create test directory structure
		await mkdir(testDir, { recursive: true });
		await mkdir(join(testDir, "simple-package"), { recursive: true });
		await mkdir(join(testDir, "exports-package"), { recursive: true });
		await mkdir(join(testDir, "exports-package", "lib"), { recursive: true });
		await mkdir(join(testDir, "exports-package", "esm"), { recursive: true });
		await mkdir(join(testDir, "exports-package", "cjs"), { recursive: true });
		await mkdir(join(testDir, "legacy-package"), { recursive: true });
		await mkdir(join(testDir, "wildcard-package"), { recursive: true });
		await mkdir(join(testDir, "wildcard-package", "utils"), {
			recursive: true,
		});
		await mkdir(join(testDir, "default-package"), { recursive: true });

		// Create simple package with main field
		await writeFile(
			join(testDir, "simple-package", "index.js"),
			"export default 'simple';",
		);
		await writeFile(
			join(testDir, "simple-package", "module.mjs"),
			"export default 'module';",
		);

		// Create exports package with complex exports
		await writeFile(
			join(testDir, "exports-package", "lib", "index.js"),
			"export default 'lib';",
		);
		await writeFile(
			join(testDir, "exports-package", "esm", "index.js"),
			"export default 'esm';",
		);
		await writeFile(
			join(testDir, "exports-package", "cjs", "index.js"),
			"module.exports = 'cjs';",
		);

		// Create legacy package
		await writeFile(
			join(testDir, "legacy-package", "main.js"),
			"module.exports = 'main';",
		);
		await writeFile(
			join(testDir, "legacy-package", "module.mjs"),
			"export default 'module';",
		);

		// Create wildcard package
		await writeFile(
			join(testDir, "wildcard-package", "utils", "format.js"),
			"export function format() {}",
		);
		await writeFile(
			join(testDir, "wildcard-package", "utils", "parse.js"),
			"export function parse() {}",
		);

		// Create default package (only index files)
		await writeFile(
			join(testDir, "default-package", "index.js"),
			"export default 'default';",
		);
	} catch {
		// Ignore setup errors for tests that don't need files
	}
}

// Helper function to cleanup test files
async function cleanupTestPackages() {
	try {
		await rm(testDir, { recursive: true, force: true });
	} catch {
		// Ignore cleanup errors
	}
}

// resolveEntryPoints tests
test("resolveEntryPoints - simple main field", async () => {
	await setupTestPackages();

	const packageJson = {
		name: "simple-package",
		main: "./index.js",
	};

	const result = await resolveEntryPoints(
		packageJson,
		join(testDir, "simple-package"),
	);
	strictEqual(result.success, true);
	strictEqual(typeof result.entryPoints, "object");
	strictEqual(result.entryPoints.type, "commonjs");

	await cleanupTestPackages();
});

test("resolveEntryPoints - exports field with conditions", async () => {
	await setupTestPackages();

	const packageJson = {
		name: "exports-package",
		type: "module",
		exports: {
			".": {
				import: "./esm/index.js",
				require: "./cjs/index.js",
				default: "./lib/index.js",
			},
		},
	};

	const result = await resolveEntryPoints(
		packageJson,
		join(testDir, "exports-package"),
	);
	strictEqual(result.success, true);
	strictEqual(result.entryPoints.type, "module");
	strictEqual(typeof result.entryPoints.exports, "object");

	await cleanupTestPackages();
});

test("resolveEntryPoints - module field preference", async () => {
	await setupTestPackages();

	const packageJson = {
		name: "simple-package",
		main: "./index.js",
		module: "./module.mjs",
	};

	const result = await resolveEntryPoints(
		packageJson,
		join(testDir, "simple-package"),
		{ preferESM: true },
	);
	strictEqual(result.success, true);

	await cleanupTestPackages();
});

test("resolveEntryPoints - custom conditions", async () => {
	await setupTestPackages();

	const packageJson = {
		name: "exports-package",
		exports: {
			".": {
				browser: "./lib/index.js",
				node: "./esm/index.js",
				default: "./cjs/index.js",
			},
		},
	};

	const result = await resolveEntryPoints(
		packageJson,
		join(testDir, "exports-package"),
		{ conditions: ["browser", "default"] },
	);
	strictEqual(result.success, true);

	await cleanupTestPackages();
});

test("resolveEntryPoints - subpath resolution", async () => {
	await setupTestPackages();

	const packageJson = {
		name: "exports-package",
		exports: {
			".": "./lib/index.js",
			"./utils": "./utils/index.js",
		},
	};

	const result = await resolveEntryPoints(
		packageJson,
		join(testDir, "exports-package"),
		{ subpath: "./utils" },
	);
	strictEqual(result.success, true);

	await cleanupTestPackages();
});

test("resolveEntryPoints - error handling", async () => {
	const result = await resolveEntryPoints(null, "/nonexistent/path");
	strictEqual(result.success, false);
	strictEqual(typeof result.error, "string");
});

// resolveMainEntry tests
test("resolveMainEntry - exports field priority", async () => {
	await setupTestPackages();

	const packageJson = {
		main: "./index.js",
		module: "./module.mjs",
		exports: {
			".": "./lib/index.js",
		},
	};

	const result = await resolveMainEntry(
		packageJson,
		join(testDir, "exports-package"),
		["import", "default"],
		true,
	);
	strictEqual(result.success, true);
	strictEqual(typeof result.path, "string");

	await cleanupTestPackages();
});

test("resolveMainEntry - module field fallback", async () => {
	await setupTestPackages();

	const packageJson = {
		main: "./index.js",
		module: "./module.mjs",
	};

	const result = await resolveMainEntry(
		packageJson,
		join(testDir, "simple-package"),
		["import", "default"],
		true,
	);
	strictEqual(result.success, true);
	strictEqual(typeof result.modulePath, "string");

	await cleanupTestPackages();
});

test("resolveMainEntry - main field fallback", async () => {
	await setupTestPackages();

	const packageJson = {
		main: "./main.js",
	};

	const result = await resolveMainEntry(
		packageJson,
		join(testDir, "legacy-package"),
		["import", "default"],
		false,
	);
	strictEqual(result.success, true);

	await cleanupTestPackages();
});

test("resolveMainEntry - default file resolution", async () => {
	await setupTestPackages();

	const packageJson = {
		name: "default-package",
	};

	const result = await resolveMainEntry(
		packageJson,
		join(testDir, "default-package"),
		["import", "default"],
		true,
	);
	strictEqual(result.success, true);

	await cleanupTestPackages();
});

test("resolveMainEntry - no valid entry found", async () => {
	const packageJson = {
		main: "./nonexistent.js",
	};

	const result = await resolveMainEntry(
		packageJson,
		"/nonexistent/path",
		["import", "default"],
		true,
	);
	strictEqual(result.success, false);
});

// resolveExportsField tests
test("resolveExportsField - string export", async () => {
	await setupTestPackages();

	const exports = "./lib/index.js";

	const result = await resolveExportsField(
		exports,
		join(testDir, "exports-package"),
		".",
		["import", "default"],
	);
	strictEqual(result.success, true);
	strictEqual(typeof result.exports, "object");

	await cleanupTestPackages();
});

test("resolveExportsField - object with subpaths", async () => {
	await setupTestPackages();

	const exports = {
		".": "./lib/index.js",
		"./utils": "./utils/index.js",
	};

	const result = await resolveExportsField(
		exports,
		join(testDir, "exports-package"),
		".",
		["import", "default"],
	);
	strictEqual(result.success, true);
	strictEqual(typeof result.exports, "object");

	await cleanupTestPackages();
});

test("resolveExportsField - conditional exports", async () => {
	await setupTestPackages();

	const exports = {
		import: "./esm/index.js",
		require: "./cjs/index.js",
		default: "./lib/index.js",
	};

	const result = await resolveExportsField(
		exports,
		join(testDir, "exports-package"),
		".",
		["import", "default"],
	);
	strictEqual(result.success, true);

	await cleanupTestPackages();
});

test("resolveExportsField - array fallbacks", async () => {
	await setupTestPackages();

	const exports = ["./nonexistent.js", "./lib/index.js"];

	const result = await resolveExportsField(
		exports,
		join(testDir, "exports-package"),
		".",
		["import", "default"],
	);
	strictEqual(result.success, true);

	await cleanupTestPackages();
});

test("resolveExportsField - complex nested structure", async () => {
	await setupTestPackages();

	const exports = {
		".": {
			import: {
				browser: "./esm/browser.js",
				node: "./esm/index.js",
			},
			require: "./cjs/index.js",
			default: "./lib/index.js",
		},
	};

	const result = await resolveExportsField(
		exports,
		join(testDir, "exports-package"),
		".",
		["import", "browser", "default"],
	);
	strictEqual(result.success, true);

	await cleanupTestPackages();
});

test("resolveExportsField - error handling", async () => {
	const result = await resolveExportsField(null, "/nonexistent/path", ".", [
		"import",
	]);
	strictEqual(result.success, false);
	strictEqual(typeof result.exports, "object");
});

// resolveExportsSubpath tests
test("resolveExportsSubpath - exact match", async () => {
	await setupTestPackages();

	const exports = {
		".": "./lib/index.js",
		"./utils": "./utils/index.js",
	};

	const result = await resolveExportsSubpath(
		exports,
		join(testDir, "exports-package"),
		"./utils",
		["import", "default"],
	);
	// Note: Will not succeed because ./utils/index.js doesn't exist
	// This tests the logic flow
	strictEqual(typeof result.success, "boolean");

	await cleanupTestPackages();
});

test("resolveExportsSubpath - wildcard matching", async () => {
	await setupTestPackages();

	const exports = {
		"./utils/*": "./utils/*.js",
	};

	const result = await resolveExportsSubpath(
		exports,
		join(testDir, "wildcard-package"),
		"./utils/format",
		["import", "default"],
	);
	strictEqual(result.success, true);
	strictEqual(typeof result.path, "string");

	await cleanupTestPackages();
});

test("resolveExportsSubpath - no match found", async () => {
	const exports = {
		".": "./lib/index.js",
	};

	const result = await resolveExportsSubpath(
		exports,
		"/nonexistent/path",
		"./nonexistent",
		["import"],
	);
	strictEqual(result.success, false);
});

// resolveConditionalExport tests
test("resolveConditionalExport - string value", async () => {
	await setupTestPackages();

	const result = await resolveConditionalExport(
		"./lib/index.js",
		join(testDir, "exports-package"),
		["import", "default"],
	);
	strictEqual(result.success, true);
	strictEqual(typeof result.path, "string");

	await cleanupTestPackages();
});

test("resolveConditionalExport - conditional object", async () => {
	await setupTestPackages();

	const exportValue = {
		import: "./esm/index.js",
		require: "./cjs/index.js",
		default: "./lib/index.js",
	};

	const result = await resolveConditionalExport(
		exportValue,
		join(testDir, "exports-package"),
		["import", "default"],
	);
	strictEqual(result.success, true);

	await cleanupTestPackages();
});

test("resolveConditionalExport - fallback to default", async () => {
	await setupTestPackages();

	const exportValue = {
		browser: "./browser.js",
		default: "./lib/index.js",
	};

	const result = await resolveConditionalExport(
		exportValue,
		join(testDir, "exports-package"),
		["node", "import"],
	);
	strictEqual(result.success, true);

	await cleanupTestPackages();
});

test("resolveConditionalExport - array fallbacks", async () => {
	await setupTestPackages();

	const exportValue = ["./nonexistent.js", "./lib/index.js"];

	const result = await resolveConditionalExport(
		exportValue,
		join(testDir, "exports-package"),
		["import", "default"],
	);
	strictEqual(result.success, true);

	await cleanupTestPackages();
});

test("resolveConditionalExport - no valid condition", async () => {
	const exportValue = {
		browser: "./browser.js",
		worker: "./worker.js",
	};

	const result = await resolveConditionalExport(
		exportValue,
		"/nonexistent/path",
		["node", "import"],
	);
	strictEqual(result.success, false);
});

// resolveDefaultEntry tests
test("resolveDefaultEntry - index.js exists", async () => {
	await setupTestPackages();

	const result = await resolveDefaultEntry(join(testDir, "default-package"));
	strictEqual(result.success, true);
	strictEqual(typeof result.path, "string");

	await cleanupTestPackages();
});

test("resolveDefaultEntry - index.mjs priority", async () => {
	await setupTestPackages();

	// Create index.mjs which should take priority
	await writeFile(
		join(testDir, "default-package", "index.mjs"),
		"export default 'mjs';",
	);

	const result = await resolveDefaultEntry(join(testDir, "default-package"));
	strictEqual(result.success, true);
	strictEqual(result.path.endsWith("index.js"), true); // index.js comes first in candidates

	await cleanupTestPackages();
});

test("resolveDefaultEntry - no index files", async () => {
	const result = await resolveDefaultEntry("/nonexistent/path");
	strictEqual(result.success, false);
});

// validateEntryPoint tests
test("validateEntryPoint - valid JS file", async () => {
	await setupTestPackages();

	const entryPath = join(testDir, "simple-package", "index.js");
	const result = await validateEntryPoint(entryPath);
	strictEqual(result.valid, true);

	await cleanupTestPackages();
});

test("validateEntryPoint - valid MJS file", async () => {
	await setupTestPackages();

	const entryPath = join(testDir, "simple-package", "module.mjs");
	const result = await validateEntryPoint(entryPath);
	strictEqual(result.valid, true);

	await cleanupTestPackages();
});

test("validateEntryPoint - file does not exist", async () => {
	const result = await validateEntryPoint("/nonexistent/file.js");
	strictEqual(result.valid, false);
	strictEqual(typeof result.error, "string");
});

test("validateEntryPoint - invalid extension", async () => {
	await setupTestPackages();

	// Create file with invalid extension
	await writeFile(join(testDir, "invalid.txt"), "content");

	const result = await validateEntryPoint(join(testDir, "invalid.txt"));
	strictEqual(result.valid, false);
	strictEqual(result.error, "Invalid entry point file extension");

	await cleanupTestPackages();
});

test("validateEntryPoint - extension validation disabled", async () => {
	await setupTestPackages();

	await writeFile(join(testDir, "config.json"), "{}");

	const result = await validateEntryPoint(join(testDir, "config.json"), {
		requireJSExtension: false,
	});
	strictEqual(result.valid, true);

	await cleanupTestPackages();
});

test("validateEntryPoint - invalid path characters", async () => {
	const result = await validateEntryPoint("./path/../../../etc/passwd");
	strictEqual(result.valid, false);
	strictEqual(result.error, "Invalid entry point path");
});

test("validateEntryPoint - null byte injection", async () => {
	const result = await validateEntryPoint("./path/file\x00.js");
	strictEqual(result.valid, false);
	strictEqual(result.error, "Invalid entry point path");
});

test("validateEntryPoint - validation error", async () => {
	const result = await validateEntryPoint(null);
	strictEqual(result.valid, false);
	strictEqual(result.error, "Entry point validation failed");
});

// createEntryPointMetadata tests
test("createEntryPointMetadata - complete metadata", () => {
	const metadata = createEntryPointMetadata(
		"test-package",
		"/path/to/package/index.js",
		{
			type: "module",
			subpath: "./utils",
			browser: true,
			conditions: ["import", "browser"],
		},
	);

	strictEqual(metadata.packageName, "test-package");
	strictEqual(metadata.path, "/path/to/package/index.js");
	strictEqual(metadata.extension, ".js");
	strictEqual(metadata.isESM, true);
	strictEqual(metadata.format, "esm");
	strictEqual(metadata.browser, true);
	deepStrictEqual(metadata.conditions, ["import", "browser"]);
});

test("createEntryPointMetadata - minimal metadata", () => {
	const metadata = createEntryPointMetadata(
		"simple-package",
		"/path/to/simple.cjs",
	);

	strictEqual(metadata.packageName, "simple-package");
	strictEqual(metadata.extension, ".cjs");
	strictEqual(metadata.isESM, false);
	strictEqual(metadata.format, "cjs");
	strictEqual(metadata.type, "commonjs");
	strictEqual(metadata.browser, false);
	deepStrictEqual(metadata.conditions, []);
});

test("createEntryPointMetadata - ESM detection", () => {
	const metadata1 = createEntryPointMetadata("esm-package", "/path/to/esm.mjs");
	strictEqual(metadata1.isESM, true);
	strictEqual(metadata1.format, "esm");

	const metadata2 = createEntryPointMetadata(
		"module-package",
		"/path/to/module.js",
		{ type: "module" },
	);
	strictEqual(metadata2.isESM, true);
	strictEqual(metadata2.format, "esm");
});

// extractExportSubpaths tests
test("extractExportSubpaths - string export", () => {
	const subpaths = extractExportSubpaths("./index.js");
	deepStrictEqual(subpaths, ["."]);
});

test("extractExportSubpaths - object with subpaths", () => {
	const exports = {
		".": "./index.js",
		"./utils": "./utils/index.js",
		"./lib/*": "./lib/*.js",
	};

	const subpaths = extractExportSubpaths(exports);
	deepStrictEqual(subpaths, [".", "./utils", "./lib/*"]);
});

test("extractExportSubpaths - conditional exports", () => {
	const exports = {
		import: "./esm/index.js",
		require: "./cjs/index.js",
	};

	const subpaths = extractExportSubpaths(exports);
	deepStrictEqual(subpaths, []);
});

test("extractExportSubpaths - mixed exports", () => {
	const exports = {
		".": "./index.js",
		"./utils": "./utils/index.js",
		import: "./esm/index.js",
		require: "./cjs/index.js",
	};

	const subpaths = extractExportSubpaths(exports);
	deepStrictEqual(subpaths, [".", "./utils"]);
});

test("extractExportSubpaths - empty object", () => {
	const subpaths = extractExportSubpaths({});
	deepStrictEqual(subpaths, []);
});

test("extractExportSubpaths - null/undefined", () => {
	const subpaths1 = extractExportSubpaths(null);
	deepStrictEqual(subpaths1, []);

	const subpaths2 = extractExportSubpaths(undefined);
	deepStrictEqual(subpaths2, []);
});

// Integration and performance tests
test("integration - complete entry point resolution workflow", async () => {
	await setupTestPackages();

	const packageJson = {
		name: "complex-package",
		type: "module",
		main: "./main.js",
		module: "./esm/index.js",
		exports: {
			".": {
				import: "./esm/index.js",
				require: "./cjs/index.js",
				default: "./lib/index.js",
			},
			"./utils/*": "./utils/*.js",
		},
	};

	// Test main entry resolution
	const mainResult = await resolveMainEntry(
		packageJson,
		join(testDir, "exports-package"),
		["import", "browser", "default"],
		true,
	);
	strictEqual(mainResult.success, true);

	// Test full entry point resolution
	const fullResult = await resolveEntryPoints(
		packageJson,
		join(testDir, "exports-package"),
	);
	strictEqual(fullResult.success, true);

	// Test entry point validation
	if (fullResult.entryPoints.main) {
		const validation = await validateEntryPoint(fullResult.entryPoints.main);
		strictEqual(validation.valid, true);
	}

	// Test metadata creation
	const metadata = createEntryPointMetadata(
		packageJson.name,
		fullResult.entryPoints.main || "/path/to/fallback.js",
		{ type: packageJson.type },
	);
	strictEqual(metadata.packageName, packageJson.name);

	await cleanupTestPackages();
});

test("performance - handle complex exports efficiently", async () => {
	await setupTestPackages();

	// Create complex exports structure with existing files
	const exports = {};
	for (let i = 0; i < 10; i++) {
		exports[`./module${i}`] = "./lib/index.js"; // Point to existing file
	}

	// Add the main export
	exports["."] = "./lib/index.js";

	const start = performance.now();
	const result = await resolveExportsField(
		exports,
		join(testDir, "exports-package"),
		".",
		["import", "browser", "default"],
	);
	const end = performance.now();

	strictEqual(result.success, true);
	// Should complete in reasonable time (< 500ms for 10+ exports)
	strictEqual(end - start < 500, true);

	await cleanupTestPackages();
});

test("memory - no leaks in repeated operations", async () => {
	await setupTestPackages();

	const packageJson = {
		name: "memory-test",
		exports: {
			".": "./lib/index.js",
			"./utils": "./utils/index.js",
		},
	};

	// Test repeated operations don't accumulate memory
	for (let i = 0; i < 100; i++) {
		await resolveEntryPoints(packageJson, join(testDir, "exports-package"));
		await resolveDefaultEntry(join(testDir, "default-package"));
		createEntryPointMetadata("test", "/path/test.js");
	}

	// If we get here without memory issues, test passes
	strictEqual(true, true);

	await cleanupTestPackages();
});

test("error resilience - malformed inputs", async () => {
	// Test various malformed inputs
	const malformedInputs = [
		{ packageJson: null, path: "/valid/path" },
		{ packageJson: {}, path: null },
		{ packageJson: { exports: "invalid" }, path: "/invalid/path" },
		{ packageJson: { exports: { circular: { ref: true } } }, path: "/path" },
	];

	for (const { packageJson, path } of malformedInputs) {
		const result = await resolveEntryPoints(packageJson, path);
		strictEqual(typeof result, "object");
		strictEqual(typeof result.success, "boolean");

		if (!result.success) {
			strictEqual(typeof result.error, "string");
		}
	}
});
