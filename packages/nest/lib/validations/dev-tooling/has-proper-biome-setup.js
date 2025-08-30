/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PackageJsonListWorkspacePackages } from "../../queries/index.js";

/**
 * Validates that biome is properly set up in a workspace
 * - Biome should be in root devDependencies only
 * - No individual packages should have biome dependencies
 * - Linux binaries should be available for CI
 */
export const HasProperBiomeSetup = (/** @type {string} */ workspacePath) => {
	if (typeof workspacePath !== "string" || workspacePath === "") {
		throw new Error("Workspace path must be a non-empty string");
	}

	const violations = [];

	// Check root package.json has biome in devDependencies
	const rootPackageJsonPath = join(workspacePath, "package.json");
	if (!existsSync(rootPackageJsonPath)) {
		throw new Error("Workspace root must have package.json");
	}

	let rootPackageData;
	try {
		const content = readFileSync(rootPackageJsonPath, "utf8");
		rootPackageData = JSON.parse(content);
	} catch (error) {
		throw new Error(
			`Cannot parse root package.json: ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	// Verify biome is in root devDependencies
	const hasBiomeInDevDeps = rootPackageData.devDependencies?.["@biomejs/biome"];

	if (!hasBiomeInDevDeps) {
		violations.push(
			"Biome must be installed as devDependency in workspace root",
		);
	}

	// Check that biome is NOT in root dependencies (wrong place)
	const hasBiomeInDeps = rootPackageData.dependencies?.["@biomejs/biome"];

	if (hasBiomeInDeps) {
		violations.push("Biome should be in devDependencies, not dependencies");
	}

	// Check individual packages don't have biome dependencies
	try {
		const packagePaths = PackageJsonListWorkspacePackages(workspacePath);
		for (const relativePath of packagePaths) {
			const packagePath = join(workspacePath, relativePath);
			const packageJsonPath = join(packagePath, "package.json");

			if (existsSync(packageJsonPath)) {
				try {
					const content = readFileSync(packageJsonPath, "utf8");
					const packageData = JSON.parse(content);

					// Check both dependencies and devDependencies
					const hasInDeps = packageData.dependencies?.["@biomejs/biome"];
					const hasInDevDeps = packageData.devDependencies?.["@biomejs/biome"];

					if (hasInDeps || hasInDevDeps) {
						violations.push(
							`Package ${relativePath} should not have biome dependency (use workspace root)`,
						);
					}
				} catch {
					// Skip packages with invalid JSON
				}
			}
		}
	} catch {
		// If we can't list packages, skip individual package checks
	}

	// Check Linux binary is available in node_modules (only on Linux systems)
	// On macOS/Windows, npm only installs platform-specific binaries locally
	// But lockfile should still contain all platform references for CI
	const isLinux = process.platform === "linux";
	if (isLinux && hasBiomeInDevDeps) {
		const linuxBinaryPath = join(
			workspacePath,
			"node_modules",
			"@biomejs",
			"cli-linux-x64",
		);
		if (!existsSync(linuxBinaryPath)) {
			violations.push(
				"Biome Linux binary missing (required for CI) - try: npm uninstall @biomejs/biome && npm install --save-dev @biomejs/biome",
			);
		}
	}

	// Check package-lock.json contains Linux binaries (if lockfile exists)
	const lockfilePath = join(workspacePath, "package-lock.json");
	if (hasBiomeInDevDeps && existsSync(lockfilePath)) {
		try {
			const lockContent = readFileSync(lockfilePath, "utf8");
			if (!lockContent.includes("@biomejs/cli-linux-x64")) {
				violations.push(
					"Package lockfile missing Linux binaries - reinstall biome to include cross-platform binaries",
				);
			}
		} catch {
			// Skip lockfile validation if we can't read it
		}
	}

	if (violations.length > 0) {
		throw new Error(
			`Biome setup validation failed:\n${violations.map((v) => `  ${v}`).join("\n")}`,
		);
	}

	return true;
};
