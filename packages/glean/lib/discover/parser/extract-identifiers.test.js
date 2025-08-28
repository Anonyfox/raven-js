/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Exhaustive test suite for JavaScript symbol extraction.
 */

import { deepStrictEqual } from "node:assert";
import { test } from "node:test";
import { Identifier } from "../models/identifier.js";
import { extractIdentifiers } from "./extract-identifiers.js";

/**
 * Helper function to convert array of Identifiers to plain objects for testing.
 * @param {Array<Identifier>} identifiers - Array of Identifier instances
 * @returns {Array<{exportedName: string, originalName: string, sourcePath: string|null}>}
 */
function toPlainObjects(identifiers) {
	return identifiers.map((id) => id.toJSON());
}

test("extractIdentifiers - returns Identifier instances", () => {
	const code = `export const test = 'value';`;
	const result = extractIdentifiers(code);

	// Verify we get Identifier instances
	deepStrictEqual(result.length, 1);
	deepStrictEqual(result[0] instanceof Identifier, true);
	deepStrictEqual(result[0].exportedName, "test");
	deepStrictEqual(result[0].originalName, "test");
	deepStrictEqual(result[0].sourcePath, null);
});

test("extractIdentifiers - empty and invalid inputs", () => {
	deepStrictEqual(toPlainObjects(extractIdentifiers("")), []);
	deepStrictEqual(toPlainObjects(extractIdentifiers("   ")), []);
	deepStrictEqual(toPlainObjects(extractIdentifiers("// just comments")), []);
	deepStrictEqual(
		toPlainObjects(extractIdentifiers("/* block comment */")),
		[],
	);
	deepStrictEqual(toPlainObjects(extractIdentifiers(null)), []);
	deepStrictEqual(toPlainObjects(extractIdentifiers(undefined)), []);
});

test("extractIdentifiers - basic named exports", () => {
	const code = `
		export const foo = 'value';
		export let bar = 123;
		export var baz = true;
	`;

	const expected = [
		{ exportedName: "foo", originalName: "foo", sourcePath: null },
		{ exportedName: "bar", originalName: "bar", sourcePath: null },
		{ exportedName: "baz", originalName: "baz", sourcePath: null },
	];

	deepStrictEqual(toPlainObjects(extractIdentifiers(code)), expected);
});

test("extractIdentifiers - function and class exports", () => {
	const code = `
		export function myFunction() {
			return 'hello';
		}

		export class MyClass {
			constructor() {}
		}

		export async function asyncFunc() {}
		export function* generatorFunc() {}
	`;

	const expected = [
		{
			exportedName: "myFunction",
			originalName: "myFunction",
			sourcePath: null,
		},
		{ exportedName: "MyClass", originalName: "MyClass", sourcePath: null },
		{ exportedName: "asyncFunc", originalName: "asyncFunc", sourcePath: null },
		{
			exportedName: "generatorFunc",
			originalName: "generatorFunc",
			sourcePath: null,
		},
	];

	deepStrictEqual(toPlainObjects(extractIdentifiers(code)), expected);
});

test("extractIdentifiers - default exports", () => {
	const code1 = `export default function() {}`;
	deepStrictEqual(toPlainObjects(extractIdentifiers(code1)), [
		{ exportedName: "default", originalName: "default", sourcePath: null },
	]);

	const code2 = `export default class {}`;
	deepStrictEqual(toPlainObjects(extractIdentifiers(code2)), [
		{ exportedName: "default", originalName: "default", sourcePath: null },
	]);

	const code3 = `export default 'some value';`;
	deepStrictEqual(toPlainObjects(extractIdentifiers(code3)), [
		{ exportedName: "default", originalName: "default", sourcePath: null },
	]);

	const code4 = `
		const myDefault = 'value';
		export default myDefault;
	`;
	deepStrictEqual(toPlainObjects(extractIdentifiers(code4)), [
		{ exportedName: "default", originalName: "myDefault", sourcePath: null },
	]);
});

