/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Pure glob pattern matching function.
 *
 * Provides simple wildcard pattern matching for file paths,
 * supporting basic glob patterns like *.js, lib/*, etc.
 */

/**
 * Tests if a path matches a glob pattern with basic wildcard support.
 *
 * Supports * (any characters except /) and ? (single character except /) patterns.
 * Handles leading "./" normalization for both pattern and path.
 *
 * @param {string} pattern - Glob pattern (e.g., "./lib/*.js", "*.md")
 * @param {string} path - File path to test
 * @returns {boolean} True if path matches pattern
 *
 * @example
 * // Basic wildcard matching
 * glob("*.js", "app.js"); // → true
 * glob("lib/*.js", "lib/utils.js"); // → true
 * glob("*.md", "app.js"); // → false
 *
 * @example
 * // Path normalization
 * glob("./src/*.js", "src/index.js"); // → true
 * glob("src/*.js", "./src/index.js"); // → true
 */
export function glob(pattern, path) {
	if (typeof pattern !== "string" || typeof path !== "string") {
		return false;
	}

	// Empty strings should not match
	if (pattern === "" || path === "") {
		return false;
	}

	// Normalize both pattern and path by removing leading "./"
	const cleanPattern = pattern.startsWith("./") ? pattern.slice(2) : pattern;
	const cleanPath = path.startsWith("./") ? path.slice(2) : path;

	// Convert glob pattern to regex
	const regexPattern = cleanPattern
		.replace(/\./g, "\\.")
		.replace(/\*/g, "[^/]*")
		.replace(/\?/g, "[^/]");

	const regex = new RegExp(`^${regexPattern}$`);
	return regex.test(cleanPath);
}
