/**
 * @fileoverview Tests for update-package-versions utility
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import assert from "node:assert";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import { updatePackageVersions } from "./update-package-versions.js";

describe("updatePackageVersions", () => {
	test("should handle invalid workspace gracefully", () => {
		// Create a temporary directory for testing
		const tempDir = mkdtempSync(join(tmpdir(), "semver-test-"));
		mkdirSync(tempDir, { recursive: true });

		try {
			// Create a directory that's not a workspace
			const nonWorkspaceDir = join(tempDir, "non-workspace");
			mkdirSync(nonWorkspaceDir, { recursive: true });

			const result = updatePackageVersions(nonWorkspaceDir, "2.0.0");

			assert(result.errors.length > 0);
			assert(
				result.errors.some((error) => error.includes("Not a valid workspace")),
			);
			assert.strictEqual(result.updated.length, 0);
		} finally {
			// Clean up temporary directory
			if (existsSync(tempDir)) {
				rmSync(tempDir, { recursive: true, force: true });
			}
		}
	});

	test("should handle non-existent directory gracefully", () => {
		// Test with a non-existent directory
		const nonExistentDir = "/non/existent/path";

		const result = updatePackageVersions(nonExistentDir, "2.0.0");

		assert(result.errors.length > 0);
		assert(
			result.errors.some((error) => error.includes("Not a valid workspace")),
		);
		assert.strictEqual(result.updated.length, 0);
	});

	test("should handle invalid workspace gracefully", () => {
		// Create a temporary directory for testing
		const tempDir = mkdtempSync(join(tmpdir(), "semver-test-"));
		mkdirSync(tempDir, { recursive: true });

		try {
			// Create a directory that's not a workspace (no package.json)
			const nonWorkspaceDir = join(tempDir, "non-workspace");
			mkdirSync(nonWorkspaceDir, { recursive: true });

			const result = updatePackageVersions(nonWorkspaceDir, "2.0.0");

			assert(result.errors.length > 0);
			assert(
				result.errors.some((error) => error.includes("Not a valid workspace")),
			);
			assert.strictEqual(result.updated.length, 0);
		} finally {
			// Clean up temporary directory
			if (existsSync(tempDir)) {
				rmSync(tempDir, { recursive: true, force: true });
			}
		}
	});
});
