/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for file analysis module - orchestration validation.
 */

import { strict as assert } from "node:assert";
import { mkdir, rmdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { analyzeFile, analyzeFiles } from "./file-analysis.js";

test("analyzeFile handles file reading errors", async () => {
	const result = await analyzeFile("/nonexistent/file.js");

	assert.equal(result.file, "/nonexistent/file.js");
	assert.equal(result.score, 0);
	assert.equal(result.issues.length, 1);
	assert.equal(result.issues[0].type, "file_error");
	assert.equal(result.issues[0].severity, "error");
});

test("analyzeFile processes valid JavaScript files", async () => {
	const tempDir = join(tmpdir(), `glean-test-${Date.now()}`);
	await mkdir(tempDir, { recursive: true });

	try {
		const testFile = join(tempDir, "test.js");
		const content = `
/**
 * Add two numbers together
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} Sum of the numbers
 */
export function add(a, b) {
	return a + b;
}

function undocumented() {
	return "no docs";
}
		`;

		await writeFile(testFile, content);

		const result = await analyzeFile(testFile);

		assert.equal(result.file, testFile);
		assert.ok(result.score > 0);
		assert.ok(result.issues.length > 0); // Should have issues for undocumented function

		// Should find both functions
		const undocumentedIssue = result.issues.find(
			(i) => i.entity === "undocumented",
		);
		assert.ok(undocumentedIssue);
		assert.equal(undocumentedIssue.type, "missing_jsdoc");
	} finally {
		await rmdir(tempDir, { recursive: true });
	}
});

test("analyzeFiles generates comprehensive reports", async () => {
	const tempDir = join(tmpdir(), `glean-test-${Date.now()}`);
	await mkdir(tempDir, { recursive: true });

	try {
		const file1 = join(tempDir, "good.js");
		const file2 = join(tempDir, "bad.js");

		// Well-documented file
		await writeFile(
			file1,
			`
/**
 * Well documented function
 * @param {string} input - Input parameter
 * @returns {string} Processed output
 */
export function goodFunc(input) {
	return input.toUpperCase();
}
		`,
		);

		// Poorly documented file
		await writeFile(
			file2,
			`
export function badFunc() {
	return "no docs";
}
		`,
		);

		const report = await analyzeFiles([file1, file2]);

		assert.equal(report.summary.filesAnalyzed, 2);
		assert.equal(report.files.length, 2);
		assert.ok(report.summary.totalIssues > 0);
		assert.ok(
			report.summary.overallScore >= 0 && report.summary.overallScore <= 100,
		);
		assert.ok(report.summary.filesWithIssues > 0);

		// Check that bad file has lower score than good file
		const goodFile = report.files.find((f) => f.file === file1);
		const badFile = report.files.find((f) => f.file === file2);
		assert.ok(goodFile.score > badFile.score);
	} finally {
		await rmdir(tempDir, { recursive: true });
	}
});

test("analyzeFiles handles empty file list", async () => {
	const report = await analyzeFiles([]);

	assert.equal(report.summary.filesAnalyzed, 0);
	assert.equal(report.summary.totalIssues, 0);
	assert.equal(report.summary.overallScore, 100);
	assert.equal(report.summary.filesWithIssues, 0);
	assert.equal(report.files.length, 0);
});
