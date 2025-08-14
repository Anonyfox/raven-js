/**
 * @fileoverview Tests for package validation
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import assert from "node:assert";
import {
	mkdirSync,
	mkdtempSync,
	rmdirSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import {
	getPackageInfo,
	getWorkspacePackages,
	isValidPackage,
	readPackageJson,
	validatePackage,
	validateWorkspace,
} from "./package.js";

/**
 * Create a temporary directory for testing
 * @returns {string} Path to temporary directory
 */
function createTempDir() {
	return mkdtempSync(join(tmpdir(), "nest-test-"));
}

/**
 * Create a test package.json file
 * @param {string} dir - Directory to create package.json in
 * @param {Object} packageJson - Package.json content
 */
function createPackageJson(dir, packageJson) {
	writeFileSync(
		join(dir, "package.json"),
		JSON.stringify(packageJson, null, 2),
	);
}

/**
 * Create a test LICENSE file
 * @param {string} dir - Directory to create LICENSE in
 */
function createLicenseFile(dir) {
	writeFileSync(join(dir, "LICENSE"), "MIT License\nCopyright (c) 2024 Test");
}

/**
 * Create a test README.md file
 * @param {string} dir - Directory to create README.md in
 */
function createReadmeFile(dir) {
	writeFileSync(
		join(dir, "README.md"),
		"# Test Package\n\nTest package for validation.",
	);
}

/**
 * Clean up temporary directory
 * @param {string} dir - Directory to clean up
 */
function cleanupTempDir(dir) {
	try {
		unlinkSync(join(dir, "package.json"));
		unlinkSync(join(dir, "LICENSE"));
		unlinkSync(join(dir, "README.md"));
		rmdirSync(dir);
	} catch {
		// Ignore cleanup errors
	}
}

