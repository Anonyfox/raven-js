/**
 * @fileoverview Tests for list packages function
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { Folder } from "./folder.js";
import { listPackages } from "./list-packages.js";

describe("listPackages", () => {
	test("should return null when package.json is missing", () => {
		const folder = new Folder();
		const result = listPackages(folder);

		assert.strictEqual(result, null);
	});

	test("should return null when package.json is invalid JSON", () => {
		const folder = new Folder();
		folder.addFile("package.json", "{ invalid json");

		const result = listPackages(folder);

		assert.strictEqual(result, null);
	});

	test("should return null when workspaces field is missing", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-workspace",
				version: "1.0.0",
			}),
		);

		const result = listPackages(folder);

		assert.strictEqual(result, null);
	});

	test("should return null when workspaces field is not an array", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-workspace",
				version: "1.0.0",
				workspaces: "not an array",
			}),
		);

		const result = listPackages(folder);

		assert.strictEqual(result, null);
	});

	test("should return null when workspaces array is empty", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-workspace",
				version: "1.0.0",
				workspaces: [],
			}),
		);

		const result = listPackages(folder);

		assert.strictEqual(result, null);
	});

	test("should return null when no valid packages found", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-workspace",
				version: "1.0.0",
				workspaces: ["packages/*"],
			}),
		);
		// Add a directory without package.json
		folder.addFile("packages/empty-dir/README.md", "# Empty Directory");

		const result = listPackages(folder);

		assert.strictEqual(result, null);
	});

	test("should return package paths for direct workspace pattern", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-workspace",
				version: "1.0.0",
				workspaces: ["packages/core", "packages/utils"],
			}),
		);

		// Add packages
		folder.addFile(
			"packages/core/package.json",
			JSON.stringify({
				name: "@test/core",
				version: "1.0.0",
			}),
		);
		folder.addFile(
			"packages/utils/package.json",
			JSON.stringify({
				name: "@test/utils",
				version: "1.0.0",
			}),
		);

		const result = listPackages(folder);

		assert.deepStrictEqual(result, ["packages/core", "packages/utils"]);
	});

	test("should return package paths for glob workspace pattern", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-workspace",
				version: "1.0.0",
				workspaces: ["packages/*"],
			}),
		);

		// Add packages
		folder.addFile(
			"packages/core/package.json",
			JSON.stringify({
				name: "@test/core",
				version: "1.0.0",
			}),
		);
		folder.addFile(
			"packages/utils/package.json",
			JSON.stringify({
				name: "@test/utils",
				version: "1.0.0",
			}),
		);
		folder.addFile(
			"packages/docs/package.json",
			JSON.stringify({
				name: "@test/docs",
				version: "1.0.0",
			}),
		);

		// Add a directory without package.json (should be ignored)
		folder.addFile("packages/empty-dir/README.md", "# Empty Directory");

		const result = listPackages(folder);

		assert.deepStrictEqual(result, [
			"packages/core",
			"packages/utils",
			"packages/docs",
		]);
	});

	test("should handle multiple workspace patterns", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-workspace",
				version: "1.0.0",
				workspaces: ["packages/*", "apps/*"],
			}),
		);

		// Add packages in packages directory
		folder.addFile(
			"packages/core/package.json",
			JSON.stringify({
				name: "@test/core",
				version: "1.0.0",
			}),
		);
		folder.addFile(
			"packages/utils/package.json",
			JSON.stringify({
				name: "@test/utils",
				version: "1.0.0",
			}),
		);

		// Add packages in apps directory
		folder.addFile(
			"apps/web/package.json",
			JSON.stringify({
				name: "@test/web",
				version: "1.0.0",
			}),
		);
		folder.addFile(
			"apps/api/package.json",
			JSON.stringify({
				name: "@test/api",
				version: "1.0.0",
			}),
		);

		const result = listPackages(folder);

		assert.deepStrictEqual(result, [
			"packages/core",
			"packages/utils",
			"apps/web",
			"apps/api",
		]);
	});

	test("should ignore invalid workspace patterns", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-workspace",
				version: "1.0.0",
				workspaces: ["packages/*", 123, null, "invalid-pattern"],
			}),
		);

		// Add packages
		folder.addFile(
			"packages/core/package.json",
			JSON.stringify({
				name: "@test/core",
				version: "1.0.0",
			}),
		);

		const result = listPackages(folder);

		assert.deepStrictEqual(result, ["packages/core"]);
	});

	test("should handle nested package.json files", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-workspace",
				version: "1.0.0",
				workspaces: ["packages/*"],
			}),
		);

		// Add packages with nested files
		folder.addFile(
			"packages/core/package.json",
			JSON.stringify({
				name: "@test/core",
				version: "1.0.0",
			}),
		);
		folder.addFile("packages/core/src/index.js", "export default {};");
		folder.addFile("packages/core/README.md", "# Core Package");

		folder.addFile(
			"packages/utils/package.json",
			JSON.stringify({
				name: "@test/utils",
				version: "1.0.0",
			}),
		);
		folder.addFile(
			"packages/utils/lib/helper.js",
			"export function helper() {};",
		);

		const result = listPackages(folder);

		assert.deepStrictEqual(result, ["packages/core", "packages/utils"]);
	});

	test("should handle complex glob patterns", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-workspace",
				version: "1.0.0",
				workspaces: ["packages/*", "tools/*", "examples/*"],
			}),
		);

		// Add packages in different directories
		folder.addFile(
			"packages/core/package.json",
			JSON.stringify({
				name: "@test/core",
				version: "1.0.0",
			}),
		);
		folder.addFile(
			"tools/build/package.json",
			JSON.stringify({
				name: "@test/build",
				version: "1.0.0",
			}),
		);
		folder.addFile(
			"examples/basic/package.json",
			JSON.stringify({
				name: "@test/basic-example",
				version: "1.0.0",
			}),
		);

		// Add directories without package.json (should be ignored)
		folder.addFile("packages/docs/README.md", "# Documentation");
		folder.addFile("tools/scripts/script.js", "console.log('script');");

		const result = listPackages(folder);

		assert.deepStrictEqual(result, [
			"packages/core",
			"tools/build",
			"examples/basic",
		]);
	});

	test("should return null when workspace patterns don't match any packages", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-workspace",
				version: "1.0.0",
				workspaces: ["packages/*", "apps/*"],
			}),
		);

		// Add directories without package.json
		folder.addFile("packages/docs/README.md", "# Documentation");
		folder.addFile("apps/website/index.html", "<!DOCTYPE html>");

		const result = listPackages(folder);

		assert.strictEqual(result, null);
	});
});
