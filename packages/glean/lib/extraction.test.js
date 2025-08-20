/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for extraction module - surgical validation of graph building.
 */

import { strict as assert } from "node:assert";
import { mkdir, rmdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
	buildEntityNode,
	buildPackageMetadata,
	determineExportType,
	extractDocumentationGraph,
	extractModuleData,
	extractModuleExports,
	extractModuleImports,
	extractReadmeData,
	extractSourceSnippet,
	findClosingBrace,
	generateModuleId,
	generateReadmeId,
	parseImportClause,
	parseJSDocToStructured,
	parseParamTag,
	parseReturnTag,
} from "./extraction.js";

test("buildPackageMetadata handles various package.json structures", () => {
	// Null package.json
	const nullResult = buildPackageMetadata(null);
	assert.equal(nullResult.name, "unknown");
	assert.equal(nullResult.version, "0.0.0");
	assert.deepEqual(nullResult.exports, {});

	// Complete package.json
	const completePackage = {
		name: "@raven-js/test",
		version: "1.2.3",
		description: "Test package",
		main: "index.js",
		module: "esm.js",
		exports: {
			".": "./index.js",
			"./sub": "./sub.js",
		},
	};

	const completeResult = buildPackageMetadata(completePackage);
	assert.equal(completeResult.name, "@raven-js/test");
	assert.equal(completeResult.version, "1.2.3");
	assert.equal(completeResult.description, "Test package");
	assert.equal(completeResult.main, "index.js");
	assert.equal(completeResult.module, "esm.js");
	assert.deepEqual(completeResult.exports, completePackage.exports);

	// Minimal package.json
	const minimalPackage = {};
	const minimalResult = buildPackageMetadata(minimalPackage);
	assert.equal(minimalResult.name, "unknown");
	assert.equal(minimalResult.version, "0.0.0");
	assert.equal(minimalResult.description, "");
});

test("extractModuleExports finds various export patterns", () => {
	const content = `
export { name1, name2 };
export { alias as realName };
export default function() {}
export const CONSTANT = "value";
export function namedFunc() {}
export class NamedClass {}
const private = "not exported";
export { name1, name2 } from "./other.js";
	`;

	const exports = extractModuleExports(content);

	assert.ok(exports.includes("name1"));
	assert.ok(exports.includes("name2"));
	assert.ok(exports.includes("alias"));
	assert.ok(exports.includes("default"));
	assert.ok(exports.includes("CONSTANT"));
	assert.ok(exports.includes("namedFunc"));
	assert.ok(exports.includes("NamedClass"));
	assert.ok(!exports.includes("private"));

	// Should not have duplicates
	assert.equal(exports.filter((name) => name === "name1").length, 1);
});

test("extractModuleImports finds import patterns", () => {
	const content = `
import defaultExport from "./module1.js";
import { named1, named2 } from "./module2.js";
import * as namespace from "./module3.js";
import defaultExport, { named3 } from "./module4.js";
import("./dynamic.js");
import { alias as realName } from "./module5.js";
import "side-effect-only";
	`;

	const imports = extractModuleImports(content);

	assert.equal(imports.length, 6);

	// Check default import
	const defaultImport = imports.find((imp) => imp.path === "./module1.js");
	assert.ok(defaultImport);
	assert.deepEqual(defaultImport.names, ["defaultExport"]);
	assert.equal(defaultImport.type, "static");

	// Check named imports
	const namedImport = imports.find((imp) => imp.path === "./module2.js");
	assert.ok(namedImport);
	assert.deepEqual(namedImport.names, ["named1", "named2"]);

	// Check namespace import
	const namespaceImport = imports.find((imp) => imp.path === "./module3.js");
	assert.ok(namespaceImport);
	assert.deepEqual(namespaceImport.names, ["namespace"]);

	// Check mixed import
	const mixedImport = imports.find((imp) => imp.path === "./module4.js");
	assert.ok(mixedImport);
	assert.deepEqual(mixedImport.names, ["defaultExport", "named3"]);

	// Check dynamic import
	const dynamicImport = imports.find((imp) => imp.path === "./dynamic.js");
	assert.ok(dynamicImport);
	assert.equal(dynamicImport.type, "dynamic");
	assert.deepEqual(dynamicImport.names, []);

	// Check alias import
	const aliasImport = imports.find((imp) => imp.path === "./module5.js");
	assert.ok(aliasImport);
	assert.deepEqual(aliasImport.names, ["alias"]);
});

test("parseImportClause handles various import clause formats", () => {
	// Default import only
	assert.deepEqual(parseImportClause("defaultExport"), ["defaultExport"]);

	// Named imports only
	assert.deepEqual(parseImportClause("{ name1, name2 }"), ["name1", "name2"]);

	// Namespace import
	assert.deepEqual(parseImportClause("* as namespace"), ["namespace"]);

	// Mixed imports
	assert.deepEqual(parseImportClause("defaultExport, { named1, named2 }"), [
		"defaultExport",
		"named1",
		"named2",
	]);

	// Alias handling
	assert.deepEqual(parseImportClause("{ original as alias }"), ["original"]);

	// Empty clause
	assert.deepEqual(parseImportClause(""), []);
});

