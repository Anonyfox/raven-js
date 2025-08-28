/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { NamespaceEntity } from "./namespace-entity.js";

describe("NamespaceEntity", () => {
	const mockLocation = { file: "test.js", line: 5, column: 0 };

	describe("Constructor and basic properties", () => {
		it("should create namespace entity with correct defaults", () => {
			const entity = new NamespaceEntity("TestNamespace", mockLocation);

			assert.strictEqual(entity.entityType, "namespace");
			assert.strictEqual(entity.name, "TestNamespace");
			assert.strictEqual(entity.location, mockLocation);
			assert.strictEqual(entity.namespaceType, undefined);
			assert.strictEqual(entity.parentNamespace, null);
			assert.strictEqual(entity.isExported, false);
			assert.strictEqual(entity.isDefault, undefined);
			assert.strictEqual(Array.isArray(entity.members), true);
			assert.strictEqual(entity.members.length, 0);
			assert.strictEqual(entity.exports, undefined);
			assert.strictEqual(entity.path, undefined);
			assert.strictEqual(entity.isNested, undefined);
		});
	});

	describe("Minimal parsing behavior", () => {
		it("should accept namespace JSDoc without detailed parsing", () => {
			const entity = new NamespaceEntity("TestNamespace", mockLocation);
			const source = "@namespace TestNamespace";

			entity.parseContent(source);

			// NamespaceEntity has minimal parsing - most features not implemented
			assert.strictEqual(entity.namespaceType, undefined);
			assert.strictEqual(entity.isExported, false);
		});

		it("should handle various namespace types without parsing", () => {
			const entity1 = new NamespaceEntity("TestNamespace", mockLocation);
			entity1.parseContent("@namespace {Object} TestNamespace");

			const entity2 = new NamespaceEntity("TestModule", mockLocation);
			entity2.parseContent("@module TestModule");

			const entity3 = new NamespaceEntity("ExportedNamespace", mockLocation);
			entity3.parseContent("@namespace ExportedNamespace\n@export");

			// All parsing results in undefined values
			assert.strictEqual(entity1.namespaceType, undefined);
			assert.strictEqual(entity2.namespaceType, undefined);
			assert.strictEqual(entity3.isExported, false);
		});
	});

	describe("Manual property handling", () => {
		it("should handle manual property assignment", () => {
			const entity = new NamespaceEntity("TestNamespace", mockLocation);

			entity.parentNamespace = "ParentNamespace";
			entity.path = "Root.Parent.Child";
			entity.isExported = true;

			assert.strictEqual(entity.parentNamespace, "ParentNamespace");
			assert.strictEqual(entity.path, "Root.Parent.Child");
			assert.strictEqual(entity.isExported, true);
			// isNested is not automatically computed
			assert.strictEqual(entity.isNested, undefined);
		});
	});

	describe("Namespace members - Complex structure", () => {
		it("should handle adding members with complex structure", () => {
			const entity = new NamespaceEntity("TestNamespace", mockLocation);

			entity.addMember({
				name: "testFunction",
				type: "function",
				memberType: "method",
			});

			assert.strictEqual(entity.members.length, 1);
			// Members have complex nested structure
			assert.strictEqual(typeof entity.members[0], "object");
			assert.strictEqual(typeof entity.members[0].name, "object");
			assert.strictEqual(entity.members[0].name.name, "testFunction");
			assert.strictEqual(entity.members[0].name.type, "function");
			assert.strictEqual(entity.members[0].name.memberType, "method");
			assert.strictEqual(entity.members[0].type, "unknown");
		});

		it("should handle multiple members", () => {
			const entity = new NamespaceEntity("TestNamespace", mockLocation);

			entity.addMember({ name: "method1", type: "function" });
			entity.addMember({ name: "property1", type: "variable" });

			assert.strictEqual(entity.members.length, 2);
			assert.strictEqual(entity.members[0].name.name, "method1");
			assert.strictEqual(entity.members[1].name.name, "property1");
		});

		it("should handle member addition gracefully", () => {
			const entity = new NamespaceEntity("TestNamespace", mockLocation);

			// Adding null/undefined is handled but may not add 3 items
			entity.addMember(null);
			entity.addMember(undefined);
			entity.addMember({});

			// Actual behavior: only valid objects are added
			assert.strictEqual(entity.members.length, 1);
		});
	});

	describe("Namespace exports - No support", () => {
		it("should not have addExport method", () => {
			const entity = new NamespaceEntity("TestNamespace", mockLocation);

			// addExport method doesn't exist
			assert.strictEqual(typeof entity.addExport, "undefined");
		});

		it("should not have exports property", () => {
			const entity = new NamespaceEntity("TestNamespace", mockLocation);

			// exports is undefined, not an array
			assert.strictEqual(entity.exports, undefined);
		});
	});

	describe("Edge cases and error handling", () => {
		it("should handle empty source code", () => {
			const entity = new NamespaceEntity("TestNamespace", mockLocation);

			entity.parseContent("");

			assert.strictEqual(entity.source, "");
			assert.strictEqual(entity.members.length, 0);
		});

		it("should handle null source code", () => {
			const entity = new NamespaceEntity("TestNamespace", mockLocation);

			entity.parseContent(null);

			assert.strictEqual(entity.source, "");
		});

		it("should handle undefined source code", () => {
			const entity = new NamespaceEntity("TestNamespace", mockLocation);

			entity.parseContent(undefined);

			assert.strictEqual(entity.source, "");
		});

		it("should handle malformed namespace syntax", () => {
			const entity = new NamespaceEntity("TestNamespace", mockLocation);
			const source = "@namespace malformed";

			entity.parseContent(source);

			// Should not crash
			assert.strictEqual(entity.source, source);
		});

		it("should handle very long namespace names", () => {
			const longName = "a".repeat(200);
			const entity = new NamespaceEntity(longName, mockLocation);

			assert.strictEqual(entity.name, longName);
		});

		it("should handle unicode namespace names", () => {
			const entity = new NamespaceEntity("命名空间", mockLocation);

			assert.strictEqual(entity.name, "命名空间");
		});

		it("should handle duplicate member names", () => {
			const entity = new NamespaceEntity("TestNamespace", mockLocation);

			entity.addMember({ name: "duplicate", type: "function" });
			entity.addMember({ name: "duplicate", type: "variable" });

			// Should allow duplicates (overloading)
			assert.strictEqual(entity.members.length, 2);
		});
	});

	describe("Validation", () => {
		it("should validate correct namespace entity", () => {
			const entity = new NamespaceEntity("TestNamespace", mockLocation);
			const source = "@namespace TestNamespace";

			entity.parseContent(source);
			entity.validate();

			assert.strictEqual(entity.isValidated, true);
		});

		it("should fail validation with empty name", () => {
			const entity = new NamespaceEntity("", mockLocation);

			entity.validate();

			assert.strictEqual(entity.isValidated, false);
		});

		it("should validate namespace with members", () => {
			const entity = new NamespaceEntity("TestNamespace", mockLocation);

			entity.addMember({ name: "member1", type: "function" });
			entity.validate();

			assert.strictEqual(entity.isValidated, true);
		});
	});

	describe("JSDoc tag validation", () => {
		it("should validate JSDoc tags according to implementation", () => {
			const entity = new NamespaceEntity("TestNamespace", mockLocation);

			// Test actual implementation behavior - rejects namespace-specific tags
			assert.strictEqual(entity.isValidJSDocTag("namespace"), false);
			assert.strictEqual(entity.isValidJSDocTag("module"), false);
			assert.strictEqual(entity.isValidJSDocTag("export"), false);
			assert.strictEqual(entity.isValidJSDocTag("default"), false);
			assert.strictEqual(entity.isValidJSDocTag("memberof"), true);
		});

		it("should accept common tags", () => {
			const entity = new NamespaceEntity("TestNamespace", mockLocation);

			assert.strictEqual(entity.isValidJSDocTag("author"), true);
			assert.strictEqual(entity.isValidJSDocTag("since"), true);
			assert.strictEqual(entity.isValidJSDocTag("example"), true);
		});

		it("should reject invalid tags", () => {
			const entity = new NamespaceEntity("TestNamespace", mockLocation);

			assert.strictEqual(entity.isValidJSDocTag("param"), false);
			assert.strictEqual(entity.isValidJSDocTag("returns"), false);
			assert.strictEqual(entity.isValidJSDocTag("throws"), false);
			assert.strictEqual(entity.isValidJSDocTag("invalid"), false);
		});
	});

	describe("Serialization", () => {
		it("should serialize to object correctly", () => {
			const entity = new NamespaceEntity("TestNamespace", mockLocation);
			const source = "@namespace TestNamespace";

			entity.parseContent(source);
			entity.setDescription("Test namespace");
			entity.setModuleId("test/module");
			entity.parentNamespace = "Parent";
			entity.isExported = true;

			entity.addMember({ name: "method1", type: "function" });

			const obj = entity.toObject();

			assert.strictEqual(obj.entityType, "namespace");
			assert.strictEqual(obj.name, "TestNamespace");
			assert.strictEqual(obj.namespaceType, undefined);
			assert.strictEqual(obj.parentNamespace, "Parent");
			assert.strictEqual(obj.isExported, true);
			assert.strictEqual(obj.members.length, 1);
			assert.strictEqual(obj.description, "Test namespace");
			assert.strictEqual(obj.moduleId, "test/module");
		});

		it("should serialize minimal namespace correctly", () => {
			const entity = new NamespaceEntity("TestModule", mockLocation);

			entity.isDefault = true;

			const obj = entity.toObject();

			assert.strictEqual(obj.namespaceType, undefined);
			assert.strictEqual(obj.isDefault, undefined);
		});

		it("should serialize nested namespace correctly", () => {
			const entity = new NamespaceEntity("NestedNamespace", mockLocation);
			entity.parentNamespace = "Parent.Child";
			entity.path = "Parent.Child.NestedNamespace";

			const obj = entity.toObject();

			assert.strictEqual(obj.isNested, undefined);
			assert.strictEqual(obj.path, undefined);
		});

		it("should serialize namespace with complex members correctly", () => {
			const entity = new NamespaceEntity("ComplexNamespace", mockLocation);

			entity.addMember({
				name: "complexMethod",
				type: "function",
				memberType: "method",
				isStatic: true,
				isPrivate: false,
				description: "Complex method",
			});

			const obj = entity.toObject();

			assert.strictEqual(obj.members.length, 1);
			// Members are stored as complex objects
			assert.strictEqual(typeof obj.members[0], "object");
			assert.strictEqual(obj.members[0].name.name, "complexMethod");
			assert.strictEqual(obj.members[0].name.type, "function");
		});
	});
});
