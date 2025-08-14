/**
 * @fileoverview Package version validation
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

/**
 * Validate package version
 * @param {import('../folder.js').Folder} folder - Folder instance containing package files
 * @returns {import('../types.js').PackageValidationError[]} Validation errors
 */
export function validateVersion(folder) {
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

	if (!packageJson.version || !packageJson.version.trim()) {
		errors.push({
			code: "MISSING_VERSION",
			message: "Package must have a version field",
			field: "version",
		});
		return errors;
	}

	const version = packageJson.version.trim();

	// Basic semver validation
	const semverPattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
	if (!semverPattern.test(version)) {
		errors.push({
			code: "INVALID_VERSION",
			message: "Version must follow semantic versioning format (e.g., 1.0.0)",
			field: "version",
		});
	}

	return errors;
}
