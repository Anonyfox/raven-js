/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { HasMinimalSettings } from "./has-minimal-settings.js";

describe("HasMinimalSettings", () => {
	let testDir;

	beforeEach(() => {
		// Create unique temporary directory for each test
		testDir = mkdtempSync(join(tmpdir(), "jsconfig-validation-"));
	});

	afterEach(() => {
		// Clean up temporary directory after each test
		try {
			rmSync(testDir, { recursive: true, force: true });
		} catch {
			// Ignore cleanup errors
		}
	});

	it("should throw error for empty package path", () => {
		assert.throws(
			() => HasMinimalSettings(""),
			/Package path must be a non-empty string/,
		);
	});

	it("should throw error for non-string package path", () => {
		assert.throws(
			() => HasMinimalSettings(null),
			/Package path must be a non-empty string/,
		);
	});

	it("should throw error when jsconfig.json is missing", () => {
		assert.throws(
			() => HasMinimalSettings(testDir),
			/Package must have a jsconfig.json file/,
		);
	});

	it("should throw error for invalid JSON in jsconfig.json", () => {
		const jsconfigPath = join(testDir, "jsconfig.json");
		writeFileSync(jsconfigPath, "{ invalid json }");

		assert.throws(
			() => HasMinimalSettings(testDir),
			/Invalid JSON in jsconfig.json/,
		);
	});

	it("should pass validation for canonical package jsconfig", () => {
		const jsconfigPath = join(testDir, "jsconfig.json");
		const canonicalConfig = {
			compilerOptions: {
				checkJs: true,
				module: "NodeNext",
				moduleResolution: "NodeNext",
				target: "ESNext",
				noImplicitAny: true,
				resolveJsonModule: true,
			},
			include: ["**/*.js"],
			exclude: [
				"**/*.test.js",
				"node_modules/**",
				"./static/**",
				"**/*.min.js",
			],
		};

		writeFileSync(jsconfigPath, JSON.stringify(canonicalConfig, null, 2));

		assert.strictEqual(HasMinimalSettings(testDir), true);
	});

	it("should pass validation for canonical examples jsconfig", () => {
		const exampleDir = join(testDir, "examples", "test-example");
		mkdirSync(exampleDir, { recursive: true });

		const jsconfigPath = join(exampleDir, "jsconfig.json");
		const canonicalExamplesConfig = {
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
			exclude: ["node_modules/**", "./static/**", "**/*.min.js"],
		};

		writeFileSync(
			jsconfigPath,
			JSON.stringify(canonicalExamplesConfig, null, 2),
		);

		assert.strictEqual(HasMinimalSettings(exampleDir), true);
	});

	it("should skip validation when escape hatch comment is present", () => {
		const jsconfigPath = join(testDir, "jsconfig.json");
		const customConfig = `{
			// nest-ignore: jsconfig-custom - requires special Node.js experimental features
			"compilerOptions": {
				"checkJs": true,
				"module": "ES2022",
				"target": "ES2020"
			}
		}`;

		writeFileSync(jsconfigPath, customConfig);

		assert.strictEqual(HasMinimalSettings(testDir), true);
	});

	it("should throw error for missing compilerOptions", () => {
		const jsconfigPath = join(testDir, "jsconfig.json");
		const invalidConfig = {
			include: ["**/*.js"],
			exclude: ["**/*.test.js", "node_modules/**", "static/**", "**/*.min.js"],
		};

		writeFileSync(jsconfigPath, JSON.stringify(invalidConfig, null, 2));

		assert.throws(
			() => HasMinimalSettings(testDir),
			/Missing or invalid compilerOptions/,
		);
	});

	it("should throw error for wrong compiler option values", () => {
		const jsconfigPath = join(testDir, "jsconfig.json");
		const wrongConfig = {
			compilerOptions: {
				checkJs: false, // Wrong for regular packages
				module: "NodeNext",
				moduleResolution: "NodeNext",
				target: "ESNext",
				noImplicitAny: true,
				resolveJsonModule: true,
			},
			include: ["**/*.js"],
			exclude: ["**/*.test.js", "node_modules/**", "static/**", "**/*.min.js"],
		};

		writeFileSync(jsconfigPath, JSON.stringify(wrongConfig, null, 2));

		assert.throws(
			() => HasMinimalSettings(testDir),
			/compilerOptions.checkJs: expected true, got false/,
		);
	});

	it("should throw error for missing include array", () => {
		const jsconfigPath = join(testDir, "jsconfig.json");
		const missingIncludeConfig = {
			compilerOptions: {
				checkJs: true,
				module: "NodeNext",
				moduleResolution: "NodeNext",
				target: "ESNext",
				noImplicitAny: true,
				resolveJsonModule: true,
			},
			exclude: ["**/*.test.js", "node_modules/**", "static/**", "**/*.min.js"],
		};

		writeFileSync(jsconfigPath, JSON.stringify(missingIncludeConfig, null, 2));

		assert.throws(
			() => HasMinimalSettings(testDir),
			/Missing or invalid include array/,
		);
	});

	it("should throw error for missing required exclude patterns", () => {
		const jsconfigPath = join(testDir, "jsconfig.json");
		const wrongExcludeConfig = {
			compilerOptions: {
				checkJs: true,
				module: "NodeNext",
				moduleResolution: "NodeNext",
				target: "ESNext",
				noImplicitAny: true,
				resolveJsonModule: true,
			},
			include: ["**/*.js"],
			exclude: ["node_modules/**"], // Missing **/*.test.js, ./static/**, **/*.min.js
		};

		writeFileSync(jsconfigPath, JSON.stringify(wrongExcludeConfig, null, 2));

		assert.throws(
			() => HasMinimalSettings(testDir),
			/exclude: missing required patterns/,
		);
	});

	it("should allow additional include/exclude patterns", () => {
		const jsconfigPath = join(testDir, "jsconfig.json");
		const extendedConfig = {
			compilerOptions: {
				checkJs: true,
				module: "NodeNext",
				moduleResolution: "NodeNext",
				target: "ESNext",
				noImplicitAny: true,
				resolveJsonModule: true,
			},
			include: ["**/*.js", "**/*.mjs"], // Additional .mjs pattern
			exclude: [
				"**/*.test.js",
				"node_modules/**",
				"./static/**",
				"**/*.min.js",
				"build/**",
			], // Additional build/** pattern
		};

		writeFileSync(jsconfigPath, JSON.stringify(extendedConfig, null, 2));

		assert.strictEqual(HasMinimalSettings(testDir), true);
	});
});