describe("Package Validation", () => {
	test("should validate a valid package", () => {
		const tempDir = createTempDir();

		try {
			createPackageJson(tempDir, {
				name: "@raven-js/test",
				version: "1.0.0",
				description: "Test package",
				author: {
					name: "Test Author",
					email: "test@example.com",
					url: "https://example.com",
				},
				license: "MIT",
				main: "index.js",
				scripts: {
					test: "echo test",
					"test:code": "node --test",
					"test:style": "biome check",
				},
			});

			createLicenseFile(tempDir);
			createReadmeFile(tempDir);
			writeFileSync(join(tempDir, "index.js"), "// Test file");

			const result = validatePackage(tempDir);

			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.errors.length, 0);
			assert.strictEqual(result.packageJson.name, "@raven-js/test");
			assert.strictEqual(result.path, tempDir);
		} finally {
			cleanupTempDir(tempDir);
		}
	});

	test("should detect missing author", () => {
		const tempDir = createTempDir();

		try {
			createPackageJson(tempDir, {
				name: "@raven-js/test",
				version: "1.0.0",
				license: "MIT",
			});

			createLicenseFile(tempDir);
			createReadmeFile(tempDir);

			const result = validatePackage(tempDir);

			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.errors.length, 2);
			assert.strictEqual(
				result.errors.some((e) => e.code === "MISSING_AUTHOR"),
				true,
			);
			assert.strictEqual(
				result.errors.some((e) => e.code === "MISSING_SCRIPTS"),
				true,
			);
		} finally {
			cleanupTempDir(tempDir);
		}
	});

	test("should detect missing license file", () => {
		const tempDir = createTempDir();

		try {
			createPackageJson(tempDir, {
				name: "@raven-js/test",
				version: "1.0.0",
				author: {
					name: "Test Author",
					email: "test@example.com",
					url: "https://example.com",
				},
				license: "MIT",
			});

			createReadmeFile(tempDir);

			const result = validatePackage(tempDir);

			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.errors.length, 2);
			assert.strictEqual(
				result.errors.some((e) => e.code === "MISSING_LICENSE_FILE"),
				true,
			);
			assert.strictEqual(
				result.errors.some((e) => e.code === "MISSING_SCRIPTS"),
				true,
			);
		} finally {
			cleanupTempDir(tempDir);
		}
	});

	test("should detect missing README.md", () => {
		const tempDir = createTempDir();

		try {
			createPackageJson(tempDir, {
				name: "@raven-js/test",
				version: "1.0.0",
				author: {
					name: "Test Author",
					email: "test@example.com",
					url: "https://example.com",
				},
				license: "MIT",
			});

			createLicenseFile(tempDir);

			const result = validatePackage(tempDir);

			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.errors.length, 2);
			assert.strictEqual(
				result.errors.some((e) => e.code === "MISSING_README"),
				true,
			);
			assert.strictEqual(
				result.errors.some((e) => e.code === "MISSING_SCRIPTS"),
				true,
			);
		} finally {
			cleanupTempDir(tempDir);
		}
	});

	test("should detect invalid version format", () => {
		const tempDir = createTempDir();

		try {
			createPackageJson(tempDir, {
				name: "@raven-js/test",
				version: "invalid-version",
				author: {
					name: "Test Author",
					email: "test@example.com",
					url: "https://example.com",
				},
				license: "MIT",
			});

			createLicenseFile(tempDir);
			createReadmeFile(tempDir);

			const result = validatePackage(tempDir);

			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.errors.length, 2);
			assert.strictEqual(
				result.errors.some((e) => e.code === "INVALID_VERSION"),
				true,
			);
			assert.strictEqual(
				result.errors.some((e) => e.code === "MISSING_SCRIPTS"),
				true,
			);
		} finally {
			cleanupTempDir(tempDir);
		}
	});

	test("should detect missing main entry point", () => {
		const tempDir = createTempDir();

		try {
			createPackageJson(tempDir, {
				name: "@raven-js/test",
				version: "1.0.0",
				author: {
					name: "Test Author",
					email: "test@example.com",
					url: "https://example.com",
				},
				license: "MIT",
				main: "missing-file.js",
			});

			createLicenseFile(tempDir);
			createReadmeFile(tempDir);

			const result = validatePackage(tempDir);

			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.errors.length, 2);
			assert.strictEqual(
				result.errors.some((e) => e.code === "MISSING_MAIN_ENTRY"),
				true,
			);
			assert.strictEqual(
				result.errors.some((e) => e.code === "MISSING_SCRIPTS"),
				true,
			);
		} finally {
			cleanupTempDir(tempDir);
		}
	});

	test("should handle invalid package.json", () => {
		const tempDir = createTempDir();

		try {
			writeFileSync(join(tempDir, "package.json"), "invalid json");

			const result = validatePackage(tempDir);

			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.errors.length, 1);
			assert.strictEqual(result.errors[0].code, "PACKAGE_READ_ERROR");
		} finally {
			cleanupTempDir(tempDir);
		}
	});

	test("should handle missing package.json", () => {
		const tempDir = createTempDir();

		try {
			const result = validatePackage(tempDir);

			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.errors.length, 1);
			assert.strictEqual(result.errors[0].code, "PACKAGE_READ_ERROR");
		} finally {
			cleanupTempDir(tempDir);
		}
	});

	test("should detect missing scripts", () => {
		const tempDir = createTempDir();

		try {
			createPackageJson(tempDir, {
				name: "@raven-js/test",
				version: "1.0.0",
				author: {
					name: "Test Author",
					email: "test@example.com",
					url: "https://example.com",
				},
				license: "MIT",
			});

			createLicenseFile(tempDir);
			createReadmeFile(tempDir);

			const result = validatePackage(tempDir);

			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.errors.length, 1);
			assert.strictEqual(result.errors[0].code, "MISSING_SCRIPTS");
		} finally {
			cleanupTempDir(tempDir);
		}
	});

	test("should detect missing required scripts", () => {
		const tempDir = createTempDir();

		try {
			createPackageJson(tempDir, {
				name: "@raven-js/test",
				version: "1.0.0",
				author: {
					name: "Test Author",
					email: "test@example.com",
					url: "https://example.com",
				},
				license: "MIT",
				scripts: {
					test: "echo test",
					// Missing test:code, test:style
				},
			});

			createLicenseFile(tempDir);
			createReadmeFile(tempDir);

			const result = validatePackage(tempDir);

			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.errors.length, 2);
			assert.strictEqual(
				result.errors.some((e) => e.code === "MISSING_SCRIPT"),
				true,
			);
		} finally {
			cleanupTempDir(tempDir);
		}
	});

	test("should detect empty script values", () => {
		const tempDir = createTempDir();

		try {
			createPackageJson(tempDir, {
				name: "@raven-js/test",
				version: "1.0.0",
				author: {
					name: "Test Author",
					email: "test@example.com",
					url: "https://example.com",
				},
				license: "MIT",
				scripts: {
					test: "echo test",
					"test:code": "",
					"test:style": "biome check",
				},
			});

			createLicenseFile(tempDir);
			createReadmeFile(tempDir);

			const result = validatePackage(tempDir);

			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.errors.length, 1);
			assert.strictEqual(result.errors[0].code, "MISSING_SCRIPT");
			assert.strictEqual(result.errors[0].field, "scripts.test:code");
		} finally {
			cleanupTempDir(tempDir);
		}
	});
});

