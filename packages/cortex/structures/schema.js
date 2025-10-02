/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSON Schema implementation for data structure validation and type safety.
 *
 * Provides schema definition, validation, and serialization using vanilla JavaScript classes.
 * Supports primitive types, nested schemas, arrays with explicit item types, field metadata,
 * optional fields, and enum constraints. Array items can be defined using native constructors
 * (String, Number, Boolean) or Schema instances for clean empty array defaults.
 */

/**
 * @typedef {string | number | boolean} PrimitiveType
 * @typedef {PrimitiveType | Schema | Array<PrimitiveType | Schema>} SchemaField
 * @typedef {StringConstructor | NumberConstructor | BooleanConstructor} PrimitiveConstructor
 */

/**
 * @typedef {Object} FieldMetadata
 * @property {string} description
 * @property {boolean} optional
 * @property {Array<any>} [enum]
 * @property {PrimitiveType | PrimitiveConstructor | Schema} [items]
 */

/**
 * @typedef {Object} JsonSchemaObject
 * @property {string} type
 * @property {Object<string, any>} properties
 * @property {string[]} required
 */

/**
 * Abstract base class for type-safe JSON schema validation and data structure definition.
 *
 * Enables compile-time safety through JSDoc typing and runtime validation.
 * Supports primitive types, nested schemas, arrays, field metadata, optional fields, and enum constraints.
 * Provides lazy validation and direct JSON serialization capabilities.
 *
 * @example
 * // Define nested schema structures
 * class Address extends Schema {
 *   street = Schema.field("", { description: "Street address" });
 *   city = Schema.field("", { description: "City name" });
 *   zip = Schema.field("", { description: "ZIP code" });
 * }
 *
 * class User extends Schema {
 *   name = Schema.field("", { description: "User's full name" });
 *   age = Schema.field(0, { description: "User's age in years" });
 *   address = Schema.field(new Address(), { description: "Home address" });
 *   email = Schema.field("", { description: "Email address", optional: true });
 * }
 *
 * // Generate JSON Schema
 * const user = new User();
 * console.log(user.toJSON());
 *
 * @example
 * // Validate and deserialize JSON data
 * const userData = {
 *   name: "Alice Cooper",
 *   age: 30,
 *   address: { street: "123 Main St", city: "Springfield", zip: "12345" }
 * };
 *
 * const user = new User();
 * const isValid = user.validate(userData);
 * if (isValid) {
 *   user.fromJSON(userData);
 *   console.log(user.name.value); // "Alice Cooper"
 * }
 *
 * @example
 * // Define schema with enum constraints
 * class Document extends Schema {
 *   status = Schema.field("draft", {
 *     description: "Document status",
 *     enum: ["draft", "published", "archived"]
 *   });
 *   priority = Schema.field(1, {
 *     description: "Priority level",
 *     enum: [1, 2, 3, 4, 5]
 *   });
 *   tags = Schema.field([""], {
 *     description: "Document tags",
 *     enum: ["bug", "feature", "docs", "test"]
 *   });
 * }
 *
 * const doc = new Document();
 * doc.validate({ status: "published", priority: 3, tags: ["feature", "docs"] }); // true
 * doc.validate({ status: "invalid", priority: 99, tags: [] }); // false
 *
 * @example
 * // Define arrays with explicit items type
 * class Task extends Schema {
 *   tags = Schema.field([], {
 *     description: "Task tags",
 *     items: String,
 *     enum: ["urgent", "normal", "low"]
 *   });
 *   scores = Schema.field([], {
 *     description: "Task scores",
 *     items: Number
 *   });
 *   flags = Schema.field([], {
 *     description: "Boolean flags",
 *     items: Boolean
 *   });
 *   users = Schema.field([], {
 *     description: "Assigned users",
 *     items: new User()
 *   });
 * }
 */
