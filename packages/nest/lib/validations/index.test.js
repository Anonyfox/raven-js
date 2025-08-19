import assert from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import * as rules from "./index.js";

/**
 * Find workspace root by walking up from current directory
 * @param {string} startPath - Starting path to search from
 * @returns {string} Workspace root path
 */
function findWorkspaceRoot(startPath) {
	let currentPath = startPath;

	while (currentPath !== dirname(currentPath)) {
		const packageJsonPath = join(currentPath, "package.json");
		if (existsSync(packageJsonPath)) {
			try {
				const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
				if (packageJson.workspaces && Array.isArray(packageJson.workspaces)) {
					return currentPath;
				}
			} catch {
				// Continue searching if package.json is invalid
			}
		}
		currentPath = dirname(currentPath);
	}

	// If no workspace found, return the original path
	return startPath;
}

describe("lib/rules/index.js", () => {
	it("should export main validation functions", () => {
		assert.strictEqual(typeof rules.validate, "function");
		assert.strictEqual(typeof rules.validatePackage, "function");
		assert.strictEqual(typeof rules.validateWorkspaceRoot, "function");
		assert.strictEqual(typeof rules.IsWorkspace, "function");
		assert.strictEqual(typeof rules.ListWorkspacePackages, "function");
	});

	it("should validate function signature", () => {
		// Test input validation
		assert.throws(() => {
			rules.validate("");
		}, /Path must be a non-empty string/);

		assert.throws(() => {
			rules.validate(null);
		}, /Path must be a non-empty string/);
	});

	it("should validatePackage function signature", () => {
		// Test input validation
		assert.throws(() => {
			rules.validatePackage("");
		}, /Package path must be a non-empty string/);

		assert.throws(() => {
			rules.validatePackage(null);
		}, /Package path must be a non-empty string/);
	});

	it("should handle invalid package path", () => {
		// Test with non-existent path - now returns result instead of throwing
		const result = rules.validatePackage("/non/existent/path");
		assert.strictEqual(result.passed, false);
		assert.strictEqual(result.checks.length > 0, true);
		assert.strictEqual(result.checks[0].passed, false);
		assert.match(result.checks[0].error, /is not a valid npm package/);
	});

	it("should validateWorkspaceRoot function signature", () => {
		// Test input validation
		assert.throws(() => {
			rules.validateWorkspaceRoot("");
		}, /Workspace path must be a non-empty string/);

		assert.throws(() => {
			rules.validateWorkspaceRoot(null);
		}, /Workspace path must be a non-empty string/);
	});

	it("should handle invalid workspace path", () => {
		// Test with non-existent path - now returns result instead of throwing
		const result = rules.validateWorkspaceRoot("/non/existent/path");
		assert.strictEqual(result.passed, false);
		assert.strictEqual(result.checks.length > 0, true);
		assert.strictEqual(result.checks[0].passed, false);
		assert.match(result.checks[0].error, /is not a valid npm package/);
	});

	it("should validateWorkspaceRoot with actual workspace", () => {
		// Test with actual workspace root path - find it dynamically
		const workspaceRoot = findWorkspaceRoot(process.cwd());

		// This should pass since the workspace root should be valid
		const result = rules.validateWorkspaceRoot(workspaceRoot);
		assert.strictEqual(typeof result, "object");
		assert.strictEqual(result.passed, true);
		assert.strictEqual(Array.isArray(result.checks), true);
		assert.strictEqual(result.packageName, "raven-js");
		assert.strictEqual(result.packagePath, workspaceRoot);
	});

	it("should validate function with actual workspace", () => {
		// Test the main validate function with workspace - disable output for testing
		const workspaceRoot = findWorkspaceRoot(process.cwd());

		// Test validation function structure (may not pass due to missing JSDoc headers)
		const result = rules.validate(workspaceRoot, false);
		assert.strictEqual(typeof result, "object");
		assert.strictEqual(typeof result.passed, "boolean");
		assert.strictEqual(Array.isArray(result.packages), true);
		assert.strictEqual(result.packages.length > 1, true); // Workspace + packages

		// Check that all packages have validation results structure
		for (const pkg of result.packages) {
			assert.strictEqual(typeof pkg.passed, "boolean");
			assert.strictEqual(typeof pkg.packageName, "string");
			assert.strictEqual(typeof pkg.packagePath, "string");
			assert.strictEqual(Array.isArray(pkg.checks), true);
		}
	});
});
