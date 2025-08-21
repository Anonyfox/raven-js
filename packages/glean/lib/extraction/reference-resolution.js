/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Reference resolution engine for cross-entity relationships.
 *
 * Ravens track every connection in the ecosystem with surgical precision.
 * This module implements the core intelligence for resolving JSDoc references,
 * import/export relationships, and type connections across the documentation graph.
 */

import {
	extractModuleExports,
	extractModuleImports,
} from "./module-relationships.js";

/**
 * Build cross-references between entities with predatory precision
 * @param {import('../models/documentation-graph.js').DocumentationGraph} graph - Documentation graph
 */
export function buildEntityReferences(graph) {
	// Phase 1: Symbol table construction for O(1) lookups
	const symbolTable = buildSymbolTable(graph);

	// Phase 2: JSDoc reference resolution
	resolveJSDocReferences(graph, symbolTable);

	// Phase 3: Import/export relationship mapping
	resolveImportExportReferences(graph, symbolTable);

	// Phase 4: Type reference resolution
	resolveTypeReferences(graph, symbolTable);
}

/**
 * Build symbol table for fast entity lookups
 * @param {import('../models/documentation-graph.js').DocumentationGraph} graph - Documentation graph
 * @returns {Map<string, import('../models/entity-base.js').EntityBase>} Symbol table
 */
function buildSymbolTable(graph) {
	const symbolTable = new Map();

	// Handle both Map objects (production) and plain objects (tests)
	const entities = getEntitiesIterable(graph.entities);

	// Index entities by ID for direct lookups
	for (const entity of entities) {
		const entityId =
			typeof entity.getId === "function" ? entity.getId() : entity.name;
		symbolTable.set(entityId, entity);

		// Also index by name for name-based lookups
		const entityName = entity.name;
		if (entityName && entityName !== entityId) {
			// Use module-qualified names to avoid conflicts
			const moduleId = entity.moduleId || "unknown";
			const qualifiedName = `${moduleId}/${entityName}`;
			symbolTable.set(qualifiedName, entity);

			// Also store unqualified name (will be overwritten by conflicts)
			symbolTable.set(entityName, entity);
		}
	}

	return symbolTable;
}

/**
 * Get iterable of entities from either Map or plain object
 * @param {Map<string, any>|Object|undefined|null} entities - Entities container
 * @returns {Iterable<any>} Iterable of entity values
 */
function getEntitiesIterable(entities) {
	// Handle null/undefined cases first
	if (!entities) {
		return [];
	}

	// Check if it's a Map (production DocumentationGraph)
	if (typeof (/** @type {any} */ (entities).values) === "function") {
		return /** @type {any} */ (entities).values();
	}

	// Handle plain object (test mocks)
	if (typeof entities === "object") {
		return Object.values(entities);
	}

	// Fallback for unexpected types
	return [];
}

/**
 * Resolve JSDoc @see references to actual entities
 * @param {import('../models/documentation-graph.js').DocumentationGraph} graph - Documentation graph
 * @param {Map<string, import('../models/entity-base.js').EntityBase>} symbolTable - Symbol lookup table
 */
function resolveJSDocReferences(graph, symbolTable) {
	const entities = getEntitiesIterable(graph.entities);
	for (const entity of entities) {
		const entityId =
			typeof entity.getId === "function" ? entity.getId() : entity.name;

		// Check if entity has JSDoc tags (using correct pattern)
		if (typeof entity.getAllJSDocTags !== "function") {
			continue;
		}

		const jsdocTags = entity.getAllJSDocTags();
		if (!jsdocTags || jsdocTags.length === 0) {
			continue;
		}

		// Process @see tags
		const seeTags = jsdocTags.filter(
			/** @param {any} tag */ (tag) => tag.tagType === "see",
		);
		for (const seeTag of seeTags) {
			// Cast to specific tag type to access properties
			const referenceString = /** @type {any} */ (seeTag).reference;
			if (!referenceString) continue;

			// Parse different @see reference formats
			const targetEntityId = parseJSDocReference(referenceString, symbolTable);
			if (targetEntityId && symbolTable.has(targetEntityId)) {
				graph.addReference(entityId, targetEntityId);
			}
		}

		// Process @param type references
		const paramTags = jsdocTags.filter(
			/** @param {any} tag */ (tag) => tag.tagType === "param",
		);
		for (const paramTag of paramTags) {
			// Cast to specific tag type to access properties
			const paramType = /** @type {any} */ (paramTag).type;
			if (paramType) {
				const typeReferences = extractTypeReferences(paramType);
				for (const typeRef of typeReferences) {
					const targetEntityId = resolveTypeReference(typeRef, symbolTable);
					if (targetEntityId) {
						graph.addReference(entityId, targetEntityId);
					}
				}
			}
		}

		// Process @returns type references
		const returnsTags = jsdocTags.filter(
			/** @param {any} tag */ (tag) =>
				tag.tagType === "returns" || tag.tagType === "return",
		);
		for (const returnsTag of returnsTags) {
			// Cast to specific tag type to access properties
			const returnType = /** @type {any} */ (returnsTag).type;
			if (returnType) {
				const typeReferences = extractTypeReferences(returnType);
				for (const typeRef of typeReferences) {
					const targetEntityId = resolveTypeReference(typeRef, symbolTable);
					if (targetEntityId) {
						graph.addReference(entityId, targetEntityId);
					}
				}
			}
		}

		// Process @extends references (inheritance)
		const extendsTags = jsdocTags.filter(
			/** @param {any} tag */ (tag) => tag.tagType === "extends",
		);
		for (const extendsTag of extendsTags) {
			// Cast to specific tag type to access properties
			const referenceString = /** @type {any} */ (extendsTag).reference;
			if (referenceString) {
				const targetEntityId = resolveTypeReference(
					referenceString,
					symbolTable,
				);
				if (targetEntityId) {
					graph.addReference(entityId, targetEntityId);
				}
			}
		}
	}
}

