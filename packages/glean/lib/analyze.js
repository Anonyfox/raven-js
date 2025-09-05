/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file CLI analyze command using lib2 validation as drop-in replacement.
 *
 * Provides CLI-compatible interface wrapping validate function for
 * seamless replacement of analyze command functionality.
 */

import { validate } from "./validate.js";

/**
 * Run the analyze command using lib2 validation as drop-in replacement
 * @param {string[]} args - Command arguments
 * @returns {Promise<void>}
 */
export async function runAnalyzeCommand(args) {
	const verbose = args.includes("--verbose") || args.includes("-v");
	const target = args.find((arg) => !arg.startsWith("-")) || ".";

	console.log(`📊 Analyzing JSDoc quality in: ${target}`);

	try {
		// Use lib2 validate function
		const report = validate(target);

		if (report.summary.filesAnalyzed === 0) {
			console.log("⚠️  No JavaScript files found in target directory");
			return;
		}

		if (verbose) {
			console.log(`📁 Found ${report.summary.filesAnalyzed} JavaScript files`);
		}

		// Display results using the same format as lib1
		displayAnalysisReport(report, verbose);
	} catch (error) {
		throw new Error(`Analysis failed: ${error.message}`);
	}
}

/**
 * Display analysis report in terminal (copied from lib1 for compatibility)
 * @param {import('./validate.js').ValidationReport} report - Analysis report from lib2 validate
 * @param {boolean} verbose - Show detailed output
 */
export function displayAnalysisReport(report, verbose) {
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
		/** @param {import('./validate.js').FileValidationResult} f */ (f) =>
			f.issues.length > 0,
	);

	if (filesWithIssues.length > 0) {
		console.log(`\n📝 Issues found:`);

		for (const file of filesWithIssues) {
			const relativePath = file.file.replace(process.cwd(), ".");
			console.log(`\n   ${relativePath} (score: ${file.score}/100)`);

			// Group issues by severity
			const errors = file.issues.filter(
				/** @param {import('./validate.js').ValidationIssue} i */ (i) =>
					i.severity === "error",
			);
			const warnings = file.issues.filter(
				/** @param {import('./validate.js').ValidationIssue} i */ (i) =>
					i.severity === "warning",
			);
			const info = file.issues.filter(
				/** @param {import('./validate.js').ValidationIssue} i */ (i) =>
					i.severity === "info",
			);

			if (errors.length > 0) {
				console.log(`     ❌ ${errors.length} error(s)`);
				if (verbose) {
					errors.forEach(
						/** @param {import('./validate.js').ValidationIssue} issue */ (
							issue,
						) => {
							console.log(`        Line ${issue.line}: ${issue.message}`);
						},
					);
				}
			}

			if (warnings.length > 0) {
				console.log(`     ⚠️  ${warnings.length} warning(s)`);
				if (verbose) {
					warnings.forEach(
						/** @param {import('./validate.js').ValidationIssue} issue */ (
							issue,
						) => {
							console.log(`        Line ${issue.line}: ${issue.message}`);
						},
					);
				}
			}

			if (info.length > 0) {
				console.log(`     ℹ️  ${info.length} info`);
				if (verbose) {
					info.forEach(
						/** @param {import('./validate.js').ValidationIssue} issue */ (
							issue,
						) => {
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