export class Schema {
  /**
   * Serialize the schema definition to JSON Schema format.
   * Generates standard JSON Schema v4 compatible output.
   *
   * @returns {string} JSON Schema as formatted string
   */
  toJSON() {
    return JSON.stringify(this.#buildSchema(this), null, 2);
  }

  /**
   * Deserialize JSON data into schema instance fields.
   * Validates structure and types while populating field values.
   *
   * @param {object | string} json - JSON data to deserialize
   * @throws {Error} Missing required fields or type mismatches
   */
  fromJSON(json) {
    const data = typeof json === "string" ? JSON.parse(json) : json;
    // Validate first to ensure enum constraints are checked
    this.#validateJson(this, data);
    this.#populateFromJson(this, data);
  }

  /**
   * Validate JSON data against schema without modification.
   * Non-destructive validation for data integrity checking.
   *
   * @param {object | string} json - JSON data to validate
   * @returns {boolean} True if data matches schema structure
   */
  validate(json) {
    try {
      const data = typeof json === "string" ? JSON.parse(json) : json;
      this.#validateJson(this, data);
      return true;
    } catch (_error) {
      // Silent validation failure - caller checks boolean result
      return false;
    }
  }

  /**
   * Build JSON Schema object from instance field definitions.
   * Introspects class properties to generate schema structure.
   *
   * @param {Schema} instance - Schema instance to analyze
   * @returns {JsonSchemaObject} JSON Schema object
   */
  #buildSchema(instance) {
    /** @type {JsonSchemaObject} */
    const schema = { type: "object", properties: {}, required: [] };

    for (const [key, field] of Object.entries(instance)) {
      let fieldSchema;
      let isOptional = false;
      let description = "";
      let enumValues;

      // Handle fields with metadata vs plain values
      if (field?.metadata) {
        isOptional = field.metadata.optional || false;
        description = field.metadata.description || "";
        enumValues = field.metadata.enum;
        fieldSchema = this.#getFieldSchema(field.value, field.metadata);
      } else {
        fieldSchema = this.#getFieldSchema(field);
      }

      schema.properties[key] = { ...fieldSchema };
      if (description) {
        schema.properties[key].description = description;
      }
      if (enumValues !== undefined) {
        schema.properties[key].enum = enumValues;
      }

      if (!isOptional) {
        schema.required.push(key);
      }
    }

    return schema;
  }

