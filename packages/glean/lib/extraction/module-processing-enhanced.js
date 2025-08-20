/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Enhanced module processing with intelligent entity classes.
 *
 * Revolutionary documentation extraction using specialized entity intelligence.
 * Processes JavaScript modules to create rich entity collections with validation,
 * relationship mapping, and comprehensive metadata analysis.
 */

import { readFile } from "node:fs/promises";
import { relative } from "node:path";
import { extractCodeEntities } from "../validation/index.js";
import { buildEntityGraph } from "./entity-construction-enhanced.js";
import { generateModuleId } from "./id-generators.js";
import {
	extractModuleExports,
	extractModuleImports,
} from "./module-relationships.js";

/**
 * Extract enhanced module data and entity collections from a JavaScript file
 * @param {string} filePath - Path to JavaScript file
 * @param {string} packagePath - Package root path
 * @returns {Promise<EnhancedModuleResult>} Complete module and entity data
 */
export async function extractEnhancedModuleData(filePath, packagePath) {
	const content = await readFile(filePath, "utf-8");
	const lines = content.split("\n");
	const relativePath = relative(packagePath, filePath);

	// Create module data
	const moduleId = generateModuleId(filePath, packagePath);
	const module = {
		id: moduleId,
		path: relativePath,
		exports: extractModuleExports(content),
		imports: extractModuleImports(content),
	};

	// Extract basic code entities from the file
	const codeEntities = extractCodeEntities(content);

	// Build complete entity graph with specialized instances
	const entityGraph = await buildEntityGraph(
		codeEntities,
		content,
		lines,
		filePath,
		packagePath,
		moduleId,
	);

	// Calculate summary statistics
	const summary = calculateModuleSummary(entityGraph);

	return {
		module,
		...entityGraph,
		summary,
	};
}

/**
 * Calculate summary statistics for a module's entity collection
 * @param {Object} entityGraph - Entity graph with entities, methods, properties, typedefs
 * @returns {ModuleSummary} Summary statistics
 */
function calculateModuleSummary(entityGraph) {
	const { entities, methods, properties, typedefs } = /** @type {any} */ (
		entityGraph
	);

	// Count entities by type
	const entityCounts = {
		functions: 0,
		classes: 0,
		variables: 0,
		methods: methods.length,
		properties: properties.length,
		typedefs: typedefs.length,
	};

	for (const entity of entities) {
		switch (entity.entityType) {
			case "function":
				entityCounts.functions++;
				break;
			case "class":
				entityCounts.classes++;
				break;
			case "variable":
				entityCounts.variables++;
				break;
		}
	}

	// Count validation issues
	let totalValidationIssues = 0;
	const validationSummary = {
		entitiesWithIssues: 0,
		commonIssueTypes: new Map(),
	};

	for (const entity of [...entities, ...methods, ...properties, ...typedefs]) {
		if (entity.validationIssues && entity.validationIssues.length > 0) {
			validationSummary.entitiesWithIssues++;
			totalValidationIssues += entity.validationIssues.length;

			for (const issue of entity.validationIssues) {
				const count = validationSummary.commonIssueTypes.get(issue.type) || 0;
				validationSummary.commonIssueTypes.set(issue.type, count + 1);
			}
		}
	}

	// Calculate JSDoc coverage
	let entitiesWithJSDoc = 0;
	for (const entity of [...entities, ...methods, ...properties]) {
		if (entity.getAllJSDocTags().length > 0) {
			entitiesWithJSDoc++;
		}
	}

	const totalDocumentableEntities =
		entities.length + methods.length + properties.length;
	const jsdocCoverage =
		totalDocumentableEntities > 0
			? (entitiesWithJSDoc / totalDocumentableEntities) * 100
			: 0;

	return {
		entityCounts,
		totalEntities:
			entities.length + methods.length + properties.length + typedefs.length,
		validationSummary: {
			...validationSummary,
			totalIssues: totalValidationIssues,
			commonIssueTypes: Object.fromEntries(validationSummary.commonIssueTypes),
		},
		jsdocCoverage: Math.round(jsdocCoverage * 100) / 100, // Round to 2 decimal places
		complexity: calculateComplexityScore(entityGraph),
	};
}

