/**
 * @fileoverview Package scripts validation
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

/**
 * Validate package scripts
 * @param {import('../folder.js').Folder} folder - Folder instance containing package files
 * @returns {import('../types.js').PackageValidationError[]} Validation errors
 */
export function validateScripts(folder) {
	const errors = [];

	// Get package.json content from folder
	const packageJsonContent = folder.getFile("package.json");
	if (!packageJsonContent) {
		errors.push({
			code: "MISSING_PACKAGE_JSON",
			message: "package.json not found in folder",
			field: "package.json",
		});
		return errors;
	}

	let packageJson;
	try {
		packageJson = JSON.parse(packageJsonContent);
	} catch {
		errors.push({
			code: "INVALID_PACKAGE_JSON",
			message: "package.json is not valid JSON",
			field: "package.json",
		});
		return errors;
	}

	if (!packageJson.scripts || typeof packageJson.scripts !== "object") {
		errors.push({
			code: "MISSING_SCRIPTS",
			message: "Package must have a scripts object in package.json",
			field: "scripts",
		});
		return errors;
	}

	const requiredScripts = [
		"test",
		"test:code",
		"test:style",
		"gen:context",
		"gen:docs",
	];

	for (const scriptName of requiredScripts) {
		const scriptValue = /** @type {Record<string, string>} */ (
			packageJson.scripts
		)[scriptName];
		if (!scriptValue || !scriptValue.trim()) {
			errors.push({
				code: "MISSING_SCRIPT",
				message: `Package must have a non-empty "${scriptName}" script`,
				field: `scripts.${scriptName}`,
			});
		}
	}

	return errors;
}
