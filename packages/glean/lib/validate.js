/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc validation orchestrator with comprehensive quality analysis.
 *
 * Transforms discovery and extraction models into validation reports,
 * exposing documentation inconsistencies and quality issues.
 */

import { discover } from "./discover/index.js";
import { extract } from "./extract/index.js";

/**
 * Validation issue from lib2 analysis
 * @typedef {Object} ValidationIssue
 * @property {string} type - Issue type (e.g., 'missing_jsdoc', 'param_mismatch')
 * @property {string} message - Human-readable issue description
 * @property {number} line - Line number where issue occurs
 * @property {string} severity - Issue severity ('error', 'warning', 'info')
 * @property {string} entity - Entity name where issue occurs
 * @property {string} file - File path where issue occurs
 */

/**
 * File validation result from lib2
 * @typedef {Object} FileValidationResult
 * @property {string} file - File path
 * @property {ValidationIssue[]} issues - List of validation issues
 * @property {number} score - Quality score (0-100)
 */

/**
 * Complete validation report from lib2
 * @typedef {Object} ValidationReport
 * @property {FileValidationResult[]} files - Per-file validation results
 * @property {Object} summary - Overall summary statistics
 * @property {number} summary.filesAnalyzed - Number of files analyzed
 * @property {number} summary.totalIssues - Total number of issues found
 * @property {number} summary.overallScore - Overall quality score (0-100)
 * @property {number} summary.filesWithIssues - Number of files with issues
 */

/**
 * Validate package documentation using lib2 architecture
 * @param {string} packagePath - Path to package root directory
 * @returns {ValidationReport} Comprehensive validation report
 */
export function validate(packagePath) {
	if (!packagePath || typeof packagePath !== "string") {
		throw new Error("validate() requires a valid package path");
	}

	// Discover package structure
	const discoveryPackage = discover(packagePath);

	// Extract documentation entities
	const extractPackage = extract(discoveryPackage);

	// Validate extracted package
	const validationResults = validateExtractedPackage(extractPackage);

	return validationResults;
}

/**
 * Validate extracted package and generate comprehensive report
 * @param {import('./extract/models/package.js').Package} extractPackage - Extracted package
 * @returns {ValidationReport} Validation report
 */
function validateExtractedPackage(extractPackage) {
	const fileResults = [];
	let totalIssues = 0;

	// Validate each module in the package
	for (const module of extractPackage.modules) {
		// Get unique file paths from the module
		const filePaths = getUniqueFilePaths(module);

		for (const filePath of filePaths) {
			const issues = validateModuleFile(module, filePath);
			const score = calculateFileScore(issues);

			fileResults.push({
				file: filePath,
				issues,
				score,
			});

			totalIssues += issues.length;
		}
	}

	const filesAnalyzed = fileResults.length;
	const overallScore =
		filesAnalyzed > 0
			? Math.round(
					fileResults.reduce((sum, f) => sum + f.score, 0) / filesAnalyzed,
				)
			: 100;

	return {
		files: fileResults,
		summary: {
			filesAnalyzed,
			totalIssues,
			overallScore,
			filesWithIssues: fileResults.filter((f) => f.issues.length > 0).length,
		},
	};
}

/**
 * Get unique file paths from a module
 * @param {import('./extract/models/module.js').Module} module - Module to analyze
 * @returns {string[]} Array of unique file paths
 */
function getUniqueFilePaths(module) {
	const filePaths = new Set();

	// Add entity file paths
	for (const entity of module.entities) {
		if (entity.location && /** @type {any} */ (entity.location).file) {
			filePaths.add(/** @type {any} */ (entity.location).file);
		}
	}

	return Array.from(filePaths);
}

/**
 * Validate a specific file within a module
 * @param {import('./extract/models/module.js').Module} module - Module containing the file
 * @param {string} filePath - File path to validate
 * @returns {ValidationIssue[]} Array of validation issues
 */
function validateModuleFile(module, filePath) {
	const issues = [];

	// Find entities in this file
	const entitiesInFile = module.entities.filter(
		/** @param {any} entity */ (entity) =>
			entity.location && entity.location.file === filePath,
	);

	for (const entity of entitiesInFile) {
		// Validate entity JSDoc
		issues.push(...validateEntityJSDoc(entity, filePath));

		// Validate entity structure
		issues.push(...validateEntityStructure(entity, filePath));
	}

	return issues;
}

/**
 * Validate JSDoc documentation for an entity
 * @param {any} entity - Entity to validate
 * @param {string} filePath - File path for issue reporting
 * @returns {ValidationIssue[]} Array of JSDoc validation issues
 */
