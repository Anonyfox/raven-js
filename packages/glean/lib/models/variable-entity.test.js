/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";
import { VariableEntity } from "./variable-entity.js";

test("VariableEntity - basic variable entity creation", () => {
	const location = { file: "test.js", line: 42, column: 5 };
	const variable = new VariableEntity("testVariable", location);

	strictEqual(variable.entityType, "variable");
	strictEqual(variable.name, "testVariable");
	deepStrictEqual(variable.location, location);
	strictEqual(variable.declarationType, "const");
	strictEqual(variable.hasInitializer, false);
	strictEqual(variable.isReadonly, false);
	strictEqual(variable.initializer, null);
});

test("VariableEntity - valid JSDoc tags", () => {
	const variable = new VariableEntity("test", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	// Valid variable tags
	strictEqual(variable.isValidJSDocTag("type"), true);
	strictEqual(variable.isValidJSDocTag("readonly"), true);
	strictEqual(variable.isValidJSDocTag("since"), true);
	strictEqual(variable.isValidJSDocTag("deprecated"), true);
	strictEqual(variable.isValidJSDocTag("see"), true);
	strictEqual(variable.isValidJSDocTag("author"), true);
	strictEqual(variable.isValidJSDocTag("example"), true);

	// Invalid tags
	strictEqual(variable.isValidJSDocTag("param"), false);
	strictEqual(variable.isValidJSDocTag("returns"), false);
	strictEqual(variable.isValidJSDocTag("throws"), false);
});

test("VariableEntity - const variable parsing", () => {
	const variable = new VariableEntity("API_URL", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "API_URL", line: 1 };
	const content = 'const API_URL = "https://api.example.com";';

	variable.parseEntity(rawEntity, content);

	strictEqual(variable.declarationType, "const");
	strictEqual(variable.isReadonly, true);
	strictEqual(variable.hasInitializer, true);
	strictEqual(variable.initializer, '"https://api.example.com"');
	strictEqual(variable.inferredType, "string");
});

test("VariableEntity - let variable parsing", () => {
	const variable = new VariableEntity("counter", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "counter", line: 1 };
	const content = "let counter = 42;";

	variable.parseEntity(rawEntity, content);

	strictEqual(variable.declarationType, "let");
	strictEqual(variable.isReadonly, false);
	strictEqual(variable.hasInitializer, true);
	strictEqual(variable.initializer, "42");
	strictEqual(variable.inferredType, "number");
});

test("VariableEntity - var variable parsing", () => {
	const variable = new VariableEntity("oldStyle", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "oldStyle", line: 1 };
	const content = "var oldStyle = true;";

	variable.parseEntity(rawEntity, content);

	strictEqual(variable.declarationType, "var");
	strictEqual(variable.isReadonly, false);
	strictEqual(variable.hasInitializer, true);
	strictEqual(variable.initializer, "true");
	strictEqual(variable.inferredType, "boolean");
});

test("VariableEntity - type inference from literals", () => {
	const testCases = [
		{ init: '"hello"', expected: "string" },
		{ init: "'world'", expected: "string" },
		{ init: "`template`", expected: "string" },
		{ init: "42", expected: "number" },
		{ init: "3.14", expected: "number" },
		{ init: "true", expected: "boolean" },
		{ init: "false", expected: "boolean" },
		{ init: "null", expected: "null" },
		{ init: "undefined", expected: "undefined" },
		{ init: "[1, 2, 3]", expected: "Array" },
		{ init: '{ name: "test" }', expected: "Object" },
		{ init: "() => {}", expected: "Function" },
		{ init: "function() {}", expected: "Function" },
		{ init: "new Date()", expected: "Date" },
		{ init: "new Map()", expected: "Map" },
		{ init: "someVariable", expected: "unknown" },
	];

	for (const { init, expected } of testCases) {
		const variable = new VariableEntity("test", {
			file: "test.js",
			line: 1,
			column: 0,
		});
		const rawEntity = { name: "test", line: 1 };
		const content = `const test = ${init};`;

		variable.parseEntity(rawEntity, content);
		strictEqual(
			variable.inferredType,
			expected,
			`Failed for initializer: ${init}`,
		);
	}
});

test("VariableEntity - no initializer", () => {
	const variable = new VariableEntity("uninit", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "uninit", line: 1 };
	const content = "let uninit;";

	variable.parseEntity(rawEntity, content);

	strictEqual(variable.hasInitializer, false);
	strictEqual(variable.initializer, null);
	strictEqual(variable.inferredType, null);
});

test("VariableEntity - complex initializer", () => {
	const variable = new VariableEntity("config", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "config", line: 1 };
	const content =
		'const config = { api: { url: "https://api.com", timeout: 5000 }, debug: true };';

	variable.parseEntity(rawEntity, content);

	strictEqual(variable.hasInitializer, true);
	strictEqual(
		variable.initializer,
		'{ api: { url: "https://api.com", timeout: 5000 }, debug: true }',
	);
	strictEqual(variable.inferredType, "Object");
});

test("VariableEntity - exported variable", () => {
	const variable = new VariableEntity("VERSION", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "VERSION", line: 1 };
	const content = 'export const VERSION = "1.0.0";';

	variable.parseEntity(rawEntity, content);

	strictEqual(variable.declarationType, "const");
	strictEqual(variable.isReadonly, true);
	strictEqual(variable.initializer, '"1.0.0"');
	strictEqual(variable.inferredType, "string");
});

test("VariableEntity - signature generation", () => {
	// Simple const
	const var1 = new VariableEntity("API_URL", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	var1.parseEntity(
		{ name: "API_URL", line: 1 },
		'const API_URL = "https://api.com";',
	);
	strictEqual(var1.getSignature(), 'const API_URL = "https://api.com"');

	// Long initializer truncation
	const var2 = new VariableEntity("longVar", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const longInit = "a".repeat(60);
	var2.parseEntity(
		{ name: "longVar", line: 1 },
		`const longVar = "${longInit}";`,
	);
	strictEqual(var2.getSignature().includes("..."), true);

	// No initializer
	const var3 = new VariableEntity("uninit", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	var3.parseEntity({ name: "uninit", line: 1 }, "let uninit;");
	strictEqual(var3.getSignature(), "let uninit");
});

test("VariableEntity - validation", () => {
	const variable = new VariableEntity("testVar", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "testVar", line: 1 };
	const content = 'const testVar = "value";';

	variable.parseEntity(rawEntity, content);
	variable.validate();

	strictEqual(variable.isValid(), true);
	strictEqual(variable.validationIssues.length, 0);
});

test("VariableEntity - validation with empty name", () => {
	const variable = new VariableEntity("", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	variable.validate();
	strictEqual(variable.isValid(), false);
});

test("VariableEntity - HTML output", () => {
	const variable = new VariableEntity("API_URL", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	variable.parseEntity(
		{ name: "API_URL", line: 1 },
		'const API_URL = "https://api.com";',
	);

	const html = variable.toHTML();

	strictEqual(html.includes("API_URL"), true);
	strictEqual(html.includes("const"), true);
	strictEqual(html.includes("readonly"), true);
	strictEqual(html.includes("const API_URL"), true);
	strictEqual(html.includes("string"), true);
});

test("VariableEntity - Markdown output", () => {
	const variable = new VariableEntity("API_URL", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	variable.parseEntity(
		{ name: "API_URL", line: 1 },
		'const API_URL = "https://api.com";',
	);

	const markdown = variable.toMarkdown();

	strictEqual(markdown.includes("### API_URL"), true);
	strictEqual(markdown.includes("**Type:** const (readonly)"), true);
	strictEqual(markdown.includes("**Inferred Type:** `string`"), true);
	strictEqual(markdown.includes("const API_URL"), true);
});
