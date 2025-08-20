/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";
import { FunctionEntity } from "./function-entity.js";
import { JSDocParamTag } from "./jsdoc-param-tag.js";
import { JSDocReturnsTag } from "./jsdoc-returns-tag.js";

test("FunctionEntity - basic function entity creation", () => {
	const location = { file: "test.js", line: 42, column: 5 };
	const func = new FunctionEntity("testFunction", location);

	strictEqual(func.entityType, "function");
	strictEqual(func.name, "testFunction");
	deepStrictEqual(func.location, location);
	strictEqual(func.functionType, "function");
	strictEqual(func.isAsync, false);
	strictEqual(func.isGenerator, false);
	strictEqual(func.isArrow, false);
	deepStrictEqual(func.parameters, []);
});

test("FunctionEntity - valid JSDoc tags", () => {
	const func = new FunctionEntity("test", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	// Valid function tags
	strictEqual(func.isValidJSDocTag("param"), true);
	strictEqual(func.isValidJSDocTag("returns"), true);
	strictEqual(func.isValidJSDocTag("return"), true);
	strictEqual(func.isValidJSDocTag("throws"), true);
	strictEqual(func.isValidJSDocTag("example"), true);
	strictEqual(func.isValidJSDocTag("since"), true);
	strictEqual(func.isValidJSDocTag("deprecated"), true);
	strictEqual(func.isValidJSDocTag("see"), true);
	strictEqual(func.isValidJSDocTag("override"), true);

	// Invalid tags
	strictEqual(func.isValidJSDocTag("property"), false);
	strictEqual(func.isValidJSDocTag("extends"), false);
	strictEqual(func.isValidJSDocTag("invalid"), false);
});

test("FunctionEntity - regular function parsing", () => {
	const func = new FunctionEntity("regularFunction", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "regularFunction", line: 1 };
	const content =
		"function regularFunction(name, age = 25, ...args) {\n  return true;\n}";

	func.parseEntity(rawEntity, content);

	strictEqual(func.functionType, "function");
	strictEqual(func.isAsync, false);
	strictEqual(func.isGenerator, false);
	strictEqual(func.isArrow, false);
	strictEqual(func.parameters.length, 3);

	// Check parameters
	const nameParam = func.parameters[0];
	strictEqual(nameParam.name, "name");
	strictEqual(nameParam.isRest, false);
	strictEqual(nameParam.hasDefault, false);

	const ageParam = func.parameters[1];
	strictEqual(ageParam.name, "age");
	strictEqual(ageParam.hasDefault, true);
	strictEqual(ageParam.defaultValue, "25");

	const argsParam = func.parameters[2];
	strictEqual(argsParam.name, "args");
	strictEqual(argsParam.isRest, true);
	strictEqual(argsParam.hasDefault, false);
});

test("FunctionEntity - async function parsing", () => {
	const func = new FunctionEntity("asyncFunction", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "asyncFunction", line: 1 };
	const content =
		"async function asyncFunction(data) {\n  return await process(data);\n}";

	func.parseEntity(rawEntity, content);

	strictEqual(func.functionType, "async");
	strictEqual(func.isAsync, true);
	strictEqual(func.isGenerator, false);
	strictEqual(func.isArrow, false);
	strictEqual(func.parameters.length, 1);
	strictEqual(func.parameters[0].name, "data");
});

test("FunctionEntity - generator function parsing", () => {
	const func = new FunctionEntity("generatorFunction", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "generatorFunction", line: 1 };
	const content =
		"function* generatorFunction(start, end) {\n  yield start;\n  yield end;\n}";

	func.parseEntity(rawEntity, content);

	strictEqual(func.functionType, "generator");
	strictEqual(func.isAsync, false);
	strictEqual(func.isGenerator, true);
	strictEqual(func.isArrow, false);
	strictEqual(func.parameters.length, 2);
});

test("FunctionEntity - async generator function parsing", () => {
	const func = new FunctionEntity("asyncGenFunction", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "asyncGenFunction", line: 1 };
	const content =
		"async function* asyncGenFunction(items) {\n  for (const item of items) {\n    yield await process(item);\n  }\n}";

	func.parseEntity(rawEntity, content);

	strictEqual(func.functionType, "async-generator");
	strictEqual(func.isAsync, true);
	strictEqual(func.isGenerator, true);
	strictEqual(func.isArrow, false);
});

test("FunctionEntity - arrow function parsing", () => {
	const func = new FunctionEntity("arrowFunction", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "arrowFunction", line: 1 };
	const content = "const arrowFunction = (x, y = 10) => x + y;";

	func.parseEntity(rawEntity, content);

	strictEqual(func.functionType, "arrow");
	strictEqual(func.isAsync, false);
	strictEqual(func.isGenerator, false);
	strictEqual(func.isArrow, true);
	strictEqual(func.parameters.length, 2);
	strictEqual(func.parameters[1].defaultValue, "10");
});

test("FunctionEntity - async arrow function parsing", () => {
	const func = new FunctionEntity("asyncArrow", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "asyncArrow", line: 1 };
	const content = "const asyncArrow = async (data) => await fetch(data);";

	func.parseEntity(rawEntity, content);

	strictEqual(func.functionType, "async");
	strictEqual(func.isAsync, true);
	strictEqual(func.isArrow, true);
});

test("FunctionEntity - complex parameter parsing", () => {
	const func = new FunctionEntity("complexFunction", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "complexFunction", line: 1 };
	const content =
		"function complexFunction({name, age}, [x, y], callback = () => {}, ...rest) {}";

	func.parseEntity(rawEntity, content);

	strictEqual(func.parameters.length, 4);

	// Destructured object parameter
	const objParam = func.parameters[0];
	strictEqual(objParam.name, "{name, age}");
	strictEqual(objParam.isDestructured, true);

	// Destructured array parameter
	const arrParam = func.parameters[1];
	strictEqual(arrParam.name, "[x, y]");
	strictEqual(arrParam.isDestructured, true);

	// Parameter with function default
	const callbackParam = func.parameters[2];
	strictEqual(callbackParam.name, "callback");
	strictEqual(callbackParam.hasDefault, true);
	strictEqual(callbackParam.defaultValue, "() => {}");

	// Rest parameter
	const restParam = func.parameters[3];
	strictEqual(restParam.name, "rest");
	strictEqual(restParam.isRest, true);
});

test("FunctionEntity - JSDoc consistency validation", () => {
	const func = new FunctionEntity("testFunction", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "testFunction", line: 1 };
	const content = "function testFunction(name, age) {}";

	func.parseEntity(rawEntity, content);

	// Add matching JSDoc tags
	func.addJSDocTag(new JSDocParamTag("{string} name The name parameter"));
	func.addJSDocTag(new JSDocParamTag("{number} age The age parameter"));

	func.validate();
	strictEqual(func.isValid(), true);
	strictEqual(func.validationIssues.length, 0);
});

test("FunctionEntity - JSDoc consistency validation with missing param", () => {
	const func = new FunctionEntity("testFunction", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "testFunction", line: 1 };
	const content = "function testFunction(name, age) {}";

	func.parseEntity(rawEntity, content);

	// Add only one JSDoc tag (missing age parameter)
	func.addJSDocTag(new JSDocParamTag("{string} name The name parameter"));

	func.validate();
	strictEqual(func.isValid(), true); // Still valid, but has issues
	strictEqual(func.validationIssues.length, 1);
	strictEqual(func.validationIssues[0].type, "missing_param_tag");
	strictEqual(func.validationIssues[0].parameter, "age");
});

test("FunctionEntity - JSDoc consistency validation with extra param", () => {
	const func = new FunctionEntity("testFunction", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "testFunction", line: 1 };
	const content = "function testFunction(name) {}";

	func.parseEntity(rawEntity, content);

	// Add extra JSDoc tag
	func.addJSDocTag(new JSDocParamTag("{string} name The name parameter"));
	func.addJSDocTag(new JSDocParamTag("{number} age Extra parameter"));

	func.validate();
	strictEqual(func.isValid(), true);
	strictEqual(func.validationIssues.length, 1);
	strictEqual(func.validationIssues[0].type, "extra_param_tag");
	strictEqual(func.validationIssues[0].parameter, "age");
});

test("FunctionEntity - signature generation", () => {
	const func = new FunctionEntity("testFunction", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "testFunction", line: 1 };

	// Regular function
	const content1 = "function testFunction(name, age = 25) {}";
	func.parseEntity(rawEntity, content1);
	strictEqual(func.getSignature(), "function testFunction(name, age = 25)");

	// Async function
	const content2 = "async function testFunction(data) {}";
	func.parseEntity(rawEntity, content2);
	strictEqual(func.getSignature(), "async function testFunction(data)");

	// Generator function
	const content3 = "function* testFunction(items) {}";
	func.parseEntity(rawEntity, content3);
	strictEqual(func.getSignature(), "function* testFunction(items)");

	// Arrow function
	const content4 = "const testFunction = (x, y) => x + y;";
	func.parseEntity(rawEntity, content4);
	strictEqual(func.getSignature(), "(x, y) => {}");
});

test("FunctionEntity - serialization", () => {
	const func = new FunctionEntity("testFunction", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "testFunction", line: 1 };
	const content = "async function testFunction(name, age = 25) {}";

	func.parseEntity(rawEntity, content);
	func.setModuleContext("testModule", ["named"]);
	func.addJSDocTag(new JSDocParamTag("{string} name The name"));
	func.addJSDocTag(new JSDocReturnsTag("{Promise<boolean>} Success status"));

	const serialized = func.getSerializableData();

	strictEqual(serialized.entityType, "function");
	strictEqual(serialized.functionType, "async");
	strictEqual(serialized.isAsync, true);
	strictEqual(serialized.isGenerator, false);
	strictEqual(serialized.isArrow, false);
	strictEqual(serialized.parameters.length, 2);
	strictEqual(
		serialized.signature,
		"async function testFunction(name, age = 25)",
	);
	strictEqual(typeof serialized.jsdoc, "object");
});

test("FunctionEntity - HTML output", () => {
	const func = new FunctionEntity("testFunction", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "testFunction", line: 1 };
	const content = "function testFunction(name) {}";

	func.parseEntity(rawEntity, content);
	func.addJSDocTag(new JSDocParamTag("{string} name The name parameter"));
	func.addJSDocTag(new JSDocReturnsTag("{boolean} True if valid"));

	const html = func.toHTML();

	strictEqual(html.includes("testFunction"), true);
	strictEqual(html.includes("function testFunction(name)"), true);
	strictEqual(html.includes("Parameters"), true);
	strictEqual(html.includes("Returns"), true);
});

test("FunctionEntity - Markdown output", () => {
	const func = new FunctionEntity("testFunction", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "testFunction", line: 1 };
	const content = "function testFunction(name) {}";

	func.parseEntity(rawEntity, content);
	func.addJSDocTag(new JSDocParamTag("{string} name The name parameter"));

	const markdown = func.toMarkdown();

	strictEqual(markdown.includes("### testFunction"), true);
	strictEqual(markdown.includes("**Type:** function"), true);
	strictEqual(markdown.includes("**Signature:**"), true);
	strictEqual(markdown.includes("function testFunction(name)"), true);
	strictEqual(markdown.includes("**Parameters:**"), true);
});

test("FunctionEntity - no parameters function", () => {
	const func = new FunctionEntity("noParams", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "noParams", line: 1 };
	const content = "function noParams() { return true; }";

	func.parseEntity(rawEntity, content);

	strictEqual(func.parameters.length, 0);
	strictEqual(func.getSignature(), "function noParams()");
});
