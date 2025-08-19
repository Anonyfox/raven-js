import assert from "node:assert";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { IsWorkspace } from "./is-workspace.js";

test("IsWorkspace validates workspace detection", () => {
	const tempDir = mkdtempSync(join(tmpdir(), "is-workspace-test-"));

	// Test: invalid input
	assert.strictEqual(IsWorkspace(""), false);
	assert.strictEqual(IsWorkspace(123), false);

	// Test: no package.json
	assert.strictEqual(IsWorkspace(tempDir), false);

	// Test: invalid JSON
	writeFileSync(join(tempDir, "package.json"), "invalid json");
	assert.strictEqual(IsWorkspace(tempDir), false);

	// Test: no workspaces field
	writeFileSync(
		join(tempDir, "package.json"),
		JSON.stringify({ name: "test" }),
	);
	assert.strictEqual(IsWorkspace(tempDir), false);

	// Test: empty workspaces
	writeFileSync(
		join(tempDir, "package.json"),
		JSON.stringify({ workspaces: [] }),
	);
	assert.strictEqual(IsWorkspace(tempDir), false);

	// Test: invalid workspaces format
	writeFileSync(
		join(tempDir, "package.json"),
		JSON.stringify({ workspaces: "not-array" }),
	);
	assert.strictEqual(IsWorkspace(tempDir), false);

	// Test: workspaces with invalid entries
	writeFileSync(
		join(tempDir, "package.json"),
		JSON.stringify({ workspaces: [123, ""] }),
	);
	assert.strictEqual(IsWorkspace(tempDir), false);

	// Test: valid workspace
	writeFileSync(
		join(tempDir, "package.json"),
		JSON.stringify({ workspaces: ["packages/*"] }),
	);
	assert.strictEqual(IsWorkspace(tempDir), true);

	// Test: valid workspace with multiple patterns
	writeFileSync(
		join(tempDir, "package.json"),
		JSON.stringify({ workspaces: ["packages/*", "apps/*"] }),
	);
	assert.strictEqual(IsWorkspace(tempDir), true);
});
