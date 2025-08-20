/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Analysis module - JSDoc validation and quality assessment using class-based architecture.
 *
 * Surgical documentation analysis leveraging the complete DocumentationGraph
 * class hierarchy. Transforms graph validation results into comprehensive
 * quality reports with file-level scoring and detailed issue reporting.
 */

import { discoverPackage } from "./discovery/index.js";
import { extractDocumentationGraph } from "./extraction/index.js";

/**
 * Run the analyze command for JSDoc validation using class-based architecture
 * @param {string[]} args - Command arguments
 * @returns {Promise<void>}
 */
export async function runAnalyzeCommand(args) {
	const verbose = args.includes("--verbose") || args.includes("-v");
	const target = args.find((arg) => !arg.startsWith("-")) || ".";

	console.log(`📊 Analyzing JSDoc quality in: ${target}`);

	try {
		// Discover package structure
		const discovery = await discoverPackage(target);

		if (discovery.files.length === 0) {
			console.log("⚠️  No JavaScript files found in target directory");
			return;
		}

		if (verbose) {
			console.log(`📁 Found ${discovery.files.length} JavaScript files`);
			console.log(`📖 Found ${discovery.readmes.length} README files`);
		}

		// Extract documentation graph using the new class-based architecture
		const graph = await extractDocumentationGraph(target, discovery);

		// Validate the entire graph
		graph.validate();

		// Transform validation results to the format expected by displayAnalysisReport
		const report = transformGraphValidationToReport(
			graph,
			discovery.files,
			verbose,
		);

		// Display results
		displayAnalysisReport(report, verbose);
	} catch (error) {
		throw new Error(`Analysis failed: ${error.message}`);
	}
}

/**
 * Transform DocumentationGraph validation results to legacy report format
 * @param {import('./models/documentation-graph.js').DocumentationGraph} graph - Validated documentation graph
 * @param {string[]} filePaths - List of analyzed file paths
 * @param {boolean} _verbose - Show detailed output (unused)
 * @returns {Object} Report in the format expected by displayAnalysisReport
 */
