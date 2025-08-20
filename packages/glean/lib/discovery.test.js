/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for discovery module - surgical validation of package reconnaissance.
 */

import { strict as assert } from "node:assert";
import { mkdir, rmdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
	buildDependencyMap,
	discoverPackage,
	extractEntryPoints,
	extractImports,
	findReadmeFiles,
	parsePackageJson,
	scanJavaScriptFiles,
} from "./discovery.js";

test("extractEntryPoints handles various package.json configurations", () => {
	// Main field only
	assert.deepEqual(extractEntryPoints({ main: "index.js" }), ["index.js"]);

	// Module field only
	assert.deepEqual(extractEntryPoints({ module: "esm.js" }), ["esm.js"]);

	// Both main and module
	assert.deepEqual(extractEntryPoints({ main: "index.js", module: "esm.js" }), [
		"index.js",
		"esm.js",
	]);

	// String exports
	assert.deepEqual(extractEntryPoints({ exports: "./lib/index.js" }), [
		"./lib/index.js",
	]);

	// Object exports with conditional entries
	assert.deepEqual(
		extractEntryPoints({
			exports: {
				".": {
					import: "./lib/index.js",
					require: "./lib/index.cjs",
				},
			},
		}),
		["./lib/index.js", "./lib/index.cjs"],
	);

	// Complex nested exports
	assert.deepEqual(
		extractEntryPoints({
			exports: {
				".": "./index.js",
				"./sub": {
					import: "./sub/index.js",
					default: "./sub/default.js",
				},
			},
		}),
		["./index.js", "./sub/index.js", "./sub/default.js"],
	);

	// No entry points - fallback to default
	assert.deepEqual(extractEntryPoints({}), ["index.js"]);

	// Duplicate entries should be removed
	assert.deepEqual(
		extractEntryPoints({
			main: "index.js",
			exports: {
				".": "index.js",
			},
		}),
		["index.js"],
	);
});

test("extractImports finds ES6 and dynamic imports", () => {
	const content = `
import { test } from "node:test";
import fs from "./utils.js";
import * as helpers from "../helpers/index.js";
import("./dynamic.js");
import("../other.js");
import external from "external-package";
	`;

	const imports = extractImports(content, "/base/path");

	// Should only include relative imports, resolved to absolute paths
	assert.equal(imports.length, 4);
	assert.ok(imports.includes("/base/utils.js"));
	assert.ok(imports.includes("/helpers/index.js"));
	assert.ok(imports.includes("/base/dynamic.js"));
	assert.ok(imports.includes("/other.js"));

	// Should not include external packages
	assert.ok(!imports.some((path) => path.includes("external-package")));
	assert.ok(!imports.some((path) => path.includes("node:test")));
});

test("extractImports handles edge cases", () => {
	// Empty content
	assert.deepEqual(extractImports("", "/base"), []);

	// No imports
	assert.deepEqual(extractImports("const x = 5;", "/base"), []);

	// Malformed imports (should not crash)
	assert.deepEqual(extractImports('import from "broken', "/base"), []);
});

// Integration tests with temporary filesystem
test("parsePackageJson handles missing and malformed files", async () => {
	// Missing package.json
	const result1 = await parsePackageJson("/nonexistent/path");
	assert.equal(result1, null);

	// Create temporary directory with valid package.json
	const tempDir = join(tmpdir(), `glean-test-${Date.now()}`);
	await mkdir(tempDir, { recursive: true });

	try {
		const packageJson = { name: "test", version: "1.0.0" };
		await writeFile(join(tempDir, "package.json"), JSON.stringify(packageJson));

		const result2 = await parsePackageJson(tempDir);
		assert.deepEqual(result2, packageJson);

		// Malformed package.json
		await writeFile(join(tempDir, "package.json"), "invalid json{");
		const result3 = await parsePackageJson(tempDir);
		assert.equal(result3, null);
	} finally {
		await rmdir(tempDir, { recursive: true });
	}
});

