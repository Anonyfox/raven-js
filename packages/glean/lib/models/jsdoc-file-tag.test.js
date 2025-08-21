/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDoc file tag model.
 *
 * Ravens test territorial claim documentation with methodical precision.
 * Verifies file-level description parsing, validation, and output generation.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocFileTag } from "./jsdoc-file-tag.js";

test("JSDocFileTag - edge cases", () => {
	// Very long description
	const longTag = new JSDocFileTag(
		"This is a comprehensive module that handles multiple aspects of user management including authentication, authorization, profile management, password reset functionality, email verification, two-factor authentication setup, session management, and integration with external identity providers for enterprise single sign-on capabilities",
	);
	strictEqual(longTag.isValid(), true, "Should handle long descriptions");

	// Single word
	const shortTag = new JSDocFileTag("Constants");
	strictEqual(shortTag.description, "Constants", "Should handle single word");
	strictEqual(shortTag.isValid(), true, "Should be valid");

	// Special characters
	const specialTag = new JSDocFileTag(
		"Utilities for parsing & formatting JSON/XML data with error handling (v2.0)",
	);
	strictEqual(specialTag.isValid(), true, "Should handle special characters");
});
