/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Type-safe JSON Schema implementation for data structure validation
 *
 * Memory patterns for structured information - how the brain remembers and validates
 * data organization. Zero-dependency schema definition, validation, and serialization
 * using vanilla JavaScript classes with metadata support.
 *
 * Ravens remember data structure patterns across generations of development.
 */

/**
 * @typedef {string | number | boolean} PrimitiveType
 * @typedef {PrimitiveType | Schema | Array<PrimitiveType | Schema>} SchemaField
 */

/**
 * @typedef {Object} JsonSchemaObject
 * @property {string} type
 * @property {Object<string, any>} properties
 * @property {string[]} required
 */

/**
 * Type-safe JSON schema base class for data structure validation.
 *
 * Institutional memory for data patterns - enables compile-time safety in vanilla JS
 * through JSDoc typing and runtime validation. Supports primitive types, nested schemas,
 * arrays, and field metadata (descriptions, optional fields).
 *
 * PERFORMANCE CHARACTERISTICS:
 * - Zero external dependencies - pure V8 optimization
 * - Lazy validation - only validates when explicitly called
 * - Memory-efficient field metadata storage
 * - Direct JSON serialization without intermediate objects
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

			// Handle fields with metadata vs plain values
			if (field?.metadata) {
				isOptional = field.metadata.optional || false;
				description = field.metadata.description || "";
				fieldSchema = this.#getFieldSchema(field.value);
			} else {
				fieldSchema = this.#getFieldSchema(field);
			}

			schema.properties[key] = { ...fieldSchema };
			if (description) {
				schema.properties[key].description = description;
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
	 * @returns {object} Field schema definition
	 */
	#getFieldSchema(field) {
		if (field instanceof Schema) {
			return this.#buildSchema(field);
		}
		if (Array.isArray(field)) {
			const arrayItem = field[0];
			return {
				type: "array",
				items:
					arrayItem instanceof Schema
						? this.#buildSchema(arrayItem)
						: { type: typeof arrayItem },
			};
		}
		return { type: typeof field };
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
					field.value = this.#deserializeField(field.value, jsonData[key]);
				}
			} else {
				if (jsonData[key] === undefined) {
					throw new Error(`Missing required property: ${key}`);
				}
				instance[/** @type {keyof instance} */ (key)] = this.#deserializeField(
					field,
					jsonData[key],
				);
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
					this.#validateField(field.value, value, key);
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
	 * @throws {Error} Type mismatch or structure validation errors
	 */
	#validateField(field, value, key) {
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
			const arrayItem = field[0];
			value.forEach((item, index) => {
				this.#validateField(arrayItem, item, `${key}[${index}]`);
			});
		} else if (value !== undefined && typeof value !== typeof field) {
			throw new Error(
				`Invalid type for ${key}: expected ${typeof field}, got ${typeof value}`,
			);
		}
	}

	/**
	 * Deserialize field value with appropriate type conversion.
	 * Handles nested schema instantiation and array processing.
	 *
	 * @param {SchemaField} field - Field type definition
	 * @param {any} value - Value to deserialize
	 * @returns {any} Deserialized value with correct types
	 */
	#deserializeField(field, value) {
		if (field instanceof Schema) {
			const NestedSchemaConstructor = /** @type {new () => Schema} */ (
				field.constructor
			);
			const nestedInstance = new NestedSchemaConstructor();
			nestedInstance.fromJSON(value);
			return nestedInstance;
		}
		if (Array.isArray(field)) {
			const arrayItem = field[0];
			return value.map((/** @type {any} */ item) =>
				arrayItem instanceof Schema
					? this.#deserializeField(arrayItem, item)
					: item,
			);
		}
		return value !== undefined ? value : field;
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
	 * @returns {{ value: T, metadata: { description: string, optional: boolean } }} Field with metadata
	 */
	static field(value, { description = "", optional = false } = {}) {
		return { value, metadata: { description, optional } };
	}
}