describe("Package Info Functions", () => {
	test("should check if directory is valid package", () => {
		const tempDir = createTempDir();

		try {
			assert.strictEqual(isValidPackage(tempDir), false);

			createPackageJson(tempDir, {
				name: "@raven-js/test",
				version: "1.0.0",
			});

			assert.strictEqual(isValidPackage(tempDir), true);
		} finally {
			cleanupTempDir(tempDir);
		}
	});

	test("should get package info", () => {
		const tempDir = createTempDir();

		try {
			const packageJson = {
				name: "@raven-js/test",
				version: "1.0.0",
				private: true,
			};

			createPackageJson(tempDir, packageJson);

			const info = getPackageInfo(tempDir);

			assert.strictEqual(info.name, "@raven-js/test");
			assert.strictEqual(info.path, tempDir);
			assert.strictEqual(info.private, true);
			assert.deepStrictEqual(info.packageJson, packageJson);
		} finally {
			cleanupTempDir(tempDir);
		}
	});

	test("should read package.json", () => {
		const tempDir = createTempDir();

		try {
			const packageJson = {
				name: "@raven-js/test",
				version: "1.0.0",
			};

			createPackageJson(tempDir, packageJson);

			const result = readPackageJson(tempDir);

			assert.deepStrictEqual(result, packageJson);
		} finally {
			cleanupTempDir(tempDir);
		}
	});
});

describe("Workspace Functions", () => {
	test("should get workspace packages", () => {
		const workspaceDir = createTempDir();
		const packagesDir = join(workspaceDir, "packages");

		try {
			mkdirSync(packagesDir);

			// Create test package 1
			const pkg1Dir = join(packagesDir, "test1");
			mkdirSync(pkg1Dir);
			createPackageJson(pkg1Dir, {
				name: "@raven-js/test1",
				version: "1.0.0",
				private: false,
			});

			// Create test package 2
			const pkg2Dir = join(packagesDir, "test2");
			mkdirSync(pkg2Dir);
			createPackageJson(pkg2Dir, {
				name: "@raven-js/test2",
				version: "1.0.0",
				private: true,
			});

			// Create invalid directory (no package.json)
			const invalidDir = join(packagesDir, "invalid");
			mkdirSync(invalidDir);

			const packages = getWorkspacePackages(workspaceDir);

			assert.strictEqual(packages.length, 2);
			assert.strictEqual(packages[0].name, "@raven-js/test1");
			assert.strictEqual(packages[0].private, false);
			assert.strictEqual(packages[1].name, "@raven-js/test2");
			assert.strictEqual(packages[1].private, true);
		} finally {
			// Cleanup
			try {
				unlinkSync(join(workspaceDir, "packages", "test1", "package.json"));
				rmdirSync(join(workspaceDir, "packages", "test1"));
				unlinkSync(join(workspaceDir, "packages", "test2", "package.json"));
				rmdirSync(join(workspaceDir, "packages", "test2"));
				rmdirSync(join(workspaceDir, "packages", "invalid"));
				rmdirSync(join(workspaceDir, "packages"));
				rmdirSync(workspaceDir);
			} catch {
				// Ignore cleanup errors
			}
		}
	});

	test("should validate workspace", () => {
		const workspaceDir = createTempDir();
		const packagesDir = join(workspaceDir, "packages");

		try {
			mkdirSync(packagesDir);

			// Create valid package
			const validPkgDir = join(packagesDir, "valid");
			mkdirSync(validPkgDir);
			createPackageJson(validPkgDir, {
				name: "@raven-js/valid",
				version: "1.0.0",
				author: {
					name: "Test Author",
					email: "test@example.com",
					url: "https://example.com",
				},
				license: "MIT",
				scripts: {
					test: "echo test",
					"test:code": "node --test",
					"test:style": "biome check",
				},
			});
			createLicenseFile(validPkgDir);
			createReadmeFile(validPkgDir);

			// Create invalid package (missing author)
			const invalidPkgDir = join(packagesDir, "invalid");
			mkdirSync(invalidPkgDir);
			createPackageJson(invalidPkgDir, {
				name: "@raven-js/invalid",
				version: "1.0.0",
				license: "MIT",
			});
			createLicenseFile(invalidPkgDir);
			createReadmeFile(invalidPkgDir);

			const result = validateWorkspace(workspaceDir);

			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.packages.length, 2);
			assert.strictEqual(result.results.length, 2);

			const validResult = result.results.find(
				(r) => r.packageJson?.name === "@raven-js/valid",
			);
			const invalidResult = result.results.find(
				(r) => r.packageJson?.name === "@raven-js/invalid",
			);

			assert.strictEqual(validResult?.valid, true);
			assert.strictEqual(invalidResult?.valid, false);
		} finally {
			// Cleanup
			try {
				unlinkSync(join(workspaceDir, "packages", "valid", "package.json"));
				unlinkSync(join(workspaceDir, "packages", "valid", "LICENSE"));
				unlinkSync(join(workspaceDir, "packages", "valid", "README.md"));
				rmdirSync(join(workspaceDir, "packages", "valid"));
				unlinkSync(join(workspaceDir, "packages", "invalid", "package.json"));
				unlinkSync(join(workspaceDir, "packages", "invalid", "LICENSE"));
				unlinkSync(join(workspaceDir, "packages", "invalid", "README.md"));
				rmdirSync(join(workspaceDir, "packages", "invalid"));
				rmdirSync(join(workspaceDir, "packages"));
				rmdirSync(workspaceDir);
			} catch {
				// Ignore cleanup errors
			}
		}
	});
});
