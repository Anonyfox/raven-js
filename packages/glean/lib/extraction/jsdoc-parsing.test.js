/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for JSDoc parsing module - documentation extraction validation.
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";
import { findPrecedingJSDoc, parseJSDocComment } from "./jsdoc-parsing.js";

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

test("parseJSDocComment edge cases", () => {
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
