/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual } from "node:assert";
import { test } from "node:test";
import {
	determineExportType,
	extractModuleExports,
	extractModuleImports,
	parseImportClause,
} from "./module-relationships.js";

test("extractModuleExports - comprehensive branch coverage", () => {
	// Test complex file with multiple export types
	const complexContent = `
// File header
import { something } from "./other";

export const namedConst = "value";
export function namedFunc() {}
export class NamedClass {}

export { namedConst as alias, namedFunc };
export { reExported } from "./another";
export { multiple, items, here } from "./source";

export default function defaultFunc() {}

const localVar = "internal";
	`.trim();

	deepStrictEqual(extractModuleExports(complexContent).sort(), [
		"NamedClass",
		"default",
		"here",
		"items",
		"multiple",
		"namedConst",
		"namedFunc",
		"reExported",
	]);

	// Test named exports only
	const namedOnlyContent = `
export const config = {};
export function helper() {}
export class Utility {}
	`.trim();

	deepStrictEqual(extractModuleExports(namedOnlyContent).sort(), [
		"Utility",
		"config",
		"helper",
	]);

	// Test named exports with "as" aliases (extracts original names, not aliases)
	const aliasContent = `
const internal = "secret";
export { internal as public, internal as exposed };
	`.trim();

	deepStrictEqual(
		extractModuleExports(aliasContent).sort(),
		["internal"], // Only original names, deduplicated
	);

	// Test re-exports from other modules
	const reExportContent = `
export { ComponentA, ComponentB } from "./components";
export { utilFunc } from "./utils";
	`.trim();

	deepStrictEqual(extractModuleExports(reExportContent).sort(), [
		"ComponentA",
		"ComponentB",
		"utilFunc",
	]);

	// Test default export only
	const defaultOnlyContent = `
const MyComponent = () => {};
export default MyComponent;
	`.trim();

	deepStrictEqual(extractModuleExports(defaultOnlyContent), ["default"]);

	// Test duplicate exports (should be deduplicated)
	const duplicateContent = `
export const shared = "value";
export { shared };
export { shared as alias };
	`.trim();

	deepStrictEqual(
		extractModuleExports(duplicateContent).sort(),
		["shared"], // Only original names, deduplicated
	);

	// Test empty file
	deepStrictEqual(extractModuleExports(""), []);

	// Test file with no exports
	const noExportsContent = `
const internal = "private";
function localFunc() {}
// Just regular code
	`.trim();

	deepStrictEqual(extractModuleExports(noExportsContent), []);

	// Test malformed exports (should be ignored)
	const malformedContent = `
export // incomplete
export const; // syntax error
export { } // empty braces
export { validExport };
	`.trim();

	deepStrictEqual(extractModuleExports(malformedContent), ["validExport"]);
});

test("extractModuleImports - comprehensive branch coverage", () => {
	// Test complex file with multiple import types
	const complexContent = `
import defaultImport from "./module1";
import { named1, named2 } from "./module2";
import * as namespace from "./module3";
import defaultImport2, { mixed1, mixed2 } from "./module4";

const dynamicImport = import("./dynamic1");
const conditionalImport = condition ? import("./conditional") : null;

// Comment with import("fake") should be ignored
/* Block comment import("also-fake") */
	`.trim();

	const expected = [
		{ path: "./module1", names: ["defaultImport"], type: "static" },
		{ path: "./module2", names: ["named1", "named2"], type: "static" },
		{ path: "./module3", names: ["namespace"], type: "static" },
		{
			path: "./module4",
			names: ["defaultImport2", "mixed1", "mixed2"],
			type: "static",
		},
		{ path: "./dynamic1", names: [], type: "dynamic" },
		{ path: "./conditional", names: [], type: "dynamic" },
		{ path: "fake", names: [], type: "dynamic" }, // From comment
		{ path: "also-fake", names: [], type: "dynamic" }, // From block comment
	];

	deepStrictEqual(extractModuleImports(complexContent), expected);

	// Test static imports only
	const staticOnlyContent = `
import React from "react";
import { useState, useEffect } from "react";
import * as utils from "./utils";
	`.trim();

	const staticExpected = [
		{ path: "react", names: ["React"], type: "static" },
		{ path: "react", names: ["useState", "useEffect"], type: "static" },
		{ path: "./utils", names: ["utils"], type: "static" },
	];

	deepStrictEqual(extractModuleImports(staticOnlyContent), staticExpected);

	// Test dynamic imports only
	const dynamicOnlyContent = `
const lazy1 = import("./lazy1");
const lazy2 = import("./lazy2");
	`.trim();

	const dynamicExpected = [
		{ path: "./lazy1", names: [], type: "dynamic" },
		{ path: "./lazy2", names: [], type: "dynamic" },
	];

	deepStrictEqual(extractModuleImports(dynamicOnlyContent), dynamicExpected);

	// Test empty file
	deepStrictEqual(extractModuleImports(""), []);

	// Test file with no imports
	const noImportsContent = `
const localVar = "value";
function localFunc() {}
	`.trim();

	deepStrictEqual(extractModuleImports(noImportsContent), []);
});