/**
 * Parse JSDoc reference string to entity ID with enhanced pattern recognition
 * @param {string} referenceString - JSDoc reference (e.g., "{@link ModuleName.functionName}")
 * @param {Map<string, import('../models/entity-base.js').EntityBase>} symbolTable - Symbol lookup table
 * @returns {string|null} Target entity ID or null
 */
function parseJSDocReference(referenceString, symbolTable) {
	if (!referenceString?.trim()) {
		return null;
	}

	const cleanRef = referenceString.trim();

	// Handle {@link ...} format (with optional description)
	const linkMatch = cleanRef.match(/\{@link\s+([^}|]+)(?:\|[^}]*)?\}/);
	if (linkMatch) {
		const linkTarget = linkMatch[1].trim();
		return resolveReferenceTarget(linkTarget, symbolTable);
	}

	// Handle module: prefix format
	if (cleanRef.startsWith("module:")) {
		const moduleRef = cleanRef.substring(7).trim();
		return resolveReferenceTarget(moduleRef, symbolTable);
	}

	// Handle quoted references - extract content
	const quotedMatch = cleanRef.match(/^["']([^"']+)["']$/);
	if (quotedMatch) {
		return resolveReferenceTarget(quotedMatch[1], symbolTable);
	}

	// Handle URL references - skip them (not entity references)
	if (/^https?:\/\//.test(cleanRef)) {
		return null;
	}

	// Handle namespace/class member references (Class#method or Class.method)
	if (cleanRef.includes("#") || cleanRef.includes(".")) {
		const memberRef = cleanRef.replace("#", ".");
		const result = resolveReferenceTarget(memberRef, symbolTable);
		if (result) return result;

		// Try without the member part (just the class/namespace)
		const parts = memberRef.split(".");
		if (parts.length > 1) {
			const baseRef = parts[0];
			return resolveReferenceTarget(baseRef, symbolTable);
		}
	}

	// Handle plain text references (assume entity name or module.entity format)
	return resolveReferenceTarget(cleanRef, symbolTable);
}

/**
 * Resolve reference target to entity ID with intelligent lookup strategies
 * @param {string} target - Reference target string
 * @param {Map<string, import('../models/entity-base.js').EntityBase>} symbolTable - Symbol lookup table
 * @returns {string|null} Entity ID or null
 */
