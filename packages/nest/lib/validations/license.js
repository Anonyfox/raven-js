/**
 * @fileoverview Package license validation
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

/**
 * Validate package license information
 * @param {import('../folder.js').Folder} folder - Folder instance containing package files
 * @returns {import('../types.js').PackageValidationError[]} Validation errors
 */
export function validateLicense(folder) {
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

	// Check license field in package.json
	if (!packageJson.license || !packageJson.license.trim()) {
		errors.push({
			code: "MISSING_LICENSE_FIELD",
			message: "Package must have a license field in package.json",
			field: "license",
		});
		return errors; // Return early if license field is missing
	}

	// Check for LICENSE file
	const licenseFiles = ["LICENSE", "license", "License"];
	let licenseFileExists = false;

	for (const licenseFile of licenseFiles) {
		if (folder.hasFile(licenseFile)) {
			licenseFileExists = true;
			break;
		}
	}

	if (!licenseFileExists) {
		errors.push({
			code: "MISSING_LICENSE_FILE",
			message: "Package must have a LICENSE file in the root directory",
			field: "license",
		});
	}

	return errors;
}