  /**
   * Generate schema definition for individual field types.
   * Handles primitives, nested schemas, and arrays recursively.
   *
   * @param {SchemaField} field - Field to analyze
   * @param {FieldMetadata} [metadata] - Optional field metadata with items type
   * @returns {object} Field schema definition
   */
  #getFieldSchema(field, metadata) {
    if (field instanceof Schema) {
      return this.#buildSchema(field);
    }
    if (Array.isArray(field)) {
      // Use metadata.items if present, otherwise fallback to field[0]
      const arrayItem = metadata?.items !== undefined ? metadata.items : field[0];
      const itemSchema =
        arrayItem instanceof Schema ? this.#buildSchema(arrayItem) : { type: this.#getTypeString(arrayItem) };
      return {
        type: "array",
        items: itemSchema,
      };
    }
    return { type: typeof field };
  }

  /**
   * Convert value or constructor to JSON Schema type string.
   * Maps native constructors and primitive values to their type names.
   *
   * @param {PrimitiveType | PrimitiveConstructor} value - Value or constructor
   * @returns {string} JSON Schema type string
   */
  #getTypeString(value) {
    if (value === String) return "string";
    if (value === Number) return "number";
    if (value === Boolean) return "boolean";
    return typeof value;
  }

  /**
   * Normalize constructor to primitive value for validation.
   * Converts String/Number/Boolean constructors to sample primitive values.
   *
   * @param {PrimitiveType | PrimitiveConstructor | Schema} value - Value or constructor
   * @returns {SchemaField} Normalized value (constructor converted to primitive)
   */
  #normalizeToPrimitive(value) {
    if (value === String) return "";
    if (value === Number) return 0;
    if (value === Boolean) return false;
    return /** @type {SchemaField} */ (value);
  }

  /**
   * Populate instance fields from validated JSON data.
   * Handles nested schemas and type conversion during assignment.
   *
   * @param {Schema} instance - Target schema instance
   * @param {Record<string, any>} jsonData - Source JSON data
   * @throws {Error} Missing required fields or validation failures
   */
  #populateFromJson(instance, jsonData) {
    for (const [key, field] of Object.entries(instance)) {
      if (field?.metadata) {
        if (jsonData[key] === undefined) {
          if (!field.metadata.optional) {
            throw new Error(`Missing required property: ${key}`);
          }
          // Keep existing default value for optional fields
        } else {
          field.value = this.#deserializeField(field.value, jsonData[key], field.metadata.items);
        }
      } else {
        if (jsonData[key] === undefined) {
          throw new Error(`Missing required property: ${key}`);
        }
        instance[/** @type {keyof instance} */ (key)] = this.#deserializeField(field, jsonData[key]);
      }
    }
  }

  /**
   * Validate JSON data structure against schema definition.
   * Comprehensive type and structure validation with detailed error messages.
   *
   * @param {Schema} instance - Schema definition to validate against
   * @param {Record<string, any>} jsonData - JSON data to validate
   * @throws {Error} Detailed validation failure messages
   */
  #validateJson(instance, jsonData) {
    for (const [key, field] of Object.entries(instance)) {
      const value = jsonData[key];
      if (field?.metadata) {
        if (!field.metadata.optional && value === undefined) {
          throw new Error(`Missing required property: ${key}`);
        }
        if (value !== undefined) {
          this.#validateField(field.value, value, key, field.metadata.enum, field.metadata.items);
        }
      } else {
        if (value === undefined) {
          throw new Error(`Missing required property: ${key}`);
        }
        this.#validateField(field, value, key);
      }
    }
  }

  /**
   * Validate individual field value against expected type.
   * Recursive validation for nested schemas and arrays.
   *
   * @param {SchemaField} field - Expected field definition
   * @param {any} value - Actual value to validate
   * @param {string} key - Field name for error context
   * @param {Array<any>} [enumValues] - Optional enum constraint for value validation
   * @param {PrimitiveType | PrimitiveConstructor | Schema} [items] - Optional array items type
   * @throws {Error} Type mismatch or structure validation errors
   */
  #validateField(field, value, key, enumValues, items) {
    if (field instanceof Schema) {
      if (typeof value !== "object" || value === null) {
        throw new Error(`Invalid type for ${key}: expected object`);
      }
      // Recursively validate nested schema
      field.#validateJson(field, value);
    } else if (Array.isArray(field)) {
      if (!Array.isArray(value)) {
        throw new Error(`Invalid type for ${key}: expected array`);
      }
      // Use items if present, otherwise fallback to field[0]
      const arrayItem = items !== undefined ? items : field[0];
      // Normalize constructors to primitives for validation
      const normalizedItem = this.#normalizeToPrimitive(arrayItem);
      value.forEach((item, index) => {
        this.#validateField(normalizedItem, item, `${key}[${index}]`, enumValues);
      });
    } else if (value !== undefined && typeof value !== typeof field) {
      throw new Error(`Invalid type for ${key}: expected ${typeof field}, got ${typeof value}`);
    }

    // Validate enum constraint after type validation
    if (enumValues !== undefined && value !== undefined) {
      // For arrays, validate each item; for primitives, validate the value
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (!enumValues.includes(item)) {
            throw new Error(
              `Invalid enum value for ${key}[${index}]: ${JSON.stringify(item)} not in ${JSON.stringify(enumValues)}`
            );
          }
        });
      } else {
        if (!enumValues.includes(value)) {
          throw new Error(
            `Invalid enum value for ${key}: ${JSON.stringify(value)} not in ${JSON.stringify(enumValues)}`
          );
        }
      }
    }
  }

  /**
   * Deserialize field value with appropriate type conversion.
   * Handles nested schema instantiation and array processing.
   *
   * @param {SchemaField} field - Field type definition
   * @param {any} value - Value to deserialize
   * @param {PrimitiveType | PrimitiveConstructor | Schema} [items] - Optional array items type
   * @returns {any} Deserialized value with correct types
   */
  #deserializeField(field, value, items) {
    if (field instanceof Schema) {
      const NestedSchemaConstructor = /** @type {new () => Schema} */ (field.constructor);
      const nestedInstance = new NestedSchemaConstructor();
      nestedInstance.fromJSON(value);
      return nestedInstance;
    }
    if (Array.isArray(field)) {
      // Use items if present, otherwise fallback to field[0]
      const arrayItem = items !== undefined ? items : field[0];
      // Normalize constructors to primitives for deserialization
      const normalizedItem = this.#normalizeToPrimitive(arrayItem);
      return value.map((/** @type {any} */ item) =>
        normalizedItem instanceof Schema ? this.#deserializeField(normalizedItem, item) : item
      );
    }
    return value;
  }

  /**
   * Create schema field with metadata and validation rules.
   * Factory method for defining typed fields with descriptions and constraints.
   *
   * @template T
   * @param {T} value - Default value and type inference
   * @param {object} [options] - Field configuration options
   * @param {string} [options.description] - Human-readable field description
   * @param {boolean} [options.optional=false] - Whether field is optional
   * @param {Array<any>} [options.enum] - Array of allowed values for enum validation
   * @param {PrimitiveType | PrimitiveConstructor | Schema} [options.items] - Array item type (for arrays)
   * @returns {{ value: T, metadata: FieldMetadata }} Field with metadata
   */
  static field(value, { description = "", optional = false, enum: enumValues, items } = {}) {
    /** @type {FieldMetadata} */
    const metadata = { description, optional };
    if (enumValues !== undefined) {
      metadata.enum = enumValues;
    }
    if (items !== undefined) {
      metadata.items = items;
    }
    return { value, metadata };
  }
}
