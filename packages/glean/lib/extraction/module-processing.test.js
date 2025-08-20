/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { extractModuleData } from "./module-processing.js";

test("extractModuleData - comprehensive branch coverage", async () => {
	// Create temporary test directory
	const testDir = "/tmp/glean-module-test";
	await rm(testDir, { recursive: true, force: true });
	await mkdir(testDir, { recursive: true });

	try {
		// Test comprehensive module with exports, imports, and entities
		const complexModuleContent = `/**
 * @fileoverview Complex module for testing
 */
import { BaseClass } from "./base";
import * as utils from "./utils";
import defaultExport from "./default";

/**
 * A utility function
 * @param {string} input - Input value
 * @returns {string} Processed output
 */
export function processInput(input) {
  return utils.process(input);
}

/**
 * A test class
 */
export class TestClass extends BaseClass {
  constructor(value) {
    super();
    this.value = value;
  }

  getValue() {
    return this.value;
  }
}

export const CONSTANT_VALUE = "test";

const internalFunction = () => "internal";

export default TestClass;
`;

		const complexModulePath = join(testDir, "src", "complex.js");
		await mkdir(join(testDir, "src"), { recursive: true });
		await writeFile(complexModulePath, complexModuleContent);

		const complexResult = await extractModuleData(complexModulePath, testDir);

		// Verify module metadata
		strictEqual(complexResult.module.id, "src/complex");
		strictEqual(complexResult.module.path, "src/complex.js");

		// Verify exports
		const expectedExports = [
			"CONSTANT_VALUE",
			"TestClass",
			"default",
			"processInput",
		];
		deepStrictEqual(complexResult.module.exports.sort(), expectedExports);

		// Verify imports
		strictEqual(complexResult.module.imports.length, 3);
		deepStrictEqual(complexResult.module.imports[0], {
			path: "./base",
			names: ["BaseClass"],
			type: "static",
		});
		deepStrictEqual(complexResult.module.imports[1], {
			path: "./utils",
			names: ["utils"],
			type: "static",
		});
		deepStrictEqual(complexResult.module.imports[2], {
			path: "./default",
			names: ["defaultExport"],
			type: "static",
		});

		// Verify entities (should find 3: processInput, TestClass, CONSTANT_VALUE)
		// Note: internalFunction might not be found by extractCodeEntities
		strictEqual(complexResult.entities.length >= 3, true);

		// Find specific entities
		const processInputEntity = complexResult.entities.find(
			(e) => e.name === "processInput",
		);
		const testClassEntity = complexResult.entities.find(
			(e) => e.name === "TestClass",
		);
		const constantEntity = complexResult.entities.find(
			(e) => e.name === "CONSTANT_VALUE",
		);

		// Verify processInput entity
		strictEqual(processInputEntity?.type, "function");
		strictEqual(processInputEntity?.moduleId, "src/complex");
		deepStrictEqual(processInputEntity?.exports, ["named"]);
		strictEqual(processInputEntity?.jsdoc?.description, "A utility function");

		// Verify TestClass entity
		strictEqual(testClassEntity?.type, "class");
		strictEqual(testClassEntity?.moduleId, "src/complex");
		deepStrictEqual(testClassEntity?.exports, ["default"]); // Default export wins

		// Verify CONSTANT_VALUE entity
		strictEqual(constantEntity?.type, "variable");
		strictEqual(constantEntity?.moduleId, "src/complex");
		deepStrictEqual(constantEntity?.exports, ["named"]);

		// Test simple module with minimal content
		const simpleModuleContent = `export const simpleValue = 42;`;

		const simpleModulePath = join(testDir, "simple.js");
		await writeFile(simpleModulePath, simpleModuleContent);

		const simpleResult = await extractModuleData(simpleModulePath, testDir);

		strictEqual(simpleResult.module.id, "simple");
		strictEqual(simpleResult.module.path, "simple.js");
		deepStrictEqual(simpleResult.module.exports, ["simpleValue"]);
		deepStrictEqual(simpleResult.module.imports, []);
		strictEqual(simpleResult.entities.length, 1);
		strictEqual(simpleResult.entities[0].name, "simpleValue");

		// Test module with only imports (no exports or entities)
		const importOnlyContent = `import { helper } from "./helper";
import * as utils from "./utils";

// Just imports, no exports or code entities
console.log("Module loaded");`;

		const importOnlyPath = join(testDir, "imports-only.js");
		await writeFile(importOnlyPath, importOnlyContent);

		const importOnlyResult = await extractModuleData(importOnlyPath, testDir);

		strictEqual(importOnlyResult.module.id, "imports-only");
		deepStrictEqual(importOnlyResult.module.exports, []);
		strictEqual(importOnlyResult.module.imports.length, 2);
		strictEqual(importOnlyResult.entities.length, 0);

		// Test empty module
		const emptyModulePath = join(testDir, "empty.js");
		await writeFile(emptyModulePath, "");

		const emptyResult = await extractModuleData(emptyModulePath, testDir);

		strictEqual(emptyResult.module.id, "empty");
		deepStrictEqual(emptyResult.module.exports, []);
		deepStrictEqual(emptyResult.module.imports, []);
		strictEqual(emptyResult.entities.length, 0);

		// Test module with comments only
		const commentsOnlyContent = `// This is a comment-only module
/* Block comment */
/**
 * JSDoc comment not attached to anything
 */
// More comments`;

		const commentsOnlyPath = join(testDir, "comments-only.js");
		await writeFile(commentsOnlyPath, commentsOnlyContent);

		const commentsOnlyResult = await extractModuleData(
			commentsOnlyPath,
			testDir,
		);

		strictEqual(commentsOnlyResult.module.id, "comments-only");
		deepStrictEqual(commentsOnlyResult.module.exports, []);
		deepStrictEqual(commentsOnlyResult.module.imports, []);
		strictEqual(commentsOnlyResult.entities.length, 0);

		// Test deeply nested module
		const nestedModuleContent = `export function nestedFunction() {
  return "nested";
}`;

		const nestedDir = join(testDir, "deep", "nested", "structure");
		const nestedModulePath = join(nestedDir, "module.js");
		await mkdir(nestedDir, { recursive: true });
		await writeFile(nestedModulePath, nestedModuleContent);

		const nestedResult = await extractModuleData(nestedModulePath, testDir);

		strictEqual(nestedResult.module.id, "deep/nested/structure/module");
		strictEqual(nestedResult.module.path, "deep/nested/structure/module.js");
		deepStrictEqual(nestedResult.module.exports, ["nestedFunction"]);
		strictEqual(nestedResult.entities.length, 1);
		strictEqual(nestedResult.entities[0].name, "nestedFunction");
		strictEqual(
			nestedResult.entities[0].id,
			"deep/nested/structure/module/nestedFunction",
		);

		// Test .mjs module
		const mjsModuleContent = `export const mjsValue = "module";`;
		const mjsModulePath = join(testDir, "esm.mjs");
		await writeFile(mjsModulePath, mjsModuleContent);

		const mjsResult = await extractModuleData(mjsModulePath, testDir);

		strictEqual(mjsResult.module.id, "esm");
		strictEqual(mjsResult.module.path, "esm.mjs");
		deepStrictEqual(mjsResult.module.exports, ["mjsValue"]);
	} finally {
		// Cleanup
		await rm(testDir, { recursive: true, force: true });
	}
});
