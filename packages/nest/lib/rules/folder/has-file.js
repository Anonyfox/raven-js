import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Checks if a specific file exists in a directory
 * @param {string} directoryPath - The path to the directory
 * @param {string} fileName - The name/path of the file to check for
 * @returns {boolean} True if the file exists, throws error otherwise
 * @throws {Error} Informative error message if validation fails
 */
export const HasFile = (directoryPath, fileName) => {
	if (typeof directoryPath !== "string" || directoryPath === "") {
		throw new Error("Directory path must be a non-empty string");
	}

	if (typeof fileName !== "string" || fileName === "") {
		throw new Error("File name must be a non-empty string");
	}

	const filePath = join(directoryPath, fileName);

	if (!existsSync(filePath)) {
		throw new Error(
			`File "${fileName}" does not exist in directory ${directoryPath}`,
		);
	}

	return true;
};
