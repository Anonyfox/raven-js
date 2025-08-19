import assert from "node:assert";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { ListPublicPackages } from "./list-public-packages.js";

test("ListPublicPackages lists only public workspace packages", () => {
	const tempDir = mkdtempSync(join(tmpdir(), "list-public-test-"));

	// Test: invalid input
	assert.throws(() => ListPublicPackages(""), /must be a non-empty string/);
	assert.throws(() => ListPublicPackages(123), /must be a non-empty string/);

	// Test: not a workspace (should throw from ListWorkspacePackages)
	writeFileSync(
		join(tempDir, "package.json"),
		JSON.stringify({ name: "test" }),
	);
	assert.throws(
		() => ListPublicPackages(tempDir),
		/does not contain a valid workspace/,
	);

	// Setup valid workspace with mixed public/private packages
	const packagesDir = join(tempDir, "packages");
	mkdirSync(packagesDir);
	mkdirSync(join(packagesDir, "public-pkg"));
	mkdirSync(join(packagesDir, "private-pkg"));
	mkdirSync(join(packagesDir, "no-private-field"));

	// Create package.json files
	writeFileSync(
		join(packagesDir, "public-pkg", "package.json"),
		JSON.stringify({ name: "public-pkg", private: false }),
	);
	writeFileSync(
		join(packagesDir, "private-pkg", "package.json"),
		JSON.stringify({ name: "private-pkg", private: true }),
	);
	writeFileSync(
		join(packagesDir, "no-private-field", "package.json"),
		JSON.stringify({ name: "no-private-field" }),
	);

	// Setup workspace root
	writeFileSync(
		join(tempDir, "package.json"),
		JSON.stringify({ workspaces: ["packages/*"] }),
	);

	// Test: only public packages returned
	const publicPackages = ListPublicPackages(tempDir);
	assert.strictEqual(Array.isArray(publicPackages), true);
	assert.strictEqual(publicPackages.length, 2);
	assert.ok(publicPackages.includes("packages/public-pkg"));
	assert.ok(publicPackages.includes("packages/no-private-field"));
	assert.ok(!publicPackages.includes("packages/private-pkg"));

	// Test: all private packages
	writeFileSync(
		join(packagesDir, "public-pkg", "package.json"),
		JSON.stringify({ name: "public-pkg", private: true }),
	);
	writeFileSync(
		join(packagesDir, "no-private-field", "package.json"),
		JSON.stringify({ name: "no-private-field", private: true }),
	);

	const allPrivatePackages = ListPublicPackages(tempDir);
	assert.strictEqual(allPrivatePackages.length, 0);
});
