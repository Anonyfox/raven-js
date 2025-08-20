/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for validation module - surgical testing of JSDoc analysis.
 */

import { strict as assert } from "node:assert";
import { mkdir, rmdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
	analyzeFile,
	analyzeFiles,
	calculateQualityScore,
	extractCodeEntities,
	findPrecedingJSDoc,
	parseJSDocComment,
	validateEntity,
	validateJSDocContent,
} from "./validation.js";

test("extractCodeEntities finds functions, classes, and exports", () => {
	const content = `
export function publicFunction() {}

function privateFunction() {}

export const arrowFunc = () => {};

const privateArrow = async () => {};

export class PublicClass {}

class PrivateClass {}

export const CONSTANT = "value";

let variable = "not exported";
	`;

	const entities = extractCodeEntities(content);

	// Should find all functions, classes, and exported constants
	assert.equal(entities.length, 6);

	// Check specific entities
	const publicFunc = entities.find((e) => e.name === "publicFunction");
	assert.equal(publicFunc.type, "function");
	assert.equal(publicFunc.exported, true);

	const privateFunc = entities.find((e) => e.name === "privateFunction");
	assert.equal(privateFunc.type, "function");
	assert.equal(privateFunc.exported, false);

	const arrowFunc = entities.find((e) => e.name === "arrowFunc");
	assert.equal(arrowFunc.type, "function");
	assert.equal(arrowFunc.exported, true);

	const privateArrow = entities.find((e) => e.name === "privateArrow");
	assert.equal(privateArrow.type, "function");
	assert.equal(privateArrow.exported, false);

	const publicClass = entities.find((e) => e.name === "PublicClass");
	assert.equal(publicClass.type, "class");
	assert.equal(publicClass.exported, true);

	const constant = entities.find((e) => e.name === "CONSTANT");
	assert.equal(constant.type, "variable");
	assert.equal(constant.exported, true);
});

test("parseJSDocComment extracts description and tags", () => {
	const commentLines = [
		"/**",
		" * Calculate the sum of two numbers",
		" * @param {number} a - First number",
		" * @param {number} b - Second number",
		" * @returns {number} The sum of a and b",
		" * @see {@link https://example.com}",
		" */",
	];

	const jsDoc = parseJSDocComment(commentLines, 10);

	assert.equal(jsDoc.description, "Calculate the sum of two numbers");
	assert.equal(jsDoc.startLine, 10);
	assert.equal(jsDoc.endLine, 16);

	assert.ok(jsDoc.tags.param);
	assert.equal(jsDoc.tags.param.length, 2);
	assert.ok(jsDoc.tags.param[0].includes("number} a"));
	assert.ok(jsDoc.tags.param[1].includes("number} b"));

	assert.ok(jsDoc.tags.returns);
	assert.ok(jsDoc.tags.returns[0].includes("The sum"));

	assert.ok(jsDoc.tags.see);
	assert.ok(jsDoc.tags.see[0].includes("example.com"));
});

test("parseJSDocComment handles multiline descriptions and tags", () => {
	const commentLines = [
		"/**",
		" * This is a multiline description",
		" * that spans several lines",
		" * and provides detailed information",
		" * @param {string} input - A parameter that",
		" *   spans multiple lines",
		" */",
	];

	const jsDoc = parseJSDocComment(commentLines, 1);

	assert.ok(jsDoc.description.includes("multiline description"));
	assert.ok(jsDoc.description.includes("detailed information"));

	assert.ok(jsDoc.tags.param);
	assert.ok(jsDoc.tags.param[0].includes("spans multiple lines"));
});

test("findPrecedingJSDoc locates JSDoc comments correctly", () => {
	const lines = [
		"",
		"/**",
		" * Function description",
		" * @param {string} arg - Argument",
		" */",
		"function testFunc(arg) {",
		"  return arg;",
		"}",
	];

	// Find JSDoc for function on line 6 (index 5)
	const jsDoc = findPrecedingJSDoc(lines, 5);

	assert.ok(jsDoc);
	assert.equal(jsDoc.description, "Function description");
	assert.ok(jsDoc.tags.param);
	assert.equal(jsDoc.startLine, 2);
	assert.equal(jsDoc.endLine, 5);
});

test("findPrecedingJSDoc handles missing JSDoc", () => {
	const lines = ["", "function testFunc(arg) {", "  return arg;", "}"];

	const jsDoc = findPrecedingJSDoc(lines, 1);
	assert.equal(jsDoc, null);
});

test("findPrecedingJSDoc skips non-JSDoc comments", () => {
	const lines = [
		"",
		"// Regular comment",
		"/* Block comment */",
		"function testFunc(arg) {",
		"  return arg;",
		"}",
	];

	const jsDoc = findPrecedingJSDoc(lines, 3);
	assert.equal(jsDoc, null);
});

