/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file File analysis orchestration - high-level validation coordination.
 *
 * Top-level orchestration of the validation pipeline, coordinating
 * entity extraction, JSDoc parsing, and quality assessment to produce
 * comprehensive documentation analysis reports.
 */

import { readFile } from "node:fs/promises";
import { extractCodeEntities } from "./entity-extraction.js";
import { calculateQualityScore, validateEntity } from "./quality-assessment.js";

/**
 * Analyze JSDoc quality for a single JavaScript file
 * @param {string} filePath - Path to JavaScript file to analyze
 * @returns {Promise<{file: string, issues: import('./types.js').ValidationIssue[], score: number}>}
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
 * Analyze multiple files and generate summary report
 * @param {string[]} filePaths - Array of file paths to analyze
 * @returns {Promise<import('./types.js').ValidationReport>} Comprehensive validation report
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
