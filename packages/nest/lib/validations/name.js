/**
 * @fileoverview Package name validation
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

/**
 * Validate package name format
 * @param {import('../folder.js').Folder} folder - Folder instance containing package files
 * @returns {import('../types.js').PackageValidationError[]} Validation errors
 */
export function validatePackageName(folder) {
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

	if (!packageJson.name || !packageJson.name.trim()) {
		errors.push({
			code: "MISSING_NAME",
			message: "Package must have a name field",
			field: "name",
		});
		return errors;
	}

	const name = packageJson.name.trim();

	// Check for scoped package format (@raven-js/package-name)
	if (name.startsWith("@")) {
		const parts = name.split("/");
		if (parts.length !== 2 || parts[0] === "@" || !parts[1]) {
			errors.push({
				code: "INVALID_SCOPED_NAME",
				message: "Scoped package name must be in format @scope/package-name",
				field: "name",
			});
			return errors; // Return early for invalid scoped names
		}
	}

	// Check for invalid characters
	// For scoped packages, @ is only allowed at the beginning
	// For non-scoped packages, @ is not allowed
	const allowedChars = name.startsWith("@")
		? /^[a-zA-Z0-9\-_./@]+$/
		: /^[a-zA-Z0-9\-_./]+$/;

	if (!allowedChars.test(name)) {
		errors.push({
			code: "INVALID_NAME_CHARS",
			message: "Package name contains invalid characters",
			field: "name",
		});
	}

	return errors;
}