test("validateEntity identifies missing JSDoc issues", () => {
	const entity = {
		type: "function",
		name: "testFunc",
		line: 5,
		exported: true,
	};
	const content = "function testFunc() {}";

	const issues = validateEntity(entity, content);

	assert.equal(issues.length, 1);
	assert.equal(issues[0].type, "missing_jsdoc");
	assert.equal(issues[0].severity, "error"); // Exported function
	assert.ok(issues[0].message.includes("testFunc"));
});

test("validateEntity treats unexported functions as warnings", () => {
	const entity = {
		type: "function",
		name: "privateFunc",
		line: 5,
		exported: false,
	};
	const content = "function privateFunc() {}";

	const issues = validateEntity(entity, content);

	assert.equal(issues.length, 1);
	assert.equal(issues[0].severity, "warning"); // Non-exported function
});

test("validateJSDocContent identifies quality issues", () => {
	const entity = {
		type: "function",
		name: "testFunc",
		line: 5,
		exported: true,
	};

	// Poor description
	const poorJSDoc = {
		description: "Test",
		tags: {},
		startLine: 1,
		endLine: 3,
	};

	const issues1 = validateJSDocContent(poorJSDoc, entity);
	assert.ok(issues1.some((i) => i.type === "poor_description"));
	assert.ok(issues1.some((i) => i.type === "missing_param_docs"));
	assert.ok(issues1.some((i) => i.type === "missing_return_docs"));

	// Good JSDoc
	const goodJSDoc = {
		description: "This is a comprehensive description of the function",
		tags: {
			param: ["string name - The name parameter"],
			returns: ["boolean - True if successful"],
		},
		startLine: 1,
		endLine: 5,
	};

	const issues2 = validateJSDocContent(goodJSDoc, entity);
	assert.equal(issues2.filter((i) => i.type === "poor_description").length, 0);
	assert.equal(
		issues2.filter((i) => i.type === "missing_param_docs").length,
		0,
	);
	assert.equal(
		issues2.filter((i) => i.type === "missing_return_docs").length,
		0,
	);
});

test("calculateQualityScore computes reasonable scores", () => {
	// Perfect score - no entities
	assert.equal(calculateQualityScore([], []), 100);

	// Perfect score - no issues
	const entities = [
		{ type: "function", name: "func1" },
		{ type: "function", name: "func2" },
	];
	assert.equal(calculateQualityScore(entities, []), 100);

	// Score with various issue types
	const issues = [
		{ severity: "error" }, // -10
		{ severity: "warning" }, // -5
		{ severity: "info" }, // -1
	];

	// Total penalties: 16, max penalties: 30 (2 entities * 15)
	// Score: 100 - (16/30 * 100) = 100 - 53.33 = 47 (rounded)
	const score = calculateQualityScore(entities, issues);
	assert.ok(score >= 45 && score <= 50); // Allow some rounding variance
});

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

test("complex JSDoc parsing edge cases", () => {
	// Empty comment
	const emptyComment = parseJSDocComment(["/**", " */"], 1);
	assert.equal(emptyComment.description, "");
	assert.deepEqual(emptyComment.tags, {});

	// Comment with only tags
	const tagsOnly = parseJSDocComment(
		[
			"/**",
			" * @param {string} arg - Parameter",
			" * @returns {boolean} Result",
			" */",
		],
		1,
	);
	assert.equal(tagsOnly.description, "");
	assert.ok(tagsOnly.tags.param);
	assert.ok(tagsOnly.tags.returns);

	// Comment with malformed tags
	const malformed = parseJSDocComment(
		["/**", " * Description here", " * @param", " * @returns {number}", " */"],
		1,
	);
	assert.equal(malformed.description, "Description here");
	assert.equal(malformed.tags.param[0], "");
	assert.ok(malformed.tags.returns[0].includes("number"));
});

test("extractCodeEntities handles edge cases", () => {
	// Empty content
	assert.equal(extractCodeEntities("").length, 0);

	// Content with no entities
	assert.equal(extractCodeEntities("const x = 5; console.log(x);").length, 0);

	// Async functions
	const asyncContent = "export async function asyncFunc() {}";
	const entities = extractCodeEntities(asyncContent);
	assert.equal(entities.length, 1);
	assert.equal(entities[0].name, "asyncFunc");
	assert.equal(entities[0].exported, true);

	// Functions with complex signatures
	const complexContent = `
function complexFunc(
	param1,
	param2
) {}
	`;
	const complexEntities = extractCodeEntities(complexContent);
	assert.equal(complexEntities.length, 1);
	assert.equal(complexEntities[0].name, "complexFunc");
});
