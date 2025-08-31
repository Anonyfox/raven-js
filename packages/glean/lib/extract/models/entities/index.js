/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Entity classes with registry for dynamic JavaScript construct creation.
 *
 * Exports all entity implementations and provides ENTITY_REGISTRY for
 * runtime entity instantiation by type name with factory functions.
 */

// Export base class
export { EntityBase } from "./base.js";

// Export entity classes
export { CallbackEntity } from "./callback-entity.js";
export { ClassEntity } from "./class-entity.js";
export { FunctionEntity } from "./function-entity.js";
export { MethodEntity } from "./method-entity.js";
export { NamespaceEntity } from "./namespace-entity.js";
export { PropertyEntity } from "./property-entity.js";
export { TypedefEntity } from "./typedef-entity.js";
export { VariableEntity } from "./variable-entity.js";

// Import classes for registry
import { CallbackEntity } from "./callback-entity.js";
import { ClassEntity } from "./class-entity.js";
import { FunctionEntity } from "./function-entity.js";
import { MethodEntity } from "./method-entity.js";
import { NamespaceEntity } from "./namespace-entity.js";
import { PropertyEntity } from "./property-entity.js";
import { TypedefEntity } from "./typedef-entity.js";
import { VariableEntity } from "./variable-entity.js";

/**
 * Entity registry for dynamic entity instantiation by type.
 *
 * Maps entity type names to their corresponding class constructors
 * for runtime entity creation from code analysis results.
 *
 * @type {Record<string, new(name: string, location: object) => import('./base.js').EntityBase>}
 */
export const ENTITY_REGISTRY = {
	// Core JavaScript constructs
	function: FunctionEntity,
	class: ClassEntity,
	variable: VariableEntity,
	method: MethodEntity,
	property: PropertyEntity,

	// JSDoc type constructs
	typedef: TypedefEntity,
	callback: CallbackEntity,
	namespace: NamespaceEntity,

	// Aliases for convenience
	const: VariableEntity,
	let: VariableEntity,
	var: VariableEntity,
	prop: PropertyEntity,
	type: TypedefEntity,
	ns: NamespaceEntity,
};

/**
 * Create entity instance from type and basic information
 * @param {string} entityType - Entity type (function, class, variable, etc.)
 * @param {string} name - Entity name
 * @param {Object} location - Source location metadata
 * @param {string} location.file - Relative file path
 * @param {number} location.line - Line number
 * @param {number} location.column - Column number
 * @returns {import('./base.js').EntityBase|null} Entity instance or null if unknown type
 */
export function createEntity(entityType, name, location) {
	/** @type {any} */
	const EntityClass = ENTITY_REGISTRY[entityType.toLowerCase()];
	return EntityClass ? new EntityClass(name, location) : null;
}

/**
 * Get all supported entity types
 * @returns {Array<string>} List of supported entity types
 */
export function getSupportedEntityTypes() {
	return Object.keys(ENTITY_REGISTRY);
}

/**
 * Check if entity type is supported
 * @param {string} entityType - Entity type to check
 * @returns {boolean} True if entity type is supported
 */
export function isEntityTypeSupported(entityType) {
	return entityType.toLowerCase() in ENTITY_REGISTRY;
}

/**
 * Create entity from code analysis result
 * @param {Object} codeEntity - Code entity from parser
 * @param {string} codeEntity.type - Entity type
 * @param {string} codeEntity.name - Entity name
 * @param {Object} codeEntity.location - Location metadata
 * @param {string} [sourceCode] - Source code for parsing
 * @returns {import('./base.js').EntityBase|null} Parsed entity instance
 */
export function createEntityFromCode(codeEntity, sourceCode) {
	if (!codeEntity || !codeEntity.type || !codeEntity.name) {
		return null;
	}

	const entity = createEntity(
		codeEntity.type,
		codeEntity.name,
		/** @type {{ file: string; line: number; column: number; }} */ (
			codeEntity.location
		),
	);

	if (entity && sourceCode) {
		entity.parseContent(sourceCode);
		entity.validate();
	}

	return entity;
}
