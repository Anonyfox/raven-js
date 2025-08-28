/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for the Module class - Raven doctrine applied.
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, test } from "node:test";
import { File } from "./file.js";
import { Module } from "./module.js";
import { Package } from "./package.js";

describe("core functionality", () => {
	test("should create module instances and register with package correctly", () => {
		const pkg = new Package('{"name":"test","version":"1.0.0"}', new Set());
		const initialModuleCount = pkg.modules.length;

		const module = new Module(pkg, "src/index.js", "test");

		// Test property assignment
		strictEqual(module.package, pkg);
		strictEqual(module.filePath, "src/index.js");
		strictEqual(module.importPath, "test");
		strictEqual(module.readme, "");
		deepStrictEqual(module.files, []);

		// Test package registration
		strictEqual(pkg.modules.length, initialModuleCount + 1);
		strictEqual(pkg.modules[pkg.modules.length - 1], module);
	});

	test("should manage file collections and provide path tracking", () => {
		const pkg = new Package('{"name":"test","version":"1.0.0"}', new Set());
		const module = new Module(pkg, "src/index.js", "test");

		// Test empty state
		const emptyPaths = module.includedFilePaths();
		strictEqual(emptyPaths.size, 0);

		// Add first file
		const file1 = new File("src/index.js", "export const x = 1;");
		module.addFile(file1);

		strictEqual(module.files.length, 1);
		strictEqual(pkg.files.length, 1);
		const pathsAfterFirst = module.includedFilePaths();
		strictEqual(pathsAfterFirst.size, 1);
		strictEqual(pathsAfterFirst.has("src/index.js"), true);

		// Add second file
		const file2 = new File("src/utils.js", "export const y = 2;");
		module.addFile(file2);

		strictEqual(module.files.length, 2);
		strictEqual(pkg.files.length, 2);
		const pathsAfterSecond = module.includedFilePaths();
		strictEqual(pathsAfterSecond.size, 2);
		strictEqual(pathsAfterSecond.has("src/utils.js"), true);

		// Test duplicate prevention
		module.addFile(file1); // Same file again
		strictEqual(module.files.length, 2); // Should not increase
		strictEqual(pkg.files.length, 2); // Package files should also not increase
	});

	test("should track imported file dependencies and compute unvisited paths", () => {
		const pkg = new Package('{"name":"test","version":"1.0.0"}', new Set());
		const module = new Module(pkg, "src/index.js", "test");

		// Create files with imports/re-exports
		const mainFile = new File(
			"src/index.js",
			"export { helper } from './utils.js';",
		);
		const utilsFile = new File(
			"src/utils.js",
			"export const helper = () => {};",
		);

		module.addFile(mainFile);

		// Test with available files set
		const availableFiles = new Set([
			"src/index.js",
			"src/utils.js",
			"src/other.js",
		]);

		// Get imported paths
		const importedPaths = module.importedFilePaths(availableFiles);
		strictEqual(importedPaths.size, 1);
		strictEqual(importedPaths.has("src/utils.js"), true);

		// Get unvisited paths (imported but not yet included)
		const unvisitedPaths = module.unvisitedFilePaths(availableFiles);
		strictEqual(unvisitedPaths.size, 1);
		strictEqual(unvisitedPaths.has("src/utils.js"), true);

		// Add the imported file and test again
		module.addFile(utilsFile);
		const unvisitedAfterAdd = module.unvisitedFilePaths(availableFiles);
		strictEqual(unvisitedAfterAdd.size, 0); // Should be empty now
	});
});