function resolveReferenceTarget(target, symbolTable) {
	if (!target?.trim()) {
		return null;
	}

	const cleanTarget = target.trim();

	// Strategy 1: Direct lookup by exact match
	if (symbolTable.has(cleanTarget)) {
		const entity = symbolTable.get(cleanTarget);
		return typeof entity.getId === "function" ? entity.getId() : entity.name;
	}

	// Strategy 2: Module.entity format (dot notation)
	if (cleanTarget.includes(".")) {
		const parts = cleanTarget.split(".");
		const basePart = parts[0];
		const memberPart = parts.slice(1).join(".");

		// Try qualified lookup: module/entity
		const qualifiedName = `${basePart}/${memberPart}`;
		if (symbolTable.has(qualifiedName)) {
			const entity = symbolTable.get(qualifiedName);
			return typeof entity.getId === "function" ? entity.getId() : entity.name;
		}

		// Try direct member lookup
		if (symbolTable.has(memberPart)) {
			const entity = symbolTable.get(memberPart);
			return typeof entity.getId === "function" ? entity.getId() : entity.name;
		}

		// Try base part lookup (class without method)
		if (symbolTable.has(basePart)) {
			const entity = symbolTable.get(basePart);
			return typeof entity.getId === "function" ? entity.getId() : entity.name;
		}
	}

	// Strategy 3: Fuzzy matching - find entities with similar names
	const targetLower = cleanTarget.toLowerCase();
	for (const [key, entity] of symbolTable.entries()) {
		// Check if entity name matches (case-insensitive)
		const entityName = entity.name?.toLowerCase();
		if (entityName === targetLower) {
			return typeof entity.getId === "function" ? entity.getId() : entity.name;
		}

		// Check if key ends with target (for qualified names)
		if (key.toLowerCase().endsWith(`/${targetLower}`)) {
			return typeof entity.getId === "function" ? entity.getId() : entity.name;
		}
	}

	// Strategy 4: Partial matching for incomplete references
	for (const [key, entity] of symbolTable.entries()) {
		// Check if target is a substring of a qualified entity name
		if (key.toLowerCase().includes(targetLower) && key.includes("/")) {
			const parts = key.split("/");
			const entityPart = parts[parts.length - 1];
			if (entityPart.toLowerCase().includes(targetLower)) {
				return typeof entity.getId === "function"
					? entity.getId()
					: entity.name;
			}
		}
	}

	return null;
}

/**
 * Resolve import/export relationships between modules with surgical precision
 * @param {import('../models/documentation-graph.js').DocumentationGraph} graph - Documentation graph
 * @param {Map<string, import('../models/entity-base.js').EntityBase>} symbolTable - Symbol lookup table
 */
function resolveImportExportReferences(graph, symbolTable) {
	// Build module to entity mapping
	const moduleToEntities = new Map();
	const entityToModule = new Map();

	// Group entities by module
	const entities = getEntitiesIterable(graph.entities);
	for (const entity of entities) {
		const moduleId = entity.moduleId || "unknown";
		const entityId =
			typeof entity.getId === "function" ? entity.getId() : entity.name;

		if (!moduleToEntities.has(moduleId)) {
			moduleToEntities.set(moduleId, []);
		}
		moduleToEntities.get(moduleId).push(entity);
		entityToModule.set(entityId, moduleId);
	}

	// Use imported functions for module analysis
	resolveWithModuleAnalysis(
		graph,
		symbolTable,
		moduleToEntities,
		entityToModule,
		extractModuleImports,
		extractModuleExports,
	);
}

/**
 * Resolve references using module import/export analysis
 * @param {import('../models/documentation-graph.js').DocumentationGraph} graph - Documentation graph
 * @param {Map<string, import('../models/entity-base.js').EntityBase>} symbolTable - Symbol lookup table
 * @param {Map<string, any[]>} _moduleToEntities - Module to entities mapping (unused in current implementation)
 * @param {Map<string, string>} _entityToModule - Entity to module mapping (unused in current implementation)
 * @param {Function} _extractModuleImports - Import extraction function (unused - using module.imports)
 * @param {Function} _extractModuleExports - Export extraction function (unused - using module.exports)
 */
function resolveWithModuleAnalysis(
	graph,
	symbolTable,
	_moduleToEntities,
	_entityToModule,
	_extractModuleImports,
	_extractModuleExports,
) {
	// Process each module to find import/export relationships
	const modules = getEntitiesIterable(graph.modules);
	for (const module of modules) {
		const moduleId =
			typeof module.getId === "function" ? module.getId() : module.id;

		// Use existing import/export data from module entity
		const moduleImports = module.imports || [];
		const moduleExports = module.exports || [];

		// Map imported entities to their source modules
		for (const importData of moduleImports) {
			const importPath = importData.source;
			const importedNames = (importData.specifiers || []).map(
				/** @param {any} spec */ (spec) => spec.imported || spec.local,
			);

			if (!importPath || importedNames.length === 0) continue;

			// Resolve import path to module ID
			const sourceModuleId = resolveImportPath(importPath, moduleId);
			if (!sourceModuleId) continue;

			// Link imported entities
			for (const importedName of importedNames) {
				linkImportedEntity(
					graph,
					symbolTable,
					moduleId,
					sourceModuleId,
					importedName,
				);
			}
		}

		// Create export references for exported entities
		for (const exportName of moduleExports) {
			createExportReference(graph, symbolTable, moduleId, exportName);
		}
	}
}

/**
 * Resolve import path to module ID
 * @param {string} importPath - Import path from import statement
 * @param {string} currentModuleId - Current module ID
 * @returns {string|null} Resolved module ID or null
 */
