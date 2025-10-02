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

  class EnumSchema extends Schema {
    status = Schema.field("draft", {
      description: "Document status",
      enum: ["draft", "published", "archived"],
    });
    priority = Schema.field(1, {
      description: "Priority level",
      enum: [1, 2, 3, 4, 5],
    });
    tags = Schema.field([""], {
      description: "Available tags",
      enum: ["bug", "feature", "docs", "test"],
    });
  }

  class OptionalEnumSchema extends Schema {
    required = Schema.field("active", {
      description: "Status",
      enum: ["active", "inactive"],
    });
    optional = Schema.field("", {
      description: "Optional category",
      optional: true,
      enum: ["cat1", "cat2", "cat3"],
    });
  }

  class ItemsConstructorSchema extends Schema {
    tags = Schema.field([], {
      description: "String array",
      items: String,
      enum: ["bug", "feature", "docs"],
    });
    scores = Schema.field([], {
      description: "Number array",
      items: Number,
    });
    flags = Schema.field([], {
      description: "Boolean array",
      items: Boolean,
    });
  }

  class ItemsPrimitiveSchema extends Schema {
    names = Schema.field([], {
      description: "Names",
      items: "",
    });
    counts = Schema.field([], {
      description: "Counts",
      items: 0,
    });
  }

  class ItemsSchemaArray extends Schema {
    users = Schema.field([], {
      description: "User list",
      items: new SimpleSchema(),
    });
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
      assert.strictEqual(json.properties.optional.description, "Optional field");
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
      assert.deepStrictEqual(json.required, ["plainString", "plainNumber", "plainBoolean"]);
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

    it("should reject missing required plain fields (lines 223-224)", () => {
      const schema = new PlainFieldSchema();
      const missingFieldData = {
        plainString: "test",
        plainNumber: 42,
        // plainBoolean missing - this should trigger lines 223-224
      };

      assert.strictEqual(schema.validate(missingFieldData), false);
    });

    it("should handle malformed JSON strings", () => {
      const schema = new SimpleSchema();
      const malformedJson = "{ invalid json";

      assert.strictEqual(schema.validate(malformedJson), false);
    });

    it("should handle non-string JSON input path (line 101 branch coverage)", () => {
      const schema = new SimpleSchema();
      const nonStringData = { name: "test", age: 25, active: true };

      // This should hit the non-string branch of the ternary operator
      assert.strictEqual(schema.validate(nonStringData), true);
    });

    it("should handle undefined values for primitive fields in edge cases", () => {
      const schema = new SimpleSchema();

      // This should trigger validation paths for undefined values
      const partialData = {
        name: "test",
        age: undefined, // This should hit the undefined branch
        active: true,
      };

      assert.strictEqual(schema.validate(partialData), false);
    });

    it("should handle metadata edge cases for branch coverage", () => {
      // Create schema with metadata that has falsy optional and description values
      class EdgeCaseSchema extends Schema {
        field1 = Schema.field("", { optional: false, description: "" });
        field2 = Schema.field(0, { optional: true, description: null });
        field3 = Schema.field(true, { optional: false });
      }

      const schema = new EdgeCaseSchema();
      const json = schema.toJSON();
      const parsed = JSON.parse(json);

      // This should hit the branches where description is falsy
      assert.ok(parsed.properties.field1);
      assert.ok(parsed.properties.field2);
      assert.ok(parsed.properties.field3);
      assert.ok(Array.isArray(parsed.required));
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

      assert.throws(() => schema.fromJSON(data), /Missing required property: active/);
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

      assert.throws(() => schema.fromJSON(data), /Missing required property: plainBoolean/);
    });

    it("should reject undefined values for required fields", () => {
      const schema = new SimpleSchema();
      const data = { name: "Alice", age: 30, active: undefined };

      // Undefined should be treated as missing required field
      assert.throws(() => schema.fromJSON(data), /Missing required property: active/);
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

      assert.throws(() => schema.fromJSON("{ invalid json"), /Expected property name or/);
    });
  });

  describe("Enum constraints", () => {
    it("should create field with enum metadata", () => {
      const field = Schema.field("draft", {
        enum: ["draft", "published", "archived"],
      });

      assert.strictEqual(field.value, "draft");
      assert.ok(field.metadata.enum);
      assert.deepStrictEqual(field.metadata.enum, ["draft", "published", "archived"]);
    });

    it("should include enum in JSON schema output", () => {
      const schema = new EnumSchema();
      const json = JSON.parse(schema.toJSON());

      assert.deepStrictEqual(json.properties.status.enum, ["draft", "published", "archived"]);
      assert.deepStrictEqual(json.properties.priority.enum, [1, 2, 3, 4, 5]);
      assert.deepStrictEqual(json.properties.tags.enum, ["bug", "feature", "docs", "test"]);
    });

    it("should validate enum string values", () => {
      const schema = new EnumSchema();
      const validData = {
        status: "published",
        priority: 3,
        tags: ["bug", "test"],
      };
      const invalidData = {
        status: "invalid",
        priority: 3,
        tags: ["bug"],
      };

      assert.strictEqual(schema.validate(validData), true);
      assert.strictEqual(schema.validate(invalidData), false);
    });

    it("should validate enum number values", () => {
      const schema = new EnumSchema();
      const validData = {
        status: "draft",
        priority: 5,
        tags: ["feature"],
      };
      const invalidData = {
        status: "draft",
        priority: 99,
        tags: ["feature"],
      };

      assert.strictEqual(schema.validate(validData), true);
      assert.strictEqual(schema.validate(invalidData), false);
    });

    it("should validate enum array values", () => {
      const schema = new EnumSchema();
      const validData = {
        status: "archived",
        priority: 1,
        tags: ["bug", "feature", "docs"],
      };
      const invalidData = {
        status: "archived",
        priority: 1,
        tags: ["bug", "invalid"],
      };

      assert.strictEqual(schema.validate(validData), true);
      assert.strictEqual(schema.validate(invalidData), false);
    });

    it("should validate empty enum arrays", () => {
      const schema = new EnumSchema();
      const validData = {
        status: "draft",
        priority: 2,
        tags: [],
      };

      assert.strictEqual(schema.validate(validData), true);
    });

    it("should handle optional enum fields", () => {
      const schema = new OptionalEnumSchema();
      const validWithOptional = {
        required: "active",
        optional: "cat2",
      };
      const validWithoutOptional = {
        required: "inactive",
      };
      const invalidOptional = {
        required: "active",
        optional: "invalid",
      };

      assert.strictEqual(schema.validate(validWithOptional), true);
      assert.strictEqual(schema.validate(validWithoutOptional), true);
      assert.strictEqual(schema.validate(invalidOptional), false);
    });

    it("should throw detailed error for invalid enum value in fromJSON", () => {
      const schema = new EnumSchema();
      const data = { status: "invalid", priority: 3, tags: ["bug"] };

      assert.throws(
        () => schema.fromJSON(data),
        (error) => {
          return error.message.includes("Invalid enum value") && error.message.includes("status");
        }
      );
    });

    it("should throw detailed error for invalid enum array item in fromJSON", () => {
      const schema = new EnumSchema();
      const data = { status: "draft", priority: 1, tags: ["bug", "invalid"] };

      assert.throws(
        () => schema.fromJSON(data),
        (error) => {
          return error.message.includes("Invalid enum value") && error.message.includes("tags[1]");
        }
      );
    });

    it("should populate enum fields from JSON", () => {
      const schema = new EnumSchema();
      const data = {
        status: "published",
        priority: 4,
        tags: ["feature", "docs"],
      };

      schema.fromJSON(data);

      assert.strictEqual(schema.status.value, "published");
      assert.strictEqual(schema.priority.value, 4);
      assert.deepStrictEqual(schema.tags.value, ["feature", "docs"]);
    });

    it("should reject invalid enum values in fromJSON", () => {
      const schema = new EnumSchema();
      const data = {
        status: "invalid",
        priority: 1,
        tags: ["bug"],
      };

      assert.throws(() => schema.fromJSON(data), /Invalid enum value for status/);
    });

    it("should not add enum to schema when undefined", () => {
      const schema = new SimpleSchema();
      const json = JSON.parse(schema.toJSON());

      assert.strictEqual(json.properties.name.enum, undefined);
      assert.strictEqual(json.properties.age.enum, undefined);
    });
  });

  describe("Array items with constructors", () => {
    it("should create field with items metadata", () => {
      const field = Schema.field([], {
        items: String,
        enum: ["a", "b", "c"],
      });

      assert.deepStrictEqual(field.value, []);
      assert.strictEqual(field.metadata.items, String);
      assert.ok(field.metadata.enum);
    });

    it("should generate JSON schema with constructor types", () => {
      const schema = new ItemsConstructorSchema();
      const json = JSON.parse(schema.toJSON());

      assert.strictEqual(json.properties.tags.type, "array");
      assert.strictEqual(json.properties.tags.items.type, "string");
      assert.strictEqual(json.properties.scores.type, "array");
      assert.strictEqual(json.properties.scores.items.type, "number");
      assert.strictEqual(json.properties.flags.type, "array");
      assert.strictEqual(json.properties.flags.items.type, "boolean");
    });

    it("should validate arrays with constructor items", () => {
      const schema = new ItemsConstructorSchema();
      const validData = {
        tags: ["bug", "feature"],
        scores: [1, 2, 3],
        flags: [true, false],
      };
      const invalidStringData = {
        tags: ["bug"],
        scores: [1, "two"],
        flags: [true],
      };
      const invalidBoolData = {
        tags: ["bug"],
        scores: [1],
        flags: [true, "false"],
      };

      assert.strictEqual(schema.validate(validData), true);
      assert.strictEqual(schema.validate(invalidStringData), false);
      assert.strictEqual(schema.validate(invalidBoolData), false);
    });

    it("should validate empty arrays with items", () => {
      const schema = new ItemsConstructorSchema();
      const emptyData = {
        tags: [],
        scores: [],
        flags: [],
      };

      assert.strictEqual(schema.validate(emptyData), true);
    });

    it("should populate arrays with constructor items", () => {
      const schema = new ItemsConstructorSchema();
      const data = {
        tags: ["bug", "docs"],
        scores: [5, 10, 15],
        flags: [true],
      };

      schema.fromJSON(data);

      assert.deepStrictEqual(schema.tags.value, ["bug", "docs"]);
      assert.deepStrictEqual(schema.scores.value, [5, 10, 15]);
      assert.deepStrictEqual(schema.flags.value, [true]);
    });

    it("should validate enum with constructor items", () => {
      const schema = new ItemsConstructorSchema();
      const validData = {
        tags: ["bug", "feature"],
        scores: [1],
        flags: [true],
      };
      const invalidEnum = {
        tags: ["invalid"],
        scores: [1],
        flags: [true],
      };

      assert.strictEqual(schema.validate(validData), true);
      assert.strictEqual(schema.validate(invalidEnum), false);
    });

    it("should work with primitive items values (backward compat)", () => {
      const schema = new ItemsPrimitiveSchema();
      const json = JSON.parse(schema.toJSON());

      assert.strictEqual(json.properties.names.items.type, "string");
      assert.strictEqual(json.properties.counts.items.type, "number");
    });

    it("should validate arrays with primitive items", () => {
      const schema = new ItemsPrimitiveSchema();
      const validData = {
        names: ["Alice", "Bob"],
        counts: [1, 2, 3],
      };
      const invalidData = {
        names: ["Alice"],
        counts: ["not a number"],
      };

      assert.strictEqual(schema.validate(validData), true);
      assert.strictEqual(schema.validate(invalidData), false);
    });

    it("should handle schema arrays with items", () => {
      const schema = new ItemsSchemaArray();
      const json = JSON.parse(schema.toJSON());

      assert.strictEqual(json.properties.users.type, "array");
      assert.strictEqual(json.properties.users.items.type, "object");
      assert.ok(json.properties.users.items.properties.name);
    });

    it("should validate and populate schema arrays with items", () => {
      const schema = new ItemsSchemaArray();
      const validData = {
        users: [
          { name: "Alice", age: 30, active: true },
          { name: "Bob", age: 25, active: false },
        ],
      };
      const invalidData = {
        users: [{ name: "Alice", age: 30 }], // missing active
      };

      assert.strictEqual(schema.validate(validData), true);
      assert.strictEqual(schema.validate(invalidData), false);

      schema.fromJSON(validData);
      assert.strictEqual(schema.users.value.length, 2);
      assert.ok(schema.users.value[0] instanceof SimpleSchema);
      assert.strictEqual(schema.users.value[0].name.value, "Alice");
    });

    it("should handle empty arrays with schema items", () => {
      const schema = new ItemsSchemaArray();
      const emptyData = { users: [] };

      assert.strictEqual(schema.validate(emptyData), true);

      schema.fromJSON(emptyData);
      assert.deepStrictEqual(schema.users.value, []);
    });
  });

  describe("clone()", () => {
    it("should create deep copy with primitives", () => {
      const original = new SimpleSchema();
      original.name.value = "Alice";
      original.age.value = 30;
      original.active.value = false;

      const cloned = original.clone();

      assert.notStrictEqual(cloned, original);
      assert.strictEqual(cloned.name.value, "Alice");
      assert.strictEqual(cloned.age.value, 30);
      assert.strictEqual(cloned.active.value, false);

      // Mutate clone, original unchanged
      cloned.name.value = "Bob";
      assert.strictEqual(original.name.value, "Alice");
      assert.strictEqual(cloned.name.value, "Bob");
    });

    it("should deep clone nested schemas", () => {
      const original = new NestedSchema();
      original.simple.value.name.value = "Alice";
      original.simple.value.age.value = 30;
      original.count.value = 5;

      const cloned = original.clone();

      assert.notStrictEqual(cloned, original);
      assert.notStrictEqual(cloned.simple.value, original.simple.value);
      assert.strictEqual(cloned.simple.value.name.value, "Alice");
      assert.strictEqual(cloned.simple.value.age.value, 30);
      assert.strictEqual(cloned.count.value, 5);

      // Mutate nested clone
      cloned.simple.value.name.value = "Bob";
      assert.strictEqual(original.simple.value.name.value, "Alice");
      assert.strictEqual(cloned.simple.value.name.value, "Bob");
    });

    it("should deep clone arrays", () => {
      const original = new ArraySchema();
      original.numbers.value = [1, 2, 3];
      original.strings.value = ["a", "b"];

      const cloned = original.clone();

      assert.notStrictEqual(cloned.numbers.value, original.numbers.value);
      assert.deepStrictEqual(cloned.numbers.value, [1, 2, 3]);

      // Mutate clone array
      cloned.numbers.value.push(4);
      assert.deepStrictEqual(original.numbers.value, [1, 2, 3]);
      assert.deepStrictEqual(cloned.numbers.value, [1, 2, 3, 4]);
    });

    it("should deep clone arrays of schemas", () => {
      const original = new NestedArraySchema();
      original.fromJSON({
        schemas: [
          { name: "Alice", age: 30, active: true },
          { name: "Bob", age: 25, active: false },
        ],
      });

      const cloned = original.clone();

      assert.notStrictEqual(cloned.schemas.value, original.schemas.value);
      assert.notStrictEqual(cloned.schemas.value[0], original.schemas.value[0]);
      assert.strictEqual(cloned.schemas.value[0].name.value, "Alice");

      // Mutate nested schema in clone
      cloned.schemas.value[0].name.value = "Charlie";
      assert.strictEqual(original.schemas.value[0].name.value, "Alice");
      assert.strictEqual(cloned.schemas.value[0].name.value, "Charlie");
    });

    it("should preserve metadata in clone", () => {
      const original = new SchemaWithOptional();
      const cloned = original.clone();

      assert.ok(cloned.required.metadata);
      assert.ok(cloned.optional.metadata);
      assert.strictEqual(cloned.optional.metadata.optional, true);
      assert.notStrictEqual(cloned.optional.metadata, original.optional.metadata);
    });
  });

  describe("toObject()", () => {
    it("should extract plain object from simple schema", () => {
      const schema = new SimpleSchema();
      schema.name.value = "Alice";
      schema.age.value = 30;
      schema.active.value = true;

      const obj = schema.toObject();

      assert.deepStrictEqual(obj, {
        name: "Alice",
        age: 30,
        active: true,
      });
      assert.strictEqual(typeof obj, "object");
      assert.strictEqual(obj.constructor, Object);
    });

    it("should extract nested schemas recursively", () => {
      const schema = new NestedSchema();
      schema.simple.value.name.value = "Alice";
      schema.simple.value.age.value = 30;
      schema.simple.value.active.value = false;
      schema.count.value = 5;

      const obj = schema.toObject();

      assert.deepStrictEqual(obj, {
        simple: {
          name: "Alice",
          age: 30,
          active: false,
        },
        count: 5,
      });
    });

    it("should extract arrays with primitives", () => {
      const schema = new ArraySchema();
      schema.numbers.value = [1, 2, 3];
      schema.strings.value = ["a", "b", "c"];
      schema.booleans.value = [true, false];

      const obj = schema.toObject();

      assert.deepStrictEqual(obj, {
        numbers: [1, 2, 3],
        strings: ["a", "b", "c"],
        booleans: [true, false],
      });
    });

    it("should extract arrays of schemas", () => {
      const schema = new NestedArraySchema();
      schema.fromJSON({
        schemas: [
          { name: "Alice", age: 30, active: true },
          { name: "Bob", age: 25, active: false },
        ],
      });

      const obj = schema.toObject();

      assert.deepStrictEqual(obj, {
        schemas: [
          { name: "Alice", age: 30, active: true },
          { name: "Bob", age: 25, active: false },
        ],
      });
    });

    it("should handle plain fields without metadata", () => {
      const schema = new PlainFieldSchema();
      schema.plainString = "test";
      schema.plainNumber = 42;
      schema.plainBoolean = true;

      const obj = schema.toObject();

      assert.deepStrictEqual(obj, {
        plainString: "test",
        plainNumber: 42,
        plainBoolean: true,
      });
    });

    it("should extract empty arrays", () => {
      const schema = new ArraySchema();

      const obj = schema.toObject();

      assert.deepStrictEqual(obj.numbers, [0]);
      assert.deepStrictEqual(obj.strings, [""]);
    });
  });
});
