/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Glean documentation generation for packages.
 *
 * Provides functions to generate documentation using the Glean SSG tool
 * instead of TypeDoc for zero-dependency documentation generation.
 */

/**
 * Generate Glean documentation for a package
 * @param {string} packagePath - Path to the package directory
 * @param {string} outputPath - Output directory path
 * @returns {Promise<boolean>} True if documentation was generated successfully
 */
export async function generateGleanDocs(packagePath, outputPath) {
	try {
		// Use execSync to run npx glean ssg with the docs.ravenjs.dev domain
		const { execSync } = await import("node:child_process");

		// Extract package name from path for base path
		const { basename } = await import("node:path");
		const packageName = basename(packagePath);

		// Build the glean ssg command with domain and base path flags
		const command = `npx glean ssg "${packagePath}" "${outputPath}" --domain docs.ravenjs.dev --base /${packageName}`;

		// Execute the command with timeout to prevent hanging
		execSync(command, {
			stdio: "pipe", // Changed from "inherit" to "pipe" to avoid output in tests
			cwd: process.cwd(),
			timeout: 30000, // 30 second timeout
		});

		return true;
	} catch (error) {
		console.error("Glean generation error:", error);
		return false;
	}
}
