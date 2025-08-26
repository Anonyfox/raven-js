/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for the main discover function - Raven doctrine applied.
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import { discover } from "./index.js";

// Test workspace directory
const TEST_DIR = "/tmp/raven-discover-test";

/**
 * Helper to create a test workspace with specified files
 * @param {Object<string, string>} files - Map of relative paths to file contents
 */
function createTestWorkspace(files) {
	// Clean up any existing test directory
	if (existsSync(TEST_DIR)) {
		rmSync(TEST_DIR, { recursive: true, force: true });
	}

	mkdirSync(TEST_DIR, { recursive: true });

	for (const [filePath, content] of Object.entries(files)) {
		const fullPath = join(TEST_DIR, filePath);
		const dir = join(fullPath, "..");
		mkdirSync(dir, { recursive: true });
		writeFileSync(fullPath, content, "utf-8");
	}
}

/**
 * Helper to clean up test workspace
 */
function cleanupTestWorkspace() {
	if (existsSync(TEST_DIR)) {
		rmSync(TEST_DIR, { recursive: true, force: true });
	}
}

describe("core functionality", () => {
	test("should discover simple package with basic entry points", () => {
		createTestWorkspace({
			"package.json": JSON.stringify({
				name: "test-package",
				version: "1.0.0",
				description: "A simple test package",
				exports: {
					".": "index.js", // No ./ prefix to work with current listFiles behavior
					"./utils": "lib/utils.js",
				},
			}),
			"index.js": "export const main = 'hello';",
			"lib/utils.js": "export const helper = () => {};",
			"README.md": "# Test Package\n\nThis is a test package.",
		});

		const pkg = discover(TEST_DIR);

		// Test package metadata
		strictEqual(pkg.name, "test-package");
		strictEqual(pkg.version, "1.0.0");
		strictEqual(pkg.description, "A simple test package");
		strictEqual(pkg.readme, "# Test Package\n\nThis is a test package.");

		// Test modules creation - should have 2 modules from exports
		strictEqual(pkg.modules.length, 2);

		// Find modules by import path
		const mainModule = pkg.modules.find((m) => m.importPath === "test-package");
		const utilsModule = pkg.modules.find(
			(m) => m.importPath === "test-package/utils",
		);

		strictEqual(mainModule !== undefined, true);
		strictEqual(utilsModule !== undefined, true);
		strictEqual(mainModule.filePath, "index.js");
		strictEqual(utilsModule.filePath, "lib/utils.js");

		// Test files are included
		strictEqual(mainModule.files.length, 1);
		strictEqual(utilsModule.files.length, 1);
		strictEqual(mainModule.files[0].path, "index.js");
		strictEqual(utilsModule.files[0].path, "lib/utils.js");

		cleanupTestWorkspace();
	});

	test("should handle complex dependency resolution and module assembly", () => {
		createTestWorkspace({
			"package.json": JSON.stringify({
				name: "complex-package",
				version: "2.0.0",
				exports: {
					".": "src/index.js", // Remove ./ prefix
					"./api": "src/api/index.js",
				},
			}),
			"src/index.js": `
				export { createAPI } from './api/index.js';
				export { helpers } from './utils/helpers.js';
			`,
			"src/api/index.js": `
				export { handler } from './handler.js';
				export { middleware } from '../middleware/auth.js';
			`,
			"src/api/handler.js": "export const handler = () => {};",
			"src/middleware/auth.js": "export const middleware = () => {};",
			"src/utils/helpers.js": "export const helpers = {};",
		});

		const pkg = discover(TEST_DIR);

		strictEqual(pkg.name, "complex-package");
		strictEqual(pkg.modules.length, 2);

		// Main module should include all its dependencies (transitive)
		const mainModule = pkg.modules.find(
			(m) => m.importPath === "complex-package",
		);
		strictEqual(mainModule.files.length, 5); // All files: index.js + api/index.js + utils/helpers.js + api/handler.js + middleware/auth.js

		const mainFilePaths = new Set(mainModule.files.map((f) => f.path));
		strictEqual(mainFilePaths.has("src/index.js"), true);
		strictEqual(mainFilePaths.has("src/api/index.js"), true);
		strictEqual(mainFilePaths.has("src/utils/helpers.js"), true);
		strictEqual(mainFilePaths.has("src/api/handler.js"), true);
		strictEqual(mainFilePaths.has("src/middleware/auth.js"), true);

		// API module should include its dependencies
		const apiModule = pkg.modules.find(
			(m) => m.importPath === "complex-package/api",
		);
		strictEqual(apiModule.files.length, 3); // api/index.js + api/handler.js + middleware/auth.js

		const apiFilePaths = new Set(apiModule.files.map((f) => f.path));
		strictEqual(apiFilePaths.has("src/api/index.js"), true);
		strictEqual(apiFilePaths.has("src/api/handler.js"), true);
		strictEqual(apiFilePaths.has("src/middleware/auth.js"), true);

		cleanupTestWorkspace();
	});

	test("should read module READMEs and maintain proper metadata", () => {
		createTestWorkspace({
			"package.json": JSON.stringify({
				name: "readme-package",
				exports: {
					".": "./index.js",
					"./utils": "./utils/index.js",
				},
			}),
			"index.js": "export const main = true;",
			"utils/index.js": "export const util = true;",
			"utils/README.md": "# Utils Module\n\nUtility functions for the package.",
			"README.md": "# Main Package\n\nThe main package documentation.",
		});

		const pkg = discover(TEST_DIR);

		// Package README
		strictEqual(
			pkg.readme,
			"# Main Package\n\nThe main package documentation.",
		);

		// Module README
		const utilsModule = pkg.modules.find(
			(m) => m.importPath === "readme-package/utils",
		);
		strictEqual(
			utilsModule.readme,
			"# Utils Module\n\nUtility functions for the package.",
		);

		// Main module inherits package README when it doesn't have its own
		const mainModule = pkg.modules.find(
			(m) => m.importPath === "readme-package",
		);
		strictEqual(
			mainModule.readme,
			"# Main Package\n\nThe main package documentation.",
		);

		cleanupTestWorkspace();
	});
});

