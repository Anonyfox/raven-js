/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JSDoc validation and quality analysis for documentation archaeology.
 *
 * Surgical analysis of documentation quality - identifying missing, malformed,
 * or incomplete JSDoc comments with predatory precision. Clear, actionable
 * reports that guide developers to documentation gaps.
 */

import { readFile } from "node:fs/promises";

/**
 * Analyze JSDoc quality for a single JavaScript file
 * @param {string} filePath - Path to JavaScript file to analyze
 * @returns {Promise<{file: string, issues: ValidationIssue[], score: number}>}
 */
export async function analyzeFile(filePath) {
	try {
		const content = await readFile(filePath, "utf-8");
		const issues = [];

		// Extract functions, classes, and exports
		const entities = extractCodeEntities(content);

		// Check each entity for documentation quality
		for (const entity of entities) {
			const entityIssues = validateEntity(entity, content);
			issues.push(...entityIssues);
		}

		// Calculate overall quality score (0-100)
		const score = calculateQualityScore(entities, issues);

		return {
			file: filePath,
			issues,
			score,
		};
	} catch (error) {
		return {
			file: filePath,
			issues: [
				{
					type: "file_error",
					message: `Could not read file: ${error.message}`,
					line: 0,
					severity: "error",
					entity: "file",
				},
			],
			score: 0,
		};
	}
}

/**
 * Extract code entities (functions, classes, exports) from JavaScript content
 * @param {string} content - JavaScript file content
 * @returns {CodeEntity[]} Array of extracted entities
 */
export function extractCodeEntities(content) {
	const entities = [];
	const lines = content.split("\n");

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();
		const lineNumber = i + 1;

		// Function declarations
		const functionMatch = line.match(
			/^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/,
		);
		if (functionMatch) {
			entities.push({
				type: "function",
				name: functionMatch[1],
				line: lineNumber,
				exported: line.includes("export"),
			});
		}

		// Arrow function exports
		const arrowMatch = line.match(
			/^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(/,
		);
		if (arrowMatch) {
			entities.push({
				type: "function",
				name: arrowMatch[1],
				line: lineNumber,
				exported: line.includes("export"),
			});
		}

		// Class declarations
		const classMatch = line.match(/^(?:export\s+)?class\s+(\w+)/);
		if (classMatch) {
			entities.push({
				type: "class",
				name: classMatch[1],
				line: lineNumber,
				exported: line.includes("export"),
			});
		}

		// Named exports
		const namedExportMatch = line.match(/^export\s+const\s+(\w+)/);
		if (namedExportMatch) {
			entities.push({
				type: "variable",
				name: namedExportMatch[1],
				line: lineNumber,
				exported: true,
			});
		}
	}

	return entities;
}

/**
 * Validate JSDoc documentation for a code entity
 * @param {CodeEntity} entity - Code entity to validate
 * @param {string} content - Full file content for context
 * @returns {ValidationIssue[]} Array of validation issues
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
 * Find JSDoc comment preceding a line number
 * @param {string[]} lines - Array of file lines
 * @param {number} lineIndex - Line index to search backwards from
 * @returns {JSDocComment|null} Parsed JSDoc comment or null
 */
export function findPrecedingJSDoc(lines, lineIndex) {
	// Look backwards for JSDoc comment
	let endLine = -1;
	let startLine = -1;

	// Find the end of JSDoc comment (*/)
	for (let i = lineIndex - 1; i >= 0; i--) {
		const line = lines[i].trim();

		if (line === "") {
			continue; // Skip empty lines
		}

		if (line.endsWith("*/")) {
			endLine = i;
			break;
		}

		// If we hit code before finding */, there's no JSDoc
		if (!line.startsWith("*") && !line.startsWith("//")) {
			break;
		}
	}

	if (endLine === -1) return null;

	// Find the start of JSDoc comment (/**)
	for (let i = endLine; i >= 0; i--) {
		const line = lines[i].trim();

		if (line.startsWith("/**")) {
			startLine = i;
			break;
		}
	}

	if (startLine === -1) return null;

	// Extract and parse JSDoc content
	const commentLines = lines.slice(startLine, endLine + 1);
	return parseJSDocComment(commentLines, startLine + 1);
}

