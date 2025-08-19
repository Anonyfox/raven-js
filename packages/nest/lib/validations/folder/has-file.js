/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 *
 * Checks if a specific file exists in a directory
 */
export const HasFile = (/** @type {string} */ directoryPath, /** @type {string} */ fileName) => {
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
