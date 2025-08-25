/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Path security utilities for safe file serving and traversal prevention.
 *
 * Surgical security implementation preventing directory traversal, path injection,
 * and unauthorized file access while preserving legitimate ESM module serving.
 * Zero-dependency validation with performance-optimized string operations.
 *
 * Security philosophy: Fail-secure by default, explicit allowlisting over blacklisting,
 * validate early and often. Every path that enters the system gets normalized and
 * validated before any filesystem operations occur.
 */

/**
 * Normalizes a URL path to a clean, consistent format.
 *
 * Removes double slashes, resolves relative segments (. and ..),
 * and ensures consistent forward slash usage. Critical security
 * function that prevents path manipulation attacks.
 *
 * **Security**: This function is the foundation of path security.
 * All paths must pass through normalization before validation.
 *
 * @param {string} path - Raw URL path to normalize
 * @returns {string} Normalized path or empty string if invalid
 *
 * @example
 * ```javascript
 * normalizePath('/node_modules//lodash/index.js') // '/node_modules/lodash/index.js'
 * normalizePath('./lib/../index.js') // './index.js'
 * normalizePath('///multiple///slashes') // '/multiple/slashes'
 * normalizePath('') // ''
 * ```
 */
export function normalizePath(path) {
	if (typeof path !== "string" || path.length === 0) {
		return "";
	}

	// Convert backslashes to forward slashes (Windows compatibility)
	let normalized = path.replace(/\\/g, "/");

	// Remove multiple consecutive slashes
	normalized = normalized.replace(/\/+/g, "/");

	// Split into segments for processing
	const segments = normalized.split("/");
	const stack = [];
	let invalidTraversal = false;

	for (const segment of segments) {
		if (segment === "" || segment === ".") {
			// Skip empty segments and current directory references
			continue;
		}

		if (segment === "..") {
			// Parent directory - pop from stack if possible
			if (stack.length > 0 && stack[stack.length - 1] !== "..") {
				stack.pop();
			} else if (!normalized.startsWith("/")) {
				// Only allow .. in relative paths
				stack.push("..");
			} else {
				// For absolute paths, attempting to go above root is invalid
				invalidTraversal = true;
			}
		} else {
			stack.push(segment);
		}
	}

	// If there was invalid traversal above root, return root
	if (invalidTraversal && normalized.startsWith("/")) {
		return "/";
	}

	// Reconstruct path
	let result = stack.join("/");

	// Preserve leading slash for absolute paths
	if (normalized.startsWith("/")) {
		result = "/" + result;
	}

	// Handle edge case of empty result
	return result || (normalized.startsWith("/") ? "/" : "");
}

/**
 * Validates that a path is safe for file serving operations.
 *
 * Comprehensive security validation checking for directory traversal,
 * null bytes, invalid characters, and other attack vectors.
 * Must be called after normalization.
 *
 * **Security**: Returns false for any suspicious patterns.
 * Designed to be overly cautious - legitimate paths should pass easily.
 *
 * @param {string} path - Normalized path to validate
 * @returns {boolean} True if path is safe for filesystem operations
 *
 * @example
 * ```javascript
 * validatePath('/node_modules/lodash/index.js') // true
 * validatePath('../../../etc/passwd') // false
 * validatePath('/path/with/null\x00byte') // false
 * validatePath('normal/path.js') // true
 * ```
 */