test("scanJavaScriptFiles finds .js and .mjs files", async () => {
	const tempDir = join(tmpdir(), `glean-test-${Date.now()}`);
	await mkdir(tempDir, { recursive: true });
	await mkdir(join(tempDir, "src"), { recursive: true });
	await mkdir(join(tempDir, "node_modules"), { recursive: true });

	try {
		// Create various files
		await writeFile(join(tempDir, "index.js"), "// main");
		await writeFile(join(tempDir, "module.mjs"), "// esm");
		await writeFile(join(tempDir, "style.css"), "/* not js */");
		await writeFile(join(tempDir, "src", "utils.js"), "// nested");
		await writeFile(join(tempDir, "node_modules", "dep.js"), "// excluded");

		const files = await scanJavaScriptFiles(tempDir);

		// Should find .js and .mjs files, but exclude node_modules
		assert.equal(files.length, 3);
		assert.ok(files.some((f) => f.endsWith("index.js")));
		assert.ok(files.some((f) => f.endsWith("module.mjs")));
		assert.ok(files.some((f) => f.endsWith("utils.js")));
		assert.ok(!files.some((f) => f.includes("node_modules")));
		assert.ok(!files.some((f) => f.endsWith("style.css")));
	} finally {
		await rmdir(tempDir, { recursive: true });
	}
});

test("findReadmeFiles locates README files case insensitively", async () => {
	const tempDir = join(tmpdir(), `glean-test-${Date.now()}`);
	await mkdir(tempDir, { recursive: true });
	await mkdir(join(tempDir, "docs"), { recursive: true });

	try {
		// Create various README files
		await writeFile(join(tempDir, "README.md"), "# Root");
		await writeFile(join(tempDir, "readme.txt"), "# Root txt");
		await writeFile(join(tempDir, "Readme.rst"), "# Root rst");
		await writeFile(join(tempDir, "docs", "README.md"), "# Docs");
		await writeFile(join(tempDir, "notreadme.md"), "# Not readme");

		const readmes = await findReadmeFiles(tempDir);

		assert.equal(readmes.length, 4);
		assert.ok(readmes.some((f) => f.endsWith("README.md")));
		assert.ok(readmes.some((f) => f.endsWith("readme.txt")));
		assert.ok(readmes.some((f) => f.endsWith("Readme.rst")));
		assert.ok(readmes.some((f) => f.includes("docs")));
		assert.ok(!readmes.some((f) => f.endsWith("notreadme.md")));
	} finally {
		await rmdir(tempDir, { recursive: true });
	}
});

test("buildDependencyMap creates import mapping", async () => {
	const tempDir = join(tmpdir(), `glean-test-${Date.now()}`);
	await mkdir(tempDir, { recursive: true });

	try {
		const file1 = join(tempDir, "file1.js");
		const file2 = join(tempDir, "file2.js");

		await writeFile(file1, 'import { test } from "./file2.js";');
		await writeFile(file2, 'export const test = "value";');

		const depMap = await buildDependencyMap([file1, file2]);

		assert.equal(depMap.size, 2);
		assert.equal(depMap.get(file1).length, 1);
		assert.ok(depMap.get(file1)[0].endsWith("file2.js"));
		assert.equal(depMap.get(file2).length, 0);
	} finally {
		await rmdir(tempDir, { recursive: true });
	}
});

test("discoverPackage integrates all discovery functions", async () => {
	const tempDir = join(tmpdir(), `glean-test-${Date.now()}`);
	await mkdir(tempDir, { recursive: true });

	try {
		// Setup a small package structure
		await writeFile(
			join(tempDir, "package.json"),
			JSON.stringify({
				name: "test-package",
				main: "index.js",
				exports: {
					".": "./index.js",
					"./sub": "./lib/sub.js",
				},
			}),
		);
		await writeFile(join(tempDir, "index.js"), "export const main = true;");
		await writeFile(join(tempDir, "README.md"), "# Test Package");
		await mkdir(join(tempDir, "lib"), { recursive: true });
		await writeFile(join(tempDir, "lib", "sub.js"), "export const sub = true;");

		const result = await discoverPackage(tempDir);

		assert.ok(result.packageJson);
		assert.equal(result.packageJson.name, "test-package");
		assert.equal(result.entryPoints.length, 2);
		assert.ok(result.entryPoints.includes("index.js"));
		assert.ok(result.entryPoints.includes("./lib/sub.js"));
		assert.equal(result.files.length, 2);
		assert.equal(result.readmes.length, 1);
	} finally {
		await rmdir(tempDir, { recursive: true });
	}
});

test("discovery functions handle inaccessible directories gracefully", async () => {
	// Test with non-existent path
	const files = await scanJavaScriptFiles("/nonexistent/path");
	assert.equal(files.length, 0);

	const readmes = await findReadmeFiles("/nonexistent/path");
	assert.equal(readmes.length, 0);

	const depMap = await buildDependencyMap(["/nonexistent/file.js"]);
	assert.equal(depMap.size, 1);
	assert.equal(depMap.get("/nonexistent/file.js").length, 0);
});
