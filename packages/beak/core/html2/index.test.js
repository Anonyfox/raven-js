/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Tests for HTML2 placeholder implementation
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";

import { html2, raw2 } from "./index.js";

test("html2 - placeholder returns empty string", () => {
	const result = html2`<div>${"test"}</div>`;
	assert.equal(result, "");
});

test("raw2 - placeholder returns empty string", () => {
	const result = raw2`<div>${"test"}</div>`;
	assert.equal(result, "");
});
