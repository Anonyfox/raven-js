/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { EntityBase } from "./base.js";

// Mock concrete entity for testing
class TestEntity extends EntityBase {
	constructor(name, location) {
		super("test", name, location);
	}

	parseContent(sourceCode) {
		this.setSource(sourceCode);
	}
}

describe("EntityBase", () => {
	const mockLocation = { file: "test.js", line: 1, column: 0 };

	it("should not be instantiable directly", () => {
		assert.throws(() => new EntityBase("test", "test", mockLocation));
	});

	it("should create valid entity through inheritance", () => {
		const entity = new TestEntity("myTest", mockLocation);

		assert.strictEqual(entity.entityType, "test");
		assert.strictEqual(entity.name, "myTest");
		assert.strictEqual(entity.location, mockLocation);
		assert.strictEqual(entity.description, "");
		assert.strictEqual(entity.source, "");
		assert.strictEqual(entity.moduleId, "");
		assert.strictEqual(entity.isValidated, false);
		assert.strictEqual(Array.isArray(entity.jsdocTags), true);
	});

	it("should generate correct ID", () => {
		const entity = new TestEntity("myFunction", mockLocation);
		entity.setModuleId("test/module");

		assert.strictEqual(entity.getId(), "test/module/myFunction");
	});

	it("should handle JSDoc tags", () => {
		const entity = new TestEntity("myFunction", mockLocation);
		const mockTag = { tagType: "param", name: "arg1" };

		entity.addJSDocTag(mockTag);

		assert.strictEqual(entity.getAllJSDocTags().length, 1);
		assert.strictEqual(entity.hasJSDocTag("param"), true);
		assert.strictEqual(entity.hasJSDocTag("returns"), false);
		assert.strictEqual(entity.getJSDocTag("param"), mockTag);
		assert.strictEqual(entity.getJSDocTagsByType("param").length, 1);
	});

	it("should handle multiple tags of same type", () => {
		const entity = new TestEntity("myFunction", mockLocation);
		const tag1 = { tagType: "param", name: "arg1" };
		const tag2 = { tagType: "param", name: "arg2" };

		entity.addJSDocTag(tag1);
		entity.addJSDocTag(tag2);

		assert.strictEqual(entity.getJSDocTagsByType("param").length, 2);
		assert.strictEqual(entity.getJSDocTag("param"), tag1); // Returns first
	});

	it("should handle description", () => {
		const entity = new TestEntity("myFunction", mockLocation);
		const description = "This is a test function";

		entity.setDescription(description);

		assert.strictEqual(entity.description, description);
	});

	it("should handle source code", () => {
		const entity = new TestEntity("myFunction", mockLocation);
		const sourceCode = "function myFunction() { return 42; }";

		entity.parseContent(sourceCode);

		assert.strictEqual(entity.source, sourceCode);
	});

	it("should validate basic requirements", () => {
		const entity = new TestEntity("myFunction", mockLocation);

		entity.validate();

		assert.strictEqual(entity.isValidated, true);
	});

	it("should fail validation with missing data", () => {
		const entity = new TestEntity("", mockLocation);

		entity.validate();

		assert.strictEqual(entity.isValidated, false);
	});

	it("should serialize to object", () => {
		const entity = new TestEntity("myFunction", mockLocation);
		entity.setDescription("Test description");
		entity.setModuleId("test/module");
		entity.addJSDocTag({
			tagType: "param",
			toObject: () => ({ type: "param" }),
		});

		const obj = entity.toObject();

		assert.strictEqual(obj.entityType, "test");
		assert.strictEqual(obj.name, "myFunction");
		assert.strictEqual(obj.description, "Test description");
		assert.strictEqual(obj.moduleId, "test/module");
		assert.strictEqual(Array.isArray(obj.jsdocTags), true);
		assert.strictEqual(obj.jsdocTags.length, 1);
	});

	it("should handle common JSDoc tags", () => {
		const entity = new TestEntity("myFunction", mockLocation);

		assert.strictEqual(entity.isValidJSDocTag("author"), true);
		assert.strictEqual(entity.isValidJSDocTag("since"), true);
		assert.strictEqual(entity.isValidJSDocTag("deprecated"), true);
		assert.strictEqual(entity.isValidJSDocTag("see"), true);
		assert.strictEqual(entity.isValidJSDocTag("example"), true);
		assert.strictEqual(entity.isValidJSDocTag("invalid"), false);
	});
});