export function validatePath(path) {
	if (typeof path !== "string" || path.length === 0) {
		return false;
	}

	// Check for null bytes (directory traversal attack vector)
	if (path.includes("\x00")) {
		return false;
	}

	// Check for other control characters
	if (/[\x01-\x1f\x7f]/.test(path)) {
		return false;
	}

	// Reject absolute paths that try to escape common boundaries
	if (path.startsWith("/") && (path.startsWith("//") || path.includes("://"))) {
		return false;
	}

	// Reject paths that look like domain names (but allow common file extensions)
	if (
		path.startsWith("/") &&
		/^\/[a-zA-Z0-9.-]+\.(com|org|net|edu|gov|mil|int|co|io|dev|app)$/i.test(
			path,
		)
	) {
		return false;
	}

	// Check for suspicious patterns that could indicate attacks
	const suspiciousPatterns = [
		/^\/+$/, // Multiple slashes (but allow single "/")
		/\/\.{3,}\//, // Hidden file patterns like /.../  but not /../
		/\/\.\/.*\/\./, // Hidden file access patterns like /./hidden/.file
		/[<>:"|?*]/, // Windows invalid characters
		/^\.\.[^/.]/, // Files starting with .. but not ../  (like ..file.js)
		/\/\.\.[^/.]/, // Paths containing segments starting with .. but not ../ (like path/..file.js)
		/[a-zA-Z0-9]\.\.[a-zA-Z0-9]/, // Double dots in the middle of filenames (like file..name.js)
		/(\.\.[\\/]){3,}/, // Excessive directory traversal (3+ levels, both / and \)
		/^\.[\\/].*\.\.[\\/]/, // Windows-style traversal patterns starting with . (like .\..\..\))
	];

	for (const pattern of suspiciousPatterns) {
		if (pattern.test(path)) {
			return false;
		}
	}

	// Allow single "/" root path
	if (path === "/") {
		return true;
	}

	return true;
}

/**
 * Checks if a file path has a valid JavaScript module extension.
 *
 * Only allows .js and .mjs extensions for security and compatibility.
 * ESM modules must use these extensions to be served properly.
 *
 * **Security**: Prevents serving non-JavaScript files that could
 * contain malicious content or expose sensitive data.
 *
 * @param {string} filePath - File path to check
 * @returns {boolean} True if extension is .js or .mjs
 *
 * @example
 * ```javascript
 * isValidJSExtension('module.js') // true
 * isValidJSExtension('module.mjs') // true
 * isValidJSExtension('config.json') // false
 * isValidJSExtension('script.php') // false
 * ```
 */
export function isValidJSExtension(filePath) {
	if (typeof filePath !== "string" || filePath.length === 0) {
		return false;
	}

	// Extract extension (everything after the last dot)
	const lastDotIndex = filePath.lastIndexOf(".");
	if (lastDotIndex === -1 || lastDotIndex === filePath.length - 1) {
		return false;
	}

	const extension = filePath.slice(lastDotIndex);
	return extension === ".js" || extension === ".mjs";
}

/**
 * Prevents directory traversal by limiting path depth and validating boundaries.
 *
 * Enforces maximum traversal depth for relative paths and validates
 * that absolute paths stay within expected boundaries. Critical for
 * workspace package serving where some traversal is legitimate.
 *
 * **Security Balance**: Allows controlled traversal for legitimate workspace
 * access while preventing filesystem escapes and unauthorized access.
 *
 * @param {string} path - Normalized path to validate
 * @param {number} [maxDepth=5] - Maximum allowed traversal depth
 * @returns {boolean} True if path respects traversal limits
 *
 * @example
 * ```javascript
 * preventTraversal('../shared/utils.js', 3) // true
 * preventTraversal('../../../../etc/passwd', 3) // false
 * preventTraversal('/node_modules/lodash/index.js') // true
 * preventTraversal('../../../../../../../evil', 2) // false
 * ```
 */
export function preventTraversal(path, maxDepth = 2) {
	if (typeof path !== "string" || path.length === 0) {
		return false;
	}

	if (!Number.isInteger(maxDepth) || maxDepth < 0) {
		return false;
	}

	// For absolute paths, ensure they start with allowed prefixes or are root-level files
	if (path.startsWith("/")) {
		const allowedPrefixes = ["/node_modules/", "/@workspace/"];
		const hasValidPrefix = allowedPrefixes.some((prefix) =>
			path.startsWith(prefix),
		);

		// Allow root-level files (like /package.json) and paths with valid prefixes
		if (hasValidPrefix || path === "/" || !path.substring(1).includes("/")) {
			return true;
		}

		// Reject other absolute paths that don't match allowed patterns
		return false;
	}

	// For relative paths, count traversal depth
	const segments = path.split("/");
	let traversalCount = 0;

	for (const segment of segments) {
		if (segment === "..") {
			traversalCount++;
			if (traversalCount > maxDepth) {
				return false;
			}
		}
	}

	return true;
}

/**
 * Sanitizes a raw path input for safe processing.
 *
 * Complete path sanitization pipeline combining normalization,
 * validation, and security checks. Single entry point for all
 * path processing in the resolve middleware.
 *
 * **Usage**: All external path inputs should go through this function
 * before any filesystem operations or security decisions.
 *
 * @param {string} rawPath - Raw path input from HTTP request
 * @param {Object} [options={}] - Sanitization options
 * @param {number} [options.maxDepth=5] - Maximum traversal depth
 * @param {boolean} [options.requireJSExtension=false] - Require .js/.mjs extension
 * @returns {string|null} Sanitized path or null if invalid/unsafe
 *
 * @example
 * ```javascript
 * sanitizePath('/node_modules//lodash/index.js') // '/node_modules/lodash/index.js'
 * sanitizePath('../shared/utils.js') // '../shared/utils.js'
 * sanitizePath('../../../../etc/passwd') // null
 * sanitizePath('file.txt', { requireJSExtension: true }) // null
 * ```
 */
export function sanitizePath(rawPath, options = {}) {
	const { maxDepth = 2, requireJSExtension = false } = options;

	if (typeof rawPath !== "string" || rawPath.length === 0) {
		return null;
	}

	// Step 1: Pre-normalization security check (catch attack patterns in raw input)
	if (!validatePath(rawPath)) {
		return null;
	}

	// Step 2: Normalize path
	const normalized = normalizePath(rawPath);
	if (!normalized) {
		return null;
	}

	// Step 3: Post-normalization validation (catch patterns that survive normalization)
	if (!validatePath(normalized)) {
		return null;
	}

	// Step 4: Traversal prevention
	if (!preventTraversal(normalized, maxDepth)) {
		return null;
	}

	// Step 5: Extension validation (optional)
	if (requireJSExtension && !isValidJSExtension(normalized)) {
		return null;
	}

	return normalized;
}

/**
 * Extracts the file extension from a path safely.
 *
 * Handles edge cases like files without extensions, hidden files,
 * and paths ending with dots. Used for MIME type determination.
 *
 * @param {string} filePath - File path to extract extension from
 * @returns {string} Extension including the dot, or empty string if none
 *
 * @example
 * ```javascript
 * getFileExtension('module.js') // '.js'
 * getFileExtension('file.mjs') // '.mjs'
 * getFileExtension('no-extension') // ''
 * getFileExtension('.hidden') // ''
 * ```
 */
export function getFileExtension(filePath) {
	if (typeof filePath !== "string" || filePath.length === 0) {
		return "";
	}

	const lastDotIndex = filePath.lastIndexOf(".");
	const lastSlashIndex = Math.max(
		filePath.lastIndexOf("/"),
		filePath.lastIndexOf("\\"),
	);

	// No dot found, or dot is before the last slash (directory name with dot)
	if (lastDotIndex === -1 || lastDotIndex < lastSlashIndex) {
		return "";
	}

	// Dot is at the end or at the beginning of filename (hidden file)
	if (
		lastDotIndex === filePath.length - 1 ||
		lastDotIndex === lastSlashIndex + 1
	) {
		return "";
	}

	return filePath.slice(lastDotIndex);
}
