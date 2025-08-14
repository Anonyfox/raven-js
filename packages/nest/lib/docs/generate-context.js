/**
 * @fileoverview Generate context files for packages
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

/**
 * Generate a context file for a package
 * @param {import('../folder.js').Folder} folder - Folder instance containing package files
 * @returns {import('../types.js').ContextObject|null} Context object or null if generation fails
 */
export function generateContext(folder) {
	try {
		// Get package.json content
		const packageJsonContent = folder.getFile("package.json");
		if (!packageJsonContent) {
			return null;
		}

		const packageJson = JSON.parse(packageJsonContent);

		// Get README.md content
		const readmeContent = folder.getFile("README.md");
		if (!readmeContent) {
			return null;
		}

		const ctx = {
			name: packageJson.name,
			version: packageJson.version,
			exports: packageJson.exports ? packageJson.exports : packageJson.main,
			readme: readmeContent,
		};

		return ctx;
	} catch {
		return null;
	}
}

/**
 * Generate context file content as JSON string
 * @param {import('../folder.js').Folder} folder - Folder instance containing package files
 * @returns {string|null} JSON string or null if generation fails
 */
export function generateContextJson(folder) {
	const ctx = generateContext(folder);
	return ctx ? JSON.stringify(ctx, null, 2) : null;
}
