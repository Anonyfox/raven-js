/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";
import { ClassEntity } from "./class-entity.js";

test("ClassEntity - basic class entity creation", () => {
	const location = { file: "test.js", line: 42, column: 5 };
	const classEntity = new ClassEntity("TestClass", location);

	strictEqual(classEntity.entityType, "class");
	strictEqual(classEntity.name, "TestClass");
	deepStrictEqual(classEntity.location, location);
	strictEqual(classEntity.extendsClass, null);
	strictEqual(classEntity.hasConstructor, false);
	strictEqual(classEntity.isAbstract, false);
	deepStrictEqual(classEntity.methods, []);
	deepStrictEqual(classEntity.properties, []);
	deepStrictEqual(classEntity.implementsInterfaces, []);
});

test("ClassEntity - valid JSDoc tags", () => {
	const classEntity = new ClassEntity("test", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	// Valid class tags
	strictEqual(classEntity.isValidJSDocTag("extends"), true);
	strictEqual(classEntity.isValidJSDocTag("implements"), true);
	strictEqual(classEntity.isValidJSDocTag("abstract"), true);
	strictEqual(classEntity.isValidJSDocTag("example"), true);
	strictEqual(classEntity.isValidJSDocTag("since"), true);
	strictEqual(classEntity.isValidJSDocTag("deprecated"), true);
	strictEqual(classEntity.isValidJSDocTag("see"), true);
	strictEqual(classEntity.isValidJSDocTag("author"), true);

	// Invalid tags
	strictEqual(classEntity.isValidJSDocTag("param"), false);
	strictEqual(classEntity.isValidJSDocTag("returns"), false);
	strictEqual(classEntity.isValidJSDocTag("type"), false);
});

test("ClassEntity - simple class parsing", () => {
	const classEntity = new ClassEntity("SimpleClass", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "SimpleClass", line: 1 };
	const content = `class SimpleClass {
  constructor(name) {
    this.name = name;
  }

  getName() {
    return this.name;
  }
}`;

	classEntity.parseEntity(rawEntity, content);

	strictEqual(classEntity.extendsClass, null);
	strictEqual(classEntity.hasConstructor, true);
	strictEqual(classEntity.methods.length, 2); // constructor + getName
	strictEqual(classEntity.properties.length, 0);

	// Check constructor
	const constructorMethod = classEntity.methods.find(
		(m) => m.type === "constructor",
	);
	strictEqual(constructorMethod.name, "constructor");
	strictEqual(constructorMethod.isStatic, false);
	strictEqual(constructorMethod.isPrivate, false);

	// Check method
	const getNameMethod = classEntity.methods.find((m) => m.name === "getName");
	strictEqual(getNameMethod.type, "method");
	strictEqual(getNameMethod.isStatic, false);
	strictEqual(getNameMethod.isPrivate, false);
});

test("ClassEntity - inheritance parsing", () => {
	const classEntity = new ClassEntity("ChildClass", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "ChildClass", line: 1 };
	const content = `class ChildClass extends ParentClass {
  constructor(name, age) {
    super(name);
    this.age = age;
  }
}`;

	classEntity.parseEntity(rawEntity, content);

	strictEqual(classEntity.extendsClass, "ParentClass");
	strictEqual(classEntity.hasConstructor, true);
	strictEqual(classEntity.methods.length, 1); // constructor only
});

test("ClassEntity - static and private members", () => {
	const classEntity = new ClassEntity("AdvancedClass", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "AdvancedClass", line: 1 };
	const content = `class AdvancedClass {
  static count = 0;
  #privateField = "secret";
  publicField = "visible";

  static getCount() {
    return AdvancedClass.count;
  }

  #privateMethod() {
    return this.#privateField;
  }

  get publicProperty() {
    return this.publicField;
  }

  set publicProperty(value) {
    this.publicField = value;
  }
}`;

	classEntity.parseEntity(rawEntity, content);

	strictEqual(classEntity.methods.length, 4); // getCount, #privateMethod, getter, setter
	strictEqual(classEntity.properties.length, 3); // count, #privateField, publicField

	// Check static method
	const staticMethod = classEntity.methods.find((m) => m.name === "getCount");
	strictEqual(staticMethod.isStatic, true);
	strictEqual(staticMethod.isPrivate, false);

	// Check private method
	const privateMethod = classEntity.methods.find(
		(m) => m.name === "privateMethod",
	);
	strictEqual(privateMethod.isStatic, false);
	strictEqual(privateMethod.isPrivate, true);

	// Check getter
	const getter = classEntity.methods.find((m) => m.type === "getter");
	strictEqual(getter.name, "publicProperty");

	// Check setter
	const setter = classEntity.methods.find((m) => m.type === "setter");
	strictEqual(setter.name, "publicProperty");

	// Check static property
	const staticProp = classEntity.properties.find((p) => p.name === "count");
	strictEqual(staticProp.isStatic, true);
	strictEqual(staticProp.hasInitializer, true);

	// Check private property
	const privateProp = classEntity.properties.find(
		(p) => p.name === "privateField",
	);
	strictEqual(privateProp.isPrivate, true);
});

test("ClassEntity - exported class", () => {
	const classEntity = new ClassEntity("ExportedClass", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "ExportedClass", line: 1 };
	const content = `export class ExportedClass {
  constructor() {}
}`;

	classEntity.parseEntity(rawEntity, content);

	strictEqual(classEntity.hasConstructor, true);
	strictEqual(classEntity.methods.length, 1);
});

test("ClassEntity - class without constructor", () => {
	const classEntity = new ClassEntity("NoConstructor", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "NoConstructor", line: 1 };
	const content = `class NoConstructor {
  getValue() {
    return 42;
  }
}`;

	classEntity.parseEntity(rawEntity, content);

	strictEqual(classEntity.hasConstructor, false);
	strictEqual(classEntity.constructorLine, null);
	strictEqual(classEntity.methods.length, 1);
});

test("ClassEntity - empty class", () => {
	const classEntity = new ClassEntity("EmptyClass", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "EmptyClass", line: 1 };
	const content = `class EmptyClass {
}`;

	classEntity.parseEntity(rawEntity, content);

	strictEqual(classEntity.hasConstructor, false);
	strictEqual(classEntity.methods.length, 0);
	strictEqual(classEntity.properties.length, 0);
});

test("ClassEntity - signature generation", () => {
	// Simple class
	const class1 = new ClassEntity("SimpleClass", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	class1.parseEntity({ name: "SimpleClass", line: 1 }, "class SimpleClass {}");
	strictEqual(class1.getSignature(), "class SimpleClass");

	// Class with inheritance
	const class2 = new ClassEntity("ChildClass", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	class2.parseEntity(
		{ name: "ChildClass", line: 1 },
		"class ChildClass extends ParentClass {}",
	);
	strictEqual(class2.getSignature(), "class ChildClass extends ParentClass");
});

test("ClassEntity - summary generation", () => {
	const classEntity = new ClassEntity("TestClass", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "TestClass", line: 1 };
	const content = `class TestClass extends BaseClass {
  field = "value";
  static count = 0;

  constructor() {}

  method1() {}
  static method2() {}
}`;

	classEntity.parseEntity(rawEntity, content);

	const summary = classEntity.getSummary();
	strictEqual(summary.hasConstructor, true);
	strictEqual(summary.methodCount, 3); // constructor + method1 + method2
	strictEqual(summary.propertyCount, 2); // field + count
	strictEqual(summary.isAbstract, false);
	strictEqual(summary.hasInheritance, true);
	strictEqual(summary.implementsCount, 0);
});

test("ClassEntity - validation", () => {
	const classEntity = new ClassEntity("ValidClass", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "ValidClass", line: 1 };
	const content = "class ValidClass {}";

	classEntity.parseEntity(rawEntity, content);
	classEntity.validate();

	strictEqual(classEntity.isValid(), true);
	strictEqual(classEntity.validationIssues.length, 0);
});

test("ClassEntity - validation with empty name", () => {
	const classEntity = new ClassEntity("", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	classEntity.validate();
	strictEqual(classEntity.isValid(), false);
});

test("ClassEntity - JSDoc extends validation", () => {
	const classEntity = new ClassEntity("ChildClass", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "ChildClass", line: 1 };
	const content = "class ChildClass extends ParentClass {}";

	classEntity.parseEntity(rawEntity, content);
	classEntity.validate();

	strictEqual(classEntity.isValid(), true);
	strictEqual(classEntity.validationIssues.length, 1);
	strictEqual(classEntity.validationIssues[0].type, "missing_extends_tag");
	strictEqual(classEntity.validationIssues[0].actualClass, "ParentClass");
});

test("ClassEntity - serialization", () => {
	const classEntity = new ClassEntity("TestClass", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "TestClass", line: 1 };
	const content = `class TestClass extends BaseClass {
  constructor() {}
  method() {}
}`;

	classEntity.parseEntity(rawEntity, content);
	classEntity.setModuleContext("testModule", ["named"]);

	const serialized = classEntity.getSerializableData();

	strictEqual(serialized.entityType, "class");
	strictEqual(serialized.extendsClass, "BaseClass");
	strictEqual(serialized.hasConstructor, true);
	strictEqual(serialized.methods.length, 2);
	strictEqual(serialized.properties.length, 0);
	strictEqual(serialized.isAbstract, false);
	strictEqual(serialized.signature, "class TestClass extends BaseClass");
	strictEqual(serialized.moduleId, "testModule");
	strictEqual(typeof serialized.summary, "object");
});

test("ClassEntity - HTML output", () => {
	const classEntity = new ClassEntity("TestClass", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "TestClass", line: 1 };
	const content = `class TestClass extends BaseClass {
  constructor() {}
  getValue() {}
}`;

	classEntity.parseEntity(rawEntity, content);

	const html = classEntity.toHTML();

	strictEqual(html.includes("TestClass"), true);
	strictEqual(html.includes("class"), true);
	strictEqual(html.includes("BaseClass"), true);
	strictEqual(html.includes("Constructor"), true);
	strictEqual(html.includes("Methods"), true);
	strictEqual(html.includes("getValue"), true);
});

test("ClassEntity - HTML output for abstract class", () => {
	const classEntity = new ClassEntity("AbstractClass", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	// Simulate abstract tag
	classEntity.isAbstract = true;

	const html = classEntity.toHTML();
	strictEqual(html.includes("abstract"), true);
});

test("ClassEntity - Markdown output", () => {
	const classEntity = new ClassEntity("TestClass", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "TestClass", line: 1 };
	const content = `class TestClass extends BaseClass {
  field = "value";
  constructor() {}
  getValue() {}
}`;

	classEntity.parseEntity(rawEntity, content);

	const markdown = classEntity.toMarkdown();

	strictEqual(markdown.includes("### TestClass"), true);
	strictEqual(markdown.includes("**Type:** class"), true);
	strictEqual(markdown.includes("**Extends:** `BaseClass`"), true);
	strictEqual(markdown.includes("**Summary:**"), true);
	strictEqual(markdown.includes("Constructor: Yes"), true);
	strictEqual(markdown.includes("Methods: 2"), true);
	strictEqual(markdown.includes("Properties: 1"), true);
	strictEqual(markdown.includes("**Methods:**"), true);
	strictEqual(markdown.includes("**Properties:**"), true);
});

test("ClassEntity - complex class body parsing", () => {
	const classEntity = new ClassEntity("ComplexClass", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	const rawEntity = { name: "ComplexClass", line: 1 };
	const content = `class ComplexClass {
  // This is a comment
  static staticField = "static";

  /* Multi-line comment */
  #privateField;

  normalField = 42;

  constructor(value) {
    this.#privateField = value;
  }

  // Another comment
  static staticMethod() {
    return ComplexClass.staticField;
  }

  #privateMethod() {
    return this.#privateField;
  }

  get getter() {
    return this.normalField;
  }

  set setter(value) {
    this.normalField = value;
  }

  normalMethod() {
    return "normal";
  }
}`;

	classEntity.parseEntity(rawEntity, content);

	strictEqual(classEntity.hasConstructor, true);
	strictEqual(classEntity.methods.length, 6); // constructor, staticMethod, privateMethod, getter, setter, normalMethod
	strictEqual(classEntity.properties.length, 3); // staticField, privateField, normalField

	// Verify method types
	const methodTypes = classEntity.methods.map((m) => m.type);
	strictEqual(methodTypes.includes("constructor"), true);
	strictEqual(methodTypes.includes("method"), true);
	strictEqual(methodTypes.includes("getter"), true);
	strictEqual(methodTypes.includes("setter"), true);

	// Verify static detection
	const staticMembers = classEntity.methods.filter((m) => m.isStatic);
	strictEqual(staticMembers.length, 1);
	strictEqual(staticMembers[0].name, "staticMethod");

	const staticProps = classEntity.properties.filter((p) => p.isStatic);
	strictEqual(staticProps.length, 1);
	strictEqual(staticProps[0].name, "staticField");

	// Verify private detection
	const privateMembers = classEntity.methods.filter((m) => m.isPrivate);
	strictEqual(privateMembers.length, 1);
	strictEqual(privateMembers[0].name, "privateMethod");

	const privateProps = classEntity.properties.filter((p) => p.isPrivate);
	strictEqual(privateProps.length, 1);
	strictEqual(privateProps[0].name, "privateField");
});
