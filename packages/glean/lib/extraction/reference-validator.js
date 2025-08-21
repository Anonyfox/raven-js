/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Reference validation and quality assurance for documentation graphs.
 *
 * Ravens scrutinize every connection with predatory precision.
 * This module validates reference accuracy, completeness, and consistency
 * to ensure documentation graphs are bulletproof and comprehensive.
 */

/**
 * Comprehensive reference validation results
 * @typedef {Object} ValidationResults
 * @property {boolean} isValid - Overall validation status
 * @property {number} totalReferences - Total number of references found
 * @property {number} validReferences - Number of valid references
 * @property {number} brokenReferences - Number of broken references
 * @property {Array<ValidationIssue>} issues - List of validation issues
 * @property {ValidationMetrics} metrics - Reference quality metrics
 */

/**
 * Individual validation issue
 * @typedef {Object} ValidationIssue
 * @property {string} type - Issue type (broken, orphan, circular, duplicate)
 * @property {string} severity - Issue severity (error, warning, info)
 * @property {string} sourceEntityId - Entity ID where issue originates
 * @property {string} targetEntityId - Target entity ID (if applicable)
 * @property {string} message - Human-readable issue description
 * @property {string} suggestion - Suggested fix (if available)
 */

/**
 * Reference quality metrics
 * @typedef {Object} ValidationMetrics
 * @property {number} referenceAccuracy - Percentage of accurate references
 * @property {number} referenceCompleteness - Percentage of expected references found
 * @property {number} orphanedEntities - Number of entities with no references
 * @property {number} circularReferences - Number of circular reference chains
 * @property {number} averageReferencesPerEntity - Average references per entity
 */

/**
 * Validate all references in a documentation graph with surgical precision
 * @param {import('../models/documentation-graph.js').DocumentationGraph} graph - Documentation graph to validate
 * @returns {ValidationResults} Comprehensive validation results
 */
export function validateDocumentationReferences(graph) {
	/** @type {ValidationResults} */
	const results = {
		isValid: true,
		totalReferences: 0,
		validReferences: 0,
		brokenReferences: 0,
		issues: [],
		metrics: {
			referenceAccuracy: 0,
			referenceCompleteness: 0,
			orphanedEntities: 0,
			circularReferences: 0,
			averageReferencesPerEntity: 0,
		},
	};

	// Validate reference existence and accuracy
	validateReferenceAccuracy(graph, results);

	// Check for orphaned entities
	validateOrphanedEntities(graph, results);

	// Detect circular references
	validateCircularReferences(graph, results);

	// Check reference completeness
	validateReferenceCompleteness(graph, results);

	// Calculate metrics
	calculateValidationMetrics(graph, results);

	// Determine overall validation status
	results.isValid = results.issues.every((issue) => issue.severity !== "error");

	return results;
}

/**
 * Validate that all references point to existing entities
 * @param {import('../models/documentation-graph.js').DocumentationGraph} graph - Documentation graph
 * @param {ValidationResults} results - Results to update
 */
function validateReferenceAccuracy(graph, results) {
	const entities = getEntitiesIterable(graph.entities);
	const entityIds = new Set();

	// Build set of valid entity IDs
	for (const entity of entities) {
		const entityId =
			typeof entity.getId === "function" ? entity.getId() : entity.name;
		entityIds.add(entityId);
	}

	// Check all references
	for (const entity of entities) {
		const entityId =
			typeof entity.getId === "function" ? entity.getId() : entity.name;
		const references = graph.getReferences(entityId);

		results.totalReferences += references.length;

		for (const targetId of references) {
			if (entityIds.has(targetId)) {
				results.validReferences++;
			} else {
				results.brokenReferences++;
				results.issues.push({
					type: "broken",
					severity: "error",
					sourceEntityId: entityId,
					targetEntityId: targetId,
					message: `Broken reference: ${entityId} -> ${targetId}`,
					suggestion:
						"Check entity ID spelling and ensure target entity exists",
				});
			}
		}
	}
}

/**
 * Identify entities with no incoming or outgoing references
 * @param {import('../models/documentation-graph.js').DocumentationGraph} graph - Documentation graph
 * @param {ValidationResults} results - Results to update
 */
function validateOrphanedEntities(graph, results) {
	const entities = getEntitiesIterable(graph.entities);

	for (const entity of entities) {
		const entityId =
			typeof entity.getId === "function" ? entity.getId() : entity.name;
		const outgoingRefs = graph.getReferences(entityId);
		const incomingRefs = graph.getReferencedBy(entityId);

		if (outgoingRefs.length === 0 && incomingRefs.length === 0) {
			results.metrics.orphanedEntities++;
			results.issues.push({
				type: "orphan",
				severity: "warning",
				sourceEntityId: entityId,
				targetEntityId: null,
				message: `Orphaned entity: ${entityId} has no references`,
				suggestion: "Add JSDoc references or verify entity is needed",
			});
		}
	}
}

/**
 * Detect circular reference chains
 * @param {import('../models/documentation-graph.js').DocumentationGraph} graph - Documentation graph
 * @param {ValidationResults} results - Results to update
 */