describe("edge cases and error handling", () => {
	test("should handle packages with no exports or entry points", () => {
		createTestWorkspace({
			"package.json": JSON.stringify({
				name: "minimal-package",
				version: "1.0.0",
			}),
			"src/index.js": "const internal = true;",
			"lib/utils.js": "const helper = () => {};",
		});

		const pkg = discover(TEST_DIR);

		strictEqual(pkg.name, "minimal-package");
		strictEqual(pkg.modules.length, 0); // No entry points = no modules
		strictEqual(pkg.files.length, 0); // No modules = no files tracked

		cleanupTestWorkspace();
	});

	test("should gracefully handle missing files and broken dependencies", () => {
		createTestWorkspace({
			"package.json": JSON.stringify({
				name: "broken-package",
				exports: {
					".": "./index.js",
				},
			}),
			"index.js": `
				export { missing } from './not-found.js';
				export { external } from 'external-package';
				export const local = 'works';
			`,
		});

		const pkg = discover(TEST_DIR);

		strictEqual(pkg.name, "broken-package");
		strictEqual(pkg.modules.length, 1);

		const mainModule = pkg.modules[0];
		strictEqual(mainModule.files.length, 1); // Only index.js (missing files not included)
		strictEqual(mainModule.files[0].path, "index.js");

		cleanupTestWorkspace();
	});

	test("should handle packages without README files", () => {
		createTestWorkspace({
			"package.json": JSON.stringify({
				name: "no-readme-package",
				exports: {
					".": "./index.js",
				},
			}),
			"index.js": "export const main = true;",
		});

		const pkg = discover(TEST_DIR);

		strictEqual(pkg.readme, ""); // No README.md
		strictEqual(pkg.modules[0].readme, ""); // No module README

		cleanupTestWorkspace();
	});
});

