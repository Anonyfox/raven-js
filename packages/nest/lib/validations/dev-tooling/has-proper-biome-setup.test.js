/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { HasProperBiomeSetup } from "./has-proper-biome-setup.js";

describe("HasProperBiomeSetup", () => {
	let testDir;

	beforeEach(() => {
		// Create unique temporary directory for each test
		testDir = mkdtempSync(join(tmpdir(), "biome-validation-"));
	});

	afterEach(() => {
		// Clean up temporary directory after each test
		try {
			rmSync(testDir, { recursive: true, force: true });
		} catch {
			// Ignore cleanup errors
		}
	});

	it("should throw error for empty workspace path", () => {
		assert.throws(
			() => HasProperBiomeSetup(""),
			/Workspace path must be a non-empty string/,
		);
	});

	it("should throw error for non-string workspace path", () => {
		assert.throws(
			() => HasProperBiomeSetup(null),
			/Workspace path must be a non-empty string/,
		);
	});

	it("should throw error when package.json is missing", () => {
		assert.throws(
			() => HasProperBiomeSetup(testDir),
			/Workspace root must have package.json/,
		);
	});

	it("should pass when biome is properly set up in root devDependencies", () => {
		// Create root package.json with biome in devDependencies
		const rootPackageJson = {
			name: "test-workspace",
			workspaces: ["packages/test"],
			devDependencies: {
				"@biomejs/biome": "^2.2.0",
			},
		};
		writeFileSync(
			join(testDir, "package.json"),
			JSON.stringify(rootPackageJson, null, 2),
		);

		// Create mock Linux binary directory
		const linuxBinaryDir = join(
			testDir,
			"node_modules",
			"@biomejs",
			"cli-linux-x64",
		);
		mkdirSync(linuxBinaryDir, { recursive: true });
		writeFileSync(join(linuxBinaryDir, "biome"), "mock binary");

		// Create package-lock.json with Linux binary reference
		const lockfile = {
			dependencies: {
				"@biomejs/cli-linux-x64": {
					version: "2.2.0",
				},
			},
		};
		writeFileSync(
			join(testDir, "package-lock.json"),
			JSON.stringify(lockfile, null, 2),
		);

		// Create workspace package without biome
		const packageDir = join(testDir, "packages", "test");
		mkdirSync(packageDir, { recursive: true });
		const packageJson = {
			name: "test-package",
			version: "1.0.0",
		};
		writeFileSync(
			join(packageDir, "package.json"),
			JSON.stringify(packageJson, null, 2),
		);

		assert.strictEqual(HasProperBiomeSetup(testDir), true);
	});

	it("should fail when biome is missing from root devDependencies", () => {
		const rootPackageJson = {
			name: "test-workspace",
			workspaces: ["packages/test"],
		};
		writeFileSync(
			join(testDir, "package.json"),
			JSON.stringify(rootPackageJson, null, 2),
		);

		assert.throws(
			() => HasProperBiomeSetup(testDir),
			/Biome must be installed as devDependency in workspace root/,
		);
	});

	it("should fail when biome is in root dependencies instead of devDependencies", () => {
		const rootPackageJson = {
			name: "test-workspace",
			workspaces: ["packages/test"],
			dependencies: {
				"@biomejs/biome": "^2.2.0",
			},
		};
		writeFileSync(
			join(testDir, "package.json"),
			JSON.stringify(rootPackageJson, null, 2),
		);

		assert.throws(
			() => HasProperBiomeSetup(testDir),
			/Biome should be in devDependencies, not dependencies/,
		);
	});

	it("should fail when individual packages have biome dependencies", () => {
		// Root setup correctly
		const rootPackageJson = {
			name: "test-workspace",
			workspaces: ["packages/test"],
			devDependencies: {
				"@biomejs/biome": "^2.2.0",
			},
		};
		writeFileSync(
			join(testDir, "package.json"),
			JSON.stringify(rootPackageJson, null, 2),
		);

		// Package incorrectly has biome
		const packageDir = join(testDir, "packages", "test");
		mkdirSync(packageDir, { recursive: true });
		const packageJson = {
			name: "test-package",
			version: "1.0.0",
			devDependencies: {
				"@biomejs/biome": "^2.1.0",
			},
		};
		writeFileSync(
			join(packageDir, "package.json"),
			JSON.stringify(packageJson, null, 2),
		);

		assert.throws(
			() => HasProperBiomeSetup(testDir),
			/Package packages\/test should not have biome dependency/,
		);
	});

	it("should fail when Linux binary is missing (Linux only)", () => {
		// Skip this test on non-Linux systems since binary check is platform-specific
		if (process.platform !== "linux") {
			return;
		}

		const rootPackageJson = {
			name: "test-workspace",
			workspaces: ["packages/test"],
			devDependencies: {
				"@biomejs/biome": "^2.2.0",
			},
		};
		writeFileSync(
			join(testDir, "package.json"),
			JSON.stringify(rootPackageJson, null, 2),
		);

		// No Linux binary directory created
		assert.throws(
			() => HasProperBiomeSetup(testDir),
			/Biome Linux binary missing.*required for CI/,
		);
	});

	it("should fail when lockfile missing Linux binary references", () => {
		const rootPackageJson = {
			name: "test-workspace",
			workspaces: ["packages/test"],
			devDependencies: {
				"@biomejs/biome": "^2.2.0",
			},
		};
		writeFileSync(
			join(testDir, "package.json"),
			JSON.stringify(rootPackageJson, null, 2),
		);

		// Create Linux binary directory
		const linuxBinaryDir = join(
			testDir,
			"node_modules",
			"@biomejs",
			"cli-linux-x64",
		);
		mkdirSync(linuxBinaryDir, { recursive: true });

		// Create lockfile without Linux references
		const lockfile = {
			dependencies: {
				"@biomejs/biome": {
					version: "2.2.0",
				},
			},
		};
		writeFileSync(
			join(testDir, "package-lock.json"),
			JSON.stringify(lockfile, null, 2),
		);

		assert.throws(
			() => HasProperBiomeSetup(testDir),
			/Package lockfile missing Linux binaries/,
		);
	});
});