function validateCircularReferences(graph, results) {
	const entities = getEntitiesIterable(graph.entities);
	const visited = new Set();
	const recursionStack = new Set();

	for (const entity of entities) {
		const entityId =
			typeof entity.getId === "function" ? entity.getId() : entity.name;
		if (!visited.has(entityId)) {
			const cycle = detectCircularPath(
				graph,
				entityId,
				visited,
				recursionStack,
				[],
			);
			if (cycle.length > 0) {
				results.metrics.circularReferences++;
				results.issues.push({
					type: "circular",
					severity: "info",
					sourceEntityId: cycle[0],
					targetEntityId: cycle[cycle.length - 1],
					message: `Circular reference chain: ${cycle.join(" -> ")}`,
					suggestion: "Circular references are normal but verify intentional",
				});
			}
		}
	}
}

/**
 * Detect circular reference path using DFS
 * @param {import('../models/documentation-graph.js').DocumentationGraph} graph - Documentation graph
 * @param {string} entityId - Current entity ID
 * @param {Set<string>} visited - Visited entities
 * @param {Set<string>} recursionStack - Current recursion stack
 * @param {string[]} path - Current path
 * @returns {string[]} Circular path if found, empty array otherwise
 */
function detectCircularPath(graph, entityId, visited, recursionStack, path) {
	visited.add(entityId);
	recursionStack.add(entityId);
	path.push(entityId);

	const references = graph.getReferences(entityId);
	for (const targetId of references) {
		if (recursionStack.has(targetId)) {
			// Found cycle - return the path
			const cycleStartIndex = path.indexOf(targetId);
			return path.slice(cycleStartIndex).concat([targetId]);
		}

		if (!visited.has(targetId)) {
			const cycle = detectCircularPath(
				graph,
				targetId,
				visited,
				recursionStack,
				[...path],
			);
			if (cycle.length > 0) {
				return cycle;
			}
		}
	}

	recursionStack.delete(entityId);
	return [];
}

/**
 * Validate reference completeness against expected patterns
 * @param {import('../models/documentation-graph.js').DocumentationGraph} graph - Documentation graph
 * @param {ValidationResults} results - Results to update
 */
function validateReferenceCompleteness(graph, results) {
	const entities = getEntitiesIterable(graph.entities);

	for (const entity of entities) {
		if (typeof entity.getAllJSDocTags !== "function") continue;

		const entityId =
			typeof entity.getId === "function" ? entity.getId() : entity.name;
		const jsdocTags = entity.getAllJSDocTags();
		const references = graph.getReferences(entityId);

		// Check if @see tags have corresponding references
		const seeTags = jsdocTags.filter(
			/** @param {any} tag */ (tag) => tag.tagType === "see",
		);
		for (const seeTag of seeTags) {
			const seeReference = /** @type {any} */ (seeTag).reference;
			if (seeReference && !isExternalReference(seeReference)) {
				const hasReference = references.some((ref) =>
					ref.includes(extractEntityNameFromReference(seeReference)),
				);
				if (!hasReference) {
					results.issues.push({
						type: "incomplete",
						severity: "warning",
						sourceEntityId: entityId,
						targetEntityId: seeReference,
						message: `Missing reference for @see tag: ${seeReference}`,
						suggestion: "Verify entity exists or update reference",
					});
				}
			}
		}

		// Check if @param type references exist
		const paramTags = jsdocTags.filter(
			/** @param {any} tag */ (tag) => tag.tagType === "param",
		);
		for (const paramTag of paramTags) {
			const paramType = /** @type {any} */ (paramTag).type;
			if (paramType && containsCustomType(paramType)) {
				const typeNames = extractTypeNames(paramType);
				for (const typeName of typeNames) {
					const hasReference = references.some((ref) =>
						ref.includes(typeName.toLowerCase()),
					);
					if (!hasReference) {
						results.issues.push({
							type: "incomplete",
							severity: "info",
							sourceEntityId: entityId,
							targetEntityId: typeName,
							message: `Missing reference for @param type: ${typeName}`,
							suggestion: "Check if type should be linked to entity",
						});
					}
				}
			}
		}
	}
}

/**
 * Calculate reference quality metrics
 * @param {import('../models/documentation-graph.js').DocumentationGraph} graph - Documentation graph
 * @param {ValidationResults} results - Results to update
 */
function calculateValidationMetrics(graph, results) {
	const entities = getEntitiesIterable(graph.entities);
	const entityCount = Array.from(entities).length;

	// Calculate accuracy
	if (results.totalReferences > 0) {
		results.metrics.referenceAccuracy =
			(results.validReferences / results.totalReferences) * 100;
	}

	// Calculate completeness (based on expected vs actual references)
	const expectedReferences = countExpectedReferences(graph);
	if (expectedReferences > 0) {
		results.metrics.referenceCompleteness =
			(results.validReferences / expectedReferences) * 100;
	}

	// Calculate average references per entity
	if (entityCount > 0) {
		results.metrics.averageReferencesPerEntity =
			results.totalReferences / entityCount;
	}
}

