/**
 * @fileoverview Generate TypeDoc documentation for packages
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

/**
 * Get entry points for TypeDoc generation
 * @param {import('../folder.js').Folder} folder - Folder instance containing package files
 * @returns {string[]} Array of entry point paths
 */
export function getEntryPoints(folder) {
	try {
		const packageJsonContent = folder.getFile("package.json");
		if (!packageJsonContent) {
			return [];
		}

		const packageJson = JSON.parse(packageJsonContent);

		// For TypeDoc, we'll use the main entry point and let it discover files through jsconfig.json
		if (packageJson.main) {
			return [packageJson.main];
		}

		// Fallback to exports if no main
		if (packageJson.exports) {
			return Object.values(packageJson.exports)
				.map((entry) => entry.import)
				.filter(Boolean);
		}

		return [];
	} catch {
		return [];
	}
}

/**
 * Generate TypeDoc configuration for a package
 * @param {import('../folder.js').Folder} folder - Folder instance containing package files
 * @param {string} outputPath - Output directory path
 * @returns {import('../types.js').TypeDocConfig|null} TypeDoc configuration object or null if generation fails
 */
export function generateTypeDocConfig(folder, outputPath) {
	try {
		const packageJsonContent = folder.getFile("package.json");
		if (!packageJsonContent) {
			return null;
		}

		const packageJson = JSON.parse(packageJsonContent);
		const entryPoints = getEntryPoints(folder);

		if (entryPoints.length === 0) {
			return null;
		}

		return {
			entryPoints,
			out: outputPath,
			skipErrorChecking: true,
			customFooterHtml: '<a href="/">View all RavenJS packages</a>',
			name: packageJson.name,
			tsconfig: "./jsconfig.json",
		};
	} catch {
		return null;
	}
}

/**
 * Check if package has valid TypeDoc configuration
 * @param {import('../folder.js').Folder} folder - Folder instance containing package files
 * @returns {boolean} True if package can generate TypeDoc documentation
 */
export function canGenerateTypeDoc(folder) {
	const config = generateTypeDocConfig(folder, "./temp");
	return config !== null && config.entryPoints.length > 0;
}

/**
 * Generate TypeDoc documentation for a package
 * @param {import('../folder.js').Folder} folder - Folder instance containing package files
 * @param {string} outputPath - Output directory path
 * @returns {Promise<boolean>} True if documentation was generated successfully
 */
export async function generateTypeDoc(folder, outputPath) {
	// Change to package directory for TypeDoc to work correctly
	const originalCwd = process.cwd();
	const packagePath = folder.rootPath || process.cwd();

	try {
		const config = generateTypeDocConfig(folder, outputPath);
		if (!config) {
			return false;
		}

		// Use execSync like the original working script
		const { execSync } = await import("node:child_process");

		process.chdir(packagePath);

		// Build command line arguments like the original script
		const flags = [];
		flags.push("--skipErrorChecking");
		flags.push(`--out ${outputPath}`);
		flags.push(
			'--customFooterHtml "<a href=\\"/\\">View all RavenJS packages</a>"',
		);
		flags.push("--name", config.name);
		flags.push("--tsconfig", "jsconfig.json");

		// Execute TypeDoc with entry points as arguments
		execSync(`typedoc ${flags.join(" ")} ${config.entryPoints.join(" ")}`);

		process.chdir(originalCwd);
		return true;
	} catch (error) {
		console.error("TypeDoc generation error:", error);
		process.chdir(originalCwd);
		return false;
	}
}
