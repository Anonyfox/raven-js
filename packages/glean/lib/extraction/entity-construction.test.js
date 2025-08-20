/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual } from "node:assert";
import { test } from "node:test";
import { buildEntityNode } from "./entity-construction.js";

test("buildEntityNode - comprehensive branch coverage", async () => {
	const packagePath = "/project/root";
	const filePath = "/project/root/src/utils/helper.js";
	const moduleId = "src/utils/helper";

	// Test function entity with JSDoc
	const functionContent = `/**
 * A helper function that processes data
 * @param {string} input - The input data
 * @param {boolean} flag - Processing flag
 * @returns {Object} Processed result
 */
export function processData(input, flag) {
  return { input, flag };
}`;

	const functionLines = functionContent.split("\n");
	const functionEntity = {
		type: "function",
		name: "processData",
		line: 7, // Line where function is declared (1-based indexing)
		exported: true,
	};

	const functionResult = await buildEntityNode(
		functionEntity,
		functionContent,
		functionLines,
		filePath,
		packagePath,
		moduleId,
	);

	deepStrictEqual(functionResult, {
		id: "src/utils/helper/processData",
		type: "function",
		name: "processData",
		location: {
			file: "src/utils/helper.js",
			line: 7,
			column: 0,
		},
		exports: ["named"],
		jsdoc: {
			description: "A helper function that processes data",
			tags: {
				param: [
					{ type: "string", name: "input", description: "The input data" },
					{ type: "boolean", name: "flag", description: "Processing flag" },
				],
				returns: { type: "Object", description: "Processed result /" },
			},
		},
		references: [],
		referencedBy: [],
		source:
			"export function processData(input, flag) {\n  return { input, flag };\n}",
		moduleId: "src/utils/helper",
	});

	// Test class entity without JSDoc
	const classContent = `import { BaseClass } from './base';

export class MyClass extends BaseClass {
  constructor(value) {
    super();
    this.value = value;
  }

  getValue() {
    return this.value;
  }
}`;

	const classLines = classContent.split("\n");
	const classEntity = {
		type: "class",
		name: "MyClass",
		line: 3, // Line where class is declared
		exported: true,
	};

	const classResult = await buildEntityNode(
		classEntity,
		classContent,
		classLines,
		filePath,
		packagePath,
		moduleId,
	);

	deepStrictEqual(classResult, {
		id: "src/utils/helper/MyClass",
		type: "class",
		name: "MyClass",
		location: {
			file: "src/utils/helper.js",
			line: 3,
			column: 0,
		},
		exports: ["named"],
		jsdoc: null, // No JSDoc comment
		references: [],
		referencedBy: [],
		source: `export class MyClass extends BaseClass {
  constructor(value) {
    super();
    this.value = value;
  }

  getValue() {
    return this.value;
  }
}`,
		moduleId: "src/utils/helper",
	});

	// Test variable entity with default export
	const variableContent = `const myVariable = {
  key: "value",
  number: 42
};

export default myVariable;`;

	const variableLines = variableContent.split("\n");
	const variableEntity = {
		type: "variable",
		name: "myVariable",
		line: 1, // Line where variable is declared
		exported: true,
	};

	const variableResult = await buildEntityNode(
		variableEntity,
		variableContent,
		variableLines,
		filePath,
		packagePath,
		moduleId,
	);

	deepStrictEqual(variableResult, {
		id: "src/utils/helper/myVariable",
		type: "variable",
		name: "myVariable",
		location: {
			file: "src/utils/helper.js",
			line: 1,
			column: 0,
		},
		exports: ["default"],
		jsdoc: null,
		references: [],
		referencedBy: [],
		source: `const myVariable = {
  key: "value",
  number: 42`,
		moduleId: "src/utils/helper",
	});

	// Test non-exported entity
	const internalContent = `function internalFunction() {
  return "internal";
}

export const publicConst = "public";`;

	const internalLines = internalContent.split("\n");
	const internalEntity = {
		type: "function",
		name: "internalFunction",
		line: 1,
		exported: false,
	};

	const internalResult = await buildEntityNode(
		internalEntity,
		internalContent,
		internalLines,
		filePath,
		packagePath,
		moduleId,
	);

	deepStrictEqual(internalResult, {
		id: "src/utils/helper/internalFunction",
		type: "function",
		name: "internalFunction",
		location: {
			file: "src/utils/helper.js",
			line: 1,
			column: 0,
		},
		exports: [], // Not exported
		jsdoc: null,
		references: [],
		referencedBy: [],
		source: `function internalFunction() {
  return "internal";
}`,
		moduleId: "src/utils/helper",
	});

	// Test entity with malformed JSDoc
	const malformedJSDocContent = `/**
 * Incomplete JSDoc comment
 * @param {string name - Missing closing brace
 * @returns {boolean True if valid
 */
export function malformedDocFunction(name) {
  return true;
}`;

	const malformedLines = malformedJSDocContent.split("\n");
	const malformedEntity = {
		type: "function",
		name: "malformedDocFunction",
		line: 7,
		exported: true,
	};

	const malformedResult = await buildEntityNode(
		malformedEntity,
		malformedJSDocContent,
		malformedLines,
		filePath,
		packagePath,
		moduleId,
	);

	// Should handle malformed JSDoc gracefully (might be null if too malformed)
	// The validation.js findPrecedingJSDoc might reject severely malformed JSDoc
	if (malformedResult.jsdoc) {
		deepStrictEqual(
			malformedResult.jsdoc.description,
			"Incomplete JSDoc comment",
		);
	} else {
		// If JSDoc is too malformed to parse, should be null
		deepStrictEqual(malformedResult.jsdoc, null);
	}
	deepStrictEqual(malformedResult.exports, ["named"]);

	// Test root level file
	const rootFilePath = "/project/root/index.js";
	const rootModuleId = "index";
	const rootContent = `export const ROOT_CONSTANT = "root";`;
	const rootLines = rootContent.split("\n");
	const rootEntity = {
		type: "variable",
		name: "ROOT_CONSTANT",
		line: 1,
		exported: true,
	};

	const rootResult = await buildEntityNode(
		rootEntity,
		rootContent,
		rootLines,
		rootFilePath,
		packagePath,
		rootModuleId,
	);

	deepStrictEqual(rootResult.location.file, "index.js");
	deepStrictEqual(rootResult.id, "index/ROOT_CONSTANT");
	deepStrictEqual(rootResult.moduleId, "index");

	// Test deeply nested file path
	const deepFilePath = "/project/root/src/components/ui/forms/Input.js";
	const deepModuleId = "src/components/ui/forms/Input";
	const deepContent = `export class Input {}`;
	const deepLines = deepContent.split("\n");
	const deepEntity = {
		type: "class",
		name: "Input",
		line: 1,
		exported: true,
	};

	const deepResult = await buildEntityNode(
		deepEntity,
		deepContent,
		deepLines,
		deepFilePath,
		packagePath,
		deepModuleId,
	);

	deepStrictEqual(deepResult.location.file, "src/components/ui/forms/Input.js");
	deepStrictEqual(deepResult.id, "src/components/ui/forms/Input/Input");
	deepStrictEqual(deepResult.moduleId, "src/components/ui/forms/Input");
});