function transformGraphValidationToReport(graph, filePaths, _verbose) {
	const fileResults = [];
	let totalIssues = 0;
	let totalScore = 0;

	// Group validation issues by file
	const issuesByFile = new Map();

	// Initialize file results
	for (const filePath of filePaths) {
		issuesByFile.set(filePath, []);
	}

	// Process graph validation issues
	for (const issue of graph.validationIssues) {
		const validationIssue = {
			type: issue.type,
			message: issue.message,
			line: /** @type {any} */ (issue).line || 0,
			severity:
				/** @type {any} */ (issue).severity ||
				getSeverityFromIssueType(issue.type),
			entity: /** @type {any} */ (issue).entityId || "unknown",
		};

		// Try to map issue to specific file
		const targetFile = findFileForIssue(graph, issue, filePaths);
		if (targetFile && issuesByFile.has(targetFile)) {
			issuesByFile.get(targetFile).push(validationIssue);
		} else {
			// For general issues, add to the first file or create a summary
			const firstFile = filePaths[0];
			if (firstFile && issuesByFile.has(firstFile)) {
				issuesByFile.get(firstFile).push(validationIssue);
			}
		}
	}

	// Create file results
	for (const filePath of filePaths) {
		const issues = issuesByFile.get(filePath) || [];
		const score = calculateFileScore(graph, filePath, issues);

		fileResults.push({
			file: filePath,
			issues,
			score,
		});

		totalIssues += issues.length;
		totalScore += score;
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
 * Get severity level from validation issue type
 * @param {string} issueType - Type of validation issue
 * @returns {string} Severity level
 */
function getSeverityFromIssueType(issueType) {
	const errorTypes = [
		"invalid_package",
		"invalid_module",
		"invalid_entity",
		"invalid_content",
		"invalid_asset",
		"file_error",
	];
	const warningTypes = [
		"dangling_reference",
		"missing_reference",
		"circular_reference",
	];

	if (errorTypes.includes(issueType)) {
		return "error";
	} else if (warningTypes.includes(issueType)) {
		return "warning";
	}
	return "info";
}

/**
 * Find the file associated with a validation issue
 * @param {import('./models/documentation-graph.js').DocumentationGraph} graph - Documentation graph
 * @param {Object} issue - Validation issue
 * @param {string[]} filePaths - Available file paths
 * @returns {string|null} File path or null
 */
function findFileForIssue(graph, issue, filePaths) {
	// Try to find the file based on entity ID or module ID
	const entityId = /** @type {any} */ (issue).entityId;
	if (entityId) {
		// Look for entity in graph
		const entity = graph.entities.get(entityId);
		if (entity?.location?.file) {
			// Find matching file path
			return filePaths.find((path) => path.includes(entity.location.file));
		}

		// Try to extract module ID from entity ID (format: moduleId/entityName)
		const parts = entityId.split("/");
		if (parts.length > 1) {
			const moduleId = parts.slice(0, -1).join("/");
			const module = graph.modules.get(moduleId);
			if (module?.path) {
				return filePaths.find((path) => path.includes(module.path));
			}
		}
	}

	return null;
}

/**
 * Calculate quality score for a file based on graph data and issues
 * @param {import('./models/documentation-graph.js').DocumentationGraph} graph - Documentation graph
 * @param {string} filePath - File path
 * @param {Object[]} issues - File issues
 * @returns {number} Quality score (0-100)
 */
function calculateFileScore(graph, filePath, issues) {
	// Find entities in this file
	const fileEntities = [];
	for (const entity of graph.entities.values()) {
		if (entity.location?.file && filePath.includes(entity.location.file)) {
			fileEntities.push(entity);
		}
	}

	// Base score
	let score = 100;

	// Deduct for each issue
	for (const issue of issues) {
		const severity = /** @type {any} */ (issue).severity;
		switch (severity) {
			case "error":
				score -= 20;
				break;
			case "warning":
				score -= 10;
				break;
			case "info":
				score -= 5;
				break;
		}
	}

	// Bonus for well-documented entities
	for (const entity of fileEntities) {
		if (entity.jsdocTags && entity.jsdocTags.length > 0) {
			score += 2; // Small bonus for documented entities
		}
	}

	return Math.max(0, Math.min(100, score));
}

/**
 * Display analysis report in terminal
 * @param {any} report - Analysis report
 * @param {boolean} verbose - Show detailed output
 */
function displayAnalysisReport(report, verbose) {
	const { summary, files } = report;

	console.log(`\n📈 Analysis Results:`);
	console.log(`   Files analyzed: ${summary.filesAnalyzed}`);
	console.log(`   Overall score: ${summary.overallScore}/100`);
	console.log(`   Total issues: ${summary.totalIssues}`);
	console.log(`   Files with issues: ${summary.filesWithIssues}`);

	// Show score interpretation
	if (summary.overallScore >= 90) {
		console.log(`   Quality: ✅ Excellent`);
	} else if (summary.overallScore >= 70) {
		console.log(`   Quality: ⚠️  Good`);
	} else if (summary.overallScore >= 50) {
		console.log(`   Quality: 🔶 Needs improvement`);
	} else {
		console.log(`   Quality: ❌ Poor`);
	}

	// List files with issues
	const filesWithIssues = files.filter(
		/** @param {any} f */ (f) => f.issues.length > 0,
	);

	if (filesWithIssues.length > 0) {
		console.log(`\n📝 Issues found:`);

		for (const file of filesWithIssues) {
			const relativePath = file.file.replace(process.cwd(), ".");
			console.log(`\n   ${relativePath} (score: ${file.score}/100)`);

			// Group issues by severity
			const errors = file.issues.filter(
				/** @param {any} i */ (i) => i.severity === "error",
			);
			const warnings = file.issues.filter(
				/** @param {any} i */ (i) => i.severity === "warning",
			);
			const info = file.issues.filter(
				/** @param {any} i */ (i) => i.severity === "info",
			);

			if (errors.length > 0) {
				console.log(`     ❌ ${errors.length} error(s)`);
				if (verbose) {
					errors.forEach(
						/** @param {any} issue */ (issue) => {
							console.log(`        Line ${issue.line}: ${issue.message}`);
						},
					);
				}
			}

			if (warnings.length > 0) {
				console.log(`     ⚠️  ${warnings.length} warning(s)`);
				if (verbose) {
					warnings.forEach(
						/** @param {any} issue */ (issue) => {
							console.log(`        Line ${issue.line}: ${issue.message}`);
						},
					);
				}
			}

			if (info.length > 0) {
				console.log(`     ℹ️  ${info.length} info`);
				if (verbose) {
					info.forEach(
						/** @param {any} issue */ (issue) => {
							console.log(`        Line ${issue.line}: ${issue.message}`);
						},
					);
				}
			}
		}

		if (!verbose) {
			console.log(`\n   💡 Use --verbose for detailed issue descriptions`);
		}
	} else {
		console.log(`\n✅ No documentation issues found!`);
	}

	console.log(`\n🎉 Analysis complete!`);
}