function resolveImportPath(importPath, currentModuleId) {
	// Handle relative imports
	if (importPath.startsWith("./") || importPath.startsWith("../")) {
		// Simple relative path resolution (basic implementation)
		const currentParts = currentModuleId.split("/");
		const importParts = importPath.split("/");

		// Navigate up for ../ parts
		const resultParts = [...currentParts];
		resultParts.pop(); // Remove filename

		for (const part of importParts) {
			if (part === "..") {
				resultParts.pop();
			} else if (part !== ".") {
				resultParts.push(part);
			}
		}

		return resultParts.join("/");
	}

	// Handle absolute/package imports
	return importPath;
}

/**
 * Link imported entity to its source
 * @param {import('../models/documentation-graph.js').DocumentationGraph} graph - Documentation graph
 * @param {Map<string, import('../models/entity-base.js').EntityBase>} symbolTable - Symbol lookup table
 * @param {string} importingModuleId - Module doing the importing
 * @param {string} sourceModuleId - Module being imported from
 * @param {string} entityName - Name of imported entity
 */
function linkImportedEntity(
	graph,
	symbolTable,
	importingModuleId,
	sourceModuleId,
	entityName,
) {
	// Find the source entity
	const sourceEntityId = `${sourceModuleId}/${entityName}`;
	if (!symbolTable.has(sourceEntityId)) {
		// Try just the entity name
		if (!symbolTable.has(entityName)) {
			return; // Entity not found
		}
	}

	// Find entities in the importing module that might reference this import
	const importingEntities = Array.from(symbolTable.values()).filter(
		(entity) => entity.moduleId === importingModuleId,
	);

	for (const importingEntity of importingEntities) {
		const importingEntityId =
			typeof importingEntity.getId === "function"
				? importingEntity.getId()
				: importingEntity.name;

		// Create reference from importing entity to imported entity
		if (symbolTable.has(sourceEntityId)) {
			graph.addReference(importingEntityId, sourceEntityId);
		} else if (symbolTable.has(entityName)) {
			graph.addReference(importingEntityId, entityName);
		}
	}
}

/**
 * Create export reference for exported entity
 * @param {import('../models/documentation-graph.js').DocumentationGraph} _graph - Documentation graph (unused in current implementation)
 * @param {Map<string, import('../models/entity-base.js').EntityBase>} symbolTable - Symbol lookup table
 * @param {string} moduleId - Module ID
 * @param {string} exportName - Name of exported entity
 */
function createExportReference(_graph, symbolTable, moduleId, exportName) {
	const entityId = `${moduleId}/${exportName}`;

	// Mark entity as exported (metadata for later use)
	if (symbolTable.has(entityId)) {
		const entity = symbolTable.get(entityId);
		// Store export information in the entity's exports array if it exists
		if (
			entity &&
			Array.isArray(entity.exports) &&
			!entity.exports.includes("named")
		) {
			entity.exports.push("named");
		}
	}
}

/**
 * Extract type references from JSDoc type string with enhanced pattern recognition
 * @param {string} typeString - JSDoc type annotation
 * @returns {string[]} Array of type references
 */
