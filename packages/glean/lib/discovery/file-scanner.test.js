/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file File system reconnaissance tests - 100% branch coverage.
 */

import { deepStrictEqual } from "node:assert";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { findReadmeFiles, scanJavaScriptFiles } from "./file-scanner.js";

describe("File System Reconnaissance", () => {
	it("scanJavaScriptFiles: finds JavaScript files recursively", async () => {
		const tempDir = await mkdtemp(join(tmpdir(), "glean-test-"));

		// Create test structure
		await mkdir(join(tempDir, "src"));
		await mkdir(join(tempDir, "lib"));
		await writeFile(join(tempDir, "index.js"), "// main file");
		await writeFile(join(tempDir, "src", "component.js"), "// component");
		await writeFile(join(tempDir, "src", "module.mjs"), "// esm module");
		await writeFile(join(tempDir, "lib", "utils.js"), "// utilities");
		await writeFile(join(tempDir, "package.json"), "{}"); // non-JS file

		const result = await scanJavaScriptFiles(tempDir);

		// Sort results for consistent comparison
		result.sort();
		const expected = [
			join(tempDir, "index.js"),
			join(tempDir, "lib", "utils.js"),
			join(tempDir, "src", "component.js"),
			join(tempDir, "src", "module.mjs"),
		].sort();

		deepStrictEqual(result, expected);

		// Cleanup
		await rm(tempDir, { recursive: true });
	});

	it("scanJavaScriptFiles: excludes default directories", async () => {
		const tempDir = await mkdtemp(join(tmpdir(), "glean-test-"));

		// Create test structure with excluded directories
		await mkdir(join(tempDir, "node_modules"));
		await mkdir(join(tempDir, ".git"));
		await mkdir(join(tempDir, "dist"));
		await mkdir(join(tempDir, "build"));
		await mkdir(join(tempDir, "src"));

		await writeFile(join(tempDir, "index.js"), "// main");
		await writeFile(join(tempDir, "node_modules", "lib.js"), "// dependency");
		await writeFile(join(tempDir, ".git", "hook.js"), "// git hook");
		await writeFile(join(tempDir, "dist", "bundle.js"), "// built file");
		await writeFile(join(tempDir, "build", "output.js"), "// build file");
		await writeFile(join(tempDir, "src", "code.js"), "// source");

		const result = await scanJavaScriptFiles(tempDir);

		result.sort();
		const expected = [
			join(tempDir, "index.js"),
			join(tempDir, "src", "code.js"),
		].sort();

		deepStrictEqual(result, expected);

		// Cleanup
		await rm(tempDir, { recursive: true });
	});

	it("scanJavaScriptFiles: excludes custom directories", async () => {
		const tempDir = await mkdtemp(join(tmpdir(), "glean-test-"));

		// Create test structure
		await mkdir(join(tempDir, "custom"));
		await mkdir(join(tempDir, "exclude"));
		await mkdir(join(tempDir, "include"));

		await writeFile(join(tempDir, "index.js"), "// main");
		await writeFile(join(tempDir, "custom", "lib.js"), "// custom");
		await writeFile(join(tempDir, "exclude", "code.js"), "// excluded");
		await writeFile(join(tempDir, "include", "util.js"), "// included");

		const result = await scanJavaScriptFiles(tempDir, ["custom", "exclude"]);

		result.sort();
		const expected = [
			join(tempDir, "index.js"),
			join(tempDir, "include", "util.js"),
		].sort();

		deepStrictEqual(result, expected);

		// Cleanup
		await rm(tempDir, { recursive: true });
	});

	it("scanJavaScriptFiles: handles missing directory gracefully", async () => {
		const nonExistentPath = join(tmpdir(), "non-existent-dir-12345");
		const result = await scanJavaScriptFiles(nonExistentPath);
		deepStrictEqual(result, []);
	});

	it("scanJavaScriptFiles: filters by file extension", async () => {
		const tempDir = await mkdtemp(join(tmpdir(), "glean-test-"));

		// Create files with various extensions
		await writeFile(join(tempDir, "script.js"), "// javascript");
		await writeFile(join(tempDir, "module.mjs"), "// esm");
		await writeFile(join(tempDir, "legacy.cjs"), "// commonjs");
		await writeFile(join(tempDir, "types.ts"), "// typescript");
		await writeFile(join(tempDir, "data.json"), "{}");
		await writeFile(join(tempDir, "readme.txt"), "text");

		const result = await scanJavaScriptFiles(tempDir);

		result.sort();
		const expected = [
			join(tempDir, "module.mjs"),
			join(tempDir, "script.js"),
		].sort();

		deepStrictEqual(result, expected);

		// Cleanup
		await rm(tempDir, { recursive: true });
	});

	it("findReadmeFiles: finds README files recursively", async () => {
		const tempDir = await mkdtemp(join(tmpdir(), "glean-test-"));

		// Create test structure with various README files
		await mkdir(join(tempDir, "docs"));
		await mkdir(join(tempDir, "src"));

		await writeFile(join(tempDir, "README.md"), "# Main readme");
		await writeFile(join(tempDir, "readme.txt"), "text readme");
		await writeFile(join(tempDir, "ReadMe.rst"), "rst readme");
		await writeFile(join(tempDir, "docs", "README.md"), "# Docs readme");
		await writeFile(join(tempDir, "src", "readme.txt"), "src readme");
		await writeFile(join(tempDir, "other.md"), "other file");

		const result = await findReadmeFiles(tempDir);

		result.sort();
		const expected = [
			join(tempDir, "README.md"),
			join(tempDir, "ReadMe.rst"),
			join(tempDir, "docs", "README.md"),
			join(tempDir, "readme.txt"),
			join(tempDir, "src", "readme.txt"),
		].sort();

		deepStrictEqual(result, expected);

		// Cleanup
		await rm(tempDir, { recursive: true });
	});

	it("findReadmeFiles: excludes build directories", async () => {
		const tempDir = await mkdtemp(join(tmpdir(), "glean-test-"));

		// Create structure with excluded directories
		await mkdir(join(tempDir, "node_modules"));
		await mkdir(join(tempDir, ".git"));
		await mkdir(join(tempDir, "dist"));
		await mkdir(join(tempDir, "build"));
		await mkdir(join(tempDir, "src"));

		await writeFile(join(tempDir, "README.md"), "# Main");
		await writeFile(join(tempDir, "node_modules", "README.md"), "# Dependency");
		await writeFile(join(tempDir, ".git", "readme.txt"), "git readme");
		await writeFile(join(tempDir, "dist", "README.md"), "# Built");
		await writeFile(join(tempDir, "build", "readme.md"), "build readme");
		await writeFile(join(tempDir, "src", "README.md"), "# Source");

		const result = await findReadmeFiles(tempDir);

		result.sort();
		const expected = [
			join(tempDir, "README.md"),
			join(tempDir, "src", "README.md"),
		].sort();

		deepStrictEqual(result, expected);

		// Cleanup
		await rm(tempDir, { recursive: true });
	});

	it("findReadmeFiles: handles missing directory gracefully", async () => {
		const nonExistentPath = join(tmpdir(), "non-existent-dir-54321");
		const result = await findReadmeFiles(nonExistentPath);
		deepStrictEqual(result, []);
	});

	it("findReadmeFiles: case insensitive README matching", async () => {
		const tempDir = await mkdtemp(join(tmpdir(), "glean-test-"));

		// Create files with different cases
		await writeFile(join(tempDir, "README.md"), "standard");
		await writeFile(join(tempDir, "readme.txt"), "lowercase");
		await writeFile(join(tempDir, "ReadMe.rst"), "mixedcase");
		await writeFile(join(tempDir, "README"), "no extension");
		await writeFile(join(tempDir, "READTHIS.md"), "not readme");
		await writeFile(join(tempDir, "read.md"), "partial match");

		const result = await findReadmeFiles(tempDir);

		result.sort();
		const expected = [
			join(tempDir, "README"),
			join(tempDir, "README.md"),
			join(tempDir, "ReadMe.rst"),
			join(tempDir, "readme.txt"),
		].sort();

		deepStrictEqual(result, expected);

		// Cleanup
		await rm(tempDir, { recursive: true });
	});
});
