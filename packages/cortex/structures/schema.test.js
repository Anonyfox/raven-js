/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { Schema } from "./schema.js";

describe("Schema", () => {
	// Test schemas for comprehensive coverage
	class SimpleSchema extends Schema {
		name = Schema.field("", { description: "User name" });
		age = Schema.field(0, { description: "User age" });
		active = Schema.field(true, { description: "User status" });
	}

	class SchemaWithOptional extends Schema {
		required = Schema.field("", { description: "Required field" });
		optional = Schema.field("", {
			description: "Optional field",
			optional: true,
		});
	}

	class NestedSchema extends Schema {
		simple = Schema.field(new SimpleSchema(), {
			description: "Nested simple schema",
		});
		count = Schema.field(0, { description: "Count value" });
	}

	class ArraySchema extends Schema {
		numbers = Schema.field([0], { description: "Array of numbers" });
		strings = Schema.field([""], { description: "Array of strings" });
		booleans = Schema.field([true], { description: "Array of booleans" });
	}

	class NestedArraySchema extends Schema {
		schemas = Schema.field([new SimpleSchema()], {
			description: "Array of schemas",
		});
	}

	class PlainFieldSchema extends Schema {
		// Plain fields without metadata
		constructor() {
			super();
			this.plainString = "";
			this.plainNumber = 42;
			this.plainBoolean = false;
		}
	}

	describe("Static field method", () => {
		it("should create field with default metadata", () => {
			const field = Schema.field("test");

			assert.strictEqual(field.value, "test");
			assert.strictEqual(field.metadata.description, "");
			assert.strictEqual(field.metadata.optional, false);
		});

		it("should create field with custom metadata", () => {
			const field = Schema.field(42, {
				description: "Test number",
				optional: true,
			});

			assert.strictEqual(field.value, 42);
			assert.strictEqual(field.metadata.description, "Test number");
			assert.strictEqual(field.metadata.optional, true);
		});

		it("should handle partial options", () => {
			const fieldDesc = Schema.field("test", {
				description: "Only description",
			});
			const fieldOpt = Schema.field("test", { optional: true });

			assert.strictEqual(fieldDesc.metadata.description, "Only description");
			assert.strictEqual(fieldDesc.metadata.optional, false);
			assert.strictEqual(fieldOpt.metadata.description, "");
			assert.strictEqual(fieldOpt.metadata.optional, true);
		});
	});

	describe("toJSON", () => {
		it("should generate basic JSON schema", () => {
			const schema = new SimpleSchema();
			const json = JSON.parse(schema.toJSON());

			assert.strictEqual(json.type, "object");
			assert.ok(json.properties);
			assert.ok(Array.isArray(json.required));
			assert.deepStrictEqual(json.required, ["name", "age", "active"]);
		});

		it("should include field descriptions", () => {
			const schema = new SimpleSchema();
			const json = JSON.parse(schema.toJSON());

			assert.strictEqual(json.properties.name.description, "User name");
			assert.strictEqual(json.properties.age.description, "User age");
			assert.strictEqual(json.properties.active.description, "User status");
		});

		it("should handle optional fields", () => {
			const schema = new SchemaWithOptional();
			const json = JSON.parse(schema.toJSON());

			assert.deepStrictEqual(json.required, ["required"]);
			assert.strictEqual(
				json.properties.optional.description,
				"Optional field",
			);
		});

		it("should handle nested schemas", () => {
			const schema = new NestedSchema();
			const json = JSON.parse(schema.toJSON());

			assert.strictEqual(json.properties.simple.type, "object");
			assert.ok(json.properties.simple.properties);
			assert.ok(json.properties.simple.properties.name);
			assert.strictEqual(json.properties.simple.properties.name.type, "string");
		});

		it("should handle array fields", () => {
			const schema = new ArraySchema();
			const json = JSON.parse(schema.toJSON());

			assert.strictEqual(json.properties.numbers.type, "array");
			assert.strictEqual(json.properties.numbers.items.type, "number");
			assert.strictEqual(json.properties.strings.type, "array");
			assert.strictEqual(json.properties.strings.items.type, "string");
			assert.strictEqual(json.properties.booleans.type, "array");
			assert.strictEqual(json.properties.booleans.items.type, "boolean");
		});

		it("should handle nested arrays", () => {
			const schema = new NestedArraySchema();
			const json = JSON.parse(schema.toJSON());

			assert.strictEqual(json.properties.schemas.type, "array");
			assert.strictEqual(json.properties.schemas.items.type, "object");
			assert.ok(json.properties.schemas.items.properties);
		});

		it("should handle plain fields without metadata", () => {
			const schema = new PlainFieldSchema();
			const json = JSON.parse(schema.toJSON());

			assert.strictEqual(json.properties.plainString.type, "string");
			assert.strictEqual(json.properties.plainNumber.type, "number");
			assert.strictEqual(json.properties.plainBoolean.type, "boolean");
			assert.deepStrictEqual(json.required, [
				"plainString",
				"plainNumber",
				"plainBoolean",
			]);
		});
	});

	describe("validate", () => {
		it("should validate valid simple data", () => {
			const schema = new SimpleSchema();
			const data = { name: "Alice", age: 30, active: true };

			assert.strictEqual(schema.validate(data), true);
		});

		it("should validate JSON string input", () => {
			const schema = new SimpleSchema();
			const jsonString = JSON.stringify({
				name: "Alice",
				age: 30,
				active: true,
			});

			assert.strictEqual(schema.validate(jsonString), true);
		});

		it("should reject missing required fields", () => {
			const schema = new SimpleSchema();
			const data = { name: "Alice", age: 30 }; // missing active

			assert.strictEqual(schema.validate(data), false);
		});

		it("should accept missing optional fields", () => {
			const schema = new SchemaWithOptional();
			const data = { required: "test" }; // optional field missing

			assert.strictEqual(schema.validate(data), true);
		});

		it("should reject wrong primitive types", () => {
			const schema = new SimpleSchema();
			const data = { name: "Alice", age: "thirty", active: true }; // age is string

			assert.strictEqual(schema.validate(data), false);
		});

		it("should validate nested schemas", () => {
			const schema = new NestedSchema();
			const validData = {
				simple: { name: "Alice", age: 30, active: true },
				count: 5,
			};
			const invalidData = {
				simple: { name: "Alice", age: 30 }, // missing active
				count: 5,
			};

			assert.strictEqual(schema.validate(validData), true);
			assert.strictEqual(schema.validate(invalidData), false);
		});

		it("should validate array fields", () => {
			const schema = new ArraySchema();
			const validData = {
				numbers: [1, 2, 3],
				strings: ["a", "b", "c"],
				booleans: [true, false, true],
			};
			const invalidData = {
				numbers: [1, "two", 3], // mixed types
				strings: ["a", "b", "c"],
				booleans: [true, false, true],
			};

			assert.strictEqual(schema.validate(validData), true);
			assert.strictEqual(schema.validate(invalidData), false);
		});

		it("should reject non-array for array fields", () => {
			const schema = new ArraySchema();
			const data = {
				numbers: "not an array",
				strings: ["a", "b"],
				booleans: [true],
			};

			assert.strictEqual(schema.validate(data), false);
		});

		it("should validate nested arrays", () => {
			const schema = new NestedArraySchema();
			const validData = {
				schemas: [
					{ name: "Alice", age: 30, active: true },
					{ name: "Bob", age: 25, active: false },
				],
			};
			const invalidData = {
				schemas: [
					{ name: "Alice", age: 30, active: true },
					{ name: "Bob", age: 25 }, // missing active
				],
			};

			assert.strictEqual(schema.validate(validData), true);
			assert.strictEqual(schema.validate(invalidData), false);
		});

		it("should reject non-object for nested schema", () => {
			const schema = new NestedSchema();
			const data = {
				simple: "not an object",
				count: 5,
			};

			assert.strictEqual(schema.validate(data), false);
		});

		it("should validate plain fields", () => {
			const schema = new PlainFieldSchema();
			const validData = {
				plainString: "test",
				plainNumber: 42,
				plainBoolean: false,
			};
			const invalidData = {
				plainString: "test",
				plainNumber: "not a number",
				plainBoolean: false,
			};

			assert.strictEqual(schema.validate(validData), true);
			assert.strictEqual(schema.validate(invalidData), false);
		});

		it("should handle malformed JSON strings", () => {
			const schema = new SimpleSchema();
			const malformedJson = "{ invalid json";

			assert.strictEqual(schema.validate(malformedJson), false);
		});
	});

	describe("fromJSON", () => {
		it("should populate simple schema fields", () => {
			const schema = new SimpleSchema();
			const data = { name: "Alice", age: 30, active: true };

			schema.fromJSON(data);

			assert.strictEqual(schema.name.value, "Alice");
			assert.strictEqual(schema.age.value, 30);
			assert.strictEqual(schema.active.value, true);
		});

		it("should handle JSON string input", () => {
			const schema = new SimpleSchema();
			const jsonString = JSON.stringify({
				name: "Alice",
				age: 30,
				active: true,
			});

			schema.fromJSON(jsonString);

			assert.strictEqual(schema.name.value, "Alice");
			assert.strictEqual(schema.age.value, 30);
			assert.strictEqual(schema.active.value, true);
		});

		it("should throw on missing required fields", () => {
			const schema = new SimpleSchema();
			const data = { name: "Alice", age: 30 }; // missing active

			assert.throws(
				() => schema.fromJSON(data),
				/Missing required property: active/,
			);
		});

		it("should handle optional fields", () => {
			const schema = new SchemaWithOptional();
			const dataWithOptional = { required: "test", optional: "value" };
			const dataWithoutOptional = { required: "test" };

			schema.fromJSON(dataWithOptional);
			assert.strictEqual(schema.optional.value, "value");

			schema.fromJSON(dataWithoutOptional);
			assert.strictEqual(schema.required.value, "test");
			// Optional field should keep its default value
		});

		it("should populate nested schemas", () => {
			const schema = new NestedSchema();
			const data = {
				simple: { name: "Alice", age: 30, active: true },
				count: 5,
			};

			schema.fromJSON(data);

			assert.ok(schema.simple.value instanceof SimpleSchema);
			assert.strictEqual(schema.simple.value.name.value, "Alice");
			assert.strictEqual(schema.simple.value.age.value, 30);
			assert.strictEqual(schema.simple.value.active.value, true);
			assert.strictEqual(schema.count.value, 5);
		});

		it("should populate array fields", () => {
			const schema = new ArraySchema();
			const data = {
				numbers: [1, 2, 3],
				strings: ["a", "b", "c"],
				booleans: [true, false, true],
			};

			schema.fromJSON(data);

			assert.deepStrictEqual(schema.numbers.value, [1, 2, 3]);
			assert.deepStrictEqual(schema.strings.value, ["a", "b", "c"]);
			assert.deepStrictEqual(schema.booleans.value, [true, false, true]);
		});

		it("should populate nested arrays", () => {
			const schema = new NestedArraySchema();
			const data = {
				schemas: [
					{ name: "Alice", age: 30, active: true },
					{ name: "Bob", age: 25, active: false },
				],
			};

			schema.fromJSON(data);

			assert.strictEqual(schema.schemas.value.length, 2);
			assert.ok(schema.schemas.value[0] instanceof SimpleSchema);
			assert.strictEqual(schema.schemas.value[0].name.value, "Alice");
			assert.ok(schema.schemas.value[1] instanceof SimpleSchema);
			assert.strictEqual(schema.schemas.value[1].name.value, "Bob");
		});

		it("should populate plain fields", () => {
			const schema = new PlainFieldSchema();
			const data = {
				plainString: "updated",
				plainNumber: 100,
				plainBoolean: true,
			};

			schema.fromJSON(data);

			assert.strictEqual(schema.plainString, "updated");
			assert.strictEqual(schema.plainNumber, 100);
			assert.strictEqual(schema.plainBoolean, true);
		});

		it("should throw on plain field missing", () => {
			const schema = new PlainFieldSchema();
			const data = {
				plainString: "test",
				plainNumber: 42,
				// plainBoolean missing
			};

			assert.throws(
				() => schema.fromJSON(data),
				/Missing required property: plainBoolean/,
			);
		});

		it("should reject undefined values for required fields", () => {
			const schema = new SimpleSchema();
			const data = { name: "Alice", age: 30, active: undefined };

			// Undefined should be treated as missing required field
			assert.throws(
				() => schema.fromJSON(data),
				/Missing required property: active/,
			);
		});
	});

	describe("Error handling and edge cases", () => {
		it("should handle empty objects", () => {
			const schema = new SimpleSchema();

			assert.strictEqual(schema.validate({}), false);
			assert.throws(() => schema.fromJSON({}), /Missing required property/);
		});

		it("should handle null values", () => {
			const schema = new SimpleSchema();
			const data = { name: null, age: 30, active: true };

			assert.strictEqual(schema.validate(data), false);
		});

		it("should preserve existing values on validation failure", () => {
			const schema = new SimpleSchema();
			schema.name.value = "Original";

			const invalidData = { name: "Alice", age: "invalid", active: true };

			assert.strictEqual(schema.validate(invalidData), false);
			assert.strictEqual(schema.name.value, "Original"); // unchanged
		});

		it("should handle complex nested validation failures", () => {
			const schema = new NestedSchema();
			const invalidData = {
				simple: { name: "Alice", age: "invalid" }, // missing active, wrong type
				count: 5,
			};

			assert.strictEqual(schema.validate(invalidData), false);
		});

		it("should handle malformed JSON in fromJSON", () => {
			const schema = new SimpleSchema();

			assert.throws(
				() => schema.fromJSON("{ invalid json"),
				/Expected property name or/,
			);
		});
	});
});