describe("edge cases and error handling", () => {
	test("should handle modules with no imports or complex dependency chains", () => {
		const pkg = new Package('{"name":"test","version":"1.0.0"}', new Set());
		const module = new Module(pkg, "src/standalone.js", "standalone");

		// File with no imports/exports
		const standaloneFile = new File(
			"src/standalone.js",
			"const local = 'value';",
		);
		module.addFile(standaloneFile);

		const availableFiles = new Set(["src/standalone.js", "src/other.js"]);

		// Should have no imported files
		const importedPaths = module.importedFilePaths(availableFiles);
		strictEqual(importedPaths.size, 0);

		// Should have no unvisited files
		const unvisitedPaths = module.unvisitedFilePaths(availableFiles);
		strictEqual(unvisitedPaths.size, 0);

		// Test with empty files set
		const emptyImported = module.importedFilePaths(new Set());
		strictEqual(emptyImported.size, 0);

		const emptyUnvisited = module.unvisitedFilePaths(new Set());
		strictEqual(emptyUnvisited.size, 0);
	});

	test("should handle files with external dependencies and non-resolvable imports", () => {
		const pkg = new Package('{"name":"test","version":"1.0.0"}', new Set());
		const module = new Module(pkg, "src/external.js", "external");

		// File with external npm imports (should be ignored) and local imports
		const externalFile = new File(
			"src/external.js",
			`
			import lodash from 'lodash';
			import { helper } from './utils.js';
			export { helper };
		`,
		);
		module.addFile(externalFile);

		// Only include the external file, not utils.js
		const limitedFiles = new Set(["src/external.js"]);

		// Should find the local import but not resolve it (utils.js not available)
		const importedPaths = module.importedFilePaths(limitedFiles);
		strictEqual(importedPaths.size, 0); // Can't resolve to actual file

		// Test with utils.js available
		const fullFiles = new Set(["src/external.js", "src/utils.js"]);
		const resolvedPaths = module.importedFilePaths(fullFiles);
		strictEqual(resolvedPaths.size, 1);
		strictEqual(resolvedPaths.has("src/utils.js"), true);
	});
});

describe("integration scenarios", () => {
	test("should support complex module assembly workflows", () => {
		const pkg = new Package('{"name":"test","version":"1.0.0"}', new Set());

		// Create multiple modules sharing some files
		const mainModule = new Module(pkg, "src/index.js", "test");
		const utilsModule = new Module(pkg, "src/utils/index.js", "test/utils");

		strictEqual(pkg.modules.length, 2);

		// Add files to main module
		const mainFile = new File(
			"src/index.js",
			"export { api } from './api.js';",
		);
		const apiFile = new File("src/api.js", "export const api = {};");

		mainModule.addFile(mainFile);
		mainModule.addFile(apiFile);

		// Add files to utils module
		const utilsIndexFile = new File(
			"src/utils/index.js",
			"export { helper } from './helper.js';",
		);
		const helperFile = new File(
			"src/utils/helper.js",
			"export const helper = () => {};",
		);

		utilsModule.addFile(utilsIndexFile);
		utilsModule.addFile(helperFile);

		// Test package-level file tracking
		strictEqual(pkg.files.length, 4);

		// Test each module tracks only its files
		strictEqual(mainModule.files.length, 2);
		strictEqual(utilsModule.files.length, 2);

		// Test cross-module dependency detection would work
		const allAvailableFiles = new Set([
			"src/index.js",
			"src/api.js",
			"src/utils/index.js",
			"src/utils/helper.js",
		]);

		const mainImports = mainModule.importedFilePaths(allAvailableFiles);
		strictEqual(mainImports.has("src/api.js"), true);

		const utilsImports = utilsModule.importedFilePaths(allAvailableFiles);
		strictEqual(utilsImports.has("src/utils/helper.js"), true);
	});

	test("should maintain consistency with package state and handle README content", () => {
		const pkg = new Package(
			'{"name":"advanced","version":"2.0.0","description":"Advanced package"}',
			new Set(),
		);
		const module = new Module(pkg, "lib/advanced.js", "advanced");

		// Test module inherits package reference correctly
		strictEqual(module.package.name, "advanced");
		strictEqual(module.package.version, "2.0.0");
		strictEqual(module.package.description, "Advanced package");

		// Test README assignment
		module.readme =
			"# Advanced Module\n\nThis module provides advanced functionality.";
		strictEqual(
			module.readme,
			"# Advanced Module\n\nThis module provides advanced functionality.",
		);

		// Test file addition updates package
		const libFile = new File(
			"lib/advanced.js",
			"export class AdvancedFeature {}",
		);
		const beforeCount = pkg.files.length;

		module.addFile(libFile);

		strictEqual(pkg.files.length, beforeCount + 1);
		strictEqual(pkg.files[pkg.files.length - 1], libFile);

		// Test module-package relationship remains intact
		strictEqual(module.package, pkg);
		strictEqual(pkg.modules.includes(module), true);
	});
});
