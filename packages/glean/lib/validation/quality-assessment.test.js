/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for quality assessment module - validation business logic.
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
	calculateQualityScore,
	validateEntity,
	validateJSDocContent,
} from "./quality-assessment.js";

test("validateEntity identifies missing JSDoc issues", () => {
	const entity = {
		type: "function",
		name: "testFunc",
		line: 1,
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
		line: 1,
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
