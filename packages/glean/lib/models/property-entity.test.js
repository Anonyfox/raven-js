/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";
import { PropertyEntity } from "./property-entity.js";

// Mock JSDoc tag objects for testing
function createMockTypeTag(type, description = "") {
	return {
		tagType: "type",
		type,
		description,
		toJSON: () => ({ __type: "type", __data: { type, description } }),
		toHTML: () => `<span>@type {${type}}</span>`,
		toMarkdown: () => `@type {${type}} - ${description}`,
	};
}

function createMockReadonlyTag() {
	return {
		tagType: "readonly",
		toJSON: () => ({ __type: "readonly", __data: {} }),
		toHTML: () => `<span>@readonly</span>`,
		toMarkdown: () => `@readonly`,
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

function createMockDefaultTag(description) {
	return {
		tagType: "default",
		description,
		toJSON: () => ({ __type: "default", __data: { description } }),
		toHTML: () => `<span>@default ${description}</span>`,
		toMarkdown: () => `@default ${description}`,
	};
}

test("PropertyEntity - basic property entity creation", () => {
	const location = { file: "test.js", line: 42, column: 5 };
	const property = new PropertyEntity("testProperty", location);

	strictEqual(property.entityType, "property");
	strictEqual(property.name, "testProperty");
	deepStrictEqual(property.location, location);
	strictEqual(property.isStatic, false);
	strictEqual(property.isPrivate, false);
	strictEqual(property.isReadonly, false);
	strictEqual(property.hasInitializer, false);
	strictEqual(property.initializer, null);
	strictEqual(property.inferredType, "unknown");
	strictEqual(property.parentClass, null);
	strictEqual(property.signature, "");
	strictEqual(property.accessModifier, "public");
});

test("PropertyEntity - valid JSDoc tags", () => {
	const property = new PropertyEntity("test", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	// Valid property tags
	strictEqual(property.isValidJSDocTag("type"), true);
	strictEqual(property.isValidJSDocTag("readonly"), true);
	strictEqual(property.isValidJSDocTag("static"), true);
	strictEqual(property.isValidJSDocTag("private"), true);
	strictEqual(property.isValidJSDocTag("abstract"), true);
	strictEqual(property.isValidJSDocTag("override"), true);
	strictEqual(property.isValidJSDocTag("default"), true);
	strictEqual(property.isValidJSDocTag("example"), true);
	strictEqual(property.isValidJSDocTag("since"), true);
	strictEqual(property.isValidJSDocTag("deprecated"), true);
	strictEqual(property.isValidJSDocTag("see"), true);
	strictEqual(property.isValidJSDocTag("author"), true);

	// Invalid tags
	strictEqual(property.isValidJSDocTag("param"), false);
	strictEqual(property.isValidJSDocTag("returns"), false);
	strictEqual(property.isValidJSDocTag("throws"), false);
	strictEqual(property.isValidJSDocTag("extends"), false);
});

test("PropertyEntity - simple property parsing", () => {
	const property = new PropertyEntity("name", {
		file: "test.js",
		line: 5,
		column: 2,
	});

	const rawProperty = {
		name: "name",
		signature: "name;",
		isStatic: false,
		isPrivate: false,
		line: 5,
	};

	const content = `class Person {
  name;
  age = 25;
}`;

	property.parseEntity(rawProperty, content);

	strictEqual(property.isStatic, false);
	strictEqual(property.isPrivate, false);
	strictEqual(property.hasInitializer, false);
	strictEqual(property.initializer, null);
	strictEqual(property.inferredType, "unknown");
	strictEqual(property.accessModifier, "public");
});

test("PropertyEntity - property with string initializer", () => {
	const property = new PropertyEntity("name", {
		file: "test.js",
		line: 5,
		column: 2,
	});

	const rawProperty = {
		name: "name",
		signature: 'name = "John";',
		isStatic: false,
		isPrivate: false,
		line: 5,
	};

	const content = `class Person {
  name = "John";
  age = 25;
}`;

	property.parseEntity(rawProperty, content);

	strictEqual(property.hasInitializer, true);
	strictEqual(property.initializer, '"John"');
	strictEqual(property.inferredType, "string");
});

test("PropertyEntity - property with number initializer", () => {
	const property = new PropertyEntity("age", {
		file: "test.js",
		line: 6,
		column: 2,
	});

	const rawProperty = {
		name: "age",
		signature: "age = 25;",
		isStatic: false,
		isPrivate: false,
		line: 6,
	};

	property.parseEntity(rawProperty, "");

	strictEqual(property.hasInitializer, true);
	strictEqual(property.initializer, "25");
	strictEqual(property.inferredType, "number");
});

test("PropertyEntity - property with boolean initializer", () => {
	const property = new PropertyEntity("active", {
		file: "test.js",
		line: 7,
		column: 2,
	});

	const rawProperty = {
		name: "active",
		signature: "active = true;",
		isStatic: false,
		isPrivate: false,
		line: 7,
	};

	property.parseEntity(rawProperty, "");

	strictEqual(property.hasInitializer, true);
	strictEqual(property.initializer, "true");
	strictEqual(property.inferredType, "boolean");
});

test("PropertyEntity - property with array initializer", () => {
	const property = new PropertyEntity("items", {
		file: "test.js",
		line: 8,
		column: 2,
	});

	const rawProperty = {
		name: "items",
		signature: "items = [];",
		isStatic: false,
		isPrivate: false,
		line: 8,
	};

	property.parseEntity(rawProperty, "");

	strictEqual(property.hasInitializer, true);
	strictEqual(property.initializer, "[]");
	strictEqual(property.inferredType, "Array");
});

test("PropertyEntity - property with object initializer", () => {
	const property = new PropertyEntity("config", {
		file: "test.js",
		line: 9,
		column: 2,
	});

	const rawProperty = {
		name: "config",
		signature: "config = {};",
		isStatic: false,
		isPrivate: false,
		line: 9,
	};

	property.parseEntity(rawProperty, "");

	strictEqual(property.hasInitializer, true);
	strictEqual(property.initializer, "{}");
	strictEqual(property.inferredType, "Object");
});

test("PropertyEntity - property with function initializer", () => {
	const property = new PropertyEntity("handler", {
		file: "test.js",
		line: 10,
		column: 2,
	});

	const rawProperty = {
		name: "handler",
		signature: "handler = () => {};",
		isStatic: false,
		isPrivate: false,
		line: 10,
	};

	property.parseEntity(rawProperty, "");

	strictEqual(property.hasInitializer, true);
	strictEqual(property.initializer, "() => {}");
	strictEqual(property.inferredType, "Function");
});

test("PropertyEntity - property with constructor initializer", () => {
	const property = new PropertyEntity("date", {
		file: "test.js",
		line: 11,
		column: 2,
	});

	const rawProperty = {
		name: "date",
		signature: "date = new Date();",
		isStatic: false,
		isPrivate: false,
		line: 11,
	};

	property.parseEntity(rawProperty, "");

	strictEqual(property.hasInitializer, true);
	strictEqual(property.initializer, "new Date()");
	strictEqual(property.inferredType, "Date");
});

test("PropertyEntity - static property parsing", () => {
	const property = new PropertyEntity("count", {
		file: "test.js",
		line: 12,
		column: 2,
	});

	const rawProperty = {
		name: "count",
		signature: "static count = 0;",
		isStatic: true,
		isPrivate: false,
		line: 12,
	};

	property.parseEntity(rawProperty, "");

	strictEqual(property.isStatic, true);
	strictEqual(property.hasInitializer, true);
	strictEqual(property.initializer, "0");
	strictEqual(property.inferredType, "number");
	strictEqual(property.accessModifier, "public");
});

test("PropertyEntity - private property parsing", () => {
	const property = new PropertyEntity("#secret", {
		file: "test.js",
		line: 13,
		column: 2,
	});

	const rawProperty = {
		name: "#secret",
		signature: '#secret = "hidden";',
		isStatic: false,
		isPrivate: true,
		line: 13,
	};

	property.parseEntity(rawProperty, "");

	strictEqual(property.isPrivate, true);
	strictEqual(property.hasInitializer, true);
	strictEqual(property.initializer, '"hidden"');
	strictEqual(property.inferredType, "string");
	strictEqual(property.accessModifier, "private");
});

test("PropertyEntity - static private property parsing", () => {
	const property = new PropertyEntity("#instances", {
		file: "test.js",
		line: 14,
		column: 2,
	});

	const rawProperty = {
		name: "#instances",
		signature: "static #instances = [];",
		isStatic: true,
		isPrivate: true,
		line: 14,
	};

	property.parseEntity(rawProperty, "");

	strictEqual(property.isStatic, true);
	strictEqual(property.isPrivate, true);
	strictEqual(property.hasInitializer, true);
	strictEqual(property.initializer, "[]");
	strictEqual(property.inferredType, "Array");
	strictEqual(property.accessModifier, "private");
});

test("PropertyEntity - parent class context", () => {
	const property = new PropertyEntity("test", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	property.setParentClass("TestClass");
	strictEqual(property.parentClass, "TestClass");

	// Test with class entity reference
	const mockClassEntity = { name: "TestClass" };
	property.setParentClass("TestClass", mockClassEntity);
	strictEqual(property.parentClassEntity, mockClassEntity);
});

test("PropertyEntity - JSDoc type validation", () => {
	const property = new PropertyEntity("value", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const rawProperty = {
		signature: 'value = "test";',
		isStatic: false,
		isPrivate: false,
	};

	property.parseEntity(rawProperty, "");
	property.addJSDocTag(createMockTypeTag("string", "A string value"));

	property.validate();

	strictEqual(property.isValid(), true);
	strictEqual(property.validationIssues.length, 0);
});

test("PropertyEntity - JSDoc type mismatch validation", () => {
	const property = new PropertyEntity("value", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const rawProperty = {
		signature: 'value = "test";', // string initializer
		isStatic: false,
		isPrivate: false,
	};

	property.parseEntity(rawProperty, "");
	property.addJSDocTag(createMockTypeTag("number")); // But documented as number

	property.validate();

	strictEqual(property.isValid(), true);
	strictEqual(property.validationIssues.length, 1);
	strictEqual(property.validationIssues[0].type, "type_mismatch");
});

test("PropertyEntity - JSDoc static tag validation", () => {
	const property = new PropertyEntity("test", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const rawProperty = {
		signature: "test = 5;",
		isStatic: false, // Not actually static
		isPrivate: false,
	};

	property.parseEntity(rawProperty, "");
	property.addJSDocTag(createMockStaticTag()); // But has @static tag

	property.validate();

	strictEqual(property.validationIssues.length, 1);
	strictEqual(property.validationIssues[0].type, "static_tag_mismatch");
});

test("PropertyEntity - JSDoc private tag validation", () => {
	const property = new PropertyEntity("test", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const rawProperty = {
		signature: "test = 5;",
		isStatic: false,
		isPrivate: false, // Not actually private
	};

	property.parseEntity(rawProperty, "");
	property.addJSDocTag(createMockPrivateTag()); // But has @private tag

	property.validate();

	strictEqual(property.validationIssues.length, 1);
	strictEqual(property.validationIssues[0].type, "private_tag_mismatch");
});

test("PropertyEntity - JSDoc readonly with mutable object validation", () => {
	const property = new PropertyEntity("config", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const rawProperty = {
		signature: "config = {};", // Object initializer
		isStatic: false,
		isPrivate: false,
	};

	property.parseEntity(rawProperty, "");
	property.addJSDocTag(createMockReadonlyTag());

	property.validate();

	strictEqual(property.validationIssues.length, 1);
	strictEqual(property.validationIssues[0].type, "readonly_mutable_warning");
});

test("PropertyEntity - missing type annotation validation", () => {
	const property = new PropertyEntity("mystery", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	const rawProperty = {
		signature: "mystery = someComplexExpression();", // Unknown type
		isStatic: false,
		isPrivate: false,
	};

	property.parseEntity(rawProperty, "");
	// No @type tag provided

	property.validate();

	strictEqual(property.validationIssues.length, 1);
	strictEqual(property.validationIssues[0].type, "missing_type_annotation");
});

test("PropertyEntity - signature generation", () => {
	// Simple property
	const simple = new PropertyEntity("name", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	simple.parseEntity({ signature: "name;" }, "");
	strictEqual(simple.getSignature(), "name");

	// Property with initializer
	const withInit = new PropertyEntity("age", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	withInit.parseEntity({ signature: "age = 25;" }, "");
	strictEqual(withInit.getSignature(), "age = 25");

	// Static property
	const staticProp = new PropertyEntity("count", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	staticProp.isStatic = true;
	staticProp.hasInitializer = true;
	staticProp.initializer = "0";
	strictEqual(staticProp.getSignature(), "static count = 0");

	// Private property
	const privateProp = new PropertyEntity("#secret", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	privateProp.isPrivate = true;
	privateProp.hasInitializer = true;
	privateProp.initializer = '"hidden"';
	strictEqual(privateProp.getSignature(), '#secret = "hidden"');
});

test("PropertyEntity - summary generation", () => {
	const property = new PropertyEntity("test", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	property.isStatic = true;
	property.isPrivate = false;
	property.hasInitializer = true;
	property.inferredType = "string";
	property.parentClass = "TestClass";

	const summary = property.getSummary();
	strictEqual(summary.isStatic, true);
	strictEqual(summary.isPrivate, false);
	strictEqual(summary.hasInitializer, true);
	strictEqual(summary.inferredType, "string");
	strictEqual(summary.accessModifier, "public");
	strictEqual(summary.parentClass, "TestClass");
});

test("PropertyEntity - serialization", () => {
	const property = new PropertyEntity("name", {
		file: "test.js",
		line: 5,
		column: 2,
	});

	const rawProperty = {
		signature: 'name = "John";',
		isStatic: false,
		isPrivate: false,
	};

	property.parseEntity(rawProperty, "");
	property.setModuleContext("testModule", ["named"]);
	property.setParentClass("Person");

	const serialized = property.getSerializableData();

	strictEqual(serialized.entityType, "property");
	strictEqual(serialized.isStatic, false);
	strictEqual(serialized.isPrivate, false);
	strictEqual(serialized.hasInitializer, true);
	strictEqual(serialized.initializer, '"John"');
	strictEqual(serialized.inferredType, "string");
	strictEqual(serialized.parentClass, "Person");
	strictEqual(serialized.moduleId, "testModule");
	strictEqual(typeof serialized.summary, "object");
});

test("PropertyEntity - HTML output", () => {
	const property = new PropertyEntity("name", {
		file: "test.js",
		line: 5,
		column: 2,
	});

	const rawProperty = {
		signature: 'name = "John";',
		isStatic: true,
		isPrivate: false,
	};

	property.parseEntity(rawProperty, "");
	property.setParentClass("Person");
	property.addJSDocTag(createMockTypeTag("string", "Person's name"));
	property.addJSDocTag(createMockDefaultTag("John Doe"));

	const html = property.toHTML();

	strictEqual(html.includes("name"), true);
	strictEqual(html.includes("property"), true);
	strictEqual(html.includes("static"), true);
	strictEqual(html.includes("Person"), true);
	strictEqual(html.includes("string"), true);
	strictEqual(html.includes("John"), true);
});

test("PropertyEntity - HTML output for private property", () => {
	const property = new PropertyEntity("#secret", {
		file: "test.js",
		line: 8,
		column: 2,
	});

	const rawProperty = {
		signature: '#secret = "hidden";',
		isStatic: false,
		isPrivate: true,
	};

	property.parseEntity(rawProperty, "");
	property.addJSDocTag(createMockReadonlyTag());

	const html = property.toHTML();

	strictEqual(html.includes("#secret"), true);
	strictEqual(html.includes("private"), true);
	strictEqual(html.includes("readonly"), true);
	strictEqual(html.includes("hidden"), true);
});

test("PropertyEntity - Markdown output", () => {
	const property = new PropertyEntity("config", {
		file: "test.js",
		line: 10,
		column: 4,
	});

	const rawProperty = {
		signature: "static config = {};",
		isStatic: true,
		isPrivate: false,
	};

	property.parseEntity(rawProperty, "");
	property.setParentClass("Settings");
	property.addJSDocTag(createMockTypeTag("Object", "Configuration object"));
	property.addJSDocTag(createMockReadonlyTag());

	const markdown = property.toMarkdown();

	strictEqual(markdown.includes("### config"), true);
	strictEqual(
		markdown.includes("**Type:** property (static) (readonly)"),
		true,
	);
	strictEqual(markdown.includes("**Class:** `Settings`"), true);
	strictEqual(markdown.includes("**Type:** `Object`"), true);
	strictEqual(markdown.includes("static config = {}"), true);
});

test("PropertyEntity - Markdown output without type", () => {
	const property = new PropertyEntity("value", {
		file: "test.js",
		line: 12,
		column: 2,
	});

	const rawProperty = {
		signature: 'value = "test";',
		isStatic: false,
		isPrivate: false,
	};

	property.parseEntity(rawProperty, "");

	const markdown = property.toMarkdown();

	strictEqual(markdown.includes("**Inferred Type:** `string`"), true);
	strictEqual(markdown.includes('**Default Value:** `"test"`'), true);
});
