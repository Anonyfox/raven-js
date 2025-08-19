import assert from "node:assert";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { ListWorkspacePackages } from "./list-workspace-packages.js";

test("ListWorkspacePackages lists workspace packages correctly", () => {
	const tempDir = mkdtempSync(join(tmpdir(), "list-workspace-test-"));

	// Test: invalid input
	assert.throws(() => ListWorkspacePackages(""), /must be a non-empty string/);
	assert.throws(() => ListWorkspacePackages(123), /must be a non-empty string/);

	// Test: no package.json
	assert.throws(
		() => ListWorkspacePackages(tempDir),
		/Cannot read package.json/,
	);

	// Test: invalid JSON
	writeFileSync(join(tempDir, "package.json"), "invalid json");
	assert.throws(() => ListWorkspacePackages(tempDir), /Invalid JSON/);

	// Test: no workspaces field
	writeFileSync(
		join(tempDir, "package.json"),
		JSON.stringify({ name: "test" }),
	);
	assert.throws(
		() => ListWorkspacePackages(tempDir),
		/does not contain a valid workspace/,
	);

	// Test: empty workspaces
	writeFileSync(
		join(tempDir, "package.json"),
		JSON.stringify({ workspaces: [] }),
	);
	assert.throws(
		() => ListWorkspacePackages(tempDir),
		/does not contain a valid workspace/,
	);

	// Setup valid workspace with packages
	const packagesDir = join(tempDir, "packages");
	mkdirSync(packagesDir);
	mkdirSync(join(packagesDir, "pkg1"));
	mkdirSync(join(packagesDir, "pkg2"));

	// Create package.json files for packages
	writeFileSync(
		join(packagesDir, "pkg1", "package.json"),
		JSON.stringify({ name: "pkg1" }),
	);
	writeFileSync(
		join(packagesDir, "pkg2", "package.json"),
		JSON.stringify({ name: "pkg2" }),
	);

	// Test: valid workspace with glob pattern
	writeFileSync(
		join(tempDir, "package.json"),
		JSON.stringify({ workspaces: ["packages/*"] }),
	);
	const packages = ListWorkspacePackages(tempDir);
	assert.strictEqual(Array.isArray(packages), true);
	assert.strictEqual(packages.length, 2);
	assert.ok(packages.includes("packages/pkg1"));
	assert.ok(packages.includes("packages/pkg2"));

	// Test: workspace with direct pattern
	writeFileSync(
		join(tempDir, "package.json"),
		JSON.stringify({ workspaces: ["packages/pkg1"] }),
	);
	const directPackages = ListWorkspacePackages(tempDir);
	assert.deepStrictEqual(directPackages, ["packages/pkg1"]);
});
