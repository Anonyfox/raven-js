/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";
import {
	buildEntityNode,
	buildEntityReferences,
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
} from "./index.js";

test("API reconstruction - all exports available", () => {
	// Verify all expected exports are present and are functions
	const exportedFunctions = {
		// Graph orchestration
		extractDocumentationGraph,
		buildEntityReferences,

		// Package intelligence
		buildPackageMetadata,

		// Module processing
		extractModuleData,

		// Entity construction
		buildEntityNode,

		// Module relationships
		extractModuleExports,
		extractModuleImports,
		parseImportClause,
		determineExportType,

		// Source analysis
		extractSourceSnippet,
		findClosingBrace,

		// JSDoc processing
		parseJSDocToStructured,
		parseParamTag,
		parseReturnTag,

		// Content integration
		extractReadmeData,

		// ID generation utilities
		generateModuleId,
		generateReadmeId,
	};

	// Verify all exports are functions
	for (const [exportName, exportValue] of Object.entries(exportedFunctions)) {
		strictEqual(
			typeof exportValue,
			"function",
			`${exportName} should be exported as a function`,
		);
	}

	// Verify we have exactly the expected number of exports
	strictEqual(
		Object.keys(exportedFunctions).length,
		17,
		"Should have exactly 17 function exports",
	);
});

test("API reconstruction - function behavior validation", () => {
	// Test that key functions work as expected

	// Test ID generators
	strictEqual(generateModuleId("/project/src/test.js", "/project"), "src/test");

	strictEqual(generateReadmeId("/project/docs/README.md", "/project"), "docs");

	// Test package metadata
	const packageMetadata = buildPackageMetadata({
		name: "test-package",
		version: "1.0.0",
	});
	deepStrictEqual(packageMetadata, {
		name: "test-package",
		version: "1.0.0",
		description: "",
		exports: {},
		main: undefined,
		module: undefined,
	});

	// Test module exports extraction
	const exportsResult = extractModuleExports(
		"export const test = 'value';\nexport default function() {}",
	);
	deepStrictEqual(exportsResult.sort(), ["default", "test"]);

	// Test module imports extraction
	const importsResult = extractModuleImports(
		"import { test } from './test';\nimport defaultImport from './default';",
	);
	strictEqual(importsResult.length, 2);
	deepStrictEqual(importsResult[0], {
		path: "./test",
		names: ["test"],
		type: "static",
	});

	// Test import clause parsing
	const importNames = parseImportClause("defaultImport, { named1, named2 }");
	deepStrictEqual(importNames, ["defaultImport", "named1", "named2"]);

	// Test source snippet extraction
	const sourceSnippet = extractSourceSnippet(
		["function test() {", "  return true;", "}"],
		1,
		"function",
	);
	strictEqual(sourceSnippet, "function test() {\n  return true;\n}");

	// Test brace finding
	const bracePosition = findClosingBrace(
		["function test() {", "  return true;", "}"],
		0,
	);
	strictEqual(bracePosition, 2);

	// Test export type determination
	const exportType = determineExportType(
		{ name: "test", exported: true },
		"export default test;",
	);
	deepStrictEqual(exportType, ["default"]);

	// Test JSDoc parsing
	const jsDocResult = parseJSDocToStructured({
		description: "Test function",
		tags: {
			param: ["{string} input - Test input"],
			returns: ["{boolean} Test result"],
		},
	});

	strictEqual(jsDocResult.description, "Test function");
	strictEqual(jsDocResult.tags.param.length, 1);
	strictEqual(jsDocResult.tags.param[0].type, "string");
	strictEqual(jsDocResult.tags.param[0].name, "input");

	// Test param tag parsing
	const paramTag = parseParamTag("{number} count - The count");
	deepStrictEqual(paramTag, {
		type: "number",
		name: "count",
		description: "The count",
	});

	// Test return tag parsing
	const returnTag = parseReturnTag("{string} The result");
	deepStrictEqual(returnTag, {
		type: "string",
		description: "The result",
	});

	// Test buildEntityReferences (should not throw)
	const mockGraph = { entities: {} };
	buildEntityReferences(mockGraph);
	deepStrictEqual(mockGraph.entities, {}); // Should remain unchanged
});
