#!/usr/bin/env node

/**
 * @fileoverview Raven's development nest - CLI entry point
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { execSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

/**
 * Find the workspace root by looking for a package.json with workspaces
 * @param {string} startPath - Path to start searching from
 * @returns {string} Path to workspace root
 */
function findWorkspaceRoot(startPath) {
	let currentPath = startPath;

	while (currentPath !== dirname(currentPath)) {
		const packageJsonPath = join(currentPath, "package.json");
		if (existsSync(packageJsonPath)) {
			try {
				const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
				if (packageJson.workspaces && Array.isArray(packageJson.workspaces)) {
					return currentPath;
				}
			} catch {
				// Continue searching if package.json is invalid
			}
		}
		currentPath = dirname(currentPath);
	}

	// If no workspace found, return the original path
	return startPath;
}

import {
	copyFavicon,
	generateAllBundles,
	generateContextJson,
	generateLandingPage,
	generateTypeDoc,
	getDocsPath,
} from "../lib/docs/index.js";
import { bumpVersion, updatePackageVersions } from "../lib/index.js";
import { PackageJsonListPublicPackages } from "../lib/queries/index.js";
import { validate } from "../lib/rules/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version info
const packageJson = JSON.parse(
	readFileSync(join(__dirname, "..", "package.json"), "utf8"),
);

/**
 * Display help information
 */
function showHelp() {
	console.log(`
🦅 Raven's Nest - Development CLI

Usage: nest <command> [options]

Commands:
  validate  Validate package(s) - detects workspace vs single package
  check     Alias for validate
  build     Build packages with esbuild
  publish   Publish packages to npm
  docs      Generate documentation
  build-docs Build documentation for packages
  version   Manage package versions

Options:
  --help, -h    Show this help message
  --version, -v Show version information

Examples:
  nest validate                    # Validate current directory (workspace or package)
  nest validate packages/beak      # Validate specific package
  nest validate /path/to/workspace # Validate workspace at specific path
  nest build
  nest publish
  nest docs
  nest build-docs                  # Build documentation for all packages
  nest build-docs packages/beak    # Build documentation for specific package
  nest version --bump patch

For more information, visit: https://ravenjs.dev
`);
}

/**
 * Display version information
 */
function showVersion() {
	console.log(`nest v${packageJson.version}`);
}

/**
 * Main CLI function
 */
async function main() {
	const { values, positionals } = parseArgs({
		args: process.argv.slice(2),
		allowPositionals: true,
		options: {
			help: { type: "boolean", short: "h" },
			version: { type: "boolean", short: "v" },
		},
	});

	// Handle help and version flags
	if (values.help) {
		showHelp();
		return;
	}

	if (values.version) {
		showVersion();
		return;
	}

	// Get command from positional arguments
	const [command] = positionals;

	if (!command) {
		console.error("❌ Error: No command specified");
		showHelp();
		process.exit(1);
	}

	// Route commands
	switch (command) {
		case "validate":
		case "check":
			await handleValidateCommand(positionals.slice(1), values);
			break;
		case "build":
			await handleBuildCommand(positionals.slice(1), values);
			break;
		case "publish":
			await handlePublishCommand(positionals.slice(1), values);
			break;
		case "docs":
			await handleDocsCommand(positionals.slice(1), values);
			break;
		case "build-docs":
			await handleBuildDocsCommand(positionals.slice(1), values);
			break;
		case "version":
			await handleVersionCommand(positionals.slice(1), values);
			break;
		default:
			console.error(`❌ Error: Unknown command "${command}"`);
			showHelp();
			process.exit(1);
	}
}

/**
 * Handle validate command
 * @param {string[]} args - Command arguments
 * @param {Object} _options - Command options
 */
async function handleValidateCommand(args, _options) {
	const [targetPath = "."] = args;
	const resolvedPath = targetPath === "." ? process.cwd() : targetPath;

	console.log(`🦅 Validating: ${targetPath}`);

	try {
		validate(resolvedPath);
		console.log("✅ Validation passed");
	} catch (/** @type {unknown} */ error) {
		const message = error instanceof Error ? error.message : String(error);
		console.log(`❌ Validation failed: ${message}`);
		process.exit(1);
	}
}

/**
 * Handle build command
 * @param {string[]} _args - Command arguments
 * @param {Object} _options - Command options
 */
async function handleBuildCommand(_args, _options) {
	console.log("🦅 Build command not yet implemented");
	console.log("This will handle building packages with esbuild");
}

/**
 * Handle publish command
 * @param {string[]} _args - Command arguments
 * @param {Object} _options - Command options
 */
async function handlePublishCommand(_args, _options) {
	console.log("🦅 Publish command not yet implemented");
	console.log("This will handle publishing packages to npm");
}

/**
 * Handle docs command
 * @param {string[]} _args - Command arguments
 * @param {Object} _options - Command options
 */
async function handleDocsCommand(_args, _options) {
	console.log("🦅 Docs command not yet implemented");
	console.log("This will handle generating documentation");
}

