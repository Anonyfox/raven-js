#!/usr/bin/env node

/**
 * @fileoverview Raven's development nest - CLI entry point
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { Folder, listPackages, validatePackage } from "../lib/index.js";

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

	// Create a Folder instance for the target path
	const folder = new Folder(resolvedPath);

	// Check if this is a workspace
	const workspacePackages = listPackages(folder);

	if (workspacePackages) {
		// This is a workspace - validate all packages including root
		console.log("📦 Detected workspace - validating all packages...");

		let allValid = true;
		const packagesToValidate = [".", ...workspacePackages];

		for (const packagePath of packagesToValidate) {
			const fullPath =
				packagePath === "." ? resolvedPath : `${resolvedPath}/${packagePath}`;
			const packageName = packagePath === "." ? "workspace root" : packagePath;

			console.log(`\n🔍 Validating ${packageName}...`);
			const result = validatePackage(fullPath);

			if (result.valid) {
				console.log(`✅ ${packageName}: Valid`);
			} else {
				console.log(`❌ ${packageName}: Invalid`);
				allValid = false;
				for (const error of result.errors) {
					console.log(`   ${error.code}: ${error.message}`);
				}
			}
		}

		if (!allValid) {
			console.log("\n❌ Workspace validation failed");
			process.exit(1);
		} else {
			console.log("\n✅ Workspace validation passed");
		}
	} else {
		// This is a single package - validate just this package
		console.log("📦 Detected single package - validating...");

		const result = validatePackage(resolvedPath);

		if (result.valid) {
			console.log("✅ Package is valid");
		} else {
			console.log("❌ Package validation failed:");
			for (const error of result.errors) {
				console.log(`   ${error.code}: ${error.message}`);
			}
			process.exit(1);
		}
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
 * Handle version command
 * @param {string[]} _args - Command arguments
 * @param {Object} _options - Command options
 */
async function handleVersionCommand(_args, _options) {
	console.log("🦅 Version command not yet implemented");
	console.log("This will handle version management");
}

// Run the CLI
main().catch((error) => {
	console.error("❌ Error:", error.message);
	process.exit(1);
});
