import { existsSync } from "node:fs";
import { join } from "node:path";
import { GetAllFilePaths } from "../../queries/get-all-file-paths.js";

/**
 * Validates that every JavaScript file has an accompanying test file
 * @param {string} directoryPath - The path to the directory
 * @returns {boolean} True if all JS files have tests, throws error otherwise
 * @throws {Error} Informative error message if validation fails
 */
export const HasValidTestFiles = (directoryPath) => {
	if (typeof directoryPath !== "string" || directoryPath === "") {
		throw new Error("Directory path must be a non-empty string");
	}

	const allFilePaths = GetAllFilePaths(directoryPath);
	const jsFiles = allFilePaths.filter((path) =>
		isJavaScriptFileRequiringTest(path),
	);

	const missingTests = [];

	for (const jsFile of jsFiles) {
		const testFile = jsFile.replace(/\.js$/, ".test.js");
		const testFilePath = join(directoryPath, testFile);

		if (!existsSync(testFilePath)) {
			missingTests.push(jsFile);
		}
	}

	if (missingTests.length > 0) {
		throw new Error(
			`Missing test files for JavaScript files in ${directoryPath}: ${missingTests.join(", ")}`,
		);
	}

	return true;
};

/**
 * Check if a file path represents a JavaScript file that should have a test file
 * @param {string} filePath - Relative path to the file
 * @returns {boolean} True if file is a .js file that should have a corresponding .test.js file
 */
function isJavaScriptFileRequiringTest(filePath) {
	// Skip test files themselves
	if (!filePath.endsWith(".js") || filePath.endsWith(".test.js")) {
		return false;
	}

	// Skip files in bin folders (CLI tools don't need tests)
	if (filePath.startsWith("bin/") || filePath.includes("/bin/")) {
		return false;
	}

	return true;
}
