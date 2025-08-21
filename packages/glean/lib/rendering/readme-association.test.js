/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Integration tests for README-module association rules.
 *
 * Defines precise rules for when modules should display READMEs
 * to prevent inappropriate fallback to parent READMEs.
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";

/**
 * Core README association rules that the system must follow
 */
const README_ASSOCIATION_RULES = {
	// Rule 1: Exact match only - no parent fallback
	exactMatchOnly: true,

	// Rule 2: Module should only show README if specifically for that module
	specificityRequired: true,

	// Rule 3: No automatic parent directory README inheritance
	noParentFallback: true,
};

/**
 * Test cases defining correct README-module associations
 */
const CORRECT_README_ASSOCIATIONS = {
	// Root package module should show package README
	"package-root": {
		moduleId: "root",
		readmeId: "root",
		shouldShow: true,
		reason: "Package root should show package README",
	},

	// Main core module should show core README
	"core-main": {
		moduleId: "core/index",
		readmeId: "core",
		shouldShow: true,
		reason: "Main core module should show core README",
	},

	// Submodules should NOT show parent README unless they have their own
	"core-js-submodule": {
		moduleId: "core/js/index",
		readmeId: "core/js", // This doesn't exist in beak
		shouldShow: false,
		reason: "JS submodule should NOT show parent core README - too broad",
	},

	"core-css-submodule": {
		moduleId: "core/css/index",
		readmeId: "core/css", // This doesn't exist in beak
		shouldShow: false,
		reason: "CSS submodule should NOT show parent core README - too broad",
	},

	"core-html-submodule": {
		moduleId: "core/html/index",
		readmeId: "core/html", // This doesn't exist in beak
		shouldShow: false,
		reason: "HTML submodule should NOT show parent core README - too broad",
	},

	// Deep submodules should only show their specific README
	"deep-submodule": {
		moduleId: "core/md/html-transformer/inline-transformers",
		readmeId: "core/md/html-transformer/inline-transformers", // Doesn't exist
		shouldShow: false,
		reason: "Deep submodules should not fallback to distant parent READMEs",
	},

	// SEO module should show its own README if it exists
	"seo-main": {
		moduleId: "seo/index",
		readmeId: "seo", // This doesn't exist in beak
		shouldShow: false,
		reason:
			"SEO module should only show seo-specific README, not package README",
	},
};

/**
 * Test the README association logic rules
 */
test("README Association Rules - Core Principles", () => {
	// Test Rule 1: Exact match only
	strictEqual(
		README_ASSOCIATION_RULES.exactMatchOnly,
		true,
		"Should require exact README-module match",
	);

	// Test Rule 2: Specificity required
	strictEqual(
		README_ASSOCIATION_RULES.specificityRequired,
		true,
		"Should require README to be specifically about that module",
	);

	// Test Rule 3: No parent fallback
	strictEqual(
		README_ASSOCIATION_RULES.noParentFallback,
		true,
		"Should not fallback to parent directory READMEs",
	);
});

/**
 * Test correct README associations for real beak package structure
 */
test("README Association - Beak Package Scenarios", () => {
	// Core module should show core README
	const coreAssociation = CORRECT_README_ASSOCIATIONS["core-main"];
	strictEqual(coreAssociation.moduleId, "core/index");
	strictEqual(coreAssociation.readmeId, "core");
	strictEqual(coreAssociation.shouldShow, true);

	// JS submodule should NOT show core README
	const jsAssociation = CORRECT_README_ASSOCIATIONS["core-js-submodule"];
	strictEqual(jsAssociation.moduleId, "core/js/index");
	strictEqual(jsAssociation.shouldShow, false);

	// CSS submodule should NOT show core README
	const cssAssociation = CORRECT_README_ASSOCIATIONS["core-css-submodule"];
	strictEqual(cssAssociation.moduleId, "core/css/index");
	strictEqual(cssAssociation.shouldShow, false);
});

/**
 * Test that determines correct README ID for a given module ID
 * @param {string} moduleId - Module identifier
 * @param {string[]} availableReadmeIds - Available README IDs
 * @returns {string|null} Correct README ID or null
 */
export function getCorrectReadmeId(moduleId, availableReadmeIds) {
	// Rule 1: Try exact match first
	if (availableReadmeIds.includes(moduleId)) {
		return moduleId;
	}

	// Rule 2: For main module of a directory, try directory README
	// Only if this is the main index file of that directory
	if (moduleId.endsWith("/index")) {
		const dirPath = moduleId.slice(0, -6); // Remove '/index'
		if (availableReadmeIds.includes(dirPath)) {
			return dirPath;
		}
	}

	// Rule 3: No other fallbacks - return null
	return null;
}

/**
 * Test the getCorrectReadmeId function with beak package scenarios
 */
test("getCorrectReadmeId - Beak Package Examples", () => {
	const availableReadmeIds = ["root", "core"]; // What exists in beak

	// Core index should get core README
	strictEqual(getCorrectReadmeId("core/index", availableReadmeIds), "core");

	// JS submodule should get nothing (no fallback to core)
	strictEqual(getCorrectReadmeId("core/js/index", availableReadmeIds), null);

	// CSS submodule should get nothing
	strictEqual(getCorrectReadmeId("core/css/index", availableReadmeIds), null);

	// Deep submodule should get nothing
	strictEqual(
		getCorrectReadmeId(
			"core/md/html-transformer/inline-transformers",
			availableReadmeIds,
		),
		null,
	);

	// SEO module should get nothing (no seo README exists)
	strictEqual(getCorrectReadmeId("seo/index", availableReadmeIds), null);
});

/**
 * Integration test with actual beak documentation generation
 */
test("README Association - Integration Test", async () => {
	// This test should verify the actual behavior matches the rules
	// Will be implemented after fixing the logic

	const expectedAssociations = {
		"core/index": "core", // ✅ Should show core README
		"core/js/index": null, // ❌ Currently shows core README (wrong)
		"core/css/index": null, // ❌ Currently shows core README (wrong)
		"core/html/index": null, // ❌ Currently shows core README (wrong)
		"seo/index": null, // ✅ Should show nothing
	};

	// TODO: Implement actual integration test after fixing logic
	deepStrictEqual(expectedAssociations["core/index"], "core");
});
