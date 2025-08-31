/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Node.js entry point file resolution.
 *
 * Resolves a target path to an actual JavaScript file following Node.js
 * module resolution rules: direct match, index.js resolution, and
 * extension inference.
 */

/**
 * Picks the correct entry point file following Node.js module resolution rules.
 *
 * Resolution order: exact match → extension inference (.js, .mjs, .jsx) → index.js resolution.
 * Handles directory targets by looking for index files with supported extensions.
 *
 * @param {Set<string>} availableFiles - Set of available file paths
 * @param {string} targetPath - Target path (may or may not include filename)
 * @returns {string|null} Resolved file path or null if no match found
 *
 * @example
 * // Exact file matching
 * const files = new Set(['src/app.js', 'src/utils.js']);
 * pickEntrypointFile(files, 'src/app.js'); // → 'src/app.js'
 *
 * @example
 * // Extension inference and directory resolution
 * const files = new Set(['lib/index.js', 'lib/utils.js']);
 * pickEntrypointFile(files, 'lib'); // → 'lib/index.js'
 * pickEntrypointFile(files, 'lib/utils'); // → 'lib/utils.js'
 */
export function pickEntrypointFile(availableFiles, targetPath) {
	if (
		!availableFiles ||
		!(availableFiles instanceof Set) ||
		availableFiles.size === 0 ||
		typeof targetPath !== "string"
	) {
		return null;
	}

	if (targetPath === "" || availableFiles.size === 0) {
		return null;
	}

	// Normalize target path by removing leading "./"
	const cleanPath = targetPath.startsWith("./")
		? targetPath.slice(2)
		: targetPath;

	// Try exact match first
	if (availableFiles.has(cleanPath) && isJavaScriptFile(cleanPath)) {
		return cleanPath;
	}

	// Try adding extensions if no extension provided (Node.js resolution order)
	if (!cleanPath.includes(".")) {
		const extensionCandidates = [
			`${cleanPath}.js`,
			`${cleanPath}.mjs`,
			`${cleanPath}.jsx`,
		];

		for (const candidate of extensionCandidates) {
			if (availableFiles.has(candidate)) {
				return candidate;
			}
		}
	}

	// Try index.js resolution for directories
	const indexCandidates = [
		`${cleanPath}/index.js`,
		`${cleanPath}/index.mjs`,
		`${cleanPath}/index.jsx`,
	];

	for (const candidate of indexCandidates) {
		if (availableFiles.has(candidate)) {
			return candidate;
		}
	}

	return null;
}

/**
 * Checks if a file is a JavaScript file.
 *
 * @param {string} filePath - File path to check
 * @returns {boolean} True if it's a JavaScript file
 */
function isJavaScriptFile(filePath) {
	return /\.(js|mjs|jsx)$/.test(filePath);
}
