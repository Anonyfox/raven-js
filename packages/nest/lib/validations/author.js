/**
 * @fileoverview Package author validation
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

/**
 * Validate package author information
 * @param {import('../folder.js').Folder} folder - Folder instance containing package files
 * @returns {import('../types.js').PackageValidationError[]} Validation errors
 */
export function validateAuthor(folder) {
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

	if (packageJson.author === null || packageJson.author === undefined) {
		errors.push({
			code: "MISSING_AUTHOR",
			message: "Package must have an author field",
			field: "author",
		});
		return errors;
	}

	// Check if author is a string or object
	if (typeof packageJson.author === "string") {
		// Simple string author - check if it's not empty
		const authorString = /** @type {string} */ (packageJson.author);
		if (!authorString.trim()) {
			errors.push({
				code: "INVALID_AUTHOR",
				message: "Author field cannot be empty",
				field: "author",
			});
			return errors;
		}
	} else if (
		typeof packageJson.author === "object" &&
		packageJson.author !== null
	) {
		// Object author - validate required fields
		if (!packageJson.author.name || !packageJson.author.name.trim()) {
			errors.push({
				code: "INVALID_AUTHOR_NAME",
				message: "Author object must have a non-empty name field",
				field: "author.name",
			});
		}

		if (!packageJson.author.email || !packageJson.author.email.trim()) {
			errors.push({
				code: "INVALID_AUTHOR_EMAIL",
				message: "Author object must have a non-empty email field",
				field: "author.email",
			});
		}

		if (!packageJson.author.url || !packageJson.author.url.trim()) {
			errors.push({
				code: "INVALID_AUTHOR_URL",
				message: "Author object must have a non-empty url field",
				field: "author.url",
			});
		}
	} else {
		errors.push({
			code: "INVALID_AUTHOR_TYPE",
			message: "Author field must be a string or object",
			field: "author",
		});
	}

	return errors;
}