/**
 * Count expected references based on JSDoc annotations
 * @param {import('../models/documentation-graph.js').DocumentationGraph} graph - Documentation graph
 * @returns {number} Expected reference count
 */
function countExpectedReferences(graph) {
	const entities = getEntitiesIterable(graph.entities);
	let expectedCount = 0;

	for (const entity of entities) {
		if (typeof entity.getAllJSDocTags !== "function") continue;

		const jsdocTags = entity.getAllJSDocTags();
		for (const tag of jsdocTags) {
			if (
				tag.tagType === "see" ||
				tag.tagType === "param" ||
				tag.tagType === "returns"
			) {
				const content =
					/** @type {any} */ (tag).reference || /** @type {any} */ (tag).type;
				if (content && containsCustomType(content)) {
					expectedCount += extractTypeNames(content).length;
				}
			}
		}
	}

	return expectedCount;
}

/**
 * Check if reference is external (URL, module, etc.)
 * @param {string} reference - Reference string
 * @returns {boolean} True if external reference
 */
function isExternalReference(reference) {
	return (
		/^https?:\/\//.test(reference) ||
		/^module:/.test(reference) ||
		reference.includes("@link http")
	);
}

/**
 * Extract entity name from JSDoc reference
 * @param {string} reference - JSDoc reference string
 * @returns {string} Extracted entity name
 */
function extractEntityNameFromReference(reference) {
	// Handle {@link EntityName} format
	const linkMatch = reference.match(/\{@link\s+([^}|]+)/);
	if (linkMatch) {
		return linkMatch[1].split(".")[0];
	}

	// Handle plain reference
	return reference.split(".")[0].split("#")[0];
}

/**
 * Check if type string contains custom types (not built-ins)
 * @param {string} typeString - Type string to check
 * @returns {boolean} True if contains custom types
 */
function containsCustomType(typeString) {
	const builtinTypes =
		/\b(string|number|boolean|object|function|undefined|null|Array|Object|Function|Date|RegExp|Error|Promise|Map|Set|WeakMap|WeakSet|Symbol|BigInt|any|unknown|void|never)\b/g;
	const withoutBuiltins = typeString.replace(builtinTypes, "");
	return /\b[A-Z][a-zA-Z0-9_]*\b/.test(withoutBuiltins);
}

/**
 * Extract custom type names from type string
 * @param {string} typeString - Type string
 * @returns {string[]} Array of custom type names
 */
function extractTypeNames(typeString) {
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
	]);

	const typeMatches = typeString.match(/\b[A-Z][a-zA-Z0-9_]*\b/g) || [];
	return typeMatches.filter((type) => !builtinTypes.has(type));
}

/**
 * Get iterable from either Map or plain object (compatibility helper)
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
 * Generate human-readable validation report
 * @param {ValidationResults} results - Validation results
 * @returns {string} Formatted validation report
 */
export function generateValidationReport(results) {
	const report = [];

	report.push("🦅 Reference Validation Report");
	report.push("=".repeat(40));
	report.push("");

	// Summary
	report.push("📊 Summary:");
	report.push(`   Status: ${results.isValid ? "✅ PASSED" : "❌ FAILED"}`);
	report.push(`   Total References: ${results.totalReferences}`);
	report.push(`   Valid References: ${results.validReferences}`);
	report.push(`   Broken References: ${results.brokenReferences}`);
	report.push("");

	// Metrics
	report.push("📈 Quality Metrics:");
	report.push(
		`   Reference Accuracy: ${results.metrics.referenceAccuracy.toFixed(1)}%`,
	);
	report.push(
		`   Reference Completeness: ${results.metrics.referenceCompleteness.toFixed(1)}%`,
	);
	report.push(`   Orphaned Entities: ${results.metrics.orphanedEntities}`);
	report.push(`   Circular References: ${results.metrics.circularReferences}`);
	report.push(
		`   Avg References/Entity: ${results.metrics.averageReferencesPerEntity.toFixed(1)}`,
	);
	report.push("");

	// Issues
	if (results.issues.length > 0) {
		report.push("⚠️  Issues Found:");
		const errorCount = results.issues.filter(
			(i) => i.severity === "error",
		).length;
		const warningCount = results.issues.filter(
			(i) => i.severity === "warning",
		).length;
		const infoCount = results.issues.filter(
			(i) => i.severity === "info",
		).length;

		report.push(`   Errors: ${errorCount}`);
		report.push(`   Warnings: ${warningCount}`);
		report.push(`   Info: ${infoCount}`);
		report.push("");

		// List issues by severity
		for (const severity of ["error", "warning", "info"]) {
			const severityIssues = results.issues.filter(
				(i) => i.severity === severity,
			);
			if (severityIssues.length > 0) {
				const icon =
					severity === "error" ? "❌" : severity === "warning" ? "⚠️" : "ℹ️";
				report.push(`${icon} ${severity.toUpperCase()}S:`);
				for (const issue of severityIssues) {
					report.push(`   • ${issue.message}`);
					if (issue.suggestion) {
						report.push(`     💡 ${issue.suggestion}`);
					}
				}
				report.push("");
			}
		}
	} else {
		report.push("✅ No issues found!");
	}

	return report.join("\n");
}
