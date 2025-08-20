/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for entity extraction module - surgical code parsing validation.
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";
import { extractCodeEntities } from "./entity-extraction.js";

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
	assert.equal(entities.length, 7);

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
