/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Discovery orchestration integration tests.
 *
 * Test the coordination layer that assembles package metadata intelligence,
 * file system reconnaissance, and dependency analysis into unified discovery.
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
	buildDependencyMap,
	discoverPackage,
	extractEntryPoints,
	extractImports,
	findReadmeFiles,
	parsePackageJson,
	scanJavaScriptFiles,
} from "./index.js";

describe("Discovery Orchestration", () => {
	it("discoverPackage integrates all discovery functions", async () => {
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
			await writeFile(
				join(tempDir, "lib", "sub.js"),
				"export const sub = true;",
			);

			const result = await discoverPackage(tempDir);

			// Verify integration results
			strictEqual(result.packageJson.name, "test-package");
			strictEqual(result.entryPoints.length, 3); // main + exports entries
			strictEqual(result.files.length, 2); // index.js + lib/sub.js
			strictEqual(result.readmes.length, 1); // README.md
		} finally {
			await rm(tempDir, { recursive: true });
		}
	});

	it("re-exports all discovery functions correctly", () => {
		// Verify all functions are exported and callable
		strictEqual(typeof discoverPackage, "function");
		strictEqual(typeof parsePackageJson, "function");
		strictEqual(typeof extractEntryPoints, "function");
		strictEqual(typeof scanJavaScriptFiles, "function");
		strictEqual(typeof findReadmeFiles, "function");
		strictEqual(typeof buildDependencyMap, "function");
		strictEqual(typeof extractImports, "function");
	});

	it("handles missing package gracefully", async () => {
		const result = await discoverPackage("/nonexistent/path");

		strictEqual(result.packageJson, null);
		deepStrictEqual(result.entryPoints, []); // no package.json means no entry points determined
		deepStrictEqual(result.files, []); // no files found
		deepStrictEqual(result.readmes, []); // no readmes found
	});
});
