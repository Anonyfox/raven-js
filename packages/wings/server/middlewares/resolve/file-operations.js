/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Safe file system operations for ESM module serving.
 *
 * Surgical file operations with comprehensive error handling, security validation,
 * and performance optimization. Zero-dependency implementation using only Node.js
 * built-ins with fail-safe error handling for production reliability.
 *
 * Security philosophy: Never expose filesystem structure through errors,
 * always validate paths through security layer, graceful degradation on failures.
 */

import { existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { normalizePath, validatePath } from "./path-security.js";

/**
 * Validates file paths for local file operations with appropriate security.
 *
 * More permissive than web request path validation but still secure for
 * local file system operations. Allows absolute paths within reasonable
 * boundaries while preventing common attack vectors.
 *
 * @param {string} filePath - File path to validate
 * @returns {string|null} Normalized path or null if invalid
 */
export function validateFilePath(filePath) {
	if (typeof filePath !== "string" || filePath.length === 0) {
		return null;
	}

	// Step 1: Normalize the path
	const normalized = normalizePath(filePath);
	if (!normalized) {
		return null;
	}

	// Step 2: Basic security validation (no null bytes, control chars, etc.)
	if (!validatePath(normalized)) {
		return null;
	}

	// Step 3: For local file operations, we're more permissive with absolute paths
	// but still prevent obvious security issues
	if (normalized.startsWith("/")) {
		// Block access to sensitive system directories
		const blockedPaths = [
			"/etc/",
			"/proc/",
			"/sys/",
			"/dev/",
			"/boot/",
			"/root/",
			"/tmp/",
			"/var/log/",
		];

		const isBlocked = blockedPaths.some((blocked) =>
			normalized.startsWith(blocked),
		);
		if (isBlocked) {
			return null;
		}
	}

	return normalized;
}

/**
 * Safely reads a file with comprehensive error handling and path validation.
 *
 * Performs security validation, existence checking, and safe file reading
 * with proper error categorization. Never exposes sensitive filesystem
 * information through error messages.
 *
 * **Security**: All paths validated through sanitization pipeline before
 * any filesystem operations. Path traversal attacks blocked at entry point.
 *
 * @param {string} filePath - File path to read (will be sanitized)
 * @param {Object} [options={}] - Reading options
 * @param {string} [options.encoding='utf8'] - File encoding
 * @param {number} [options.maxSize=10485760] - Maximum file size in bytes (10MB default)
 * @returns {Promise<{success: boolean, content?: string, error?: string, errorType?: string}>}
 *
 * @example
 * ```javascript
 * const result = await readFileSafe('/node_modules/lodash/index.js');
 * if (result.success) {
 *   console.log(result.content);
 * } else {
 *   console.error(`Failed to read file: ${result.error}`);
 * }
 * ```
 */
export async function readFileSafe(filePath, options = {}) {
	const { encoding = "utf8", maxSize = 10485760 } = options; // 10MB default

	try {
		// Step 1: Validate and sanitize path
		const validatedPath = validateFilePath(filePath);
		if (!validatedPath) {
			return {
				success: false,
				error: "Invalid file path",
				errorType: "INVALID_PATH",
			};
		}

		// Step 2: Check file existence and get stats
		const stats = await getFileStats(validatedPath);
		if (!stats.success) {
			return {
				success: false,
				error: stats.error,
				errorType: stats.errorType,
			};
		}

		// Step 3: Validate file size
		if (stats.size > maxSize) {
			return {
				success: false,
				error: "File too large",
				errorType: "FILE_TOO_LARGE",
			};
		}

		// Step 4: Read file content
		const content = await readFile(validatedPath, encoding);

		return {
			success: true,
			content,
		};
	} catch (error) {
		// Categorize errors without exposing system details
		if (error.code === "ENOENT") {
			return {
				success: false,
				error: "File not found",
				errorType: "FILE_NOT_FOUND",
			};
		}

		if (error.code === "EACCES" || error.code === "EPERM") {
			return {
				success: false,
				error: "Access denied",
				errorType: "ACCESS_DENIED",
			};
		}

		if (error.code === "EISDIR") {
			return {
				success: false,
				error: "Path is a directory",
				errorType: "IS_DIRECTORY",
			};
		}

		return {
			success: false,
			error: "File read error",
			errorType: "READ_ERROR",
		};
	}
}

/**
 * Checks if a file exists with path validation and security checks.
 *
 * Fast synchronous existence check with security validation.
 * Safe for high-frequency operations with minimal overhead.
 *
 * **Performance**: Uses synchronous existsSync for immediate response
 * in request-critical paths where async overhead matters.
 *
 * @param {string} filePath - File path to check (will be sanitized)
 * @returns {boolean} True if file exists and is accessible
 *
 * @example
 * ```javascript
 * if (fileExists('/node_modules/lodash/package.json')) {
 *   console.log('Package exists');
 * }
 * ```
 */
export function fileExists(filePath) {
	try {
		// Validate path first
		const validatedPath = validateFilePath(filePath);
		if (!validatedPath) {
			return false;
		}

		return existsSync(validatedPath);
	} catch {
		// Any error means file doesn't exist for our purposes
		return false;
	}
}

/**
 * Gets file statistics safely with comprehensive error handling.
 *
 * Retrieves file stats with proper error categorization and
 * security validation. Essential for file size validation
 * and existence checking in async contexts.
 *
 * **Security**: Path validation prevents information disclosure
 * through filesystem error messages.
 *
 * @param {string} filePath - File path to stat (will be sanitized)
 * @returns {Promise<{success: boolean, size?: number, mtime?: Date, error?: string, errorType?: string}>}
 *
 * @example
 * ```javascript
 * const stats = await getFileStats('./package.json');
 * if (stats.success) {
 *   console.log(`File size: ${stats.size} bytes`);
 * }
 * ```
 */
export async function getFileStats(filePath) {
	try {
		// Validate path
		const validatedPath = validateFilePath(filePath);
		if (!validatedPath) {
			return {
				success: false,
				error: "Invalid file path",
				errorType: "INVALID_PATH",
			};
		}

		const stats = await stat(validatedPath);

		// Only return stats for regular files
		if (!stats.isFile()) {
			return {
				success: false,
				error: "Not a regular file",
				errorType: "NOT_A_FILE",
			};
		}

		return {
			success: true,
			size: stats.size,
			mtime: stats.mtime,
		};
	} catch (error) {
		if (error.code === "ENOENT") {
			return {
				success: false,
				error: "File not found",
				errorType: "FILE_NOT_FOUND",
			};
		}

		if (error.code === "EACCES" || error.code === "EPERM") {
			return {
				success: false,
				error: "Access denied",
				errorType: "ACCESS_DENIED",
			};
		}

		return {
			success: false,
			error: "Stat error",
			errorType: "STAT_ERROR",
		};
	}
}

/**
 * Determines MIME type for file extensions with ESM module focus.
 *
 * Optimized MIME type detection for JavaScript modules and web assets.
 * Critical for proper browser handling of ES modules and static files.
 *
 * **Standards Compliance**: Returns standard MIME types per RFC 2046
 * and modern browser expectations for ES modules.
 *
 * @param {string} filePath - File path or extension to analyze
 * @returns {string} MIME type or 'application/octet-stream' for unknown
 *
 * @example
 * ```javascript
 * getMimeType('module.js')     // 'text/javascript'
 * getMimeType('module.mjs')    // 'text/javascript'
 * getMimeType('styles.css')    // 'text/css'
 * getMimeType('unknown.xyz')   // 'application/octet-stream'
 * ```
 */
export function getMimeType(filePath) {
	if (typeof filePath !== "string" || filePath.length === 0) {
		return "application/octet-stream";
	}

	// Extract extension (handle paths and bare extensions)
	const extension = filePath.startsWith(".")
		? filePath.toLowerCase()
		: extname(filePath).toLowerCase();

	// MIME type mapping optimized for ES modules and web development
	const mimeTypes = {
		// JavaScript modules (ES modules served as text/javascript)
		".js": "text/javascript",
		".mjs": "text/javascript",
		".jsx": "text/javascript", // React JSX files
		".ts": "text/javascript", // TypeScript files
		".tsx": "text/javascript", // TypeScript JSX files
		".cjs": "text/javascript", // CommonJS files
		".map": "application/json", // Source maps

		// Web assets
		".json": "application/json",
		".css": "text/css",
		".html": "text/html",
		".htm": "text/html",
		".xml": "application/xml",

		// Images
		".png": "image/png",
		".jpg": "image/jpeg",
		".jpeg": "image/jpeg",
		".gif": "image/gif",
		".svg": "image/svg+xml",
		".webp": "image/webp",
		".ico": "image/x-icon",

		// Fonts
		".woff": "font/woff",
		".woff2": "font/woff2",
		".ttf": "font/ttf",
		".otf": "font/otf",

		// Archives and documents
		".pdf": "application/pdf",
		".zip": "application/zip",
		".tar": "application/x-tar",
		".gz": "application/gzip",

		// Text formats
		".txt": "text/plain",
		".md": "text/markdown",
		".csv": "text/csv",
	};

	return mimeTypes[extension] || "application/octet-stream";
}

/**
 * Resolves an absolute file path with security validation and normalization.
 *
 * Converts relative paths to absolute paths while maintaining security
 * constraints. Essential for consistent file resolution across different
 * working directories and deployment scenarios.
 *
 * **Security**: Maintains all path security validations while enabling
 * absolute path resolution for consistent file system operations.
 *
 * @param {string} filePath - File path to resolve (relative or absolute)
 * @param {string} [basePath=process.cwd()] - Base path for relative resolution
 * @returns {string|null} Resolved absolute path or null if invalid
 *
 * @example
 * ```javascript
 * resolveFilePath('./lib/utils.js')           // '/app/lib/utils.js'
 * resolveFilePath('../shared/types.js')       // '/shared/types.js'
 * resolveFilePath('/node_modules/pkg/index.js') // '/node_modules/pkg/index.js'
 * resolveFilePath('../../../../etc/passwd')   // null (security violation)
 * ```
 */
export function resolveFilePath(filePath, basePath = process.cwd()) {
	try {
		if (typeof filePath !== "string" || filePath.length === 0) {
			return null;
		}

		if (typeof basePath !== "string" || basePath.length === 0) {
			return null;
		}

		// First validate the input path
		const validatedPath = validateFilePath(filePath);
		if (!validatedPath) {
			return null;
		}

		// Resolve to absolute path
		const absolutePath = resolve(basePath, validatedPath);

		// Re-validate the resolved path for security
		const validatedAbsolute = validateFilePath(absolutePath);
		if (!validatedAbsolute) {
			return null;
		}

		return validatedAbsolute;
	} catch {
		return null;
	}
}

/**
 * Creates appropriate HTTP headers for file serving with caching strategy.
 *
 * Generates optimized headers for different file types with appropriate
 * caching strategies for development vs production environments.
 *
 * **Performance**: Optimized cache headers for static assets while
 * maintaining development workflow responsiveness.
 *
 * @param {string} filePath - File path to generate headers for
 * @param {Object} [options={}] - Header generation options
 * @param {boolean} [options.isDevelopment=false] - Development mode (no-cache headers)
 * @param {number} [options.maxAge=3600] - Cache max age in seconds
 * @returns {Object} Headers object for HTTP response
 *
 * @example
 * ```javascript
 * const headers = createFileHeaders('module.js', { isDevelopment: true });
 * // {
 * //   'Content-Type': 'text/javascript',
 * //   'Cache-Control': 'no-cache'
 * // }
 * ```
 */
export function createFileHeaders(filePath, options = {}) {
	const { isDevelopment = false, maxAge = 3600 } = options;

	const headers = {
		"Content-Type": getMimeType(filePath),
	};

	// Set cache headers based on environment and file type
	if (isDevelopment) {
		// Development: no caching for immediate file changes
		headers["Cache-Control"] = "no-cache";
	} else {
		// Production: cache based on file type
		const extension = extname(filePath).toLowerCase();

		if (extension === ".js" || extension === ".mjs") {
			// JavaScript modules: shorter cache for application code
			headers["Cache-Control"] = `public, max-age=${Math.min(maxAge, 300)}`; // Max 5 minutes
		} else if (
			[
				".css",
				".png",
				".jpg",
				".jpeg",
				".gif",
				".svg",
				".woff",
				".woff2",
			].includes(extension)
		) {
			// Static assets: longer cache
			headers["Cache-Control"] = `public, max-age=${maxAge}`;
		} else {
			// Other files: default cache
			headers["Cache-Control"] = `public, max-age=${Math.floor(maxAge / 2)}`;
		}
	}

	// Security headers for all responses
	headers["X-Content-Type-Options"] = "nosniff";

	return headers;
}

/**
 * Validates that a file is safe for serving with security and type checks.
 *
 * Comprehensive validation ensuring files meet security and type requirements
 * for serving through the ESM resolve middleware. Prevents serving of
 * potentially dangerous or inappropriate file types.
 *
 * **Security**: Multi-layer validation preventing serving of executable
 * files, configuration files, or other sensitive content.
 *
 * @param {string} filePath - File path to validate
 * @param {Object} [options={}] - Validation options
 * @param {boolean} [options.allowOnlyJS=false] - Only allow .js/.mjs files
 * @param {string[]} [options.allowedExtensions] - Explicitly allowed extensions
 * @returns {boolean} True if file is safe to serve
 *
 * @example
 * ```javascript
 * isFileServable('module.js')              // true
 * isFileServable('config.json')            // true
 * isFileServable('secret.env')             // false
 * isFileServable('script.php')             // false
 * isFileServable('style.css', { allowOnlyJS: true })  // false
 * ```
 */
export function isFileServable(filePath, options = {}) {
	const { allowOnlyJS = false, allowedExtensions } = options;

	try {
		// Basic path validation
		const validatedPath = validateFilePath(filePath);
		if (!validatedPath) {
			return false;
		}

		const extension = extname(filePath).toLowerCase();

		// Check explicit allow list if provided
		if (allowedExtensions && Array.isArray(allowedExtensions)) {
			return allowedExtensions.includes(extension);
		}

		// JavaScript-only mode
		if (allowOnlyJS) {
			return extension === ".js" || extension === ".mjs";
		}

		// Blocked extensions (security sensitive)
		const blockedExtensions = [
			// Executable files
			".exe",
			".bat",
			".cmd",
			".com",
			".scr",
			".pif",

			// Script files (server-side)
			".php",
			".asp",
			".aspx",
			".jsp",
			".cgi",
			".pl",
			".py",
			".rb",

			// Configuration files
			".env",
			".ini",
			".conf",
			".config",
			".htaccess",
			".htpasswd",

			// Archives (could contain executables)
			".rar",
			".7z",
			".bz2",
			".xz",

			// System files
			".sys",
			".dll",
			".so",
			".dylib",
		];

		if (blockedExtensions.includes(extension)) {
			return false;
		}

		// Allowed extensions for web serving
		const webExtensions = [
			// JavaScript modules
			".js",
			".mjs",
			".jsx",

			// Web assets
			".json",
			".css",
			".html",
			".htm",
			".xml",

			// Images
			".png",
			".jpg",
			".jpeg",
			".gif",
			".svg",
			".webp",
			".ico",

			// Fonts
			".woff",
			".woff2",
			".ttf",
			".otf",

			// Text files
			".txt",
			".md",
			".csv",
		];

		return webExtensions.includes(extension);
	} catch {
		return false;
	}
}