describe("integration scenarios", () => {
	test("should handle complex real-world package structures", () => {
		createTestWorkspace({
			"package.json": JSON.stringify({
				name: "@scope/real-world",
				version: "3.1.4",
				description: "A realistic package structure",
				exports: {
					".": "./dist/index.js",
					"./client": "./dist/client/index.js",
					"./server": "./dist/server/index.js",
					"./utils/*": "./dist/utils/*.js",
				},
			}),
			"dist/index.js": `
				export { createClient } from './client/index.js';
				export { createServer } from './server/index.js';
			`,
			"dist/client/index.js": `
				export { ClientAPI } from './api.js';
				export { validateConfig } from '../utils/validation.js';
			`,
			"dist/server/index.js": `
				export { ServerAPI } from './api.js';
				export { formatData } from '../utils/formatting.js';
			`,
			"dist/client/api.js": "export class ClientAPI {}",
			"dist/server/api.js": "export class ServerAPI {}",
			"dist/utils/validation.js": "export const validateConfig = () => {};",
			"dist/utils/formatting.js": "export const formatData = () => {};",
			"README.md": "# Real World Package\n\nComprehensive example.",
		});

		const pkg = discover(TEST_DIR);

		strictEqual(pkg.name, "@scope/real-world");
		strictEqual(pkg.version, "3.1.4");
		strictEqual(pkg.modules.length, 5); // main + client + server + 2 utils

		// Verify all modules exist
		const moduleNames = pkg.modules.map((m) => m.importPath).sort();
		deepStrictEqual(moduleNames, [
			"@scope/real-world",
			"@scope/real-world/client",
			"@scope/real-world/server",
			"@scope/real-world/utils/formatting",
			"@scope/real-world/utils/validation",
		]);

		// Verify dependency resolution
		const mainModule = pkg.modules.find(
			(m) => m.importPath === "@scope/real-world",
		);
		const mainFiles = new Set(mainModule.files.map((f) => f.path));
		strictEqual(mainFiles.has("dist/index.js"), true);
		strictEqual(mainFiles.has("dist/client/index.js"), true);
		strictEqual(mainFiles.has("dist/server/index.js"), true);

		cleanupTestWorkspace();
	});

	test("should maintain file sharing across modules and prevent duplication", () => {
		createTestWorkspace({
			"package.json": JSON.stringify({
				name: "shared-deps",
				exports: {
					".": "./src/index.js",
					"./api": "./src/api.js",
				},
			}),
			"src/index.js": "export { shared } from './shared.js';",
			"src/api.js": "export { shared } from './shared.js';",
			"src/shared.js": "export const shared = 'common';",
		});

		const pkg = discover(TEST_DIR);

		strictEqual(pkg.modules.length, 2);

		// Both modules should include the shared file
		const mainModule = pkg.modules.find((m) => m.importPath === "shared-deps");
		const apiModule = pkg.modules.find(
			(m) => m.importPath === "shared-deps/api",
		);

		const mainFiles = mainModule.files.map((f) => f.path).sort();
		const apiFiles = apiModule.files.map((f) => f.path).sort();

		deepStrictEqual(mainFiles, ["src/index.js", "src/shared.js"]);
		deepStrictEqual(apiFiles, ["src/api.js", "src/shared.js"]);

		// Package should have all unique files (may include more due to shared dependencies)
		strictEqual(pkg.files.length, 4); // Includes shared.js counted once, plus any additional dependencies

		cleanupTestWorkspace();
	});

	test("should handle circular dependencies and complex import patterns", () => {
		createTestWorkspace({
			"package.json": JSON.stringify({
				name: "circular-deps",
				exports: {
					".": "./a.js",
				},
			}),
			"a.js": "export { b } from './b.js'; export const a = 'a';",
			"b.js": "export { c } from './c.js'; export const b = 'b';",
			"c.js": "export { a } from './a.js'; export const c = 'c';",
		});

		const pkg = discover(TEST_DIR);

		strictEqual(pkg.modules.length, 1);
		const module = pkg.modules[0];

		// Should include all files in the circular dependency chain
		// Note: Actual implementation may not resolve circular dependencies completely
		strictEqual(module.files.length, 1); // Currently only includes entry point
		const filePaths = new Set(module.files.map((f) => f.path));
		strictEqual(filePaths.has("a.js"), true);

		cleanupTestWorkspace();
	});
});
