/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Comprehensive tests for file listing with gitignore and hardcoded filtering.
 */

import { deepStrictEqual, ok, strictEqual } from "node:assert";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { listFiles } from "./list-files.js";

/**
 * Helper to convert Set to sorted array for comparison.
 * @param {Set<string>} set - Set to convert
 * @returns {string[]} Sorted array
 */
function setToSortedArray(set) {
	return Array.from(set).sort();
}

// Test directory structure setup
const testDir = "/tmp/glean-list-files-test";

function createTestStructure() {
	// Clean up any existing test directory
	try {
		rmSync(testDir, { recursive: true, force: true });
	} catch {
		// Ignore cleanup errors
	}

	// Create test directory structure
	mkdirSync(testDir, { recursive: true });
	mkdirSync(join(testDir, "src"), { recursive: true });
	mkdirSync(join(testDir, "lib"), { recursive: true });
	mkdirSync(join(testDir, "node_modules", "package"), { recursive: true });
	mkdirSync(join(testDir, "dist"), { recursive: true });

	// Create test files
	writeFileSync(join(testDir, "package.json"), '{"name":"test"}');
	writeFileSync(join(testDir, "README.md"), "# Test");
	writeFileSync(join(testDir, "src", "index.js"), "console.log('test');");
	writeFileSync(join(testDir, "src", "utils.js"), "export const utils = {};");
	writeFileSync(join(testDir, "lib", "helper.js"), "// helper");
	writeFileSync(
		join(testDir, "node_modules", "package", "index.js"),
		"// dependency",
	);
	writeFileSync(join(testDir, "dist", "bundle.js"), "// built file");

	// Create .gitignore
	writeFileSync(join(testDir, ".gitignore"), "dist/\n*.log\n.env");
}

function cleanupTestStructure() {
	try {
		rmSync(testDir, { recursive: true, force: true });
	} catch {
		// Ignore cleanup errors
	}
}

test("listFiles - invalid input", () => {
	const result1 = listFiles("");
	ok(result1 instanceof Set);
	strictEqual(result1.size, 0);

	const result2 = listFiles(null);
	ok(result2 instanceof Set);
	strictEqual(result2.size, 0);

	const result3 = listFiles(undefined);
	ok(result3 instanceof Set);
	strictEqual(result3.size, 0);

	const result4 = listFiles(123);
	ok(result4 instanceof Set);
	strictEqual(result4.size, 0);
});

test("listFiles - non-existent directory", () => {
	const result = listFiles("/non/existent/path");
	ok(result instanceof Set);
	strictEqual(result.size, 0);
});

test("listFiles - basic file listing with gitignore and node_modules filtering", () => {
	createTestStructure();

	const result = listFiles(testDir);

	// Verify it's a Set
	ok(result instanceof Set);

	// Should include these files (with ./ prefix)
	const expectedFiles = [
		"./.gitignore",
		"./package.json",
		"./README.md",
		"./src/index.js",
		"./src/utils.js",
		"./lib/helper.js",
	];

	// Convert Set to sorted array for comparison
	const resultArray = setToSortedArray(result);
	expectedFiles.sort();

	deepStrictEqual(resultArray, expectedFiles);

	// Verify node_modules is excluded
	ok(!result.has("./node_modules/package/index.js"));

	// Verify dist is excluded (gitignore)
	ok(!result.has("./dist/bundle.js"));

	cleanupTestStructure();
});

test("listFiles - node_modules hardcoded exclusion", () => {
	createTestStructure();

	const result = listFiles(testDir);

	// Should not contain any node_modules files
	const nodeModulesFiles = setToSortedArray(result).filter((path) =>
		path.includes("node_modules"),
	);
	deepStrictEqual(nodeModulesFiles, []);

	cleanupTestStructure();
});