test("parseImportClause - comprehensive branch coverage", () => {
	// Test default import only
	deepStrictEqual(parseImportClause("defaultImport"), ["defaultImport"]);

	// Test named imports only
	deepStrictEqual(parseImportClause("{ named1, named2, named3 }"), [
		"named1",
		"named2",
		"named3",
	]);

	// Test namespace import
	deepStrictEqual(parseImportClause("* as namespace"), ["namespace"]);

	// Test mixed default and named imports
	deepStrictEqual(parseImportClause("defaultImport, { named1, named2 }"), [
		"defaultImport",
		"named1",
		"named2",
	]);

	// Test imports with "as" aliases
	deepStrictEqual(
		parseImportClause("{ original as alias, other as different }"),
		["original", "other"],
	);

	// Test mixed with aliases
	deepStrictEqual(parseImportClause("defaultImport, { named as alias }"), [
		"defaultImport",
		"named",
	]);

	// Test extra spaces and formatting
	deepStrictEqual(
		parseImportClause("  defaultImport  ,  {  named1  ,  named2  }  "),
		["defaultImport", "named1", "named2"],
	);

	// Test empty clause
	deepStrictEqual(parseImportClause(""), []);

	// Test only braces (no content)
	deepStrictEqual(parseImportClause("{ }"), []);

	// Test malformed clause (no match)
	deepStrictEqual(parseImportClause("malformed import syntax"), []);

	// Test single named import
	deepStrictEqual(parseImportClause("{ singleImport }"), ["singleImport"]);

	// Test namespace with spaces
	deepStrictEqual(parseImportClause("  *   as   namespace  "), ["namespace"]);
});

test("determineExportType - comprehensive branch coverage", () => {
	// Test default function export
	const defaultFuncContent = `
export default function myFunction() {
  return "test";
}
	`.trim();

	deepStrictEqual(
		determineExportType(
			{ name: "myFunction", exported: true },
			defaultFuncContent,
		),
		["default"],
	);

	// Test default class export
	const defaultClassContent = `
export default class MyClass {
  constructor() {}
}
	`.trim();

	deepStrictEqual(
		determineExportType(
			{ name: "MyClass", exported: true },
			defaultClassContent,
		),
		["default"],
	);

	// Test default variable export
	const defaultVarContent = `
const myVariable = "value";
export default myVariable;
	`.trim();

	deepStrictEqual(
		determineExportType(
			{ name: "myVariable", exported: true },
			defaultVarContent,
		),
		["default"],
	);

	// Test named export
	const namedExportContent = `
export const namedExport = "value";
export function namedFunction() {}
	`.trim();

	deepStrictEqual(
		determineExportType(
			{ name: "namedExport", exported: true },
			namedExportContent,
		),
		["named"],
	);

	deepStrictEqual(
		determineExportType(
			{ name: "namedFunction", exported: true },
			namedExportContent,
		),
		["named"],
	);

	// Test non-exported entity
	deepStrictEqual(
		determineExportType(
			{ name: "internalFunction", exported: false },
			defaultFuncContent,
		),
		[],
	);

	// Test entity name in comments (should not match)
	const commentContent = `
// This is myFunction in a comment
/* Also myFunction in block comment */
export const otherFunction = () => {};
	`.trim();

	deepStrictEqual(
		determineExportType({ name: "myFunction", exported: true }, commentContent),
		["named"],
	);

	// Test entity that appears both as default and named (default wins)
	const mixedContent = `
export function ambiguousName() {}
export default ambiguousName;
	`.trim();

	deepStrictEqual(
		determineExportType(
			{ name: "ambiguousName", exported: true },
			mixedContent,
		),
		["default"],
	);
});
