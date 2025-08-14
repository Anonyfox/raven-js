/**
 * @fileoverview Package structure validation
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

/**
 * Validate package structure and required files
 * @param {import('../folder.js').Folder} folder - Folder instance containing package files
 * @returns {import('../types.js').PackageValidationError[]} Validation errors
 */
export function validatePackageStructure(folder) {
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

	// Check for README.md
	if (!folder.hasFile("README.md")) {
		errors.push({
			code: "MISSING_README",
			message: "Package must have a README.md file",
			field: "README.md",
		});
	}

	// Check for main entry point if specified
	if (packageJson.main) {
		if (!folder.hasFile(packageJson.main)) {
			errors.push({
				code: "MISSING_MAIN_ENTRY",
				message: `Main entry point '${packageJson.main}' does not exist`,
				field: "main",
			});
		}
	}

	return errors;
}
