/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for validation index module - API compatibility verification.
 */

import { strict as assert } from "node:assert";
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
} from "./index.js";

test("validation index exports all required functions", () => {
	// Verify all expected functions are exported
	assert.equal(typeof analyzeFile, "function");
	assert.equal(typeof analyzeFiles, "function");
	assert.equal(typeof calculateQualityScore, "function");
	assert.equal(typeof extractCodeEntities, "function");
	assert.equal(typeof findPrecedingJSDoc, "function");
	assert.equal(typeof parseJSDocComment, "function");
	assert.equal(typeof validateEntity, "function");
	assert.equal(typeof validateJSDocContent, "function");
});

test("validation index maintains API compatibility", () => {
	// Test that the re-exported functions work identically to originals
	const content = `
/**
 * Test function
 * @param {string} arg - Test argument
 * @returns {string} Test result
 */
export function testFunc(arg) {
	return arg;
}
	`;

	const entities = extractCodeEntities(content);
	assert.equal(entities.length, 1);
	assert.equal(entities[0].name, "testFunc");
	assert.equal(entities[0].type, "function");
	assert.equal(entities[0].exported, true);

	const lines = content.split("\n");
	const jsDoc = findPrecedingJSDoc(lines, entities[0].line - 1);
	assert.ok(jsDoc);
	assert.ok(jsDoc.description.includes("Test function"));

	const issues = validateEntity(entities[0], content);
	assert.equal(issues.length, 0); // Well-documented function should have no issues

	const score = calculateQualityScore(entities, issues);
	assert.equal(score, 100); // Perfect documentation
});
