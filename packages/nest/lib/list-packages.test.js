/**
 * @fileoverview Tests for list-packages module
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { Folder } from "./folder.js";
import { listPackages, listPublicPackages } from "./list-packages.js";

describe("listPackages", () => {
	test("should return null when package.json is missing", () => {
		const folder = new Folder();
		const result = listPackages(folder);
		assert.strictEqual(result, null);
	});

	test("should return null when package.json is invalid JSON", () => {
		const folder = new Folder();
		folder.addFile("package.json", "invalid json");
		const result = listPackages(folder);
		assert.strictEqual(result, null);
	});

	test("should return null when not a workspace (no workspaces field)", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-package",
				version: "1.0.0",
			}),
		);
		const result = listPackages(folder);
		assert.strictEqual(result, null);
	});

	test("should return null when not a workspace (empty workspaces array)", () => {
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

	test("should return null when not a workspace (workspaces is not array)", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-workspace",
				version: "1.0.0",
				workspaces: "packages/*",
			}),
		);
		const result = listPackages(folder);
		assert.strictEqual(result, null);
	});

	test("should return package paths for glob pattern", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-workspace",
				version: "1.0.0",
				workspaces: ["packages/*"],
			}),
		);
		folder.addFile(
			"packages/package1/package.json",
			JSON.stringify({ name: "package1" }),
		);
		folder.addFile(
			"packages/package2/package.json",
			JSON.stringify({ name: "package2" }),
		);
		folder.addFile("packages/package3/README.md", "README content"); // No package.json

		const result = listPackages(folder);
		assert.notStrictEqual(result, null);
		const packages = /** @type {string[]} */ (result);
		assert.strictEqual(packages.length, 2);
		assert(packages.includes("packages/package1"));
		assert(packages.includes("packages/package2"));
		assert(!packages.includes("packages/package3"));
	});

	test("should return package paths for direct path pattern", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-workspace",
				version: "1.0.0",
				workspaces: ["packages/package1", "packages/package2"],
			}),
		);
		folder.addFile(
			"packages/package1/package.json",
			JSON.stringify({ name: "package1" }),
		);
		folder.addFile(
			"packages/package2/package.json",
			JSON.stringify({ name: "package2" }),
		);

		const result = listPackages(folder);
		assert.notStrictEqual(result, null);
		const packages = /** @type {string[]} */ (result);
		assert.strictEqual(packages.length, 2);
		assert(packages.includes("packages/package1"));
		assert(packages.includes("packages/package2"));
	});

	test("should handle mixed patterns", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-workspace",
				version: "1.0.0",
				workspaces: ["packages/*", "tools/tool1"],
			}),
		);
		folder.addFile(
			"packages/package1/package.json",
			JSON.stringify({ name: "package1" }),
		);
		folder.addFile(
			"packages/package2/package.json",
			JSON.stringify({ name: "package2" }),
		);
		folder.addFile(
			"tools/tool1/package.json",
			JSON.stringify({ name: "tool1" }),
		);

		const result = listPackages(folder);
		assert.notStrictEqual(result, null);
		const packages = /** @type {string[]} */ (result);
		assert.strictEqual(packages.length, 3);
		assert(packages.includes("packages/package1"));
		assert(packages.includes("packages/package2"));
		assert(packages.includes("tools/tool1"));
	});

	test("should handle invalid workspace patterns", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-workspace",
				version: "1.0.0",
				workspaces: ["packages/*", 123, "valid-package"],
			}),
		);
		folder.addFile(
			"packages/package1/package.json",
			JSON.stringify({ name: "package1" }),
		);
		folder.addFile(
			"valid-package/package.json",
			JSON.stringify({ name: "valid-package" }),
		);

		const result = listPackages(folder);
		assert.notStrictEqual(result, null);
		const packages = /** @type {string[]} */ (result);
		assert.strictEqual(packages.length, 2);
		assert(packages.includes("packages/package1"));
		assert(packages.includes("valid-package"));
	});

	test("should return all packages including private ones", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-workspace",
				version: "1.0.0",
				workspaces: ["packages/*"],
			}),
		);
		folder.addFile(
			"packages/public-package/package.json",
			JSON.stringify({ name: "public-package" }),
		);
		folder.addFile(
			"packages/private-package/package.json",
			JSON.stringify({ name: "private-package", private: true }),
		);

		const result = listPackages(folder);
		assert.notStrictEqual(result, null);
		const packages = /** @type {string[]} */ (result);
		assert.strictEqual(packages.length, 2);
		assert(packages.includes("packages/public-package"));
		assert(packages.includes("packages/private-package"));
	});
});

