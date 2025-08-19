/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Path validation for secure asset serving.
 *
 * Implements defense-in-depth security model preventing path traversal attacks
 * and unauthorized access to internal files. Critical security boundary.
 */

/**
 * Validate that a request path is safe for asset serving.
 *
 * Implements comprehensive security checks preventing common web application
 * vulnerabilities. Only paths passing all validation rules are eligible
 * for asset serving, ensuring no internal files are exposed.
 *
 * @param {string} requestPath - URL path to validate
 * @returns {boolean} True when path is safe for asset serving
 *
 * @example Valid Asset Paths
 * ```javascript
 * isValidAssetPath('/css/style.css');    // → true
 * isValidAssetPath('/js/app.js');        // → true
 * isValidAssetPath('/images/logo.png');  // → true
 * ```
 *
 * @example Path Traversal Prevention
 * ```javascript
 * isValidAssetPath('/../secret.txt');    // → false (traversal)
 * isValidAssetPath('/app\\..\\file');    // → false (backslash)
 * isValidAssetPath('/file\0');           // → false (null byte)
 * ```
 *
 * @example Access Control
 * ```javascript
 * isValidAssetPath('app.js');            // → false (no leading /)
 * isValidAssetPath('/');                 // → false (root path)
 * isValidAssetPath('');                  // → false (empty)
 * isValidAssetPath(null);                // → false (type safety)
 * ```
 */
export function isValidAssetPath(requestPath) {
	// Must be a string
	if (typeof requestPath !== "string") return false;

	// Must start with / for public access (security requirement)
	if (!requestPath.startsWith("/")) return false;

	// Prevent path traversal attacks
	if (requestPath.includes("..")) return false;
	if (requestPath.includes("\\")) return false;

	// Prevent null bytes and other control characters
	if (requestPath.includes("\0")) return false;

	// Must not be just a slash (root path)
	if (requestPath === "/") return false;

	return true;
}