test("extractIdentifiers - named default exports", () => {
	const code = `
		export default function namedFunction() {}
		export default class NamedClass {}
	`;

	const expected = [
		{
			exportedName: "default",
			originalName: "namedFunction",
			sourcePath: null,
		},
		{ exportedName: "default", originalName: "NamedClass", sourcePath: null },
	];

	deepStrictEqual(toPlainObjects(extractIdentifiers(code)), expected);
});

test("extractIdentifiers - export lists", () => {
	const code = `
		const foo = 'value';
		const bar = 123;
		const baz = true;

		export { foo, bar, baz };
	`;

	const expected = [
		{ exportedName: "foo", originalName: "foo", sourcePath: null },
		{ exportedName: "bar", originalName: "bar", sourcePath: null },
		{ exportedName: "baz", originalName: "baz", sourcePath: null },
	];

	deepStrictEqual(toPlainObjects(extractIdentifiers(code)), expected);
});

test("extractIdentifiers - export lists with aliases", () => {
	const code = `
		const foo = 'value';
		const bar = 123;

		export { foo as renamedFoo, bar, bar as alsoBar };
	`;

	const expected = [
		{ exportedName: "renamedFoo", originalName: "foo", sourcePath: null },
		{ exportedName: "bar", originalName: "bar", sourcePath: null },
		{ exportedName: "alsoBar", originalName: "bar", sourcePath: null },
	];

	deepStrictEqual(toPlainObjects(extractIdentifiers(code)), expected);
});

test("extractIdentifiers - export default from lists", () => {
	const code = `
		const myDefault = 'value';
		export { myDefault as default };
	`;

	const expected = [
		{ exportedName: "default", originalName: "myDefault", sourcePath: null },
	];

	deepStrictEqual(toPlainObjects(extractIdentifiers(code)), expected);
});

test("extractIdentifiers - re-exports from other modules", () => {
	const code = `
		export { foo, bar } from './utils.js';
		export { baz as renamed } from "./helpers.js";
		export { default } from './default-export.js';
		export { default as namedDefault } from './another.js';
	`;

	const expected = [
		{ exportedName: "foo", originalName: "foo", sourcePath: "./utils.js" },
		{ exportedName: "bar", originalName: "bar", sourcePath: "./utils.js" },
		{
			exportedName: "renamed",
			originalName: "baz",
			sourcePath: "./helpers.js",
		},
		{
			exportedName: "default",
			originalName: "default",
			sourcePath: "./default-export.js",
		},
		{
			exportedName: "namedDefault",
			originalName: "default",
			sourcePath: "./another.js",
		},
	];

	deepStrictEqual(toPlainObjects(extractIdentifiers(code)), expected);
});

test("extractIdentifiers - wildcard re-exports", () => {
	const code = `
		export * from './all-utils.js';
		export * as namespace from "./namespaced.js";
	`;

	const expected = [
		{ exportedName: "*", originalName: "*", sourcePath: "./all-utils.js" },
		{
			exportedName: "namespace",
			originalName: "*",
			sourcePath: "./namespaced.js",
		},
	];

	deepStrictEqual(toPlainObjects(extractIdentifiers(code)), expected);
});

test("extractIdentifiers - import then export patterns", () => {
	const code = `
		import { helper } from './utils.js';
		import { format as formatter } from './format.js';
		import defaultImport from './default.js';

		export { helper };
		export { formatter as format };
		export { defaultImport as myDefault };
	`;

	const expected = [
		{
			exportedName: "helper",
			originalName: "helper",
			sourcePath: "./utils.js",
		},
		{
			exportedName: "format",
			originalName: "format",
			sourcePath: "./format.js",
		},
		{
			exportedName: "myDefault",
			originalName: "defaultImport",
			sourcePath: "./default.js",
		},
	];

	deepStrictEqual(toPlainObjects(extractIdentifiers(code)), expected);
});

test("extractIdentifiers - complex import patterns", () => {
	const code = `
		import defaultImport, { named1, named2 as alias } from './mixed.js';
		import * as namespace from './namespace.js';

		export { defaultImport };
		export { named1, alias };
		export { namespace };
	`;

	const expected = [
		{
			exportedName: "defaultImport",
			originalName: "defaultImport",
			sourcePath: "./mixed.js",
		},
		{
			exportedName: "named1",
			originalName: "named1",
			sourcePath: "./mixed.js",
		},
		{ exportedName: "alias", originalName: "named2", sourcePath: "./mixed.js" },
		{
			exportedName: "namespace",
			originalName: "namespace",
			sourcePath: "./namespace.js",
		},
	];

	deepStrictEqual(toPlainObjects(extractIdentifiers(code)), expected);
});

