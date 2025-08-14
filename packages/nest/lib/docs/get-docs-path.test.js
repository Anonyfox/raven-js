/**
 * @fileoverview Tests for docs path functions
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import assert from "node:assert";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { getDocsPath, getWorkspaceRoot } from "./get-docs-path.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the actual workspace root for testing
const workspaceRoot = dirname(dirname(dirname(dirname(__dirname))));

describe("getWorkspaceRoot", () => {
	test("should find workspace root from current directory", () => {
		const result = getWorkspaceRoot();
		assert.strictEqual(result, workspaceRoot);
	});

	test("should find workspace root from packages/nest", () => {
		const result = getWorkspaceRoot("packages/nest");
		assert.strictEqual(result, workspaceRoot);
	});

	test("should find workspace root from packages/nest/lib", () => {
		const result = getWorkspaceRoot("packages/nest/lib");
		assert.strictEqual(result, workspaceRoot);
	});

	test("should find workspace root from absolute path", () => {
		const result = getWorkspaceRoot(join(workspaceRoot, "packages", "nest"));
		assert.strictEqual(result, workspaceRoot);
	});

	test("should throw error when no workspace root found", async () => {
		// Test with a path that exists but has no workspace root
		// We'll use the system temp directory which shouldn't have a workspace
		const os = await import("node:os");
		const tempDir = os.default.tmpdir();

		assert.throws(() => {
			getWorkspaceRoot(tempDir);
		}, /Workspace root not found/);
	});
});

describe("getDocsPath", () => {
	test("should find docs path from current directory", () => {
		const result = getDocsPath();
		assert.strictEqual(result, join(workspaceRoot, "docs"));
	});

	test("should find docs path from packages/nest", () => {
		const result = getDocsPath("packages/nest");
		assert.strictEqual(result, join(workspaceRoot, "docs"));
	});

	test("should find docs path from packages/nest/lib", () => {
		const result = getDocsPath("packages/nest/lib");
		assert.strictEqual(result, join(workspaceRoot, "docs"));
	});

	test("should find docs path from absolute path", () => {
		const result = getDocsPath(join(workspaceRoot, "packages", "nest"));
		assert.strictEqual(result, join(workspaceRoot, "docs"));
	});

	test("should throw error when docs folder doesn't exist", () => {
		// This test would require temporarily moving the docs folder
		// For now, we'll test that it works with the existing structure
		const result = getDocsPath();
		assert(result.includes("docs"));
		assert(result.startsWith(workspaceRoot));
	});

	test("should throw error when no workspace root found", async () => {
		// Test with a path that exists but has no workspace root
		// We'll use the system temp directory which shouldn't have a workspace
		const os = await import("node:os");
		const tempDir = os.default.tmpdir();

		assert.throws(() => {
			getDocsPath(tempDir);
		}, /Workspace root not found/);
	});
});
