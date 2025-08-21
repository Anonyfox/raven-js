/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for JSDoc example tag model
 *
 * Ravens validate demonstration precision with predatory focus.
 * Comprehensive test coverage for example parsing, validation, and output.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocExampleTag } from "./jsdoc-example-tag.js";

test("JSDocExampleTag - complex code examples", () => {
	// React component example
	const reactTag = new JSDocExampleTag(
		"<caption>React component</caption>\nfunction Button({ label, onClick }) {\n  return (\n    <button onClick={onClick}>\n      {label}\n    </button>\n  );\n}",
	);
	strictEqual(
		reactTag.caption,
		"React component",
		"Should parse React example",
	);
	strictEqual(reactTag.isValid(), true, "Should be valid");

	// API usage example
	const apiTag = new JSDocExampleTag(
		'<caption>API call with error handling</caption>\nfetch("/api/users")\n  .then(response => {\n    if (!response.ok) {\n      throw new Error("Network error");\n    }\n    return response.json();\n  })\n  .then(users => console.log(users))\n  .catch(error => console.error(error));',
	);
	strictEqual(
		apiTag.caption,
		"API call with error handling",
		"Should parse API example",
	);
	strictEqual(apiTag.isValid(), true, "Should be valid");
});