/**
 * Handle build-docs command
 * @param {string[]} args - Command arguments
 * @param {Object} _options - Command options
 */
async function handleBuildDocsCommand(args, _options) {
	const [targetPath = "."] = args;
	const resolvedPath =
		targetPath === "." ? process.cwd() : join(process.cwd(), targetPath);

	console.log(`🦅 Building documentation: ${targetPath}`);

	try {
		// Get the docs folder path
		const docsPath = getDocsPath(resolvedPath);
		console.log(`📁 Docs folder: ${docsPath}`);

		// Store the workspace path
		const workspacePath = resolvedPath;

		// Check if this is a workspace or single package
		let workspacePackages = null;
		try {
			if (workspacePath) {
				workspacePackages = PackageJsonListPublicPackages(workspacePath);
			}
		} catch {
			// Not a workspace
			workspacePackages = null;
		}

		if (workspacePackages && workspacePackages.length > 0) {
			// This is a workspace - build docs for all packages
			console.log("📦 Detected workspace - building docs for all packages...");

			// Always clean and recreate the docs folder when building from workspace root
			console.log("🧹 Cleaning docs folder...");
			if (existsSync(docsPath)) {
				rmSync(docsPath, { recursive: true, force: true });
			}
			mkdirSync(docsPath, { recursive: true });

			// Build docs for each package
			for (const packagePath of workspacePackages) {
				const packageName = packagePath.split("/").pop();
				if (packageName) {
					console.log(`\n📦 Building docs for ${packageName}...`);
					await buildPackageDocs(packageName, workspacePath, docsPath, true);
				}
			}

			// Copy favicon to root docs directory
			console.log("\n🖼️  Copying favicon...");
			copyFavicon(docsPath, resolvedPath);

			// Generate landing page
			console.log("\n📄 Generating landing page...");
			const packageNames = workspacePackages
				.map((p) => p.split("/").pop())
				.filter((p) => p !== undefined);
			const landingPageHtml = generateLandingPage(packageNames, workspacePath);
			writeFileSync(join(docsPath, "index.html"), landingPageHtml);

			console.log("\n✅ Workspace documentation built successfully");
		} else {
			// This is a single package - build docs for just this package
			console.log("📦 Detected single package - building docs...");

			// Get package name from current directory
			const packageName = resolvedPath.split("/").pop();
			if (!packageName) {
				throw new Error("Could not determine package name from path");
			}

			// Ensure docs folder exists (don't delete existing content for single package mode)
			if (!existsSync(docsPath)) {
				console.log("📁 Creating docs folder...");
				mkdirSync(docsPath, { recursive: true });
			}

			await buildPackageDocs(packageName, workspacePath, docsPath, false);

			// Copy favicon to package docs directory
			console.log("\n🖼️  Copying favicon...");
			// In single package mode, we need to find the workspace root
			const workspaceRoot = findWorkspaceRoot(resolvedPath);
			copyFavicon(docsPath, workspaceRoot);

			console.log("\n✅ Package documentation built successfully");
		}
	} catch (error) {
		console.error(
			"❌ Error building documentation:",
			error instanceof Error ? error.message : String(error),
		);
		process.exit(1);
	}
}

/**
 * Build documentation for a single package
 * @param {string} packageName - Name of the package
 * @param {string} workspacePath - Path to workspace root
 * @param {string} docsPath - Path to the docs folder
 * @param {boolean} isWorkspace - Whether this is being called from workspace mode
 */