/**
 * Parse JSDoc comment lines into structured data
 * @param {string[]} commentLines - Lines of JSDoc comment
 * @param {number} startLine - Starting line number
 * @returns {JSDocComment} Parsed JSDoc structure
 */
export function parseJSDocComment(commentLines, startLine) {
	const comment = {
		description: "",
		tags: /** @type {any} */ ({}),
		startLine,
		endLine: startLine + commentLines.length - 1,
	};

	let currentTag = null;
	const descriptionLines = [];

	for (const line of commentLines) {
		const cleaned = line.replace(/^\s*\*?\s?/, "").trim();

		if (cleaned.startsWith("/**") || cleaned.endsWith("*/")) {
			continue; // Skip comment delimiters
		}

		// Check for JSDoc tags
		const tagMatch = cleaned.match(/^@(\w+)\s*(.*)/);
		if (tagMatch) {
			const [, tagName, tagContent] = tagMatch;
			currentTag = tagName;

			if (!comment.tags[tagName]) {
				comment.tags[tagName] = [];
			}

			comment.tags[tagName].push(tagContent);
		} else if (currentTag) {
			// Continuation of current tag
			const lastIndex = comment.tags[currentTag].length - 1;
			comment.tags[currentTag][lastIndex] += ` ${cleaned}`;
		} else {
			// Description content
			descriptionLines.push(cleaned);
		}
	}

	comment.description = descriptionLines.join(" ").trim();

	return comment;
}

/**
 * Validate JSDoc comment content quality
 * @param {JSDocComment} jsDoc - Parsed JSDoc comment
 * @param {CodeEntity} entity - Code entity being documented
 * @returns {ValidationIssue[]} Array of validation issues
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
 * @param {CodeEntity[]} entities - All extracted entities
 * @param {ValidationIssue[]} issues - All validation issues
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

/**
 * Analyze multiple files and generate summary report
 * @param {string[]} filePaths - Array of file paths to analyze
 * @returns {Promise<ValidationReport>} Comprehensive validation report
 */
export async function analyzeFiles(filePaths) {
	const fileResults = [];
	let totalIssues = 0;
	let totalScore = 0;

	for (const filePath of filePaths) {
		const result = await analyzeFile(filePath);
		fileResults.push(result);
		totalIssues += result.issues.length;
		totalScore += result.score;
	}

	const overallScore =
		filePaths.length > 0 ? Math.round(totalScore / filePaths.length) : 100;

	return {
		files: fileResults,
		summary: {
			filesAnalyzed: filePaths.length,
			totalIssues,
			overallScore,
			filesWithIssues: fileResults.filter((f) => f.issues.length > 0).length,
		},
	};
}

/**
 * @typedef {Object} CodeEntity
 * @property {string} type - Entity type (function, class, variable)
 * @property {string} name - Entity name
 * @property {number} line - Line number where entity is defined
 * @property {boolean} exported - Whether entity is exported
 */

/**
 * @typedef {Object} ValidationIssue
 * @property {string} type - Issue type identifier
 * @property {string} message - Human-readable issue description
 * @property {number} line - Line number where issue occurs
 * @property {string} severity - Issue severity (error, warning, info)
 * @property {string} entity - Entity name associated with issue
 */

/**
 * @typedef {Object} JSDocComment
 * @property {string} description - Main description text
 * @property {any} tags - JSDoc tags and their content
 * @property {number} startLine - Starting line number
 * @property {number} endLine - Ending line number
 */

/**
 * @typedef {Object} ValidationReport
 * @property {Object[]} files - Per-file analysis results
 * @property {Object} summary - Overall report summary
 */