test("extractIdentifiers - mixed local and imported exports", () => {
	const code = `
		import { imported } from './external.js';

		const local = 'value';
		function localFunc() {}

		export { imported, local, localFunc };
		export const direct = 'direct';
	`;

	const expected = [
		{
			exportedName: "imported",
			originalName: "imported",
			sourcePath: "./external.js",
		},
		{ exportedName: "local", originalName: "local", sourcePath: null },
		{ exportedName: "localFunc", originalName: "localFunc", sourcePath: null },
		{ exportedName: "direct", originalName: "direct", sourcePath: null },
	];

	deepStrictEqual(toPlainObjects(extractIdentifiers(code)), expected);
});

test("extractIdentifiers - comments and strings should be ignored", () => {
	const code = `
		// export const fake = 'comment';
		/* export const blocked = 'block comment'; */
		const real = 'export const notReal = "fake"';
		const template = \`export const alsoFake = 'template'\`;

		export const real = 'actual export';
		export { real as renamed };
	`;

	const expected = [
		{ exportedName: "real", originalName: "real", sourcePath: null },
		{ exportedName: "renamed", originalName: "real", sourcePath: null },
	];

	deepStrictEqual(toPlainObjects(extractIdentifiers(code)), expected);
});

test("extractIdentifiers - multiline exports", () => {
	const code = `
		export {
			foo,
			bar as renamed,
			baz
		} from './multiline.js';

		export const multiline = {
			prop: 'value'
		};
	`;

	const expected = [
		{ exportedName: "foo", originalName: "foo", sourcePath: "./multiline.js" },
		{
			exportedName: "renamed",
			originalName: "bar",
			sourcePath: "./multiline.js",
		},
		{ exportedName: "baz", originalName: "baz", sourcePath: "./multiline.js" },
		{ exportedName: "multiline", originalName: "multiline", sourcePath: null },
	];

	deepStrictEqual(toPlainObjects(extractIdentifiers(code)), expected);
});

test("extractIdentifiers - destructuring exports", () => {
	const code = `
		export const { prop1, prop2: renamed } = obj;
		export const [first, second] = array;
	`;

	const expected = [
		{ exportedName: "prop1", originalName: "prop1", sourcePath: null },
		{ exportedName: "renamed", originalName: "prop2", sourcePath: null },
		{ exportedName: "first", originalName: "first", sourcePath: null },
		{ exportedName: "second", originalName: "second", sourcePath: null },
	];

	deepStrictEqual(toPlainObjects(extractIdentifiers(code)), expected);
});

test("extractIdentifiers - complex file paths", () => {
	const code = `
		export { foo } from './nested/deep/path.js';
		export { bar } from '../sibling/file.js';
		export { baz } from '@scope/package';
		export { qux } from 'bare-module';
		export { special } from './file-with-dashes_and_underscores.js';
	`;

	const expected = [
		{
			exportedName: "foo",
			originalName: "foo",
			sourcePath: "./nested/deep/path.js",
		},
		{
			exportedName: "bar",
			originalName: "bar",
			sourcePath: "../sibling/file.js",
		},
		{ exportedName: "baz", originalName: "baz", sourcePath: "@scope/package" },
		{ exportedName: "qux", originalName: "qux", sourcePath: "bare-module" },
		{
			exportedName: "special",
			originalName: "special",
			sourcePath: "./file-with-dashes_and_underscores.js",
		},
	];

	deepStrictEqual(toPlainObjects(extractIdentifiers(code)), expected);
});

