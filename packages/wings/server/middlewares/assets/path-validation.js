/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @packageDocumentation
 *
 * Validate that a request path is safe for asset serving.
 * Implements security checks to prevent path traversal and unauthorized access.
 * Security rules enforced:
 * - Must be a string
 * - Must start with '/' for public access (security requirement)
 * - Must not contain '..' to prevent path traversal attacks
 * - Must not contain backslashes to prevent Windows path traversal
 * - Must not contain null bytes or other control characters
 * - Must not be just a slash (root path)
 * ```javascript
 * isValidAssetPath('/css/style.css')   // → true
 * isValidAssetPath('/js/app.js')       // → true
 * isValidAssetPath('/../secret.txt')   // → false (path traversal)
 * isValidAssetPath('/app\\..\\file')   // → false (backslash traversal)
 * isValidAssetPath('/')                // → false (root path)
 * isValidAssetPath('')                 // → false (empty)
 * isValidAssetPath(null)               // → false (not string)
 * ```
 */
export function isValidAssetPath(/** @type {string} */ requestPath) {
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