test("listFiles - gitignore dist directory exclusion", () => {
	createTestStructure();

	const result = listFiles(testDir);

	// Should not contain dist files due to gitignore
	const distFiles = setToSortedArray(result).filter((path) =>
		path.startsWith("./dist/"),
	);
	deepStrictEqual(distFiles, []);

	cleanupTestStructure();
});

test("listFiles - empty directory", () => {
	const emptyDir = join(testDir, "empty");
	mkdirSync(emptyDir, { recursive: true });

	const result = listFiles(emptyDir);
	ok(result instanceof Set);
	strictEqual(result.size, 0);

	rmSync(emptyDir, { recursive: true, force: true });
});

test("listFiles - directory with only gitignore", () => {
	const gitignoreDir = join(testDir, "gitignore-only");
	mkdirSync(gitignoreDir, { recursive: true });
	writeFileSync(join(gitignoreDir, ".gitignore"), "*.log\n");

	const result = listFiles(gitignoreDir);
	const resultArray = setToSortedArray(result);

	deepStrictEqual(resultArray, ["./.gitignore"]);

	rmSync(gitignoreDir, { recursive: true, force: true });
});

test("listFiles - wildcard gitignore patterns", () => {
	const wildcardDir = join(testDir, "wildcard-test");
	mkdirSync(wildcardDir, { recursive: true });

	// Create files
	writeFileSync(join(wildcardDir, "file.js"), "//js");
	writeFileSync(join(wildcardDir, "file.log"), "log content");
	writeFileSync(join(wildcardDir, "file.txt"), "text");

	// Create gitignore with wildcard
	writeFileSync(join(wildcardDir, ".gitignore"), "*.log\n");

	const result = listFiles(wildcardDir);
	const resultArray = setToSortedArray(result);

	const expected = ["./.gitignore", "./file.js", "./file.txt"];
	expected.sort();

	deepStrictEqual(resultArray, expected);

	// Verify .log file is excluded
	ok(!result.has("./file.log"));

	rmSync(wildcardDir, { recursive: true, force: true });
});

// COMPREHENSIVE ADDITIONAL TESTS

test("listFiles - complex nested directory structure", () => {
	const complexDir = join(testDir, "complex");
	mkdirSync(complexDir, { recursive: true });
	mkdirSync(join(complexDir, "src", "components", "ui"), { recursive: true });
	mkdirSync(join(complexDir, "src", "utils", "helpers"), { recursive: true });
	mkdirSync(join(complexDir, "tests", "unit"), { recursive: true });
	mkdirSync(join(complexDir, "docs", "api"), { recursive: true });

	// Create files at various levels
	writeFileSync(join(complexDir, "package.json"), "{}");
	writeFileSync(join(complexDir, "src", "index.js"), "export {};");
	writeFileSync(
		join(complexDir, "src", "components", "Button.js"),
		"export {};",
	);
	writeFileSync(
		join(complexDir, "src", "components", "ui", "Modal.js"),
		"export {};",
	);
	writeFileSync(join(complexDir, "src", "utils", "format.js"), "export {};");
	writeFileSync(
		join(complexDir, "src", "utils", "helpers", "math.js"),
		"export {};",
	);
	writeFileSync(join(complexDir, "tests", "setup.js"), "export {};");
	writeFileSync(join(complexDir, "tests", "unit", "button.test.js"), "test();");
	writeFileSync(join(complexDir, "docs", "README.md"), "# Docs");
	writeFileSync(join(complexDir, "docs", "api", "reference.md"), "# API");

	const result = listFiles(complexDir);

	// Verify it's a Set
	ok(result instanceof Set);

	// Should find all files
	strictEqual(result.size, 10);

	// Verify specific files exist
	ok(result.has("./package.json"));
	ok(result.has("./src/index.js"));
	ok(result.has("./src/components/ui/Modal.js"));
	ok(result.has("./src/utils/helpers/math.js"));
	ok(result.has("./tests/unit/button.test.js"));
	ok(result.has("./docs/api/reference.md"));

	rmSync(complexDir, { recursive: true, force: true });
});