test("extractIdentifiers - edge cases and complex scenarios", () => {
	const code = `
		// Multiple exports on same line
		export const a = 1, b = 2;

		// Export with complex expressions
		export const computed = obj[key];
		export const arrow = () => {};

		// Export immediately invoked
		export const result = (() => 'value')();

		// Mixed quotes in imports
		import { single } from './single-quotes.js';
		import { double } from "./double-quotes.js";

		export { single, double };
	`;

	const expected = [
		{ exportedName: "a", originalName: "a", sourcePath: null },
		{ exportedName: "b", originalName: "b", sourcePath: null },
		{ exportedName: "computed", originalName: "computed", sourcePath: null },
		{ exportedName: "arrow", originalName: "arrow", sourcePath: null },
		{ exportedName: "result", originalName: "result", sourcePath: null },
		{
			exportedName: "single",
			originalName: "single",
			sourcePath: "./single-quotes.js",
		},
		{
			exportedName: "double",
			originalName: "double",
			sourcePath: "./double-quotes.js",
		},
	];

	deepStrictEqual(toPlainObjects(extractIdentifiers(code)), expected);
});

test("extractIdentifiers - typescript-style exports (should work with JS)", () => {
	const code = `
		export type TypeExport = string; // Should be ignored in JS context
		export interface InterfaceExport {} // Should be ignored in JS context
		export const realExport: string = 'value'; // Type annotation should be handled
		export function typedFunc(): string { return ''; }
	`;

	const expected = [
		{
			exportedName: "realExport",
			originalName: "realExport",
			sourcePath: null,
		},
		{ exportedName: "typedFunc", originalName: "typedFunc", sourcePath: null },
	];

	deepStrictEqual(toPlainObjects(extractIdentifiers(code)), expected);
});

test("extractIdentifiers - no exports in file", () => {
	const code = `
		const local = 'value';
		function helper() {}
		import { something } from './other.js';
		// No exports
	`;

	deepStrictEqual(toPlainObjects(extractIdentifiers(code)), []);
});

test("extractIdentifiers - dynamic imports should be ignored", () => {
	const code = `
		const dynamicImport = await import('./dynamic.js');
		const conditional = condition ? import('./conditional.js') : null;

		export const real = 'value';
	`;

	const expected = [
		{ exportedName: "real", originalName: "real", sourcePath: null },
	];

	deepStrictEqual(toPlainObjects(extractIdentifiers(code)), expected);
});

test("extractIdentifiers - comprehensive real-world example", () => {
	const code = `
		// Imports from various sources
		import React, { useState, useEffect } from 'react';
		import { utils, format as formatter } from './utils.js';
		import * as helpers from './helpers.js';
		import defaultHelper from './default-helper.js';

		// Local definitions
		const localConst = 'value';
		function localFunction() {}
		class LocalClass {}

		// Direct exports
		export const directExport = 'direct';
		export function exportedFunction() {}

		// Re-exports
		export { utils, formatter as format };
		export { helpers };
		export { defaultHelper as helper };

		// Export list with mix
		export {
			localConst as constant,
			localFunction,
			LocalClass
		};

		// Default export
		export default LocalClass;

		// Wildcard re-export
		export * from './all-exports.js';
	`;

	const expected = [
		{
			exportedName: "directExport",
			originalName: "directExport",
			sourcePath: null,
		},
		{
			exportedName: "exportedFunction",
			originalName: "exportedFunction",
			sourcePath: null,
		},
		{ exportedName: "utils", originalName: "utils", sourcePath: "./utils.js" },
		{
			exportedName: "format",
			originalName: "format",
			sourcePath: "./utils.js",
		},
		{
			exportedName: "helpers",
			originalName: "helpers",
			sourcePath: "./helpers.js",
		},
		{
			exportedName: "helper",
			originalName: "defaultHelper",
			sourcePath: "./default-helper.js",
		},
		{ exportedName: "constant", originalName: "localConst", sourcePath: null },
		{
			exportedName: "localFunction",
			originalName: "localFunction",
			sourcePath: null,
		},
		{
			exportedName: "LocalClass",
			originalName: "LocalClass",
			sourcePath: null,
		},
		{ exportedName: "default", originalName: "LocalClass", sourcePath: null },
		{ exportedName: "*", originalName: "*", sourcePath: "./all-exports.js" },
	];

	deepStrictEqual(toPlainObjects(extractIdentifiers(code)), expected);
});
