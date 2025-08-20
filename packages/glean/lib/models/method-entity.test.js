/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";
import { MethodEntity } from "./method-entity.js";

// Mock JSDoc tag objects for testing
function createMockParamTag(name, type, description = "", optional = false) {
	return {
		tagType: "param",
		name,
		type,
		description,
		optional,
		toJSON: () => ({
			__type: "param",
			__data: { name, type, description, optional },
		}),
		toHTML: () => `<span>@param {${type}} ${name}</span>`,
		toMarkdown: () => `@param {${type}} ${name} - ${description}`,
	};
}

function createMockReturnsTag(type, description = "") {
	return {
		tagType: "returns",
		type,
		description,
		toJSON: () => ({ __type: "returns", __data: { type, description } }),
		toHTML: () => `<span>@returns {${type}}</span>`,
		toMarkdown: () => `@returns {${type}} - ${description}`,
	};
}

function createMockStaticTag() {
	return {
		tagType: "static",
		toJSON: () => ({ __type: "static", __data: {} }),
		toHTML: () => `<span>@static</span>`,
		toMarkdown: () => `@static`,
	};
}

function createMockPrivateTag() {
	return {
		tagType: "private",
		toJSON: () => ({ __type: "private", __data: {} }),
		toHTML: () => `<span>@private</span>`,
		toMarkdown: () => `@private`,
	};
}

function createMockThrowsTag(type, description = "") {
	return {
		tagType: "throws",
		type,
		description,
		toJSON: () => ({ __type: "throws", __data: { type, description } }),
		toHTML: () => `<span>@throws {${type}}</span>`,
		toMarkdown: () => `@throws {${type}} - ${description}`,
	};
}

test("MethodEntity - basic method entity creation", () => {
	const location = { file: "test.js", line: 42, column: 5 };
	const method = new MethodEntity("testMethod", location);

	strictEqual(method.entityType, "method");
	strictEqual(method.name, "testMethod");
	deepStrictEqual(method.location, location);
	strictEqual(method.methodType, "method");
	strictEqual(method.isStatic, false);
	strictEqual(method.isPrivate, false);
	strictEqual(method.isAsync, false);
	strictEqual(method.isGenerator, false);
	strictEqual(method.parentClass, null);
	deepStrictEqual(method.parameters, []);
	strictEqual(method.returnType, null);
	strictEqual(method.signature, "");
});