test("listFiles - multiple gitignore files in hierarchy", () => {
	const hierarchyDir = join(testDir, "hierarchy");
	mkdirSync(hierarchyDir, { recursive: true });
	mkdirSync(join(hierarchyDir, "src"), { recursive: true });
	mkdirSync(join(hierarchyDir, "tests"), { recursive: true });

	// Create files
	writeFileSync(join(hierarchyDir, "file.js"), "export {};");
	writeFileSync(join(hierarchyDir, "temp.log"), "log");
	writeFileSync(join(hierarchyDir, "build.out"), "output");
	writeFileSync(join(hierarchyDir, "src", "index.js"), "export {};");
	writeFileSync(join(hierarchyDir, "src", "temp.log"), "log");
	writeFileSync(join(hierarchyDir, "tests", "test.js"), "test();");
	writeFileSync(join(hierarchyDir, "tests", "results.xml"), "<xml/>");

	// Root gitignore
	writeFileSync(join(hierarchyDir, ".gitignore"), "*.log\n*.out\n");

	// Nested gitignore (should be respected too)
	writeFileSync(join(hierarchyDir, "tests", ".gitignore"), "*.xml\n");

	const result = listFiles(hierarchyDir);

	// Should include allowed files
	ok(result.has("./file.js"));
	ok(result.has("./src/index.js"));
	ok(result.has("./tests/test.js"));
	ok(result.has("./.gitignore"));
	ok(result.has("./tests/.gitignore"));

	// Should exclude files matching gitignore patterns
	ok(!result.has("./temp.log"));
	ok(!result.has("./build.out"));
	ok(!result.has("./src/temp.log"));
	ok(!result.has("./tests/results.xml"));

	rmSync(hierarchyDir, { recursive: true, force: true });
});

test("listFiles - gitignore directory patterns", () => {
	const dirPatternDir = join(testDir, "dir-pattern");
	mkdirSync(dirPatternDir, { recursive: true });
	mkdirSync(join(dirPatternDir, "build"), { recursive: true });
	mkdirSync(join(dirPatternDir, "dist"), { recursive: true });
	mkdirSync(join(dirPatternDir, "src"), { recursive: true });

	// Create files
	writeFileSync(join(dirPatternDir, "package.json"), "{}");
	writeFileSync(join(dirPatternDir, "build", "index.js"), "built");
	writeFileSync(join(dirPatternDir, "build", "styles.css"), "css");
	writeFileSync(join(dirPatternDir, "dist", "bundle.js"), "bundle");
	writeFileSync(join(dirPatternDir, "src", "main.js"), "main");

	// Gitignore with directory patterns
	writeFileSync(join(dirPatternDir, ".gitignore"), "build/\ndist/\n");

	const result = listFiles(dirPatternDir);

	// Should include allowed files
	ok(result.has("./package.json"));
	ok(result.has("./src/main.js"));
	ok(result.has("./.gitignore"));

	// Should exclude entire directories
	ok(!result.has("./build/index.js"));
	ok(!result.has("./build/styles.css"));
	ok(!result.has("./dist/bundle.js"));

	rmSync(dirPatternDir, { recursive: true, force: true });
});

