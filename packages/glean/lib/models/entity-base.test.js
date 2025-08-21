/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, strictEqual, throws } from "node:assert";
import { test } from "node:test";
import { EntityBase } from "./entity-base.js";
import { JSDocParamTag } from "./jsdoc-param-tag.js";
import { JSDocReturnsTag } from "./jsdoc-returns-tag.js";

// Test entity implementation for testing abstract base
class TestEntity extends EntityBase {
	constructor(name, location) {
		super("test", name, location);
	}

	isValidJSDocTag(tagType) {
		return ["param", "returns", "example"].includes(tagType);
	}

	parseEntity(rawEntity, content) {
		this.testData = `${rawEntity.name}:${content.length}`;
	}

	validate() {
		this.isValidated = Boolean(this.name && this.name.length > 0);
	}
}

test("EntityBase - abstract class enforcement", () => {
	throws(
		() =>
			new EntityBase("test", "name", { file: "test.js", line: 1, column: 0 }),
		/EntityBase is abstract and cannot be instantiated directly/,
		"Should prevent direct instantiation",
	);
});

test("EntityBase - basic properties and methods", () => {
	const location = { file: "test.js", line: 42, column: 5 };
	const entity = new TestEntity("testFunction", location);

	strictEqual(entity.entityType, "test");
	strictEqual(entity.name, "testFunction");
	deepStrictEqual(entity.location, location);
	strictEqual(entity.getId(), "testFunction");
	strictEqual(entity.isValid(), false); // Not validated yet

	// Set module context
	entity.setModuleContext("testModule", ["named"]);
	strictEqual(entity.moduleId, "testModule");
	deepStrictEqual(entity.exports, ["named"]);
	strictEqual(entity.getId(), "testModule/testFunction");

	// Set source
	entity.setSource("function testFunction() {}");
	strictEqual(entity.source, "function testFunction() {}");
});

test("EntityBase - JSDoc tag management", () => {
	const entity = new TestEntity("testFunction", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	// Add valid JSDoc tags
	const paramTag = new JSDocParamTag("{string} name Parameter description");
	const returnsTag = new JSDocReturnsTag("{boolean} True if valid");

	entity.addJSDocTag(paramTag);
	entity.addJSDocTag(returnsTag);

	// Verify tags are stored
	strictEqual(entity.getJSDocTag("param"), paramTag);
	strictEqual(entity.getJSDocTag("returns"), returnsTag);
	strictEqual(entity.getJSDocTag("nonexistent"), null);

	// Verify all tags
	const allTags = entity.getAllJSDocTags();
	strictEqual(allTags.length, 2);
	strictEqual(allTags.includes(paramTag), true);
	strictEqual(allTags.includes(returnsTag), true);
});

test("EntityBase - JSDoc tag validation", () => {
	const entity = new TestEntity("testFunction", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	// Should reject invalid tag types
	const invalidTag = new JSDocParamTag("{string} name Description");
	invalidTag.tagType = "invalid"; // Override to test validation

	throws(
		() => entity.addJSDocTag(invalidTag),
		/JSDoc tag '@invalid' is not valid for test entities/,
		"Should reject invalid tag types",
	);

	// Should reject malformed tags
	throws(
		() => entity.addJSDocTag(null),
		/Invalid JSDoc tag: missing tagType/,
		"Should reject null tags",
	);

	throws(
		() => entity.addJSDocTag({}),
		/Invalid JSDoc tag: missing tagType/,
		"Should reject malformed tags",
	);
});

test("EntityBase - reference management", () => {
	const entity = new TestEntity("testFunction", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	// Add references
	entity.addReference("module1/function1");
	entity.addReference("module2/class1");
	entity.addReference("module1/function1"); // Duplicate should be ignored

	deepStrictEqual(entity.references, ["module1/function1", "module2/class1"]);

	// Add back-references
	entity.addReferencedBy("module3/function2");
	entity.addReferencedBy("module4/class2");
	entity.addReferencedBy("module3/function2"); // Duplicate should be ignored

	deepStrictEqual(entity.referencedBy, ["module3/function2", "module4/class2"]);
});

test("EntityBase - HTML output", () => {
	const entity = new TestEntity("testFunction", {
		file: "test.js",
		line: 42,
		column: 5,
	});
	entity.addJSDocTag(new JSDocParamTag("{string} name Parameter description"));

	const html = entity.toHTML();

	// Should contain entity name and metadata
	strictEqual(html.includes("testFunction"), true);
	strictEqual(html.includes("test"), true);
	strictEqual(html.includes("test.js:42"), true);
	strictEqual(html.includes("jsdoc-tags"), true);
});

test("EntityBase - Markdown output", () => {
	const entity = new TestEntity("testFunction", {
		file: "test.js",
		line: 42,
		column: 5,
	});
	entity.addJSDocTag(new JSDocParamTag("{string} name Parameter description"));

	const markdown = entity.toMarkdown();

	// Should contain entity information
	strictEqual(markdown.includes("### testFunction"), true);
	strictEqual(markdown.includes("**Type:** test"), true);
	strictEqual(markdown.includes("**Location:** test.js:42"), true);
	strictEqual(markdown.includes("- {string} `name`"), true);
});

test("EntityBase - abstract method enforcement", () => {
	class IncompleteEntity extends EntityBase {
		constructor() {
			super("incomplete", "test", { file: "test.js", line: 1, column: 0 });
		}
	}

	const entity = new IncompleteEntity();

	throws(
		() => entity.isValidJSDocTag("param"),
		/isValidJSDocTag\(\) must be implemented by child classes/,
		"Should enforce isValidJSDocTag implementation",
	);

	throws(
		() => entity.parseEntity({}, "content"),
		/parseEntity\(\) must be implemented by child classes/,
		"Should enforce parseEntity implementation",
	);

	throws(
		() => entity.validate(),
		/validate\(\) must be implemented by child classes/,
		"Should enforce validate implementation",
	);
});

test("EntityBase - validation workflow", () => {
	const entity = new TestEntity("testFunction", {
		file: "test.js",
		line: 1,
		column: 0,
	});

	// Initially not validated
	strictEqual(entity.isValid(), false);

	// After validation
	entity.validate();
	strictEqual(entity.isValid(), true);

	// Empty name should fail validation
	const emptyEntity = new TestEntity("", {
		file: "test.js",
		line: 1,
		column: 0,
	});
	emptyEntity.validate();
	strictEqual(emptyEntity.isValid(), false);
});
