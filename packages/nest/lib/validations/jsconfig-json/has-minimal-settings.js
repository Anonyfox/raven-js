/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Canonical jsconfig.json structure for packages
 */
const CANONICAL_JSCONFIG = {
	compilerOptions: {
		checkJs: true,
		module: "NodeNext",
		moduleResolution: "NodeNext",
		target: "ESNext",
		noImplicitAny: true,
		resolveJsonModule: true,
	},
	include: ["**/*.js"],
	exclude: ["**/*.test.js", "node_modules/**", "static/**", "**/*.min.js"],
};

/**
 * Canonical jsconfig.json structure for examples (less strict)
 */
const CANONICAL_JSCONFIG_EXAMPLES = {
	compilerOptions: {
		checkJs: false,
		noImplicitAny: false,
		module: "NodeNext",
		moduleResolution: "NodeNext",
		target: "ESNext",
		allowJs: true,
		resolveJsonModule: true,
	},
	include: ["**/*.js"],
	exclude: ["node_modules/**", "static/**", "**/*.min.js"],
};

/**
 * Validates that a package has minimal jsconfig.json settings
 */
export const HasMinimalSettings = (/** @type {string} */ packagePath) => {
	if (typeof packagePath !== "string" || packagePath === "") {
		throw new Error("Package path must be a non-empty string");
	}

	const jsconfigPath = join(packagePath, "jsconfig.json");

	// Check if jsconfig.json exists
	if (!existsSync(jsconfigPath)) {
		throw new Error(`Package must have a jsconfig.json file at ${packagePath}`);
	}

	// Read and parse jsconfig.json
	let jsconfigContent;
	try {
		jsconfigContent = readFileSync(jsconfigPath, "utf8");
	} catch (error) {
		throw new Error(
			`Cannot read jsconfig.json at ${jsconfigPath}: ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	// Check for escape hatch comment
	if (jsconfigContent.includes("// nest-ignore: jsconfig-custom")) {
		return true; // Skip validation for custom configurations
	}

	let jsconfigData;
	try {
		jsconfigData = JSON.parse(jsconfigContent);
	} catch (error) {
		throw new Error(
			`Invalid JSON in jsconfig.json at ${jsconfigPath}: ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	// Determine if this is an examples package
	const isExamplePackage = packagePath.includes("/examples/");
	const expectedConfig = isExamplePackage
		? CANONICAL_JSCONFIG_EXAMPLES
		: CANONICAL_JSCONFIG;

	// Deep comparison of structure
	const violations = compareJsconfig(jsconfigData, expectedConfig, packagePath);

	if (violations.length > 0) {
		throw new Error(
			`JSConfig validation failed for ${packagePath}:\n${violations.join("\n")}`,
		);
	}

	return true;
};

/**
 * @typedef {Object} JSConfigData
 * @property {Record<string, any>} compilerOptions - TypeScript compiler options
 * @property {string[]} include - File patterns to include
 * @property {string[]} exclude - File patterns to exclude
 */

/**
 * Compare jsconfig structure against expected canonical form
 * @param {JSConfigData} actual - Actual jsconfig data
 * @param {JSConfigData} expected - Expected canonical jsconfig
 * @param {string} _packagePath - Package path for error context
 * @returns {string[]} Array of violation messages
 * @private
 */
function compareJsconfig(actual, expected, _packagePath) {
	const violations = [];

	// Check compilerOptions
	if (!actual.compilerOptions || typeof actual.compilerOptions !== "object") {
		violations.push("  Missing or invalid compilerOptions");
		return violations;
	}

	// Check each required compiler option
	for (const [key, expectedValue] of Object.entries(expected.compilerOptions)) {
		if (!(key in actual.compilerOptions)) {
			violations.push(`  Missing compilerOptions.${key}`);
		} else if (actual.compilerOptions[key] !== expectedValue) {
			violations.push(
				`  compilerOptions.${key}: expected ${JSON.stringify(expectedValue)}, got ${JSON.stringify(actual.compilerOptions[key])}`,
			);
		}
	}

	// Check include array
	if (!Array.isArray(actual.include)) {
		violations.push("  Missing or invalid include array");
	} else if (!arraysEqual(actual.include, expected.include)) {
		violations.push(
			`  include: expected ${JSON.stringify(expected.include)}, got ${JSON.stringify(actual.include)}`,
		);
	}

	// Check exclude array
	if (!Array.isArray(actual.exclude)) {
		violations.push("  Missing or invalid exclude array");
	} else if (!arraysEqual(actual.exclude, expected.exclude)) {
		violations.push(
			`  exclude: expected ${JSON.stringify(expected.exclude)}, got ${JSON.stringify(actual.exclude)}`,
		);
	}

	return violations;
}

/**
 * Check if two arrays are equal (order independent for some flexibility)
 * @param {string[]} a - First array
 * @param {string[]} b - Second array
 * @returns {boolean} True if arrays contain same elements
 * @private
 */
function arraysEqual(a, b) {
	if (a.length !== b.length) return false;
	const sortedA = [...a].sort();
	const sortedB = [...b].sort();
	return sortedA.every((val, idx) => val === sortedB[idx]);
}