test("MethodEntity - valid JSDoc tags", () => {
	const method = new MethodEntity("test", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	// Valid method tags
	strictEqual(method.isValidJSDocTag("param"), true);
	strictEqual(method.isValidJSDocTag("returns"), true);
	strictEqual(method.isValidJSDocTag("return"), true);
	strictEqual(method.isValidJSDocTag("throws"), true);
	strictEqual(method.isValidJSDocTag("throw"), true);
	strictEqual(method.isValidJSDocTag("override"), true);
	strictEqual(method.isValidJSDocTag("abstract"), true);
	strictEqual(method.isValidJSDocTag("static"), true);
	strictEqual(method.isValidJSDocTag("private"), true);
	strictEqual(method.isValidJSDocTag("example"), true);
	strictEqual(method.isValidJSDocTag("since"), true);
	strictEqual(method.isValidJSDocTag("deprecated"), true);
	strictEqual(method.isValidJSDocTag("see"), true);
	strictEqual(method.isValidJSDocTag("author"), true);

	// Invalid tags
	strictEqual(method.isValidJSDocTag("extends"), false);
	strictEqual(method.isValidJSDocTag("implements"), false);
	strictEqual(method.isValidJSDocTag("typedef"), false);
	strictEqual(method.isValidJSDocTag("property"), false);
});

test("MethodEntity - regular method parsing", () => {
	const method = new MethodEntity("calculate", {
		file: "test.js",
		line: 10,
		column: 2,
	});

	const rawMethod = {
		type: "method",
		name: "calculate",
		signature: "calculate(a, b = 10)",
		isStatic: false,
		isPrivate: false,
		line: 10,
	};

	const content = `class Calculator {
  calculate(a, b = 10) {
    return a + b;
  }
}`;

	method.parseEntity(rawMethod, content);

	strictEqual(method.methodType, "method");
	strictEqual(method.isStatic, false);
	strictEqual(method.isPrivate, false);
	strictEqual(method.isAsync, false);
	strictEqual(method.isGenerator, false);
	strictEqual(method.signature, "calculate(a, b = 10)");
	strictEqual(method.parameters.length, 2);

	// Check first parameter
	const paramA = method.parameters[0];
	strictEqual(paramA.name, "a");
	strictEqual(paramA.hasDefault, false);
	strictEqual(paramA.isOptional, false);
	strictEqual(paramA.isRest, false);

	// Check second parameter with default
	const paramB = method.parameters[1];
	strictEqual(paramB.name, "b");
	strictEqual(paramB.hasDefault, true);
	strictEqual(paramB.defaultValue, "10");
});

test("MethodEntity - constructor method parsing", () => {
	const method = new MethodEntity("constructor", {
		file: "test.js",
		line: 5,
		column: 2,
	});

	const rawMethod = {
		type: "constructor",
		name: "constructor",
		signature: "constructor(name, age)",
		isStatic: false,
		isPrivate: false,
		line: 5,
	};

	const content = `class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
}`;

	method.parseEntity(rawMethod, content);

	strictEqual(method.methodType, "constructor");
	strictEqual(method.parameters.length, 2);
	strictEqual(method.parameters[0].name, "name");
	strictEqual(method.parameters[1].name, "age");
});

test("MethodEntity - static method parsing", () => {
	const method = new MethodEntity("createDefault", {
		file: "test.js",
		line: 15,
		column: 2,
	});

	const rawMethod = {
		type: "method",
		name: "createDefault",
		signature: "static createDefault()",
		isStatic: true,
		isPrivate: false,
		line: 15,
	};

	const content = `class Factory {
  static createDefault() {
    return new Factory();
  }
}`;

	method.parseEntity(rawMethod, content);

	strictEqual(method.methodType, "method");
	strictEqual(method.isStatic, true);
	strictEqual(method.signature.includes("static"), true);
	strictEqual(method.parameters.length, 0);
});

test("MethodEntity - private method parsing", () => {
	const method = new MethodEntity("#privateHelper", {
		file: "test.js",
		line: 20,
		column: 2,
	});

	const rawMethod = {
		type: "method",
		name: "#privateHelper",
		signature: "#privateHelper(data)",
		isStatic: false,
		isPrivate: true,
		line: 20,
	};

	const content = `class Service {
  #privateHelper(data) {
    return data.trim();
  }
}`;

	method.parseEntity(rawMethod, content);

	strictEqual(method.methodType, "method");
	strictEqual(method.isPrivate, true);
	strictEqual(method.parameters.length, 1);
	strictEqual(method.parameters[0].name, "data");
});

test("MethodEntity - async method parsing", () => {
	const method = new MethodEntity("fetchData", {
		file: "test.js",
		line: 25,
		column: 2,
	});

	const rawMethod = {
		type: "method",
		name: "fetchData",
		signature: "async fetchData(url)",
		isStatic: false,
		isPrivate: false,
		line: 25,
	};

	const content = `class ApiClient {
  async fetchData(url) {
    return await fetch(url);
  }
}`;

	method.parseEntity(rawMethod, content);

	strictEqual(method.methodType, "method");
	strictEqual(method.isAsync, true);
	strictEqual(method.parameters.length, 1);
});

test("MethodEntity - generator method parsing", () => {
	const method = new MethodEntity("enumerate", {
		file: "test.js",
		line: 30,
		column: 2,
	});

	const rawMethod = {
		type: "method",
		name: "enumerate",
		signature: "*enumerate(items)",
		isStatic: false,
		isPrivate: false,
		line: 30,
	};

	const content = `class Iterator {
  *enumerate(items) {
    for (let i = 0; i < items.length; i++) {
      yield [i, items[i]];
    }
  }
}`;

	method.parseEntity(rawMethod, content);

	strictEqual(method.methodType, "method");
	strictEqual(method.isGenerator, true);
	strictEqual(method.parameters.length, 1);
});

test("MethodEntity - getter method parsing", () => {
	const method = new MethodEntity("fullName", {
		file: "test.js",
		line: 35,
		column: 2,
	});

	const rawMethod = {
		type: "getter",
		name: "fullName",
		signature: "get fullName()",
		isStatic: false,
		isPrivate: false,
		line: 35,
	};

	const content = `class Person {
  get fullName() {
    return this.firstName + ' ' + this.lastName;
  }
}`;

	method.parseEntity(rawMethod, content);

	strictEqual(method.methodType, "getter");
	strictEqual(method.parameters.length, 0); // Getters have no parameters
});

test("MethodEntity - setter method parsing", () => {
	const method = new MethodEntity("fullName", {
		file: "test.js",
		line: 40,
		column: 2,
	});

	const rawMethod = {
		type: "setter",
		name: "fullName",
		signature: "set fullName(value)",
		isStatic: false,
		isPrivate: false,
		line: 40,
	};

	const content = `class Person {
  set fullName(value) {
    const parts = value.split(' ');
    this.firstName = parts[0];
    this.lastName = parts[1];
  }
}`;

	method.parseEntity(rawMethod, content);

	strictEqual(method.methodType, "setter");
	strictEqual(method.parameters.length, 1);
	strictEqual(method.parameters[0].name, "value");
});

test("MethodEntity - complex parameter parsing", () => {
	const method = new MethodEntity("processData", {
		file: "test.js",
		line: 45,
		column: 2,
	});

	const rawMethod = {
		type: "method",
		name: "processData",
		signature: "processData({name, age = 25}, ...options)",
		isStatic: false,
		isPrivate: false,
		line: 45,
	};

	const content = `class DataProcessor {
  processData({name, age = 25}, ...options) {
    return { name, age, options };
  }
}`;

	method.parseEntity(rawMethod, content);

	strictEqual(method.parameters.length, 2);

	// Destructuring parameter
	const destructParam = method.parameters[0];
	strictEqual(destructParam.name, "{name, age = 25}");
	strictEqual(destructParam.isRest, false);

	// Rest parameter
	const restParam = method.parameters[1];
	strictEqual(restParam.name, "options");
	strictEqual(restParam.isRest, true);
});

test("MethodEntity - parent class context", () => {
	const method = new MethodEntity("test", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	method.setParentClass("TestClass");
	strictEqual(method.parentClass, "TestClass");

	// Test with class entity reference
	const mockClassEntity = { name: "TestClass" };
	method.setParentClass("TestClass", mockClassEntity);
	strictEqual(method.parentClassEntity, mockClassEntity);
});

test("MethodEntity - JSDoc parameter validation", () => {
	const method = new MethodEntity("calculate", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const rawMethod = {
		type: "method",
		signature: "calculate(a, b)",
		isStatic: false,
		isPrivate: false,
	};

	method.parseEntity(rawMethod, "");

	// Add JSDoc tags
	method.addJSDocTag(createMockParamTag("a", "number", "First number"));
	method.addJSDocTag(createMockParamTag("b", "number", "Second number"));
	method.addJSDocTag(createMockReturnsTag("number", "Sum result"));

	method.validate();

	strictEqual(method.isValid(), true);
	strictEqual(method.validationIssues.length, 0);
});

test("MethodEntity - JSDoc validation missing param", () => {
	const method = new MethodEntity("calculate", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const rawMethod = {
		type: "method",
		signature: "calculate(a, b)",
		isStatic: false,
		isPrivate: false,
	};

	method.parseEntity(rawMethod, "");

	// Only document one parameter
	method.addJSDocTag(createMockParamTag("a", "number", "First number"));

	method.validate();

	strictEqual(method.isValid(), true);
	strictEqual(method.validationIssues.length, 1);
	strictEqual(method.validationIssues[0].type, "missing_param_docs");
	deepStrictEqual(method.validationIssues[0].missingParams, ["b"]);
});

test("MethodEntity - JSDoc validation extra param", () => {
	const method = new MethodEntity("calculate", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const rawMethod = {
		type: "method",
		signature: "calculate(a)",
		isStatic: false,
		isPrivate: false,
	};

	method.parseEntity(rawMethod, "");

	// Document extra parameter
	method.addJSDocTag(createMockParamTag("a", "number", "First number"));
	method.addJSDocTag(createMockParamTag("b", "number", "Extra param"));

	method.validate();

	strictEqual(method.isValid(), true);
	strictEqual(method.validationIssues.length, 1);
	strictEqual(method.validationIssues[0].type, "extra_param_docs");
	deepStrictEqual(method.validationIssues[0].extraParams, ["b"]);
});

test("MethodEntity - JSDoc static tag validation", () => {
	const method = new MethodEntity("test", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const rawMethod = {
		type: "method",
		signature: "test()",
		isStatic: false, // Not actually static
		isPrivate: false,
	};

	method.parseEntity(rawMethod, "");
	method.addJSDocTag(createMockStaticTag()); // But has @static tag

	method.validate();

	strictEqual(method.validationIssues.length, 1);
	strictEqual(method.validationIssues[0].type, "static_tag_mismatch");
});

test("MethodEntity - JSDoc private tag validation", () => {
	const method = new MethodEntity("test", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const rawMethod = {
		type: "method",
		signature: "test()",
		isStatic: false,
		isPrivate: false, // Not actually private
	};

	method.parseEntity(rawMethod, "");
	method.addJSDocTag(createMockPrivateTag()); // But has @private tag

	method.validate();

	strictEqual(method.validationIssues.length, 1);
	strictEqual(method.validationIssues[0].type, "private_tag_mismatch");
});

test("MethodEntity - constructor validation with returns", () => {
	const method = new MethodEntity("constructor", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const rawMethod = {
		type: "constructor",
		signature: "constructor(name)",
		isStatic: false,
		isPrivate: false,
	};

	method.parseEntity(rawMethod, "");
	method.addJSDocTag(createMockParamTag("name", "string"));
	method.addJSDocTag(createMockReturnsTag("Object")); // Invalid for constructor

	method.validate();

	strictEqual(method.validationIssues.length, 1);
	strictEqual(method.validationIssues[0].type, "constructor_return_tag");
});

test("MethodEntity - getter validation", () => {
	const method = new MethodEntity("value", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const rawMethod = {
		type: "getter",
		signature: "get value()",
		isStatic: false,
		isPrivate: false,
	};

	method.parseEntity(rawMethod, "");
	method.addJSDocTag(createMockParamTag("invalid", "string")); // Invalid for getter

	method.validate();

	strictEqual(method.validationIssues.length, 3);
	// Should have: extra_param_docs, getter_missing_returns, getter_has_params
	const issueTypes = method.validationIssues.map((issue) => issue.type);
	strictEqual(issueTypes.includes("extra_param_docs"), true);
	strictEqual(issueTypes.includes("getter_missing_returns"), true);
	strictEqual(issueTypes.includes("getter_has_params"), true);
});

test("MethodEntity - setter validation", () => {
	const method = new MethodEntity("value", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const rawMethod = {
		type: "setter",
		signature: "set value(newValue)",
		isStatic: false,
		isPrivate: false,
	};

	method.parseEntity(rawMethod, "");
	method.addJSDocTag(createMockReturnsTag("void")); // Invalid for setter

	method.validate();

	strictEqual(method.validationIssues.length, 3);
	// Should have: missing_param_docs, setter_param_count, setter_has_returns
	const issueTypes = method.validationIssues.map((issue) => issue.type);
	strictEqual(issueTypes.includes("missing_param_docs"), true);
	strictEqual(issueTypes.includes("setter_param_count"), true);
	strictEqual(issueTypes.includes("setter_has_returns"), true);
});

test("MethodEntity - signature generation", () => {
	// Regular method
	const regular = new MethodEntity("test", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	regular.parseEntity(
		{ signature: "test(a, b = 5)", isStatic: false, isPrivate: false },
		"",
	);
	strictEqual(regular.getSignature(), "test(a, b = 5)");

	// Static async method
	const staticAsync = new MethodEntity("create", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	staticAsync.isStatic = true;
	staticAsync.isAsync = true;
	staticAsync.parameters = [{ name: "data", isRest: false, hasDefault: false }];
	strictEqual(staticAsync.getSignature(), "static async create(data)");

	// Getter
	const getter = new MethodEntity("value", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	getter.methodType = "getter";
	strictEqual(getter.getSignature(), "get value()");

	// Setter
	const setter = new MethodEntity("value", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	setter.methodType = "setter";
	setter.parameters = [{ name: "newValue", isRest: false, hasDefault: false }];
	strictEqual(setter.getSignature(), "set value(newValue)");
});

test("MethodEntity - summary generation", () => {
	const method = new MethodEntity("test", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	method.methodType = "method";
	method.isStatic = true;
	method.isAsync = true;
	method.parameters = [{ name: "a" }, { name: "b" }];
	method.parentClass = "TestClass";

	const summary = method.getSummary();
	strictEqual(summary.methodType, "method");
	strictEqual(summary.isStatic, true);
	strictEqual(summary.isAsync, true);
	strictEqual(summary.parameterCount, 2);
	strictEqual(summary.hasParameters, true);
	strictEqual(summary.parentClass, "TestClass");
});

test("MethodEntity - serialization", () => {
	const method = new MethodEntity("calculate", {
		file: "test.js",
		line: 10,
		column: 2,
	});

	const rawMethod = {
		type: "method",
		signature: "calculate(a, b)",
		isStatic: false,
		isPrivate: false,
	};

	method.parseEntity(rawMethod, "");
	method.setModuleContext("testModule", ["named"]);
	method.setParentClass("Calculator");

	const serialized = method.getSerializableData();

	strictEqual(serialized.entityType, "method");
	strictEqual(serialized.methodType, "method");
	strictEqual(serialized.isStatic, false);
	strictEqual(serialized.isPrivate, false);
	strictEqual(serialized.parentClass, "Calculator");
	strictEqual(serialized.parameters.length, 2);
	strictEqual(serialized.moduleId, "testModule");
	strictEqual(typeof serialized.summary, "object");
});

test("MethodEntity - HTML output", () => {
	const method = new MethodEntity("calculate", {
		file: "test.js",
		line: 10,
		column: 2,
	});

	const rawMethod = {
		type: "method",
		signature: "calculate(a, b)",
		isStatic: true,
		isPrivate: false,
	};

	method.parseEntity(rawMethod, "");
	method.setParentClass("Calculator");
	method.addJSDocTag(createMockParamTag("a", "number", "First number"));
	method.addJSDocTag(createMockParamTag("b", "number", "Second number"));
	method.addJSDocTag(createMockReturnsTag("number", "Sum result"));

	const html = method.toHTML();

	strictEqual(html.includes("calculate"), true);
	strictEqual(html.includes("method"), true);
	strictEqual(html.includes("static"), true);
	strictEqual(html.includes("Calculator"), true);
	strictEqual(html.includes("Parameters"), true);
	strictEqual(html.includes("Returns"), true);
});

test("MethodEntity - Markdown output", () => {
	const method = new MethodEntity("processData", {
		file: "test.js",
		line: 15,
		column: 4,
	});

	const rawMethod = {
		type: "method",
		signature: "async processData(data)",
		isStatic: false,
		isPrivate: true,
	};

	method.parseEntity(rawMethod, "");
	method.setParentClass("DataProcessor");
	method.addJSDocTag(createMockParamTag("data", "Object", "Input data"));
	method.addJSDocTag(createMockReturnsTag("Promise", "Processed data"));
	method.addJSDocTag(createMockThrowsTag("Error", "Processing failed"));

	const markdown = method.toMarkdown();

	strictEqual(markdown.includes("### processData"), true);
	strictEqual(markdown.includes("**Type:** method (private) (async)"), true);
	strictEqual(markdown.includes("**Class:** `DataProcessor`"), true);
	strictEqual(markdown.includes("**Parameters:**"), true);
	strictEqual(markdown.includes("**Returns:**"), true);
	strictEqual(markdown.includes("**Throws:**"), true);
});