async function buildPackageDocs(
	packageName,
	workspacePath,
	docsPath,
	isWorkspace = true,
) {
	// Generate context file
	console.log(`  📄 Generating context for ${packageName}...`);
	const packagePath = isWorkspace
		? join(workspacePath, "packages", packageName)
		: workspacePath;
	const contextJson = generateContextJson(packagePath);
	if (contextJson) {
		writeFileSync(
			join(docsPath, `${packageName}.context.json`),
			/** @type {string} */ (contextJson),
		);
		console.log(`  ✅ Context file generated: ${packageName}.context.json`);
	} else {
		console.log(`  ⚠️  Could not generate context for ${packageName}`);
	}

	// Generate bundles
	console.log(`  📦 Generating bundles for ${packageName}...`);
	const bundles = await generateAllBundles(packagePath, packageName);
	if (bundles) {
		// Write bundle files directly to docs folder with new naming pattern
		if (bundles.cjs) {
			writeFileSync(
				join(docsPath, `${packageName}.bundle.cjs`),
				bundles.cjs.code,
			);
			if (bundles.cjs.map) {
				writeFileSync(
					join(docsPath, `${packageName}.bundle.cjs.map`),
					bundles.cjs.map,
				);
			}
		}
		if (bundles.cjsMin) {
			writeFileSync(
				join(docsPath, `${packageName}.bundle.cjs.min.js`),
				bundles.cjsMin.code,
			);
			if (bundles.cjsMin.map) {
				writeFileSync(
					join(docsPath, `${packageName}.bundle.cjs.min.js.map`),
					bundles.cjsMin.map,
				);
			}
		}
		if (bundles.esm) {
			writeFileSync(
				join(docsPath, `${packageName}.bundle.esm.js`),
				bundles.esm.code,
			);
			if (bundles.esm.map) {
				writeFileSync(
					join(docsPath, `${packageName}.bundle.esm.js.map`),
					bundles.esm.map,
				);
			}
		}
		if (bundles.esmMin) {
			writeFileSync(
				join(docsPath, `${packageName}.bundle.esm.min.js`),
				bundles.esmMin.code,
			);
			if (bundles.esmMin.map) {
				writeFileSync(
					join(docsPath, `${packageName}.bundle.esm.min.js.map`),
					bundles.esmMin.map,
				);
			}
		}

		console.log(`  ✅ Bundles generated for ${packageName}`);
	} else {
		console.log(`  ⚠️  Could not generate bundles for ${packageName}`);
	}

	// Generate TypeDoc documentation
	console.log(`  📚 Generating TypeDoc documentation for ${packageName}...`);
	const packageDocsPath = join(docsPath, packageName);
	const typeDocSuccess = await generateTypeDoc(packagePath, packageDocsPath);
	if (typeDocSuccess) {
		console.log(`  ✅ TypeDoc documentation generated: ${packageName}/`);
	} else {
		console.log(
			`  ⚠️  Could not generate TypeDoc documentation for ${packageName}`,
		);
	}

	// Copy favicon to package docs directory
	console.log(`  🖼️  Copying favicon for ${packageName}...`);
	const workspaceRoot = isWorkspace
		? workspacePath
		: workspacePath || process.cwd();
	copyFavicon(packageDocsPath, workspaceRoot);
}

/**
 * Handle version command
 * @param {string[]} args - Command arguments
 * @param {Object} _options - Command options
 */
async function handleVersionCommand(args, _options) {
	const [bumpType] = args;

	if (!bumpType || !["major", "minor", "patch"].includes(bumpType)) {
		console.error("❌ Error: Invalid version bump type");
		console.error("Usage: nest version [major|minor|patch]");
		console.error("");
		console.error("Examples:");
		console.error(
			"  nest version major  # Bump major version (1.0.0 -> 2.0.0)",
		);
		console.error(
			"  nest version minor  # Bump minor version (1.0.0 -> 1.1.0)",
		);
		console.error(
			"  nest version patch  # Bump patch version (1.0.0 -> 1.0.1)",
		);
		process.exit(1);
	}

	console.log(`🦅 Bumping version: ${bumpType}`);

	try {
		// Find workspace root
		const workspaceRoot = findWorkspaceRoot(process.cwd());
		console.log(`📦 Workspace root: ${workspaceRoot}`);

		// Read current version from root package.json
		const rootPackagePath = join(workspaceRoot, "package.json");
		const rootPackage = JSON.parse(readFileSync(rootPackagePath, "utf8"));
		const currentVersion = rootPackage.version;

		console.log(`📋 Current version: ${currentVersion}`);

		// Calculate new version
		const newVersion = bumpVersion(
			currentVersion,
			/** @type {"major" | "minor" | "patch"} */ (bumpType),
		);
		console.log(`🆕 New version: ${newVersion}`);

		// Update all package versions
		console.log("📝 Updating package versions...");
		const result =
			/** @type {{updated: string[], skipped: string[], errors: string[]}} */ (
				updatePackageVersions(workspaceRoot, newVersion)
			);

		// Display results
		if (result.updated.length > 0) {
			console.log("✅ Updated packages:");
			for (const pkg of result.updated) {
				console.log(`   📦 ${pkg}`);
			}
		}

		if (result.skipped.length > 0) {
			console.log("⏭️  Skipped private packages:");
			for (const pkg of result.skipped) {
				console.log(`   🔒 ${pkg}`);
			}
		}

		if (result.errors.length > 0) {
			console.log("❌ Errors:");
			for (const error of result.errors) {
				console.log(`   ${error}`);
			}
			process.exit(1);
		}

		console.log(`\n✅ Successfully bumped version to ${newVersion}`);

		// Perform git operations
		console.log("🔧 Performing git operations...");

		// Add all changes
		execSync("git add .");
		console.log("✅ Added all changes to git");

		// Commit the version bump
		execSync(`git commit -m "chore: bump version to ${newVersion}"`);
		console.log("✅ Committed version bump");

		// Create git tag
		execSync(`git tag v${newVersion}`);
		console.log(`✅ Created git tag v${newVersion}`);

		// Push to origin
		execSync("git push origin main", { stdio: "inherit" });
		execSync(`git push origin v${newVersion}`, { stdio: "inherit" });
		console.log("✅ Pushed changes and tag to origin");

		console.log(
			"\n🎉 Version bump complete! Ready to publish with: nest publish",
		);
	} catch (error) {
		console.error(
			"❌ Error:",
			error instanceof Error ? error.message : String(error),
		);
		process.exit(1);
	}
}

// Run the CLI
main().catch((error) => {
	console.error("❌ Error:", error.message);
	process.exit(1);
});
