import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Validates that a package has a valid author object in its package.json
 * @param {string} packagePath - The path to the package directory
 * @returns {boolean} True if the package has a valid author object, throws error otherwise
 * @throws {Error} Informative error message if validation fails
 */
export const HasValidAuthor = (packagePath) => {
	if (typeof packagePath !== "string" || packagePath === "") {
		throw new Error("Package path must be a non-empty string");
	}

	const packageJsonPath = join(packagePath, "package.json");

	let packageJsonContent;
	try {
		packageJsonContent = readFileSync(packageJsonPath, "utf8");
	} catch (error) {
		throw new Error(
			`Cannot read package.json at ${packageJsonPath}: ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
	}

	let packageData;
	try {
		packageData = JSON.parse(packageJsonContent);
	} catch (error) {
		throw new Error(
			`Invalid JSON in package.json at ${packageJsonPath}: ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
	}

	if (!packageData.author) {
		throw new Error(
			`Missing author field in package.json at ${packageJsonPath}`,
		);
	}

	// Author must be an object (not string format)
	if (typeof packageData.author === "string") {
		throw new Error(
			`Author must be an object with name, email, and url fields (string format not allowed) in package.json at ${packageJsonPath}`,
		);
	}

	if (typeof packageData.author !== "object" || packageData.author === null) {
		throw new Error(
			`Author field must be an object in package.json at ${packageJsonPath}`,
		);
	}

	const author = packageData.author;

	// Validate required name field
	if (!author.name || typeof author.name !== "string" || !author.name.trim()) {
		throw new Error(
			`Author object must have a non-empty name field in package.json at ${packageJsonPath}`,
		);
	}

	// Validate required email field
	if (
		!author.email ||
		typeof author.email !== "string" ||
		!author.email.trim()
	) {
		throw new Error(
			`Author object must have a non-empty email field in package.json at ${packageJsonPath}`,
		);
	}

	// Validate required url field
	if (!author.url || typeof author.url !== "string" || !author.url.trim()) {
		throw new Error(
			`Author object must have a non-empty url field in package.json at ${packageJsonPath}`,
		);
	}

	return true;
};