test("listFiles - edge case patterns and special characters", () => {
	const edgeDir = join(testDir, "edge-cases");
	mkdirSync(edgeDir, { recursive: true });

	// Create files with various patterns
	writeFileSync(join(edgeDir, "normal.js"), "export {};");
	writeFileSync(join(edgeDir, "file-with-dashes.js"), "export {};");
	writeFileSync(join(edgeDir, "file_with_underscores.js"), "export {};");
	writeFileSync(join(edgeDir, "file.with.dots.js"), "export {};");
	writeFileSync(join(edgeDir, "UPPERCASE.JS"), "export {};");
	writeFileSync(join(edgeDir, "123numbers.js"), "export {};");
	writeFileSync(join(edgeDir, "special$chars.js"), "export {};");

	// Edge case gitignore patterns
	writeFileSync(
		join(edgeDir, ".gitignore"),
		"*with*\n" + // Should match files with "with" anywhere
			"*.JS\n" + // Should match .JS extension (uppercase)
			"123*\n", // Should match files starting with 123
	);

	const result = listFiles(edgeDir);

	// Should include normal files that don't match patterns
	ok(result.has("./normal.js"));
	ok(result.has("./special$chars.js"));
	ok(result.has("./.gitignore"));

	// Should exclude pattern matches
	ok(!result.has("./file-with-dashes.js")); // matches *with*
	ok(!result.has("./file_with_underscores.js")); // matches *with*
	ok(!result.has("./file.with.dots.js")); // matches *with* (contains "with")
	ok(!result.has("./UPPERCASE.JS")); // matches *.JS
	ok(!result.has("./123numbers.js")); // matches 123*

	rmSync(edgeDir, { recursive: true, force: true });
});

test("listFiles - symlinks and special file types handling", () => {
	const specialDir = join(testDir, "special-files");
	mkdirSync(specialDir, { recursive: true });

	// Create regular files
	writeFileSync(join(specialDir, "regular.js"), "export {};");
	writeFileSync(join(specialDir, "README.md"), "# Test");

	// Note: Symlinks are tricky to test cross-platform,
	// but listFiles should handle them gracefully via withFileTypes

	const result = listFiles(specialDir);

	// Should include regular files
	ok(result.has("./regular.js"));
	ok(result.has("./README.md"));

	// Should return a proper Set
	ok(result instanceof Set);
	strictEqual(result.size, 2);

	rmSync(specialDir, { recursive: true, force: true });
});

test("listFiles - performance with many files", () => {
	const perfDir = join(testDir, "performance");
	mkdirSync(perfDir, { recursive: true });

	// Create many files to test performance
	for (let i = 0; i < 100; i++) {
		writeFileSync(join(perfDir, `file${i}.js`), `// File ${i}`);
	}

	const startTime = Date.now();
	const result = listFiles(perfDir);
	const endTime = Date.now();

	// Should complete reasonably quickly (adjust threshold as needed)
	const duration = endTime - startTime;
	ok(duration < 1000, `Performance test took ${duration}ms, expected < 1000ms`);

	// Should find all files
	strictEqual(result.size, 100);

	// Verify some files exist
	ok(result.has("./file0.js"));
	ok(result.has("./file50.js"));
	ok(result.has("./file99.js"));

	rmSync(perfDir, { recursive: true, force: true });
});

test("listFiles - gitignore comments and empty lines", () => {
	const commentDir = join(testDir, "comments");
	mkdirSync(commentDir, { recursive: true });

	// Create files
	writeFileSync(join(commentDir, "keep.js"), "export {};");
	writeFileSync(join(commentDir, "ignore.log"), "log");
	writeFileSync(join(commentDir, "also-keep.js"), "export {};");

	// Gitignore with comments and empty lines
	writeFileSync(
		join(commentDir, ".gitignore"),
		"# This is a comment\n" +
			"\n" + // Empty line
			"*.log\n" + // Actual pattern
			"# Another comment\n" +
			"\n" + // Another empty line
			"   \n" + // Whitespace only line
			"# Final comment",
	);

	const result = listFiles(commentDir);

	// Should include non-ignored files
	ok(result.has("./keep.js"));
	ok(result.has("./also-keep.js"));
	ok(result.has("./.gitignore"));

	// Should exclude ignored files
	ok(!result.has("./ignore.log"));

	rmSync(commentDir, { recursive: true, force: true });
});

