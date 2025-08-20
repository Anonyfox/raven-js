/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";
import { TypedefEntity } from "./typedef-entity.js";

// Mock JSDoc tag objects for testing
function createMockTypedefTag(type, name, description = "") {
	return {
		tagType: "typedef",
		type,
		name,
		description,
		toJSON: () => ({ __type: "typedef", __data: { type, name, description } }),
		toHTML: () => `<span>@typedef {${type}} ${name}</span>`,
		toMarkdown: () => `@typedef {${type}} ${name}`,
	};
}

function createMockPropertyTag(name, type, description = "", optional = false) {
	return {
		tagType: "property",
		name,
		type,
		description,
		optional,
		toJSON: () => ({
			__type: "property",
			__data: { name, type, description, optional },
		}),
		toHTML: () => `<span>@property {${type}} ${name}</span>`,
		toMarkdown: () => `@property {${type}} ${name}`,
	};
}

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
		toMarkdown: () => `@param {${type}} ${name}`,
	};
}

function createMockReturnsTag(type, description = "") {
	return {
		tagType: "returns",
		type,
		description,
		toJSON: () => ({ __type: "returns", __data: { type, description } }),
		toHTML: () => `<span>@returns {${type}}</span>`,
		toMarkdown: () => `@returns {${type}}`,
	};
}

test("TypedefEntity - basic typedef entity creation", () => {
	const location = { file: "test.js", line: 42, column: 5 };
	const typedef = new TypedefEntity("MyType", location);

	strictEqual(typedef.entityType, "typedef");
	strictEqual(typedef.name, "MyType");
	deepStrictEqual(typedef.location, location);
	strictEqual(typedef.baseType, null);
	strictEqual(typedef.typedefType, "simple");
	strictEqual(typedef.isGeneric, false);
	deepStrictEqual(typedef.properties, []);
	deepStrictEqual(typedef.parameters, []);
	strictEqual(typedef.returnType, null);
	deepStrictEqual(typedef.genericParameters, []);
});