describe("listPublicPackages", () => {
	test("should return null when not a workspace", () => {
		const folder = new Folder();
		const result = listPublicPackages(folder);
		assert.strictEqual(result, null);
	});

	test("should return only public packages", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-workspace",
				version: "1.0.0",
				workspaces: ["packages/*"],
			}),
		);
		folder.addFile(
			"packages/public-package/package.json",
			JSON.stringify({ name: "public-package" }),
		);
		folder.addFile(
			"packages/private-package/package.json",
			JSON.stringify({ name: "private-package", private: true }),
		);
		folder.addFile(
			"packages/another-public/package.json",
			JSON.stringify({ name: "another-public" }),
		);

		const result = listPublicPackages(folder);
		assert.notStrictEqual(result, null);
		const packages = /** @type {string[]} */ (result);
		assert.strictEqual(packages.length, 2);
		assert(packages.includes("packages/public-package"));
		assert(packages.includes("packages/another-public"));
		assert(!packages.includes("packages/private-package"));
	});

	test("should handle packages with invalid package.json", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-workspace",
				version: "1.0.0",
				workspaces: ["packages/*"],
			}),
		);
		folder.addFile(
			"packages/public-package/package.json",
			JSON.stringify({ name: "public-package" }),
		);
		folder.addFile("packages/invalid-package/package.json", "invalid json");

		const result = listPublicPackages(folder);
		assert.notStrictEqual(result, null);
		const packages = /** @type {string[]} */ (result);
		assert.strictEqual(packages.length, 1);
		assert(packages.includes("packages/public-package"));
		assert(!packages.includes("packages/invalid-package"));
	});

	test("should handle packages without package.json", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-workspace",
				version: "1.0.0",
				workspaces: ["packages/*"],
			}),
		);
		folder.addFile(
			"packages/public-package/package.json",
			JSON.stringify({ name: "public-package" }),
		);
		folder.addFile("packages/no-package-json/README.md", "README content");

		const result = listPublicPackages(folder);
		assert.notStrictEqual(result, null);
		const packages = /** @type {string[]} */ (result);
		assert.strictEqual(packages.length, 1);
		assert(packages.includes("packages/public-package"));
		assert(!packages.includes("packages/no-package-json"));
	});

	test("should return null when all packages are private", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-workspace",
				version: "1.0.0",
				workspaces: ["packages/*"],
			}),
		);
		folder.addFile(
			"packages/private-package1/package.json",
			JSON.stringify({ name: "private-package1", private: true }),
		);
		folder.addFile(
			"packages/private-package2/package.json",
			JSON.stringify({ name: "private-package2", private: true }),
		);

		const result = listPublicPackages(folder);
		assert.strictEqual(result, null);
	});

	test("should handle mixed public and private packages", () => {
		const folder = new Folder();
		folder.addFile(
			"package.json",
			JSON.stringify({
				name: "test-workspace",
				version: "1.0.0",
				workspaces: ["packages/*", "tools/*"],
			}),
		);
		folder.addFile(
			"packages/public-package/package.json",
			JSON.stringify({ name: "public-package" }),
		);
		folder.addFile(
			"packages/private-package/package.json",
			JSON.stringify({ name: "private-package", private: true }),
		);
		folder.addFile(
			"tools/public-tool/package.json",
			JSON.stringify({ name: "public-tool" }),
		);
		folder.addFile(
			"tools/private-tool/package.json",
			JSON.stringify({ name: "private-tool", private: true }),
		);

		const result = listPublicPackages(folder);
		assert.notStrictEqual(result, null);
		const packages = /** @type {string[]} */ (result);
		assert.strictEqual(packages.length, 2);
		assert(packages.includes("packages/public-package"));
		assert(packages.includes("tools/public-tool"));
		assert(!packages.includes("packages/private-package"));
		assert(!packages.includes("tools/private-tool"));
	});
});