/**
 * Calculate a complexity score for the module based on entity characteristics
 * @param {Object} entityGraph - Entity graph with entities, methods, properties, typedefs
 * @returns {number} Complexity score (0-100)
 */
function calculateComplexityScore(entityGraph) {
	const { entities, methods, properties } = /** @type {any} */ (entityGraph);
	let complexityPoints = 0;

	// Base points for entity counts
	complexityPoints += entities.length * 2;
	complexityPoints += methods.length * 1.5;
	complexityPoints += properties.length * 1;

	// Additional points for complex entities
	for (const entity of entities) {
		if (entity.entityType === "function") {
			// Complex functions have many parameters
			complexityPoints += Math.min(entity.parameters?.length || 0, 5);

			// Async and generator functions are more complex
			if (entity.isAsync) complexityPoints += 2;
			if (entity.isGenerator) complexityPoints += 2;
		} else if (entity.entityType === "class") {
			// Classes with inheritance are more complex
			if (entity.extendsClass) complexityPoints += 3;

			// Many methods/properties increase complexity
			complexityPoints += Math.min((entity.methods?.length || 0) * 0.5, 10);
			complexityPoints += Math.min((entity.properties?.length || 0) * 0.3, 5);
		}
	}

	// Method complexity
	for (const method of methods) {
		if (method.isAsync) complexityPoints += 1;
		if (method.isGenerator) complexityPoints += 1;
		if (method.methodType === "constructor") complexityPoints += 2;
		complexityPoints += Math.min(method.parameters?.length || 0, 3) * 0.5;
	}

	// Cap at 100 and normalize
	return Math.min(Math.round(complexityPoints), 100);
}

/**
 * Extract entity relationships and references
 * @param {Object} entityGraph - Entity graph with all entities
 * @returns {EntityRelationships} Relationship mapping
 */
export function extractEntityRelationships(entityGraph) {
	const { entities, methods, properties } = /** @type {any} */ (entityGraph);
	const relationships = {
		/** @type {any[]} */
		inheritance: [],
		/** @type {any[]} */
		composition: [],
		/** @type {any[]} */
		aggregation: [],
		/** @type {any[]} */
		references: [],
	};

	// Track class inheritance
	for (const entity of entities) {
		if (entity.entityType === "class" && entity.extendsClass) {
			relationships.inheritance.push({
				child: entity.name,
				parent: entity.extendsClass,
				type: "inheritance",
			});
		}
	}

	// Track method-class relationships
	for (const method of methods) {
		if (method.parentClass) {
			relationships.composition.push({
				owner: method.parentClass,
				member: method.name,
				type: "method",
			});
		}
	}

	// Track property-class relationships
	for (const property of properties) {
		if (property.parentClass) {
			relationships.composition.push({
				owner: property.parentClass,
				member: property.name,
				type: "property",
			});
		}
	}

	return relationships;
}

/**
 * @typedef {Object} EnhancedModuleResult
 * @property {ModuleData} module - Module metadata
 * @property {import('../models/entity-base.js').EntityBase[]} entities - Main entities (functions, classes, variables)
 * @property {import('../models/method-entity.js').MethodEntity[]} methods - Class method entities
 * @property {import('../models/property-entity.js').PropertyEntity[]} properties - Class property entities
 * @property {import('../models/typedef-entity.js').TypedefEntity[]} typedefs - JSDoc typedef entities
 * @property {ModuleSummary} summary - Module analysis summary
 */

/**
 * @typedef {Object} ModuleData
 * @property {string} id - Module ID
 * @property {string} path - Relative path to module file
 * @property {string[]} exports - Exported names
 * @property {import('./module-relationships.js').ModuleImport[]} imports - Import data
 */

/**
 * @typedef {Object} ModuleSummary
 * @property {Object} entityCounts - Count of each entity type
 * @property {number} totalEntities - Total entity count
 * @property {Object} validationSummary - Validation issue summary
 * @property {number} jsdocCoverage - JSDoc coverage percentage
 * @property {number} complexity - Complexity score (0-100)
 */

/**
 * @typedef {Object} EntityRelationships
 * @property {Object[]} inheritance - Class inheritance relationships
 * @property {Object[]} composition - Class member relationships
 * @property {Object[]} aggregation - Aggregation relationships
 * @property {Object[]} references - Entity reference relationships
 */