test("TypedefEntity - valid JSDoc tags", () => {
	const typedef = new TypedefEntity("test", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	// Valid typedef tags
	strictEqual(typedef.isValidJSDocTag("property"), true);
	strictEqual(typedef.isValidJSDocTag("param"), true);
	strictEqual(typedef.isValidJSDocTag("returns"), true);
	strictEqual(typedef.isValidJSDocTag("return"), true);
	strictEqual(typedef.isValidJSDocTag("example"), true);
	strictEqual(typedef.isValidJSDocTag("since"), true);
	strictEqual(typedef.isValidJSDocTag("deprecated"), true);
	strictEqual(typedef.isValidJSDocTag("see"), true);
	strictEqual(typedef.isValidJSDocTag("author"), true);

	// Invalid tags
	strictEqual(typedef.isValidJSDocTag("extends"), false);
	strictEqual(typedef.isValidJSDocTag("implements"), false);
	strictEqual(typedef.isValidJSDocTag("throws"), false);
});

test("TypedefEntity - simple typedef parsing", () => {
	const typedef = new TypedefEntity("MyString", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const typedefTag = createMockTypedefTag(
		"string",
		"MyString",
		"A custom string type",
	);
	typedef.parseFromJSDoc(typedefTag);

	strictEqual(typedef.baseType, "string");
	strictEqual(typedef.typedefType, "simple");
	strictEqual(typedef.description, "A custom string type");
	strictEqual(typedef.isGeneric, false);
	strictEqual(typedef.properties.length, 0);
	strictEqual(typedef.parameters.length, 0);
});

test("TypedefEntity - object typedef parsing", () => {
	const typedef = new TypedefEntity("User", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const typedefTag = createMockTypedefTag(
		"Object",
		"User",
		"User object structure",
	);
	const propertyTags = [
		createMockPropertyTag("name", "string", "User's name"),
		createMockPropertyTag("age", "number", "User's age"),
		createMockPropertyTag("email", "string", "User's email", true), // optional
	];

	typedef.parseFromJSDoc(typedefTag, propertyTags);

	strictEqual(typedef.baseType, "Object");
	strictEqual(typedef.typedefType, "object");
	strictEqual(typedef.description, "User object structure");
	strictEqual(typedef.properties.length, 3);

	// Check properties
	const nameProperty = typedef.properties.find((p) => p.name === "name");
	strictEqual(nameProperty.type, "string");
	strictEqual(nameProperty.description, "User's name");
	strictEqual(nameProperty.optional, false);

	const emailProperty = typedef.properties.find((p) => p.name === "email");
	strictEqual(emailProperty.optional, true);
});

test("TypedefEntity - function typedef parsing", () => {
	const typedef = new TypedefEntity("MyCallback", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const typedefTag = createMockTypedefTag(
		"function",
		"MyCallback",
		"Callback function type",
	);
	const relatedTags = [
		createMockParamTag("data", "string", "Input data"),
		createMockParamTag("options", "Object", "Optional configuration", true),
		createMockReturnsTag("boolean", "Success status"),
	];

	typedef.parseFromJSDoc(typedefTag, relatedTags);

	strictEqual(typedef.baseType, "function");
	strictEqual(typedef.typedefType, "function");
	strictEqual(typedef.parameters.length, 2);
	strictEqual(typedef.returnType.type, "boolean");
	strictEqual(typedef.returnType.description, "Success status");

	// Check parameters
	const dataParam = typedef.parameters.find((p) => p.name === "data");
	strictEqual(dataParam.type, "string");
	strictEqual(dataParam.optional, false);

	const optionsParam = typedef.parameters.find((p) => p.name === "options");
	strictEqual(optionsParam.optional, true);
});

test("TypedefEntity - generic typedef parsing", () => {
	const typedef = new TypedefEntity("Container", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const typedefTag = createMockTypedefTag(
		"Array<T>",
		"Container",
		"Generic container type",
	);
	typedef.parseFromJSDoc(typedefTag);

	strictEqual(typedef.baseType, "Array<T>");
	strictEqual(typedef.typedefType, "array");
	strictEqual(typedef.isGeneric, true);
	deepStrictEqual(typedef.genericParameters, ["T"]);
});

test("TypedefEntity - complex generic typedef", () => {
	const typedef = new TypedefEntity("Map", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const typedefTag = createMockTypedefTag(
		"Object<K, V>",
		"Map",
		"Generic map type",
	);
	typedef.parseFromJSDoc(typedefTag);

	strictEqual(typedef.isGeneric, true);
	deepStrictEqual(typedef.genericParameters, ["K", "V"]);
});

test("TypedefEntity - union type parsing", () => {
	const typedef = new TypedefEntity("StringOrNumber", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const typedefTag = createMockTypedefTag(
		"(string|number)",
		"StringOrNumber",
		"String or number type",
	);
	typedef.parseFromJSDoc(typedefTag);

	strictEqual(typedef.baseType, "(string|number)");
	strictEqual(typedef.typedefType, "union");
});

test("TypedefEntity - typedef type upgrade with properties", () => {
	const typedef = new TypedefEntity("Config", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	// Start as simple type but add properties
	const typedefTag = createMockTypedefTag(
		"any",
		"Config",
		"Configuration object",
	);
	const propertyTags = [
		createMockPropertyTag("debug", "boolean", "Debug mode"),
	];

	typedef.parseFromJSDoc(typedefTag, propertyTags);

	// Should upgrade from simple to object type
	strictEqual(typedef.typedefType, "object");
	strictEqual(typedef.properties.length, 1);
});

test("TypedefEntity - typedef type upgrade with parameters", () => {
	const typedef = new TypedefEntity("Handler", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	// Start as simple type but add parameters
	const typedefTag = createMockTypedefTag("any", "Handler", "Event handler");
	const paramTags = [createMockParamTag("event", "Event", "Event object")];

	typedef.parseFromJSDoc(typedefTag, paramTags);

	// Should upgrade from simple to function type
	strictEqual(typedef.typedefType, "function");
	strictEqual(typedef.parameters.length, 1);
});

test("TypedefEntity - signature generation", () => {
	// Simple typedef
	const simple = new TypedefEntity("MyString", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	simple.parseFromJSDoc(createMockTypedefTag("string", "MyString"));
	strictEqual(simple.getSignature(), "@typedef {string} MyString");

	// Generic typedef
	const generic = new TypedefEntity("Container", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	generic.parseFromJSDoc(createMockTypedefTag("Array<T>", "Container"));
	strictEqual(generic.getSignature(), "@typedef {Array<T><T>} Container");
});

test("TypedefEntity - summary generation", () => {
	const typedef = new TypedefEntity("User", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const typedefTag = createMockTypedefTag("Object", "User");
	const propertyTags = [
		createMockPropertyTag("name", "string"),
		createMockPropertyTag("age", "number"),
	];

	typedef.parseFromJSDoc(typedefTag, propertyTags);

	const summary = typedef.getSummary();
	strictEqual(summary.typedefType, "object");
	strictEqual(summary.hasProperties, true);
	strictEqual(summary.propertyCount, 2);
	strictEqual(summary.hasParameters, false);
	strictEqual(summary.parameterCount, 0);
	strictEqual(summary.hasReturnType, false);
	strictEqual(summary.isGeneric, false);
});

test("TypedefEntity - validation", () => {
	const typedef = new TypedefEntity("ValidType", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const typedefTag = createMockTypedefTag("string", "ValidType");
	typedef.parseFromJSDoc(typedefTag);
	typedef.validate();

	strictEqual(typedef.isValid(), true);
	strictEqual(typedef.validationIssues.length, 0);
});

test("TypedefEntity - validation with empty name", () => {
	const typedef = new TypedefEntity("", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	typedef.validate();
	strictEqual(typedef.isValid(), false);
});

test("TypedefEntity - validation empty object typedef", () => {
	const typedef = new TypedefEntity("EmptyObject", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const typedefTag = createMockTypedefTag("Object", "EmptyObject");
	typedef.parseFromJSDoc(typedefTag);
	typedef.validate();

	strictEqual(typedef.isValid(), true);
	strictEqual(typedef.validationIssues.length, 1);
	strictEqual(typedef.validationIssues[0].type, "empty_object_typedef");
});

test("TypedefEntity - validation incomplete function typedef", () => {
	const typedef = new TypedefEntity("IncompleteFunction", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const typedefTag = createMockTypedefTag("function", "IncompleteFunction");
	typedef.parseFromJSDoc(typedefTag);
	typedef.validate();

	strictEqual(typedef.isValid(), true);
	strictEqual(typedef.validationIssues.length, 1);
	strictEqual(typedef.validationIssues[0].type, "incomplete_function_typedef");
});

test("TypedefEntity - validation duplicate properties", () => {
	const typedef = new TypedefEntity("DuplicateProps", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const typedefTag = createMockTypedefTag("Object", "DuplicateProps");
	const propertyTags = [
		createMockPropertyTag("name", "string"),
		createMockPropertyTag("name", "number"), // Duplicate name
	];

	typedef.parseFromJSDoc(typedefTag, propertyTags);
	typedef.validate();

	strictEqual(typedef.validationIssues.length, 1);
	strictEqual(typedef.validationIssues[0].type, "duplicate_properties");
	deepStrictEqual(typedef.validationIssues[0].duplicates, ["name"]);
});

test("TypedefEntity - serialization", () => {
	const typedef = new TypedefEntity("User", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const typedefTag = createMockTypedefTag("Object", "User", "User type");
	const propertyTags = [createMockPropertyTag("name", "string", "User name")];

	typedef.parseFromJSDoc(typedefTag, propertyTags);
	typedef.setModuleContext("testModule", ["named"]);

	const serialized = typedef.getSerializableData();

	strictEqual(serialized.entityType, "typedef");
	strictEqual(serialized.baseType, "Object");
	strictEqual(serialized.typedefType, "object");
	strictEqual(serialized.description, "User type");
	strictEqual(serialized.properties.length, 1);
	strictEqual(serialized.isGeneric, false);
	strictEqual(serialized.signature, "@typedef {Object} User");
	strictEqual(serialized.moduleId, "testModule");
	strictEqual(typeof serialized.summary, "object");
});

test("TypedefEntity - HTML output", () => {
	const typedef = new TypedefEntity("User", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const typedefTag = createMockTypedefTag("Object", "User", "User object");
	const propertyTags = [
		createMockPropertyTag("name", "string", "User name"),
		createMockPropertyTag("age", "number", "User age", true),
	];

	typedef.parseFromJSDoc(typedefTag, propertyTags);

	const html = typedef.toHTML();

	strictEqual(html.includes("User"), true);
	strictEqual(html.includes("@typedef"), true);
	strictEqual(html.includes("object"), true);
	strictEqual(html.includes("Object"), true);
	strictEqual(html.includes("Properties"), true);
	strictEqual(html.includes("name"), true);
	strictEqual(html.includes("age"), true);
	strictEqual(html.includes("(optional)"), true);
});

test("TypedefEntity - HTML output for function typedef", () => {
	const typedef = new TypedefEntity("Callback", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const typedefTag = createMockTypedefTag("function", "Callback");
	const relatedTags = [
		createMockParamTag("data", "string"),
		createMockReturnsTag("boolean"),
	];

	typedef.parseFromJSDoc(typedefTag, relatedTags);

	const html = typedef.toHTML();

	strictEqual(html.includes("Parameters"), true);
	strictEqual(html.includes("Returns"), true);
	strictEqual(html.includes("data"), true);
	strictEqual(html.includes("boolean"), true);
});

test("TypedefEntity - HTML output for generic typedef", () => {
	const typedef = new TypedefEntity("Container", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const typedefTag = createMockTypedefTag("Array<T>", "Container");
	typedef.parseFromJSDoc(typedefTag);

	const html = typedef.toHTML();

	strictEqual(html.includes("generic"), true);
	strictEqual(html.includes("Generic Parameters"), true);
	strictEqual(html.includes("<code>T</code>"), true);
});

test("TypedefEntity - Markdown output", () => {
	const typedef = new TypedefEntity("User", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const typedefTag = createMockTypedefTag("Object", "User", "User object type");
	const propertyTags = [
		createMockPropertyTag("name", "string", "User name"),
		createMockPropertyTag("age", "number", "User age", true),
	];

	typedef.parseFromJSDoc(typedefTag, propertyTags);

	const markdown = typedef.toMarkdown();

	strictEqual(markdown.includes("### User"), true);
	strictEqual(markdown.includes("**Type:** @typedef (object)"), true);
	strictEqual(markdown.includes("**Base Type:** `Object`"), true);
	strictEqual(markdown.includes("User object type"), true);
	strictEqual(markdown.includes("**Properties:**"), true);
	strictEqual(markdown.includes("- `name` `{string}` - User name"), true);
	strictEqual(
		markdown.includes("- `age` `{number}` *(optional)* - User age"),
		true,
	);
});

test("TypedefEntity - Markdown output for function typedef", () => {
	const typedef = new TypedefEntity("Handler", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const typedefTag = createMockTypedefTag("function", "Handler");
	const relatedTags = [
		createMockParamTag("event", "Event", "Event object"),
		createMockReturnsTag("void", "No return value"),
	];

	typedef.parseFromJSDoc(typedefTag, relatedTags);

	const markdown = typedef.toMarkdown();

	strictEqual(markdown.includes("**Parameters:**"), true);
	strictEqual(
		markdown.includes("**Returns:** `{void}` - No return value"),
		true,
	);
	strictEqual(markdown.includes("- `event` `{Event}` - Event object"), true);
});
