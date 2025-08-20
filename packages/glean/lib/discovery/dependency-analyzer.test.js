/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Dependency relationship mapping tests - 100% branch coverage.
 */

import { deepStrictEqual } from "node:assert";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, it } from "node:test";
import { buildDependencyMap, extractImports } from "./dependency-analyzer.js";

describe("Dependency Relationship Mapping", () => {
	it("buildDependencyMap: builds map from readable files", async () => {
		const tempDir = await mkdtemp(join(tmpdir(), "glean-test-"));

		const file1 = join(tempDir, "main.js");
		const file2 = join(tempDir, "util.js");
		const file3 = join(tempDir, "empty.js");

		await writeFile(file1, 'import { helper } from "./util.js";');
		await writeFile(file2, 'import fs from "node:fs";');
		await writeFile(file3, "// no imports");

		const files = [file1, file2, file3];
		const result = await buildDependencyMap(files);

		// Check that all files are in the map
		deepStrictEqual(result.has(file1), true);
		deepStrictEqual(result.has(file2), true);
		deepStrictEqual(result.has(file3), true);

		// Check dependency resolution
		deepStrictEqual(result.get(file1), [resolve(tempDir, "util.js")]);
		deepStrictEqual(result.get(file2), []); // node:fs is not relative
		deepStrictEqual(result.get(file3), []); // no imports

		// Cleanup
		await rm(tempDir, { recursive: true });
	});

	it("buildDependencyMap: handles unreadable files gracefully", async () => {
		const nonExistentFile = join(tmpdir(), "non-existent-file.js");
		const files = [nonExistentFile];

		const result = await buildDependencyMap(files);

		deepStrictEqual(result.has(nonExistentFile), true);
		deepStrictEqual(result.get(nonExistentFile), []);
	});

	it("extractImports: extracts ES6 imports with relative paths", () => {
		const basePath = "/project/src";
		const content = `
			import { Component } from "./component.js";
			import utils from "../utils/index.js";
			import config from "../../config.js";
		`;

		const result = extractImports(content, basePath);
		const expected = [
			resolve(basePath, "./component.js"),
			resolve(basePath, "../utils/index.js"),
			resolve(basePath, "../../config.js"),
		];

		deepStrictEqual(result, expected);
	});

	it("extractImports: ignores absolute and package imports", () => {
		const basePath = "/project/src";
		const content = `
			import fs from "node:fs";
			import lodash from "lodash";
			import { Component } from "@react/core";
			import local from "./local.js";
		`;

		const result = extractImports(content, basePath);
		const expected = [resolve(basePath, "./local.js")];

		deepStrictEqual(result, expected);
	});

	it("extractImports: extracts dynamic imports", () => {
		const basePath = "/project/src";
		const content = `
			const module1 = await import("./dynamic.js");
			const module2 = import( "./spaced.js" );
			const module3 = import('./single-quotes.js');
			const external = import("external-package");
		`;

		const result = extractImports(content, basePath);
		const expected = [
			resolve(basePath, "./dynamic.js"),
			resolve(basePath, "./spaced.js"),
			resolve(basePath, "./single-quotes.js"),
		];

		deepStrictEqual(result, expected);
	});

	it("extractImports: handles mixed import types", () => {
		const basePath = "/project";
		const content = `
			import { Component } from "./component.js";
			import fs from "node:fs";
			const dynamic = await import("./dynamic.js");
			import * as utils from "../utils.js";
			import "external-package";
		`;

		const result = extractImports(content, basePath);
		const expected = [
			resolve(basePath, "./component.js"),
			resolve(basePath, "../utils.js"),
			resolve(basePath, "./dynamic.js"),
		];

		deepStrictEqual(result, expected);
	});

	it("extractImports: handles complex import syntax", () => {
		const basePath = "/project/src";
		const content = `
			import defaultExport from "./default.js";
			import { named1, named2 } from "./named.js";
			import { renamed as alias } from "./alias.js";
			import * as namespace from "./namespace.js";
			import defaultExport, { named } from "./mixed.js";
			import
				{ multiline }
				from
				"./multiline.js";
		`;

		const result = extractImports(content, basePath);
		const expected = [
			resolve(basePath, "./default.js"),
			resolve(basePath, "./named.js"),
			resolve(basePath, "./alias.js"),
			resolve(basePath, "./namespace.js"),
			resolve(basePath, "./mixed.js"),
			resolve(basePath, "./multiline.js"),
		];

		deepStrictEqual(result, expected);
	});

	it("extractImports: returns empty array for no imports", () => {
		const basePath = "/project";
		const content = `
			// This file has no imports
			const data = { value: 42 };
			function helper() {
				return "no imports here";
			}
			export { data, helper };
		`;

		const result = extractImports(content, basePath);
		deepStrictEqual(result, []);
	});

	it("extractImports: simple regex matches patterns in comments and strings", () => {
		const basePath = "/project";
		const content = `
			import { valid } from "./valid.js";
			// import { commented } from "./commented.js";
			const notImport = "import from string";
			console.log("import('./fake.js')");
			import { real } from "./real.js";
		`;

		const result = extractImports(content, basePath);
		// Simple regex approach matches patterns even in comments/strings
		const expected = [
			resolve(basePath, "./valid.js"),
			resolve(basePath, "./commented.js"),
			resolve(basePath, "./real.js"),
			resolve(basePath, "./fake.js"),
		];

		deepStrictEqual(result, expected);
	});

	it("extractImports: handles edge cases with quotes and spacing", () => {
		const basePath = "/test";
		const content = `
			import { test1 } from "./path1.js";
			import { test2 } from './path2.js';
			import { test3 } from   "./path3.js"  ;
			const dynamic1 = import("./dyn1.js");
			const dynamic2 = import('./dyn2.js');
			const dynamic3 = import(  "./dyn3.js"  );
		`;

		const result = extractImports(content, basePath);
		const expected = [
			resolve(basePath, "./path1.js"),
			resolve(basePath, "./path2.js"),
			resolve(basePath, "./path3.js"),
			resolve(basePath, "./dyn1.js"),
			resolve(basePath, "./dyn2.js"),
			resolve(basePath, "./dyn3.js"),
		];

		deepStrictEqual(result, expected);
	});
});