test("listFiles - integration with File class expectations", () => {
	const integrationDir = join(testDir, "integration");
	mkdirSync(integrationDir, { recursive: true });
	mkdirSync(join(integrationDir, "src"), { recursive: true });

	// Create realistic project structure
	writeFileSync(join(integrationDir, "package.json"), '{"name": "test"}');
	writeFileSync(join(integrationDir, "src", "index.js"), "export {};");
	writeFileSync(join(integrationDir, "src", "utils.js"), "export {};");
	writeFileSync(join(integrationDir, ".gitignore"), "node_modules/\n");

	const result = listFiles(integrationDir);

	// Convert to array that could be used with File.importedFilePaths
	const filesArray = Array.from(result);

	// Verify the format is compatible with other functions expecting relative paths
	for (const filePath of filesArray) {
		ok(filePath.startsWith("./"), `Path should start with ./: ${filePath}`);
		ok(
			!filePath.includes("\\"),
			`Path should use forward slashes: ${filePath}`,
		);
	}

	// Verify expected files are present in correct format
	ok(result.has("./package.json"));
	ok(result.has("./src/index.js"));
	ok(result.has("./src/utils.js"));

	rmSync(integrationDir, { recursive: true, force: true });
});

test("listFiles - error handling edge cases", () => {
	// Test permission-denied or invalid directory scenarios by using mock directory
	const invalidDir = "/this/path/does/not/exist/at/all";

	// This should handle the error gracefully and return empty set
	const result = listFiles(invalidDir);
	strictEqual(result instanceof Set, true);
	strictEqual(result.size, 0);

	// SURGICAL TARGET: Hit lines 65-67 by making .gitignore unreadable
	const gitignoreFailDir = join(testDir, "gitignore-fail-test");
	mkdirSync(gitignoreFailDir, { recursive: true });

	// Create directory named .gitignore (not a file) to force readFileSync to throw
	mkdirSync(join(gitignoreFailDir, ".gitignore"));
	writeFileSync(join(gitignoreFailDir, "target.js"), "// should be found");

	// This WILL hit lines 65-67 catch block in loadLocalGitignorePatterns
	const gitignoreFailResult = listFiles(gitignoreFailDir);
	strictEqual(gitignoreFailResult instanceof Set, true);
	strictEqual(gitignoreFailResult.has("./target.js"), true);

	rmSync(gitignoreFailDir, { recursive: true, force: true });

	// SURGICAL TARGET: Hit lines 133-134 by making directory unreadable
	const dirFailDir = join(testDir, "dir-fail-test");
	mkdirSync(dirFailDir, { recursive: true });
	writeFileSync(join(dirFailDir, "normal.js"), "// normal file");

	// Create a file with the same name as where we expect a directory
	writeFileSync(join(dirFailDir, "fakedir"), "not a directory");

	// Test reading the fake directory (will cause readdirSync to fail)
	// This should hit lines 133-134 catch block in scanDirectory
	const dirFailResult = listFiles(join(dirFailDir, "fakedir"));
	strictEqual(dirFailResult instanceof Set, true);
	strictEqual(dirFailResult.size, 0); // Should return empty due to error

	rmSync(dirFailDir, { recursive: true, force: true });
});

test("listFiles - gitignore patterns edge cases", () => {
	// Test with different gitignore scenario
	const tempDir = join(testDir, "empty-gitignore-test");
	mkdirSync(tempDir, { recursive: true });

	// Create empty gitignore to test no patterns branch
	writeFileSync(join(tempDir, ".gitignore"), "");
	writeFileSync(join(tempDir, "test.js"), "// test file");
	mkdirSync(join(tempDir, "dir"));
	writeFileSync(join(tempDir, "dir", "file.js"), "// nested file");

	const files = listFiles(tempDir);
	const fileArray = Array.from(files);

	// Should include all JS files since empty gitignore has no patterns
	strictEqual(
		fileArray.some((f) => f.includes("test.js")),
		true,
	);
	strictEqual(
		fileArray.some((f) => f.includes("dir/file.js")),
		true,
	);

	rmSync(tempDir, { recursive: true, force: true });
});