test("extractSourceSnippet extracts appropriate code snippets", () => {
	const lines = [
		"const before = 'context';",
		"",
		"function testFunc(arg) {",
		"  const local = arg;",
		"  return local;",
		"}",
		"",
		"const after = 'context';",
	];

	// Function snippet
	const funcSnippet = extractSourceSnippet(lines, 3, "function");
	assert.ok(funcSnippet.includes("function testFunc"));
	assert.ok(funcSnippet.includes("return local;"));
	assert.ok(funcSnippet.includes("}"));

	// Variable snippet
	const varSnippet = extractSourceSnippet(lines, 1, "variable");
	assert.ok(varSnippet.includes("const before"));
	assert.equal(varSnippet.split("\n").length, 3); // Should be limited
});

test("findClosingBrace locates matching braces", () => {
	const lines = [
		"function test() {",
		"  if (condition) {",
		"    return true;",
		"  }",
		"  return false;",
		"}",
		"const after = 'test';",
	];

	// Find closing brace for function
	const closingIndex = findClosingBrace(lines, 0);
	assert.equal(closingIndex, 5);

	// Handle lines without braces
	const noBraceLines = ["const x = 5;", "console.log(x);"];
	const noBraceResult = findClosingBrace(noBraceLines, 0);
	assert.equal(noBraceResult, null);

	// Handle unmatched braces
	const unmatchedLines = ["function test() {", "  return;"];
	const unmatchedResult = findClosingBrace(unmatchedLines, 0);
	assert.equal(unmatchedResult, null);
});

test("determineExportType identifies export patterns", () => {
	const content = `
export default function defaultFunc() {}
export function namedFunc() {}
function privateFunc() {}
	`;

	// Default export
	const defaultEntity = { name: "defaultFunc", exported: true };
	const defaultExports = determineExportType(defaultEntity, content);
	assert.deepEqual(defaultExports, ["default"]);

	// Named export
	const namedEntity = { name: "namedFunc", exported: true };
	const namedExports = determineExportType(namedEntity, content);
	assert.deepEqual(namedExports, ["named"]);

	// Not exported
	const privateEntity = { name: "privateFunc", exported: false };
	const privateExports = determineExportType(privateEntity, content);
	assert.deepEqual(privateExports, []);
});

test("parseJSDocToStructured converts JSDoc to structured format", () => {
	const jsDocComment = {
		description: "Calculate sum of two numbers",
		tags: {
			param: ["{number} a - First number", "{number} b - Second number"],
			returns: ["{number} The sum of a and b"],
			see: ["https://example.com"],
		},
	};

	const structured = parseJSDocToStructured(jsDocComment);

	assert.equal(structured.description, "Calculate sum of two numbers");
	assert.equal(structured.tags.param.length, 2);
	assert.equal(structured.tags.param[0].type, "number");
	assert.equal(structured.tags.param[0].name, "a");
	assert.equal(structured.tags.param[0].description, "First number");
	assert.equal(structured.tags.returns.type, "number");
	assert.equal(structured.tags.returns.description, "The sum of a and b");
	assert.deepEqual(structured.tags.see, ["https://example.com"]);
});

test("parseParamTag handles various @param formats", () => {
	// Standard format
	const standard = parseParamTag("{string} name - The name parameter");
	assert.equal(standard.type, "string");
	assert.equal(standard.name, "name");
	assert.equal(standard.description, "The name parameter");

	// Without dash
	const noDash = parseParamTag("{number} count The count value");
	assert.equal(noDash.type, "number");
	assert.equal(noDash.name, "count");
	assert.equal(noDash.description, "The count value");

	// Malformed
	const malformed = parseParamTag("invalid format");
	assert.equal(malformed.type, "any");
	assert.equal(malformed.name, "unknown");
	assert.equal(malformed.description, "invalid format");
});

test("parseReturnTag handles @returns formats", () => {
	// Standard format
	const standard = parseReturnTag("{boolean} True if successful");
	assert.equal(standard.type, "boolean");
	assert.equal(standard.description, "True if successful");

	// Malformed
	const malformed = parseReturnTag("just description");
	assert.equal(malformed.type, "any");
	assert.equal(malformed.description, "just description");
});

test("generateModuleId creates consistent IDs", () => {
	const packagePath = "/project/root";
	const filePath1 = "/project/root/src/utils.js";
	const filePath2 = "/project/root/lib/index.mjs";

	assert.equal(generateModuleId(filePath1, packagePath), "src/utils");
	assert.equal(generateModuleId(filePath2, packagePath), "lib/index");
});

test("generateReadmeId creates directory-based IDs", () => {
	const packagePath = "/project/root";
	const readmePath1 = "/project/root/README.md";
	const readmePath2 = "/project/root/docs/README.md";

	assert.equal(generateReadmeId(readmePath1, packagePath), "root");
	assert.equal(generateReadmeId(readmePath2, packagePath), "docs");
});