function extractTypeReferences(typeString, depth = 0, visited = new Set()) {
	// Prevent infinite recursion with depth limit
	if (depth > 10) {
		return [];
	}

	if (!typeString?.trim()) {
		return [];
	}

	const cleanType = typeString.trim();

	// Prevent infinite loops with cycle detection
	if (visited.has(cleanType)) {
		return [];
	}
	visited.add(cleanType);

	const types = [];

	// Built-in types to exclude from references
	const builtinTypes = new Set([
		"string",
		"number",
		"boolean",
		"object",
		"function",
		"undefined",
		"null",
		"Array",
		"Object",
		"Function",
		"Date",
		"RegExp",
		"Error",
		"Promise",
		"Map",
		"Set",
		"WeakMap",
		"WeakSet",
		"Symbol",
		"BigInt",
		"any",
		"unknown",
		"void",
		"never",
		"NodeJS",
	]);

	// Handle union types: MyClass|OtherClass|string
	if (cleanType.includes("|") && !cleanType.includes("&")) {
		const unionTypes = cleanType.split("|").map((t) => t.trim());
		for (const unionType of unionTypes) {
			types.push(
				...extractTypeReferences(unionType, depth + 1, new Set(visited)),
			);
		}
		return [...new Set(types)]; // Remove duplicates
	}

	// Handle intersection types: Type1 & Type2 & Type3
	if (cleanType.includes("&")) {
		const intersectionTypes = cleanType.split("&").map((t) => t.trim());
		for (const intersectionType of intersectionTypes) {
			types.push(
				...extractTypeReferences(intersectionType, depth + 1, new Set(visited)),
			);
		}
		return [...new Set(types)]; // Remove duplicates
	}

	// Handle array types: Array<MyClass>, MyClass[], Array.<MyClass>
	const arrayMatches = cleanType.matchAll(
		/(?:Array[<.]|^)([A-Z][a-zA-Z0-9_]*)[>\].]?/g,
	);
	for (const match of arrayMatches) {
		if (!builtinTypes.has(match[1])) {
			types.push(match[1]);
		}
	}

	// Handle generic types: Promise<MyClass>, Map<string, MyClass>
	const genericMatches = cleanType.matchAll(/[A-Z][a-zA-Z0-9_]*<([^>]+)>/g);
	for (const match of genericMatches) {
		const innerTypes = match[1].split(",").map((t) => t.trim());
		for (const innerType of innerTypes) {
			types.push(
				...extractTypeReferences(innerType, depth + 1, new Set(visited)),
			);
		}
	}

	// Handle object types: {prop: MyClass, other: SomeType}
	const objectMatch = cleanType.match(/^\{([^}]+)\}$/);
	if (objectMatch) {
		const properties = objectMatch[1].split(",");
		for (const prop of properties) {
			const colonIndex = prop.indexOf(":");
			if (colonIndex > -1) {
				const propType = prop.substring(colonIndex + 1).trim();
				types.push(
					...extractTypeReferences(propType, depth + 1, new Set(visited)),
				);
			}
		}
		return [...new Set(types)];
	}

	// Handle function types: function(MyClass): OtherClass
	const functionMatch = cleanType.match(
		/^function\s*\(([^)]*)\)(?::\s*(.+))?$/,
	);
	if (functionMatch) {
		// Extract parameter types
		if (functionMatch[1]) {
			const paramTypes = functionMatch[1].split(",").map((t) => t.trim());
			for (const paramType of paramTypes) {
				types.push(
					...extractTypeReferences(paramType, depth + 1, new Set(visited)),
				);
			}
		}
		// Extract return type
		if (functionMatch[2]) {
			types.push(
				...extractTypeReferences(functionMatch[2], depth + 1, new Set(visited)),
			);
		}
		return [...new Set(types)];
	}

	// Handle module references: module:moduleName.ClassName
	if (cleanType.startsWith("module:")) {
		const moduleRef = cleanType.substring(7);
		const parts = moduleRef.split(".");
		if (parts.length > 1) {
			const className = parts[parts.length - 1];
			if (!builtinTypes.has(className)) {
				types.push(className);
			}
		}
		return types;
	}

	// Handle tuple types: [string, number, MyClass]
	const tupleMatch = cleanType.match(/^\[([^\]]+)\]$/);
	if (tupleMatch) {
		const tupleTypes = tupleMatch[1].split(",").map((t) => t.trim());
		for (const tupleType of tupleTypes) {
			types.push(
				...extractTypeReferences(tupleType, depth + 1, new Set(visited)),
			);
		}
		return [...new Set(types)];
	}

	// Handle conditional types: T extends U ? X : Y
	const conditionalMatch = cleanType.match(
		/(.+)\s+extends\s+(.+)\s*\?\s*(.+)\s*:\s*(.+)$/,
	);
	if (conditionalMatch) {
		// Extract all type components from conditional
		types.push(
			...extractTypeReferences(
				conditionalMatch[1],
				depth + 1,
				new Set(visited),
			),
		); // T
		types.push(
			...extractTypeReferences(
				conditionalMatch[2],
				depth + 1,
				new Set(visited),
			),
		); // U
		types.push(
			...extractTypeReferences(
				conditionalMatch[3],
				depth + 1,
				new Set(visited),
			),
		); // X
		types.push(
			...extractTypeReferences(
				conditionalMatch[4],
				depth + 1,
				new Set(visited),
			),
		); // Y
		return [...new Set(types)];
	}

	// Handle utility types: Partial<MyClass>, Required<T>, Record<string, MyClass>
	const utilityTypePatterns = [
		/\bPartial<([^>]+)>/g,
		/\bRequired<([^>]+)>/g,
		/\bReadonly<([^>]+)>/g,
		/\bPick<([^,>]+),\s*([^>]+)>/g,
		/\bOmit<([^,>]+),\s*([^>]+)>/g,
		/\bRecord<([^,>]+),\s*([^>]+)>/g,
		/\bExclude<([^,>]+),\s*([^>]+)>/g,
		/\bExtract<([^,>]+),\s*([^>]+)>/g,
		/\bNonNullable<([^>]+)>/g,
		/\bReturnType<([^>]+)>/g,
		/\bInstanceType<([^>]+)>/g,
	];

	for (const pattern of utilityTypePatterns) {
		const matches = [...cleanType.matchAll(pattern)];
		for (const match of matches) {
			// Extract type arguments from utility types
			for (let i = 1; i < match.length; i++) {
				if (match[i]) {
					types.push(
						...extractTypeReferences(match[i], depth + 1, new Set(visited)),
					);
				}
			}
		}
	}

	// Handle template literal types: `${string}-${MyType}`
	const templateLiteralMatch = cleanType.match(/`([^`]*)`/);
	if (templateLiteralMatch) {
		const template = templateLiteralMatch[1];
		// Extract type placeholders from template literal
		const placeholderMatches = [...template.matchAll(/\$\{([^}]+)\}/g)];
		for (const match of placeholderMatches) {
			types.push(
				...extractTypeReferences(match[1], depth + 1, new Set(visited)),
			);
		}
		return [...new Set(types)];
	}

	// Handle rest/spread types: ...MyType[]
	const restMatch = cleanType.match(/^\.\.\.(.+)$/);
	if (restMatch) {
		types.push(
			...extractTypeReferences(restMatch[1], depth + 1, new Set(visited)),
		);
		return [...new Set(types)];
	}

	// Handle keyof types: keyof MyClass
	const keyofMatch = cleanType.match(/^keyof\s+(.+)$/);
	if (keyofMatch) {
		types.push(
			...extractTypeReferences(keyofMatch[1], depth + 1, new Set(visited)),
		);
		return [...new Set(types)];
	}

	// Handle typeof types: typeof MyVariable
	const typeofMatch = cleanType.match(/^typeof\s+(.+)$/);
	if (typeofMatch) {
		types.push(
			...extractTypeReferences(typeofMatch[1], depth + 1, new Set(visited)),
		);
		return [...new Set(types)];
	}

	// Extract simple custom type names (PascalCase entities)
	const simpleTypeMatches = cleanType.match(/\b[A-Z][a-zA-Z0-9_]*\b/g) || [];
	for (const match of simpleTypeMatches) {
		if (!builtinTypes.has(match)) {
			types.push(match);
		}
	}

	return [...new Set(types)]; // Remove duplicates
}

/**
 * Resolve type reference to entity ID
 * @param {string} typeRef - Type reference string
 * @param {Map<string, import('../models/entity-base.js').EntityBase>} symbolTable - Symbol lookup table
 * @returns {string|null} Entity ID or null
 */
function resolveTypeReference(typeRef, symbolTable) {
	// Try direct lookup
	if (symbolTable.has(typeRef)) {
		const entity = symbolTable.get(typeRef);
		return typeof entity.getId === "function" ? entity.getId() : entity.name;
	}

	return null;
}

/**
 * Enhanced type reference resolution with advanced JSDoc patterns
 * @param {import('../models/documentation-graph.js').DocumentationGraph} graph - Documentation graph
 * @param {Map<string, import('../models/entity-base.js').EntityBase>} symbolTable - Symbol lookup table
 */
function resolveTypeReferences(graph, symbolTable) {
	// Enhanced type resolution for complex JSDoc patterns
	const entities = getEntitiesIterable(graph.entities);

	for (const entity of entities) {
		if (typeof entity.getAllJSDocTags !== "function") continue;

		const jsdocTags = entity.getAllJSDocTags();
		if (!jsdocTags || jsdocTags.length === 0) continue;

		const entityId =
			typeof entity.getId === "function" ? entity.getId() : entity.name;

		// Process all JSDoc tags for advanced type patterns
		for (const tag of jsdocTags) {
			// Enhanced @typedef tags with complex types
			if (tag.tagType === "typedef") {
				resolveTypedefReferences(tag, entityId, graph, symbolTable);
			}

			// Enhanced @callback tags with function signatures
			if (tag.tagType === "callback") {
				resolveCallbackTypeReferences(tag, entityId, graph, symbolTable);
			}

			// Enhanced @namespace tags with nested type resolution
			if (tag.tagType === "namespace") {
				resolveNamespaceTypeReferences(tag, entityId, graph, symbolTable);
			}

			// Enhanced @enum tags with typed values
			if (tag.tagType === "enum") {
				resolveEnumTypeReferences(tag, entityId, graph, symbolTable);
			}

			// Enhanced generic type parameters for classes and functions
			resolveGenericTypeParameters(entity, graph, symbolTable);
		}

		// Process method signatures and property types
		resolveEntityTypeSignatures(entity, graph, symbolTable);
	}
}

/**
 * Resolve JSDoc typedef complex type references
 * @param {any} typedefTag - JSDoc typedef tag instance
 * @param {string} entityId - Entity ID containing this tag
 * @param {import('../models/documentation-graph.js').DocumentationGraph} graph - Documentation graph
 * @param {Map<string, import('../models/entity-base.js').EntityBase>} symbolTable - Symbol lookup table
 */
function resolveTypedefReferences(typedefTag, entityId, graph, symbolTable) {
	// Handle @typedef with complex object type definitions
	const typedefType = /** @type {any} */ (typedefTag).type;
	if (typedefType) {
		const typeReferences = extractTypeReferences(typedefType);
		for (const typeRef of typeReferences) {
			const targetEntityId = resolveAdvancedTypeReference(typeRef, symbolTable);
			if (targetEntityId) {
				graph.addReference(entityId, targetEntityId);
			}
		}
	}

	// Handle properties in object typedef
	const properties = /** @type {any} */ (typedefTag).properties;
	if (properties && Array.isArray(properties)) {
		for (const prop of properties) {
			if (prop.type) {
				const typeReferences = extractTypeReferences(prop.type);
				for (const typeRef of typeReferences) {
					const targetEntityId = resolveAdvancedTypeReference(
						typeRef,
						symbolTable,
					);
					if (targetEntityId) {
						graph.addReference(entityId, targetEntityId);
					}
				}
			}
		}
	}
}

/**
 * Resolve JSDoc callback function signature type references
 * @param {any} callbackTag - JSDoc callback tag instance
 * @param {string} entityId - Entity ID containing this tag
 * @param {import('../models/documentation-graph.js').DocumentationGraph} graph - Documentation graph
 * @param {Map<string, import('../models/entity-base.js').EntityBase>} symbolTable - Symbol lookup table
 */
function resolveCallbackTypeReferences(
	callbackTag,
	entityId,
	graph,
	symbolTable,
) {
	// Handle callback return type
	const returnType = /** @type {any} */ (callbackTag).returnType;
	if (returnType) {
		const typeReferences = extractTypeReferences(returnType);
		for (const typeRef of typeReferences) {
			const targetEntityId = resolveAdvancedTypeReference(typeRef, symbolTable);
			if (targetEntityId) {
				graph.addReference(entityId, targetEntityId);
			}
		}
	}

	// Handle callback parameters
	const parameters = /** @type {any} */ (callbackTag).parameters;
	if (parameters && Array.isArray(parameters)) {
		for (const param of parameters) {
			if (param.type) {
				const typeReferences = extractTypeReferences(param.type);
				for (const typeRef of typeReferences) {
					const targetEntityId = resolveAdvancedTypeReference(
						typeRef,
						symbolTable,
					);
					if (targetEntityId) {
						graph.addReference(entityId, targetEntityId);
					}
				}
			}
		}
	}
}

/**
 * Resolve JSDoc namespace nested type references
 * @param {any} namespaceTag - JSDoc namespace tag instance
 * @param {string} entityId - Entity ID containing this tag
 * @param {import('../models/documentation-graph.js').DocumentationGraph} graph - Documentation graph
 * @param {Map<string, import('../models/entity-base.js').EntityBase>} symbolTable - Symbol lookup table
 */
function resolveNamespaceTypeReferences(
	namespaceTag,
	entityId,
	graph,
	symbolTable,
) {
	// Handle namespace member type references
	const members = /** @type {any} */ (namespaceTag).members;
	if (members && Array.isArray(members)) {
		for (const member of members) {
			if (member.type) {
				const typeReferences = extractTypeReferences(member.type);
				for (const typeRef of typeReferences) {
					const targetEntityId = resolveAdvancedTypeReference(
						typeRef,
						symbolTable,
					);
					if (targetEntityId) {
						graph.addReference(entityId, targetEntityId);
					}
				}
			}
		}
	}
}

/**
 * Resolve JSDoc enum typed value references
 * @param {any} enumTag - JSDoc enum tag instance
 * @param {string} entityId - Entity ID containing this tag
 * @param {import('../models/documentation-graph.js').DocumentationGraph} graph - Documentation graph
 * @param {Map<string, import('../models/entity-base.js').EntityBase>} symbolTable - Symbol lookup table
 */
function resolveEnumTypeReferences(enumTag, entityId, graph, symbolTable) {
	// Handle enum base type
	const enumType = /** @type {any} */ (enumTag).type;
	if (enumType) {
		const typeReferences = extractTypeReferences(enumType);
		for (const typeRef of typeReferences) {
			const targetEntityId = resolveAdvancedTypeReference(typeRef, symbolTable);
			if (targetEntityId) {
				graph.addReference(entityId, targetEntityId);
			}
		}
	}

	// Handle enum values with custom types
	const values = /** @type {any} */ (enumTag).values;
	if (values && Array.isArray(values)) {
		for (const value of values) {
			if (value.type) {
				const typeReferences = extractTypeReferences(value.type);
				for (const typeRef of typeReferences) {
					const targetEntityId = resolveAdvancedTypeReference(
						typeRef,
						symbolTable,
					);
					if (targetEntityId) {
						graph.addReference(entityId, targetEntityId);
					}
				}
			}
		}
	}
}

/**
 * Resolve generic type parameters for classes and functions
 * @param {any} entity - Entity with potential generic parameters
 * @param {import('../models/documentation-graph.js').DocumentationGraph} graph - Documentation graph
 * @param {Map<string, import('../models/entity-base.js').EntityBase>} symbolTable - Symbol lookup table
 */
function resolveGenericTypeParameters(entity, graph, symbolTable) {
	const entityId =
		typeof entity.getId === "function" ? entity.getId() : entity.name;

	// Handle class/function generic parameters
	const typeParameters = entity.typeParameters || entity.generics;
	if (typeParameters && Array.isArray(typeParameters)) {
		for (const typeParam of typeParameters) {
			// Handle constraints: T extends SomeClass
			if (typeParam.constraint) {
				const typeReferences = extractTypeReferences(typeParam.constraint);
				for (const typeRef of typeReferences) {
					const targetEntityId = resolveAdvancedTypeReference(
						typeRef,
						symbolTable,
					);
					if (targetEntityId) {
						graph.addReference(entityId, targetEntityId);
					}
				}
			}

			// Handle default types: T = DefaultClass
			if (typeParam.default) {
				const typeReferences = extractTypeReferences(typeParam.default);
				for (const typeRef of typeReferences) {
					const targetEntityId = resolveAdvancedTypeReference(
						typeRef,
						symbolTable,
					);
					if (targetEntityId) {
						graph.addReference(entityId, targetEntityId);
					}
				}
			}
		}
	}
}

/**
 * Resolve entity type signatures (method parameters, return types, property types)
 * @param {any} entity - Entity to process
 * @param {import('../models/documentation-graph.js').DocumentationGraph} graph - Documentation graph
 * @param {Map<string, import('../models/entity-base.js').EntityBase>} symbolTable - Symbol lookup table
 */
function resolveEntityTypeSignatures(entity, graph, symbolTable) {
	const entityId =
		typeof entity.getId === "function" ? entity.getId() : entity.name;

	// Handle function/method parameters
	if (entity.parameters && Array.isArray(entity.parameters)) {
		for (const param of entity.parameters) {
			if (param.type) {
				const typeReferences = extractTypeReferences(param.type);
				for (const typeRef of typeReferences) {
					const targetEntityId = resolveAdvancedTypeReference(
						typeRef,
						symbolTable,
					);
					if (targetEntityId) {
						graph.addReference(entityId, targetEntityId);
					}
				}
			}
		}
	}

	// Handle function/method return types
	if (entity.returnType) {
		const typeReferences = extractTypeReferences(entity.returnType);
		for (const typeRef of typeReferences) {
			const targetEntityId = resolveAdvancedTypeReference(typeRef, symbolTable);
			if (targetEntityId) {
				graph.addReference(entityId, targetEntityId);
			}
		}
	}

	// Handle class properties
	if (entity.properties && Array.isArray(entity.properties)) {
		for (const prop of entity.properties) {
			if (prop.type) {
				const typeReferences = extractTypeReferences(prop.type);
				for (const typeRef of typeReferences) {
					const targetEntityId = resolveAdvancedTypeReference(
						typeRef,
						symbolTable,
					);
					if (targetEntityId) {
						graph.addReference(entityId, targetEntityId);
					}
				}
			}
		}
	}

	// Handle class methods
	if (entity.methods && Array.isArray(entity.methods)) {
		for (const method of entity.methods) {
			// Recursively resolve method signatures
			resolveEntityTypeSignatures(method, graph, symbolTable);
		}
	}
}

/**
 * Advanced type reference resolution with enhanced lookup strategies
 * @param {string} typeRef - Type reference string
 * @param {Map<string, import('../models/entity-base.js').EntityBase>} symbolTable - Symbol lookup table
 * @returns {string|null} Entity ID or null
 */
function resolveAdvancedTypeReference(typeRef, symbolTable) {
	// Use existing resolution logic with fallback to advanced patterns
	const basicResult = resolveTypeReference(typeRef, symbolTable);
	if (basicResult) {
		return basicResult;
	}

	// Enhanced lookup for complex type patterns
	return resolveReferenceTarget(typeRef, symbolTable);
}
