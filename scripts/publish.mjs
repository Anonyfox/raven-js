import { execSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Get all packages in the workspace
 * @param {string} [root] - Workspace root directory
 * @returns {Promise<Array<{name: string, path: string, private: boolean, packageJson: Object}>>}
 */
async function getPackages(root = process.cwd()) {
	const packagesDir = join(root, "packages");

	try {
		const entries = await readdir(packagesDir, { withFileTypes: true });
		const packages = [];

		for (const entry of entries) {
			if (entry.isDirectory()) {
				const packagePath = join(packagesDir, entry.name);
				const packageJsonPath = join(packagePath, "package.json");

				try {
					const packageJson = JSON.parse(
						await readFile(packageJsonPath, "utf8"),
					);

					packages.push({
						name: packageJson.name,
						path: packagePath,
						private: packageJson.private || false,
						packageJson,
					});
				} catch {
					// Skip packages without valid package.json
					console.warn(`⚠️  Skipping ${entry.name}: invalid package.json`);
				}
			}
		}

		return packages;
	} catch (error) {
		console.error("❌ Error reading packages directory:", error.message);
		return [];
	}
}

/**
 * Get public packages (non-private)
 * @param {string} [root] - Workspace root directory
 * @returns {Promise<Array<{name: string, path: string, private: boolean, packageJson: Object}>>}
 */
async function getPublicPackages(root = process.cwd()) {
	const packages = await getPackages(root);
	return packages.filter((pkg) => !pkg.private);
}

/**
 * Log package information for debugging
 * @param {Array<{name: string, private: boolean}>} packages - Array of package objects
 * @param {string} [prefix] - Prefix for log messages
 */
function logPackages(packages, prefix = "Packages") {
	console.log(`📦 ${prefix}:`);
	for (const pkg of packages) {
		const status = pkg.private ? "🔒 private" : "🌐 public";
		console.log(`   ${pkg.name} (${status})`);
	}
}

// Check if we're on a version tag
const currentTag = execSync(
	'git describe --tags --exact-match 2>/dev/null || echo ""',
	{ encoding: "utf8" },
).trim();

if (!currentTag.startsWith("v")) {
	console.log("Not on a version tag, skipping publish");
	process.exit(0);
}

const version = currentTag.slice(1);
console.log(`Publishing version ${version}`);

// Verify all tests pass
console.log("Running tests...");
execSync("npm test", { stdio: "inherit" });

// Verify linting passes
console.log("Running linting...");
execSync("npm run lint", { stdio: "inherit" });

// Refresh workspace bin links after tests built new binaries
console.log("Refreshing workspace bin links...");
execSync("npm install --prefer-offline --no-audit", { stdio: "inherit" });

// Generate complete documentation
console.log("Generating complete documentation...");
execSync("npm run nest:docs", { stdio: "inherit" });

// Build and copy VS Code extension
console.log("Building VS Code extension...");
const originalCwd = process.cwd();
try {
	// Build the extension
	execSync("cd plugins/vscode && npm run build", { stdio: "inherit" });

	// Copy the built extension to docs
	console.log("Copying VS Code extension to docs...");
	execSync("cp plugins/vscode/ravenjs-vscode-*.vsix docs/ravenjs-vscode.vsix", {
		stdio: "inherit",
	});

	console.log("✅ VS Code extension built and copied to docs");
} catch (error) {
	console.error("❌ Error building VS Code extension:", error.message);
	process.exit(1);
} finally {
	// Return to original directory
	process.chdir(originalCwd);
}

// Get public packages only
const publicPackages = await getPublicPackages();
logPackages(publicPackages, "Publishing packages");

// Publish public packages
for (const pkg of publicPackages) {
	console.log(`Publishing ${pkg.name}...`);
	execSync(`cd ${pkg.path} && npm publish --access public`, {
		stdio: "inherit",
	});
}

console.log(`✅ Successfully published version ${version}`);