// Integration tests with file system
test("extractModuleData processes real JavaScript files", async () => {
	const tempDir = join(tmpdir(), `glean-test-${Date.now()}`);
	await mkdir(tempDir, { recursive: true });

	try {
		const testFile = join(tempDir, "test.js");
		const content = `
/**
 * Add two numbers
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} Sum of the numbers
 */
export function add(a, b) {
	return a + b;
}

import { helper } from "./helper.js";
export { helper };
		`;

		await writeFile(testFile, content);

		const result = await extractModuleData(testFile, tempDir);

		// Check module data
		assert.equal(result.module.id, "test");
		assert.equal(result.module.path, "test.js");
		assert.ok(result.module.exports.includes("add"));
		assert.ok(result.module.exports.includes("helper"));
		assert.equal(result.module.imports.length, 1);
		assert.equal(result.module.imports[0].path, "./helper.js");

		// Check entity data
		assert.equal(result.entities.length, 1);
		const addEntity = result.entities[0];
		assert.equal(addEntity.name, "add");
		assert.equal(addEntity.type, "function");
		assert.equal(addEntity.id, "test/add");
		assert.ok(addEntity.jsdoc);
		assert.equal(addEntity.jsdoc.description, "Add two numbers");
		assert.equal(addEntity.jsdoc.tags.param.length, 2);
		assert.ok(addEntity.source.includes("function add"));
	} finally {
		await rmdir(tempDir, { recursive: true });
	}
});

test("extractReadmeData processes README files", async () => {
	const tempDir = join(tmpdir(), `glean-test-${Date.now()}`);
	await mkdir(tempDir, { recursive: true });
	await mkdir(join(tempDir, "docs"), { recursive: true });

	try {
		const readmePath = join(tempDir, "docs", "README.md");
		const content = "# Test Package\n\nThis is a test package.";

		await writeFile(readmePath, content);

		const result = await extractReadmeData(readmePath, tempDir);

		assert.equal(result.path, "docs/README.md");
		assert.equal(result.content, content);
		assert.equal(result.directory, "docs");
		assert.deepEqual(result.assets, []); // No assets implemented yet
	} finally {
		await rmdir(tempDir, { recursive: true });
	}
});

test("extractDocumentationGraph creates complete graph", async () => {
	const tempDir = join(tmpdir(), `glean-test-${Date.now()}`);
	await mkdir(tempDir, { recursive: true });

	try {
		// Create package.json
		const packageJson = {
			name: "test-package",
			version: "1.0.0",
			description: "Test package for graph extraction",
		};
		await writeFile(join(tempDir, "package.json"), JSON.stringify(packageJson));

		// Create JavaScript file
		const jsFile = join(tempDir, "index.js");
		await writeFile(
			jsFile,
			`
/**
 * Main function
 * @returns {string} Greeting message
 */
export function greet() {
	return "Hello, world!";
}
		`,
		);

		// Create README
		const readmePath = join(tempDir, "README.md");
		await writeFile(readmePath, "# Test Package");

		// Mock discovery data
		const discovery = {
			files: [jsFile],
			readmes: [readmePath],
			packageJson,
			entryPoints: ["index.js"],
		};

		const graph = await extractDocumentationGraph(tempDir, discovery);

		// Check package metadata
		assert.equal(graph.package.name, "test-package");
		assert.equal(graph.package.version, "1.0.0");

		// Check modules
		assert.ok(graph.modules.index);
		assert.equal(graph.modules.index.path, "index.js");

		// Check entities
		assert.ok(graph.entities["index/greet"]);
		const greetEntity = graph.entities["index/greet"];
		assert.equal(greetEntity.name, "greet");
		assert.equal(greetEntity.type, "function");

		// Check READMEs
		assert.ok(graph.readmes.root);
		assert.equal(graph.readmes.root.content, "# Test Package");
	} finally {
		await rmdir(tempDir, { recursive: true });
	}
});

test("buildEntityNode handles entities without JSDoc", async () => {
	const codeEntity = {
		type: "function",
		name: "undocumented",
		line: 1,
		exported: true,
	};

	const content = "export function undocumented() {}";
	const lines = content.split("\n");
	const filePath = "/test/file.js";
	const packagePath = "/test";
	const moduleId = "file";

	const entity = await buildEntityNode(
		codeEntity,
		content,
		lines,
		filePath,
		packagePath,
		moduleId,
	);

	assert.equal(entity.name, "undocumented");
	assert.equal(entity.jsdoc, null); // No JSDoc
	assert.deepEqual(entity.exports, ["named"]);
	assert.ok(entity.source.includes("undocumented"));
});

test("extraction handles edge cases gracefully", () => {
	// Empty content
	assert.deepEqual(extractModuleExports(""), []);
	assert.deepEqual(extractModuleImports(""), []);

	// Malformed code
	const malformed = "export { broken";
	assert.doesNotThrow(() => extractModuleExports(malformed));

	// Complex export patterns
	const complex = `
export {
	name1,
	name2 as alias,
	name3
} from "./other.js";
	`;
	const complexExports = extractModuleExports(complex);
	assert.ok(complexExports.includes("name1"));
	assert.ok(complexExports.includes("name2"));
	assert.ok(complexExports.includes("name3"));
});
