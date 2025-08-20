/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Quality assessment - business logic for documentation validation.
 *
 * Core validation business rules that determine documentation quality.
 * Surgical analysis of JSDoc completeness, correctness, and usefulness
 * with severity-based issue classification and quality scoring.
 */

import { findPrecedingJSDoc } from "./jsdoc-parsing.js";

/**
 * Validate JSDoc documentation for a code entity
 * @param {import('./types.js').CodeEntity} entity - Code entity to validate
 * @param {string} content - Full file content for context
 * @returns {import('./types.js').ValidationIssue[]} Array of validation issues
 */
export function validateEntity(entity, content) {
	const issues = [];
	const lines = content.split("\n");

	// Find JSDoc comment preceding the entity
	const jsDocComment = findPrecedingJSDoc(lines, entity.line - 1);

	if (!jsDocComment) {
		// Missing JSDoc entirely
		if (entity.exported) {
			issues.push({
				type: "missing_jsdoc",
				message: `Missing JSDoc for exported ${entity.type} '${entity.name}'`,
				line: entity.line,
				severity: "error",
				entity: entity.name,
			});
		} else {
			issues.push({
				type: "missing_jsdoc",
				message: `Missing JSDoc for ${entity.type} '${entity.name}'`,
				line: entity.line,
				severity: "warning",
				entity: entity.name,
			});
		}
		return issues;
	}

	// Validate JSDoc content quality
	const jsDocIssues = validateJSDocContent(jsDocComment, entity);
	issues.push(...jsDocIssues);

	return issues;
}

/**
 * Validate JSDoc comment content quality
 * @param {import('./types.js').JSDocComment} jsDoc - Parsed JSDoc comment
 * @param {import('./types.js').CodeEntity} entity - Code entity being documented
 * @returns {import('./types.js').ValidationIssue[]} Array of validation issues
 */
export function validateJSDocContent(jsDoc, entity) {
	const issues = [];

	// Check for description
	if (!jsDoc.description || jsDoc.description.length < 10) {
		issues.push({
			type: "poor_description",
			message: `${entity.type} '${entity.name}' has insufficient description`,
			line: jsDoc.startLine,
			severity: "warning",
			entity: entity.name,
		});
	}

	// Function-specific validations
	if (entity.type === "function") {
		// Check for @param tags if function likely has parameters
		if (!jsDoc.tags.param) {
			issues.push({
				type: "missing_param_docs",
				message: `Function '${entity.name}' may need @param documentation`,
				line: jsDoc.startLine,
				severity: "info",
				entity: entity.name,
			});
		}

		// Check for @returns tag
		if (!jsDoc.tags.returns && !jsDoc.tags.return) {
			issues.push({
				type: "missing_return_docs",
				message: `Function '${entity.name}' missing @returns documentation`,
				line: jsDoc.startLine,
				severity: "info",
				entity: entity.name,
			});
		}
	}

	return issues;
}

/**
 * Calculate documentation quality score
 * @param {import('./types.js').CodeEntity[]} entities - All extracted entities
 * @param {import('./types.js').ValidationIssue[]} issues - All validation issues
 * @returns {number} Quality score from 0-100
 */
export function calculateQualityScore(entities, issues) {
	if (entities.length === 0) return 100; // No entities to document

	const errorCount = issues.filter((i) => i.severity === "error").length;
	const warningCount = issues.filter((i) => i.severity === "warning").length;
	const infoCount = issues.filter((i) => i.severity === "info").length;

	// Scoring: errors -10, warnings -5, info -1
	const penalties = errorCount * 10 + warningCount * 5 + infoCount * 1;
	const maxPenalties = entities.length * 15; // Maximum possible penalties

	const score = Math.max(0, Math.round(100 - (penalties / maxPenalties) * 100));
	return score;
}