function validateEntityJSDoc(entity, filePath) {
	const issues = [];

	// Check if entity has JSDoc
	if (!entity.jsdoc || entity.jsdoc.length === 0) {
		issues.push({
			type: "missing_jsdoc",
			message: `Entity '${entity.name}' is missing JSDoc documentation`,
			line: entity.location ? entity.location.line : 1,
			severity: "warning",
			entity: entity.name,
			file: filePath,
		});
		return issues;
	}

	// Validate JSDoc structure
	for (const jsdocTag of entity.jsdoc) {
		// Check for description
		if (
			jsdocTag.tag === "description" &&
			(!jsdocTag.content || jsdocTag.content.trim().length === 0)
		) {
			issues.push({
				type: "empty_description",
				message: `Entity '${entity.name}' has empty description`,
				line: entity.location ? entity.location.line : 1,
				severity: "warning",
				entity: entity.name,
				file: filePath,
			});
		}

		// Validate param tags for functions
		if (entity.type === "function" && jsdocTag.tag === "param") {
			if (!jsdocTag.name || !jsdocTag.type) {
				issues.push({
					type: "incomplete_param",
					message: `Function '${entity.name}' has incomplete @param tag`,
					line: entity.location ? entity.location.line : 1,
					severity: "error",
					entity: entity.name,
					file: filePath,
				});
			}
		}

		// Validate returns tags for functions
		if (entity.type === "function" && jsdocTag.tag === "returns") {
			if (!jsdocTag.type) {
				issues.push({
					type: "incomplete_returns",
					message: `Function '${entity.name}' has @returns tag without type`,
					line: entity.location ? entity.location.line : 1,
					severity: "error",
					entity: entity.name,
					file: filePath,
				});
			}
		}
	}

	return issues;
}

/**
 * Validate entity structure and consistency
 * @param {any} entity - Entity to validate
 * @param {string} filePath - File path for issue reporting
 * @returns {ValidationIssue[]} Array of structural validation issues
 */
function validateEntityStructure(entity, filePath) {
	const issues = [];

	// Check entity name
	if (!entity.name || entity.name.trim().length === 0) {
		issues.push({
			type: "missing_name",
			message: "Entity is missing a name",
			line: entity.location ? entity.location.line : 1,
			severity: "error",
			entity: "unknown",
			file: filePath,
		});
	}

	// Check entity type
	if (!entity.type || entity.type.trim().length === 0) {
		issues.push({
			type: "missing_type",
			message: `Entity '${entity.name}' is missing a type`,
			line: entity.location ? entity.location.line : 1,
			severity: "error",
			entity: entity.name,
			file: filePath,
		});
	}

	// Check location information
	if (!entity.location) {
		issues.push({
			type: "missing_location",
			message: `Entity '${entity.name}' is missing location information`,
			line: 1,
			severity: "warning",
			entity: entity.name,
			file: filePath,
		});
	}

	// Function-specific validation
	if (entity.type === "function") {
		// Check if function has parameters documented but no @param tags
		if (entity.parameters && entity.parameters.length > 0) {
			const paramTags = entity.jsdoc
				? entity.jsdoc.filter(
						/** @param {any} tag */ (tag) => tag.tag === "param",
					)
				: [];

			if (paramTags.length === 0) {
				issues.push({
					type: "undocumented_params",
					message: `Function '${entity.name}' has parameters but no @param documentation`,
					line: entity.location ? entity.location.line : 1,
					severity: "warning",
					entity: entity.name,
					file: filePath,
				});
			} else if (paramTags.length !== entity.parameters.length) {
				issues.push({
					type: "param_count_mismatch",
					message: `Function '${entity.name}' has ${entity.parameters.length} parameters but ${paramTags.length} @param tags`,
					line: entity.location ? entity.location.line : 1,
					severity: "warning",
					entity: entity.name,
					file: filePath,
				});
			}
		}
	}

	return issues;
}

/**
 * Calculate quality score for a file based on issues
 * @param {ValidationIssue[]} issues - Issues found in the file
 * @returns {number} Score from 0-100
 */
function calculateFileScore(issues) {
	if (issues.length === 0) {
		return 100;
	}

	let deduction = 0;
	for (const issue of issues) {
		switch (issue.severity) {
			case "error":
				deduction += 20;
				break;
			case "warning":
				deduction += 10;
				break;
			case "info":
				deduction += 5;
				break;
		}
	}

	return Math.max(0, 100 - deduction);
}
