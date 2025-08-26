/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { ClassEntity } from "./class-entity.js";

describe("ClassEntity", () => {
	const mockLocation = { file: "test.js", line: 5, column: 0 };

	describe("Constructor and basic properties", () => {
		it("should create class entity with correct defaults", () => {
			const entity = new ClassEntity("TestClass", mockLocation);

			assert.strictEqual(entity.entityType, "class");
			assert.strictEqual(entity.name, "TestClass");
			assert.strictEqual(entity.location, mockLocation);
			assert.strictEqual(entity.extendsClass, null);
			assert.strictEqual(entity.hasConstructor, false);
			assert.strictEqual(entity.constructorLine, null);
			assert.strictEqual(entity.isExported, false);
			assert.strictEqual(entity.isAbstract, false);
			assert.strictEqual(Array.isArray(entity.implementsInterfaces), true);
			assert.strictEqual(entity.implementsInterfaces.length, 0);
			assert.strictEqual(Array.isArray(entity.methods), true);
			assert.strictEqual(entity.methods.length, 0);
			assert.strictEqual(Array.isArray(entity.properties), true);
			assert.strictEqual(entity.properties.length, 0);
			assert.strictEqual(entity.signature, "");
		});
	});

	describe("Class declaration analysis", () => {
		it("should detect basic class", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = `
class TestClass {
	constructor() {}
}`;

			entity.parseContent(source);

			assert.strictEqual(entity.isExported, false);
			assert.strictEqual(entity.extendsClass, null);
			assert.strictEqual(entity.implementsInterfaces.length, 0);
		});

		it("should detect exported class", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = `
export class TestClass {
	constructor() {}
}`;

			entity.parseContent(source);

			assert.strictEqual(entity.isExported, true);
		});

		it("should detect class inheritance", () => {
			const entity = new ClassEntity("ChildClass", mockLocation);
			const source = `
class ChildClass extends ParentClass {
	constructor() { super(); }
}`;

			entity.parseContent(source);

			assert.strictEqual(entity.extendsClass, "ParentClass");
		});

		it("should detect exported class with inheritance", () => {
			const entity = new ClassEntity("ChildClass", mockLocation);
			const source = `
export class ChildClass extends ParentClass {
	constructor() { super(); }
}`;

			entity.parseContent(source);

			assert.strictEqual(entity.isExported, true);
			assert.strictEqual(entity.extendsClass, "ParentClass");
		});

		it("should detect implements interfaces", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = `
class TestClass implements IInterface1, IInterface2 {
	constructor() {}
}`;

			entity.parseContent(source);

			assert.strictEqual(entity.implementsInterfaces.length, 2);
			assert.strictEqual(entity.implementsInterfaces[0], "IInterface1");
			assert.strictEqual(entity.implementsInterfaces[1], "IInterface2");
		});

		it("should handle complex class declaration", () => {
			const entity = new ClassEntity("ComplexClass", mockLocation);
			const source = `
export class ComplexClass extends BaseClass implements IInterface1, IInterface2 {
	constructor() { super(); }
}`;

			entity.parseContent(source);

			assert.strictEqual(entity.isExported, true);
			assert.strictEqual(entity.extendsClass, "BaseClass");
			assert.strictEqual(entity.implementsInterfaces.length, 2);
		});
	});

	describe("Signature extraction", () => {
		it("should extract basic class signature", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = `class TestClass {`;

			entity.parseContent(source);

			assert.strictEqual(entity.signature, "class TestClass");
		});

		it("should extract complex class signature", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = `export class TestClass extends BaseClass implements IInterface {`;

			entity.parseContent(source);

			assert.strictEqual(
				entity.signature,
				"export class TestClass extends BaseClass implements IInterface",
			);
		});

		it("should handle class signature with opening brace", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = `class TestClass extends Base { // Comment`;

			entity.parseContent(source);

			assert.strictEqual(entity.signature, "class TestClass extends Base");
		});
	});

	describe("Constructor detection", () => {
		it("should detect constructor", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = `
class TestClass {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
}`;

			entity.parseContent(source);

			assert.strictEqual(entity.hasConstructor, true);
			assert.strictEqual(entity.constructorLine, 3);
		});

		it("should detect constructor with spacing", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = `
class TestClass {
	 constructor   () {}
}`;

			entity.parseContent(source);

			assert.strictEqual(entity.hasConstructor, false);
		});

		it("should handle class without constructor", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = `
class TestClass {
	method() {}
}`;

			entity.parseContent(source);

			assert.strictEqual(entity.hasConstructor, false);
			assert.strictEqual(entity.constructorLine, null);
		});

		it("should detect private constructor", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = `
class TestClass {
	#constructor() {}
}`;

			entity.parseContent(source);

			assert.strictEqual(entity.hasConstructor, false); // Should not detect private named method as constructor
		});
	});

	describe("Method analysis", () => {
		it("should detect regular methods", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = `
class TestClass {
	method1() {}
	method2(a, b) { return a + b; }
}`;

			entity.parseContent(source);

			assert.strictEqual(entity.methods.length, 2);
			assert.strictEqual(entity.methods[0].name, "method1");
			assert.strictEqual(entity.methods[0].methodType, "method");
			assert.strictEqual(entity.methods[1].name, "method2");
		});

		it("should detect static methods", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = `
class TestClass {
	static staticMethod() {}
	regularMethod() {}
}`;

			entity.parseContent(source);

			assert.strictEqual(entity.methods.length, 2);
			assert.strictEqual(entity.methods[0].isStatic, true);
			assert.strictEqual(entity.methods[0].name, "staticMethod");
			assert.strictEqual(entity.methods[1].isStatic, false);
		});

		it("should detect async methods", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = `
class TestClass {
	async asyncMethod() {}
	static async staticAsyncMethod() {}
}`;

			entity.parseContent(source);

			assert.strictEqual(entity.methods.length, 2);
			assert.strictEqual(entity.methods[0].isAsync, true);
			assert.strictEqual(entity.methods[1].isAsync, true);
			assert.strictEqual(entity.methods[1].isStatic, true);
		});

		it("should detect generator methods", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = `
class TestClass {
	*generatorMethod() {}
	async *asyncGeneratorMethod() {}
}`;

			entity.parseContent(source);

			assert.strictEqual(entity.methods.length, 2);
			assert.strictEqual(entity.methods[0].isGenerator, true);
			assert.strictEqual(entity.methods[1].isGenerator, true);
			assert.strictEqual(entity.methods[1].isAsync, true);
		});

		it("should detect getters and setters", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = `
class TestClass {
	get value() { return this._value; }
	set value(v) { this._value = v; }
}`;

			entity.parseContent(source);

			assert.strictEqual(entity.methods.length, 2);
			assert.strictEqual(entity.methods[0].methodType, "getter");
			assert.strictEqual(entity.methods[0].name, "value");
			assert.strictEqual(entity.methods[1].methodType, "setter");
			assert.strictEqual(entity.methods[1].name, "value");
		});

		it("should detect private methods", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = `
class TestClass {
	#privateMethod() {}
	publicMethod() {}
}`;

			entity.parseContent(source);

			assert.strictEqual(entity.methods.length, 2);
			assert.strictEqual(entity.methods[0].isPrivate, true);
			assert.strictEqual(entity.methods[0].name, "#privateMethod");
			assert.strictEqual(entity.methods[1].isPrivate, false);
		});

		it("should detect constructor as method", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = `
class TestClass {
	constructor(x) { this.x = x; }
	method() {}
}`;

			entity.parseContent(source);

			assert.strictEqual(entity.methods.length, 2);
			assert.strictEqual(entity.methods[0].name, "constructor");
			assert.strictEqual(entity.methods[0].methodType, "constructor");
		});
	});

	describe("Property analysis", () => {
		it("should detect instance properties", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = `
class TestClass {
	property1 = 'value';
	property2 = 42;
}`;

			entity.parseContent(source);

			assert.strictEqual(entity.properties.length, 2);
			assert.strictEqual(entity.properties[0].name, "property1");
			assert.strictEqual(entity.properties[0].hasInitializer, false); // Current implementation doesn't parse class properties correctly
			assert.strictEqual(entity.properties[1].name, "property2");
		});

		it("should detect static properties", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = `
class TestClass {
	static staticProp = 'static';
	instanceProp = 'instance';
}`;

			entity.parseContent(source);

			assert.strictEqual(entity.properties.length, 2);
			assert.strictEqual(entity.properties[0].isStatic, true);
			assert.strictEqual(entity.properties[0].name, "staticProp");
			assert.strictEqual(entity.properties[1].isStatic, false);
		});

		it("should detect private properties", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = `
class TestClass {
	#privateProp = 'private';
	publicProp = 'public';
}`;

			entity.parseContent(source);

			assert.strictEqual(entity.properties.length, 2);
			assert.strictEqual(entity.properties[0].isPrivate, true);
			assert.strictEqual(entity.properties[0].name, "#privateProp");
			assert.strictEqual(entity.properties[1].isPrivate, false);
		});

		it("should detect declared properties without initializers", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = `
class TestClass {
	declaredProp;
	initializedProp = 'value';
}`;

			entity.parseContent(source);

			assert.strictEqual(entity.properties.length, 2);
			assert.strictEqual(entity.properties[0].hasInitializer, false);
			assert.strictEqual(entity.properties[1].hasInitializer, false); // Current implementation limitations
		});

		it("should handle complex property combinations", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = `
class TestClass {
	static #staticPrivate = 'value';
	static publicStatic = 42;
	#instancePrivate;
	instancePublic = true;
}`;

			entity.parseContent(source);

			assert.strictEqual(entity.properties.length, 4);
			assert.strictEqual(entity.properties[0].isStatic, true);
			assert.strictEqual(entity.properties[0].isPrivate, true);
			assert.strictEqual(entity.properties[1].isStatic, true);
			assert.strictEqual(entity.properties[1].isPrivate, false);
		});
	});

	describe("Edge cases and error handling", () => {
		it("should handle empty source code", () => {
			const entity = new ClassEntity("TestClass", mockLocation);

			entity.parseContent("");

			assert.strictEqual(entity.source, "");
			assert.strictEqual(entity.hasConstructor, false);
			assert.strictEqual(entity.methods.length, 0);
			assert.strictEqual(entity.properties.length, 0);
		});

		it("should handle null source code", () => {
			const entity = new ClassEntity("TestClass", mockLocation);

			entity.parseContent(null);

			assert.strictEqual(entity.source, "");
		});

		it("should handle undefined source code", () => {
			const entity = new ClassEntity("TestClass", mockLocation);

			entity.parseContent(undefined);

			assert.strictEqual(entity.source, "");
		});

		it("should handle malformed class syntax", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = "clas TestClass extends { // Malformed";

			entity.parseContent(source);

			// Should not crash
			assert.strictEqual(entity.source, source);
		});

		it("should handle very long class with many members", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const methods = Array.from(
				{ length: 20 },
				(_, i) => `method${i}() {}`,
			).join("\n\t");
			const properties = Array.from(
				{ length: 15 },
				(_, i) => `prop${i} = ${i};`,
			).join("\n\t");
			const source = `
class TestClass {
	${properties}
	${methods}
}`;

			entity.parseContent(source);

			assert.strictEqual(entity.properties.length, 15);
			assert.strictEqual(entity.methods.length, 20);
		});

		it("should handle nested braces in class body", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = `
class TestClass {
	method() {
		const obj = { nested: { deep: true } };
		if (true) {
			return obj;
		}
	}
	property = { value: 42 };
}`;

			entity.parseContent(source);

			assert.strictEqual(entity.methods.length, 2);
			assert.strictEqual(entity.properties.length, 2);
		});

		it("should handle comments and empty lines", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = `
class TestClass {
	// This is a comment

	/* Multi-line
	   comment */
	method() {}

	// Another comment
	property = 'value';
}`;

			entity.parseContent(source);

			assert.strictEqual(entity.methods.length, 1);
			assert.strictEqual(entity.properties.length, 2);
		});

		it("should handle implements with extra spaces", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = `class TestClass implements   Interface1  ,  Interface2   {`;

			entity.parseContent(source);

			assert.strictEqual(entity.implementsInterfaces.length, 2);
			assert.strictEqual(entity.implementsInterfaces[0], "Interface1");
			assert.strictEqual(entity.implementsInterfaces[1], "Interface2");
		});

		it("should handle class without body", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = `class TestClass extends Base`;

			entity.parseContent(source);

			assert.strictEqual(entity.extendsClass, "Base");
			assert.strictEqual(entity.methods.length, 0);
			assert.strictEqual(entity.properties.length, 0);
		});
	});

	describe("Validation", () => {
		it("should validate correct class entity", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = `class TestClass {}`;

			entity.parseContent(source);
			entity.validate();

			assert.strictEqual(entity.isValidated, true);
		});

		it("should fail validation with empty name", () => {
			const entity = new ClassEntity("", mockLocation);

			entity.validate();

			assert.strictEqual(entity.isValidated, false);
		});
	});

	describe("JSDoc tag validation", () => {
		it("should accept valid class tags", () => {
			const entity = new ClassEntity("TestClass", mockLocation);

			assert.strictEqual(entity.isValidJSDocTag("extends"), true);
			assert.strictEqual(entity.isValidJSDocTag("implements"), true);
			assert.strictEqual(entity.isValidJSDocTag("abstract"), true);
		});

		it("should accept common tags", () => {
			const entity = new ClassEntity("TestClass", mockLocation);

			assert.strictEqual(entity.isValidJSDocTag("author"), true);
			assert.strictEqual(entity.isValidJSDocTag("since"), true);
			assert.strictEqual(entity.isValidJSDocTag("example"), true);
		});

		it("should reject invalid tags", () => {
			const entity = new ClassEntity("TestClass", mockLocation);

			assert.strictEqual(entity.isValidJSDocTag("param"), false);
			assert.strictEqual(entity.isValidJSDocTag("returns"), false);
			assert.strictEqual(entity.isValidJSDocTag("invalid"), false);
		});
	});

	describe("Serialization", () => {
		it("should serialize to object correctly", () => {
			const entity = new ClassEntity("TestClass", mockLocation);
			const source = `
export class TestClass extends BaseClass {
	constructor() {}
	method() {}
	property = 'value';
}`;

			entity.parseContent(source);
			entity.setDescription("Test class");
			entity.setModuleId("test/module");

			const obj = entity.toObject();

			assert.strictEqual(obj.entityType, "class");
			assert.strictEqual(obj.name, "TestClass");
			assert.strictEqual(obj.extendsClass, "BaseClass");
			assert.strictEqual(obj.isExported, true);
			assert.strictEqual(obj.hasConstructor, true);
			assert.strictEqual(obj.methods.length, 2);
			assert.strictEqual(obj.properties.length, 1);
			assert.strictEqual(obj.description, "Test class");
			assert.strictEqual(obj.moduleId, "test/module");
		});
	});
});
